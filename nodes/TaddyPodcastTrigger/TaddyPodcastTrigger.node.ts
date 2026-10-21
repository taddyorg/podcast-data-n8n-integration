import {
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';
import { API_BASE_URL, EPISODE_EXTENDED_FRAGMENT } from '../TaddyPodcast/constants';

export class TaddyPodcastTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Taddy Podcast Trigger',
		name: 'taddyPodcastTrigger',
		icon: 'file:taddy-api-logo.png',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["inputType"] === "uuids" ? "Monitor by UUIDs" : "Monitor by RSS URLs"}}',
		description: 'Triggers when new episodes are published to monitored podcasts',
		defaults: {
			name: 'Taddy Podcast Trigger',
		},
		credentials: [
			{
				name: 'taddyPodcastApi',
				required: true,
			},
		],
		polling: true,
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Specify Podcasts By',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Podcast UUIDs',
						value: 'uuids',
					},
					{
						name: 'RSS Feed URLs',
						value: 'rss_urls',
					},
				],
				default: 'uuids',
				description: 'Choose how you want to specify which podcasts to monitor',
			},
			{
				displayName: 'Podcast UUIDs',
				name: 'podcastUuids',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						inputType: ['uuids'],
					},
				},
				default: '',
				placeholder: 'uuid1,uuid2,uuid3',
				description:
					'Comma-separated list of podcast UUIDs to monitor (max 1000). Get UUIDs from "Search Podcasts" or "Find Podcast" actions.',
			},
			{
				displayName: 'RSS Feed URLs',
				name: 'rssUrls',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						inputType: ['rss_urls'],
					},
				},
				default: '',
				placeholder: 'https://example.com/feed1.xml,https://example.com/feed2.xml',
				description: 'Comma-separated list of podcast RSS feed URLs to monitor (max 1000)',
			},
			{
				displayName: 'Poll Interval',
				name: 'pollInterval',
				type: 'number',
				default: 15,
				description: 'How often to check for new episodes (in minutes)',
				typeOptions: {
					minValue: 1,
					maxValue: 1440, // 24 hours
				},
			},
			{
				displayName: 'Maximum Episodes Per Poll',
				name: 'limit',
				type: 'number',
				default: 25,
				description: 'Maximum number of latest episodes to check per poll (1-50)',
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const inputType = this.getNodeParameter('inputType') as string;
		const pollInterval = this.getNodeParameter('pollInterval') as number;
		const limit = this.getNodeParameter('limit') as number;

		// Get podcast identifiers
		let uuids: string[] = [];
		let rssUrls: string[] = [];

		if (inputType === 'uuids') {
			const uuidsInput = this.getNodeParameter('podcastUuids') as string;
			if (!uuidsInput) {
				throw new NodeOperationError(this.getNode(), 'Podcast UUIDs are required');
			}
			uuids = uuidsInput
				.split(',')
				.map((uuid) => uuid.trim())
				.filter((uuid) => uuid);

			if (uuids.length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					'At least one podcast UUID is required',
				);
			}

			if (uuids.length > 1000) {
				throw new NodeOperationError(
					this.getNode(),
					'Maximum 1000 podcast UUIDs allowed (per Taddy GraphQL schema)',
				);
			}
		} else {
			const rssUrlsInput = this.getNodeParameter('rssUrls') as string;
			if (!rssUrlsInput) {
				throw new NodeOperationError(this.getNode(), 'RSS URLs are required');
			}
			rssUrls = rssUrlsInput
				.split(',')
				.map((url) => url.trim())
				.filter((url) => url);

			if (rssUrls.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one RSS URL is required');
			}

			if (rssUrls.length > 1000) {
				throw new NodeOperationError(
					this.getNode(),
					'Maximum 1000 RSS URLs allowed (per Taddy GraphQL schema)',
				);
			}
		}

		// Get workflow static data for deduplication
		const staticData = this.getWorkflowStaticData('node');
		if (!staticData.seenEpisodeIds) {
			staticData.seenEpisodeIds = [];
		}

		const pollForNewEpisodes = async () => {
			const credentials = await this.getCredentials('taddyPodcastApi');
			const userId = credentials.userId as string;
			const apiKey = credentials.apiKey as string;

			// Build GraphQL query
			const query = `
				query GetLatestEpisodes($uuids: [ID], $rssUrls: [String], $limitPerPage: Int) {
					getLatestPodcastEpisodes(uuids: $uuids, rssUrls: $rssUrls, limitPerPage: $limitPerPage) {
						${EPISODE_EXTENDED_FRAGMENT}
					}
				}
			`;

			const variables: IDataObject = {
				limitPerPage: limit,
			};

			if (uuids.length > 0) {
				variables.uuids = uuids;
			}

			if (rssUrls.length > 0) {
				variables.rssUrls = rssUrls;
			}

			try {
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: API_BASE_URL,
					headers: {
						'X-USER-ID': userId,
						'X-API-KEY': apiKey,
						'Content-Type': 'application/json',
					},
					body: {
						query,
						variables,
					},
				});

				if (response.errors && response.errors.length > 0) {
					const errorMessages = response.errors.map((err: IDataObject) => err.message).join(', ');
					throw new NodeOperationError(
						this.getNode(),
						`Taddy API Error: ${errorMessages}`,
					);
				}

				const episodes = (response.data?.getLatestPodcastEpisodes || []) as IDataObject[];

				// Filter for new episodes (not seen before)
				const seenIds = staticData.seenEpisodeIds as string[];
				const newEpisodes = episodes.filter((episode) => {
					const episodeId = episode.uuid as string;
					return !seenIds.includes(episodeId);
				});

				if (newEpisodes.length > 0) {
					// Update seen IDs (keep last 1000 to prevent memory bloat)
					const newIds = newEpisodes.map((ep) => ep.uuid as string);
					staticData.seenEpisodeIds = [...newIds, ...seenIds].slice(0, 1000);

					// Emit new episodes
					this.emit([this.helpers.returnJsonArray(newEpisodes)]);
				}
			} catch (error) {
				// Log error but don't stop polling
				if (error instanceof Error) {
					this.logger.error(`Taddy Podcast Trigger polling error: ${error.message}`);
				}
			}
		};

		// Poll immediately on activation
		await pollForNewEpisodes();

		// Set up interval for polling
		const intervalMs = pollInterval * 60 * 1000; // Convert minutes to milliseconds
		// eslint-disable-next-line no-undef
		const interval = setInterval(pollForNewEpisodes, intervalMs);

		// Define closeFunction to clean up
		async function closeFunction() {
			// eslint-disable-next-line no-undef
			clearInterval(interval);
		}

		return {
			closeFunction,
		};
	}
}

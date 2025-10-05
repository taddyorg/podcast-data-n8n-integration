import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, PodcastEpisode, EPISODE_FRAGMENT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, parseAndValidateUuids } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetLatestEpisodes(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const inputType = context.getNodeParameter('latestEpisodesInputType', itemIndex) as string;
	let uuids: string[] = [];
	let rssUrls: string[] = [];

	if (inputType === 'uuids') {
		const uuidsInput = context.getNodeParameter('latestEpisodesUuids', itemIndex) as string;
		uuids = parseAndValidateUuids(uuidsInput, 1000, context);
	} else {
		const rssUrlsInput = context.getNodeParameter('latestEpisodesRssUrls', itemIndex) as string;
		rssUrls = rssUrlsInput
			.split(',')
			.map(u => u.trim())
			.filter(u => u);
	}

	const query = `
		query GetLatestEpisodes($uuids: [ID], $rssUrls: [String]) {
			getLatestPodcastEpisodes(uuids: $uuids, rssUrls: $rssUrls) {
				${EPISODE_FRAGMENT}
				podcastSeries {
					${PODCAST_SERIES_MINI_FRAGMENT}
				}
			}
		}
	`;

	const variables: IDataObject = {};
	if (uuids.length > 0) variables.uuids = uuids;
	if (rssUrls.length > 0) variables.rssUrls = rssUrls;

	const apiResponse = await requestWithRetry(query, variables, context);

	const episodes = (apiResponse.data?.getLatestPodcastEpisodes as PodcastEpisode[]) || [];
	return standardizeResponse(Operation.GET_LATEST_EPISODES, {
		episodes,
		totalEpisodes: episodes.length,
		inputType,
		inputCount: uuids.length || rssUrls.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getLatestEpisodesFields: INodeProperties[] = [
	{
		displayName: 'Input Type',
		name: 'latestEpisodesInputType',
		type: 'options',
		options: [
			{ name: 'Podcast UUIDs', value: 'uuids' },
			{ name: 'RSS URLs', value: 'rssUrls' },
		],
		default: 'uuids',
		description: 'Choose how to specify the podcasts',
		displayOptions: {
			show: {
				operation: [Operation.GET_LATEST_EPISODES],
			},
		},
	},
	{
		displayName: 'Podcast UUIDs',
		name: 'latestEpisodesUuids',
		type: 'string',
		default: '',
		placeholder: 'uuid1,uuid2,uuid3',
		description: 'Comma-separated list of podcast UUIDs (max 1000)',
		hint: 'Perfect for tracking multiple podcasts for weekly roundups',
		displayOptions: {
			show: {
				operation: [Operation.GET_LATEST_EPISODES],
				latestEpisodesInputType: ['uuids'],
			},
		},
	},
	{
		displayName: 'RSS URLs',
		name: 'latestEpisodesRssUrls',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/feed1.xml,https://example.com/feed2.xml',
		description: 'Comma-separated list of RSS feed URLs (max 1000)',
		displayOptions: {
			show: {
				operation: [Operation.GET_LATEST_EPISODES],
				latestEpisodesInputType: ['rssUrls'],
			},
		},
	},
];

import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, PodcastEpisode, EPISODE_FRAGMENT, EPISODE_WITH_TRANSCRIPT_FRAGMENT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, parseAndValidateUuids } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetLatestEpisodes(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const inputType = context.getNodeParameter('latestEpisodesInputType', itemIndex) as string;
	const includeTranscript = context.getNodeParameter('includeTranscript', itemIndex, true) as boolean;
	const includePodcastDetails = context.getNodeParameter('includePodcastDetails', itemIndex, true) as boolean;

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

	// Dynamically build episode fragment based on includeTranscript
	const episodeFragment = includeTranscript ? EPISODE_WITH_TRANSCRIPT_FRAGMENT : EPISODE_FRAGMENT;

	// Dynamically build podcast series block based on includePodcastDetails
	const podcastSeriesBlock = includePodcastDetails ? `
				podcastSeries {
					${PODCAST_SERIES_MINI_FRAGMENT}
				}` : '';

	const query = `
		query GetLatestEpisodes($uuids: [ID], $rssUrls: [String]) {
			getLatestPodcastEpisodes(uuids: $uuids, rssUrls: $rssUrls) {
				${episodeFragment}${podcastSeriesBlock}
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
	{
		displayName: 'Include Transcript for each episode',
		name: 'includeTranscript',
		type: 'boolean',
		default: true,
		description: 'Whether to include episode transcripts in the response',
		displayOptions: {
			show: {
				operation: [Operation.GET_LATEST_EPISODES],
			},
		},
	},
	{
		displayName: 'Include Podcast Details for each episode',
		name: 'includePodcastDetails',
		type: 'boolean',
		default: true,
		description: 'Whether to include podcast series information for each episode',
		displayOptions: {
			show: {
				operation: [Operation.GET_LATEST_EPISODES],
			},
		},
	},
];

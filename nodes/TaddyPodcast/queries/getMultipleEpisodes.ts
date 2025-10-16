import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, PodcastEpisode, EPISODE_EXTENDED_FRAGMENT, EPISODE_WITH_TRANSCRIPT_FRAGMENT, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, parseAndValidateUuids, includeTranscriptField } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetMultipleEpisodes(
	operation: Operation,
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const uuidsInput = context.getNodeParameter('episodeUuids', itemIndex) as string;
	const includeTranscript = context.getNodeParameter(`${operation}-includeTranscript`, itemIndex) as boolean;
	const uuids = parseAndValidateUuids(uuidsInput, 25, context);

	// Dynamically build episode fragment based on includeTranscript
	const episodeFragment = includeTranscript ? EPISODE_WITH_TRANSCRIPT_FRAGMENT : EPISODE_EXTENDED_FRAGMENT;

	const query = `
		query GetMultipleEpisodes($uuids: [ID]) {
			getMultiplePodcastEpisodes(uuids: $uuids) {
				${episodeFragment}
				podcastSeries {
					${PODCAST_SERIES_EXTENDED_FRAGMENT}
				}
			}
		}
	`;

	const apiResponse = await requestWithRetry(query, { uuids }, context);

	const episodes = (apiResponse.data?.getMultiplePodcastEpisodes as PodcastEpisode[]) || [];
	return standardizeResponse(Operation.GET_MULTIPLE_EPISODES, {
		episodes,
		totalReturned: episodes.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getMultipleEpisodesFields: INodeProperties[] = [
	{
		displayName: 'Episode UUIDs',
		name: 'episodeUuids',
		type: 'string',
		default: '',
		placeholder: 'uuid1,uuid2,uuid3',
		description: 'Comma-separated list of episode UUIDs (max 25)',
		hint: 'Get UUIDs from search results or previous operations',
		displayOptions: {
			show: {
				operation: [Operation.GET_MULTIPLE_EPISODES],
			},
		},
	},
	includeTranscriptField(true, Operation.GET_MULTIPLE_EPISODES),
];

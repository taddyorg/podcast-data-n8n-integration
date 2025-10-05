import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, PodcastEpisode, EPISODE_EXTENDED_FRAGMENT, MAX_API_LIMIT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetPodcastEpisodes(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const podcastUuid = context.getNodeParameter('podcastUuid', itemIndex) as string;
	const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;

	if (!podcastUuid) {
		throw new NodeOperationError(context.getNode(), 'Podcast UUID is required');
	}

	if (!validateUuid(podcastUuid)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid UUID format: ${podcastUuid}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
		);
	}

	const query = `
		query GetPodcastEpisodes($uuid: ID!, $limitPerPage: Int!) {
			getPodcastSeries(uuid: $uuid) {
				${PODCAST_SERIES_MINI_FRAGMENT}
				episodes(limitPerPage: $limitPerPage, sortOrder: LATEST) {
					${EPISODE_EXTENDED_FRAGMENT}
				}
			}
		}
	`;

	const apiResponse = await requestWithRetry(
		query,
		{ uuid: podcastUuid, limitPerPage: Math.min(maxResults, MAX_API_LIMIT) },
		context,
	);
	const podcast = apiResponse.data?.getPodcastSeries as { uuid: string; name: string; episodes: PodcastEpisode[] };
	const episodes = podcast?.episodes || [];

	return standardizeResponse(Operation.GET_PODCAST_EPISODES, {
		podcastUuid,
		podcastName: podcast?.name || 'Unknown',
		episodes,
		totalReturned: episodes.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getPodcastEpisodesFields: INodeProperties[] = [
	{
		displayName: 'Podcast UUID',
		name: 'podcastUuid',
		type: 'string',
		default: '',
		placeholder: 'e.g., cb8d858a-3ef4-4645-8942-67e55c0927f2',
		description: 'The unique identifier of the podcast',
		hint: 'Get this from search results or other operations',
		displayOptions: {
			show: {
				operation: [Operation.GET_PODCAST_EPISODES],
			},
		},
	},
];

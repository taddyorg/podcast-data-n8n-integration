import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetPodcastByUuid(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const podcastUuid = context.getNodeParameter('podcastUuid', itemIndex) as string;

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
		query getPodcastSeries($uuid: ID!) {
			getPodcastSeries(uuid: $uuid) {
				${PODCAST_SERIES_EXTENDED_FRAGMENT}
			}
		}
	`;

	const apiResponse = await requestWithRetry(query, { uuid: podcastUuid }, context);

	return standardizeResponse(Operation.GET_PODCAST_BY_UUID, {
		podcastUuid,
		podcast: apiResponse.data?.getPodcastSeries || null,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getPodcastByUuidFields: INodeProperties[] = [
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
				operation: [Operation.GET_PODCAST_BY_UUID],
			},
		},
	},
];

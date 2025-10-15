import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, PodcastSeries, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, parseAndValidateUuids } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetMultiplePodcasts(
	operation: Operation,
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const uuidsInput = context.getNodeParameter('podcastUuids', itemIndex) as string;
	const uuids = parseAndValidateUuids(uuidsInput, 25, context);

	const query = `
		query GetMultiplePodcasts($uuids: [ID]) {
			getMultiplePodcastSeries(uuids: $uuids) {
				${PODCAST_SERIES_EXTENDED_FRAGMENT}
			}
		}
	`;

	const apiResponse = await requestWithRetry(query, { uuids }, context);

	const podcasts = (apiResponse.data?.getMultiplePodcastSeries as PodcastSeries[]) || [];
	return standardizeResponse(Operation.GET_MULTIPLE_PODCASTS, {
		podcasts,
		totalReturned: podcasts.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getMultiplePodcastsFields: INodeProperties[] = [
	{
		displayName: 'Podcast UUIDs',
		name: 'podcastUuids',
		type: 'string',
		default: '',
		placeholder: 'uuid1,uuid2,uuid3',
		description: 'Comma-separated list of podcast UUIDs (max 25)',
		hint: 'Get UUIDs from search results or previous operations',
		displayOptions: {
			show: {
				operation: [Operation.GET_MULTIPLE_PODCASTS],
			},
		},
	},
];

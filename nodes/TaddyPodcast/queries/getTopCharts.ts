import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, PodcastSeries, PODCAST_SERIES_FRAGMENT, MAX_API_LIMIT } from '../constants';
import { requestWithRetry, standardizeResponse } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetTopCharts(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;
	const genres = context.getNodeParameter('popularGenres', itemIndex) as string[];

	const query = `
		query GetTopCharts($genres: [Genre!], $limitPerPage: Int) {
			getTopChartsByGenres(
				genres: $genres
				limitPerPage: $limitPerPage
				taddyType: PODCASTSERIES
			) {
				topChartsId
				podcastSeries {
					${PODCAST_SERIES_FRAGMENT}
				}
			}
		}
	`;

	if (genres.length === 0) {
		throw new NodeOperationError(context.getNode(), 'At least one genre is required');
	}

	const variables: IDataObject = {
		limitPerPage: Math.min(maxResults, MAX_API_LIMIT),
		genres: genres,
	};

	const apiResponse = await requestWithRetry(query, variables, context);

	// Extract podcast series from the nested structure
	const topCharts = apiResponse.data?.getTopChartsByGenres as Array<{ podcastSeries: PodcastSeries }> || [];
	const podcasts = topCharts.map(item => item.podcastSeries);

	return standardizeResponse(Operation.GET_DAILY_TOP_CHARTS, {
		podcasts,
		totalReturned: podcasts.length,
		genres: genres.length > 0 ? genres : ['default'],
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getTopChartsFields: INodeProperties[] = [
	{
		displayName: 'Filter by Genres',
		name: 'popularGenres',
		type: 'multiOptions',
		options: GENRE_OPTIONS,
		default: [],
		description: 'Filter popular podcasts by specific genres',
		displayOptions: {
			show: {
				operation: [Operation.GET_DAILY_TOP_CHARTS],
			},
		},
	},
];

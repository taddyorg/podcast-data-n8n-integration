import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, PodcastSeries, PODCAST_SERIES_FRAGMENT, PAGINATION_CONFIGS } from '../constants';
import { numResultsField, requestWithPagination, standardizeResponse } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetTopCharts(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const numResults = context.getNodeParameter('numResults', itemIndex) as number;
	const genres = context.getNodeParameter('popularGenres', itemIndex) as string[];

	const query = `
		query GetTopCharts($genres: [Genre!], $page: Int, $limitPerPage: Int) {
			getTopChartsByGenres(
				genres: $genres
				page: $page
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
		genres: genres,
	};

	const apiResponse = await requestWithPagination(
		query,
		variables,
		context,
		PAGINATION_CONFIGS[Operation.GET_DAILY_TOP_CHARTS],
		numResults,
		'getTopChartsByGenres'
	);

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
	numResultsField(10, PAGINATION_CONFIGS[Operation.GET_DAILY_TOP_CHARTS], [Operation.GET_DAILY_TOP_CHARTS]),
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

import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import {
	Operation,
	GENRE_OPTIONS,
	COUNTRY_OPTIONS,
	TADDY_TYPE_OPTIONS,
	PodcastSeries,
	PodcastEpisode,
	PODCAST_SERIES_FRAGMENT,
	EPISODE_EXTENDED_FRAGMENT,
	PODCAST_SERIES_MINI_FRAGMENT,
} from '../constants';
import { numResultsField, requestWithPagination, standardizeResponse } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetTopCharts(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const numResults = context.getNodeParameter('numResults', itemIndex) as number;
	const chartType = context.getNodeParameter('chartType', itemIndex) as string;
	const taddyType = context.getNodeParameter('taddyType', itemIndex) as string;

	let query: string;
	let variables: IDataObject;
	let apiFieldName: string;

	if (chartType === 'byCountry') {
		// Use getTopChartsByCountry endpoint
		const country = context.getNodeParameter('country', itemIndex) as string;

		apiFieldName = 'getTopChartsByCountry';
		query = `
			query GetTopChartsByCountry($taddyType: TaddyType!, $country: Country!, $page: Int, $limitPerPage: Int) {
				getTopChartsByCountry(
					taddyType: $taddyType
					country: $country
					page: $page
					limitPerPage: $limitPerPage
				) {
					topChartsId
					${taddyType === 'PODCASTSERIES' ? `podcastSeries {
						${PODCAST_SERIES_FRAGMENT}
					}` : ''}
					${taddyType === 'PODCASTEPISODE' ? `podcastEpisodes {
						${EPISODE_EXTENDED_FRAGMENT}
						podcastSeries {
							${PODCAST_SERIES_MINI_FRAGMENT}
						}
					}` : ''}
				}
			}
		`;

		variables = {
			taddyType,
			country,
		};
	} else {
		// Use getTopChartsByGenres endpoint
		const genres = context.getNodeParameter('genres', itemIndex) as string[];

		if (genres.length === 0) {
			throw new NodeOperationError(context.getNode(), 'At least one genre is required when filtering by genres');
		}

		apiFieldName = 'getTopChartsByGenres';
		query = `
			query GetTopChartsByGenres($taddyType: TaddyType!, $genres: [Genre!], $page: Int, $limitPerPage: Int) {
				getTopChartsByGenres(
					taddyType: $taddyType
					genres: $genres
					page: $page
					limitPerPage: $limitPerPage
				) {
					topChartsId
					${taddyType === 'PODCASTSERIES' ? `podcastSeries {
						${PODCAST_SERIES_FRAGMENT}
					}` : ''}
					${taddyType === 'PODCASTEPISODE' ? `podcastEpisodes {
						${EPISODE_EXTENDED_FRAGMENT}
						podcastSeries {
							${PODCAST_SERIES_MINI_FRAGMENT}
						}
					}` : ''}
				}
			}
		`;

		variables = {
			taddyType,
			genres,
		};
	}

	// Construct the correct result path based on taddyType
	const resultField = taddyType === 'PODCASTSERIES' ? 'podcastSeries' : 'podcastEpisodes';
	const resultPath = `${apiFieldName}.${resultField}`;

	const apiResponse = await requestWithPagination(
		Operation.GET_DAILY_TOP_CHARTS,
		query,
		variables,
		context,
		numResults,
		resultPath
	);

	// Extract data based on taddyType
	// The paginated results are already the correct array at the resultPath
	const topChartsData = apiResponse.data?.[apiFieldName] as IDataObject || {};

	if (taddyType === 'PODCASTSERIES') {
		const podcasts = topChartsData.podcastSeries as PodcastSeries[] || [];
		return standardizeResponse(Operation.GET_DAILY_TOP_CHARTS, {
			podcasts,
			totalReturned: podcasts.length,
			chartType,
			taddyType,
		});
	} else {
		const episodes = topChartsData.podcastEpisodes as PodcastEpisode[] || [];
		return standardizeResponse(Operation.GET_DAILY_TOP_CHARTS, {
			episodes,
			totalReturned: episodes.length,
			chartType,
			taddyType,
		});
	}
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getTopChartsFields: INodeProperties[] = [
	numResultsField(Operation.GET_DAILY_TOP_CHARTS),
	{
		displayName: 'Content Type',
		name: 'taddyType',
		type: 'options',
		options: TADDY_TYPE_OPTIONS,
		default: 'PODCASTSERIES',
		description: 'Whether to get top charts for podcast shows or episodes',
		displayOptions: {
			show: {
				operation: [Operation.GET_DAILY_TOP_CHARTS],
			},
		},
	},
	{
		displayName: 'Chart Type',
		name: 'chartType',
		type: 'options',
		options: [
			{
				name: 'By Country',
				value: 'byCountry',
				description: 'Get top charts for a specific country',
			},
			{
				name: 'By Genre',
				value: 'byGenre',
				description: 'Get top charts for specific genres',
			},
		],
		default: 'byCountry',
		description: 'Whether to filter top charts by country or by genre',
		displayOptions: {
			show: {
				operation: [Operation.GET_DAILY_TOP_CHARTS],
			},
		},
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		options: COUNTRY_OPTIONS,
		default: 'UNITED_STATES_OF_AMERICA',
		description: 'Country to get top charts for',
		displayOptions: {
			show: {
				operation: [Operation.GET_DAILY_TOP_CHARTS],
				chartType: ['byCountry'],
			},
		},
	},
	{
		displayName: 'Genres',
		name: 'genres',
		type: 'multiOptions',
		options: GENRE_OPTIONS,
		default: [],
		description: 'Filter top charts by specific genres (at least one required)',
		displayOptions: {
			show: {
				operation: [Operation.GET_DAILY_TOP_CHARTS],
				chartType: ['byGenre'],
			},
		},
	},
];

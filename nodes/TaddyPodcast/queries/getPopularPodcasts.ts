import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, LANGUAGE_OPTIONS, PodcastSeries, PODCAST_SERIES_FRAGMENT } from '../constants';
import { requestWithPagination, standardizeResponse, numResultsField } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetPopularPodcasts(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const numResults = context.getNodeParameter('numResults', itemIndex) as number;
	const genres = context.getNodeParameter('genres', itemIndex) as string[];
	const language = context.getNodeParameter('language', itemIndex) as string;

	const query = `
		query GetPopularContent($filterByGenres: [Genre!], $filterByLanguage: Language, $page: Int, $limitPerPage: Int) {
			getPopularContent(
				filterByGenres: $filterByGenres
				filterByLanguage: $filterByLanguage
				page: $page
				limitPerPage: $limitPerPage
				taddyType: PODCASTSERIES
			) {
				popularityRankId
				podcastSeries {
					${PODCAST_SERIES_FRAGMENT}

				}
			}
		}
	`;

	const variables: IDataObject = {};
	if (genres.length > 0) variables.filterByGenres = genres;
	if (language) variables.filterByLanguage = language;

	const apiResponse = await requestWithPagination(
		Operation.GET_POPULAR_PODCASTS,
		query,
		variables,
		context,
		numResults,
		'getPopularContent'
	);

	const popularContent = apiResponse.data?.getPopularContent as Array<{ podcastSeries: PodcastSeries }> || [];
	const podcasts = popularContent.map(item => item.podcastSeries);

	return standardizeResponse(Operation.GET_POPULAR_PODCASTS, {
		podcasts,
		totalReturned: podcasts.length,
		filters: {
			genres: genres.length > 0 ? genres : 'all',
			language: language || 'all',
		},
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getPopularPodcastsFields: INodeProperties[] = [
	numResultsField(10, Operation.GET_POPULAR_PODCASTS),
	{
		displayName: 'Filter by Genres',
		name: 'genres',
		type: 'multiOptions',
		options: GENRE_OPTIONS,
		default: [],
		description: 'Filter popular podcasts by specific genres',
		displayOptions: {
			show: {
				operation: [Operation.GET_POPULAR_PODCASTS],
			},
		},
	},
	{
		displayName: 'Filter by Language',
		name: 'language',
		type: 'options',
		options: LANGUAGE_OPTIONS,
		default: '',
		description: 'Filter popular podcasts by language',
		displayOptions: {
			show: {
				operation: [Operation.GET_POPULAR_PODCASTS],
			},
		},
	},
];

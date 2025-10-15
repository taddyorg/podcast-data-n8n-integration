import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, LANGUAGE_OPTIONS, PodcastSeries, PODCAST_SERIES_FRAGMENT } from '../constants';
import { requestWithPagination, standardizeResponse, numResultsField } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetPopularPodcasts(
	operation: Operation,
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const numResults = context.getNodeParameter(`${operation}-numResults`, itemIndex) as number;

	// Get advanced options
	const advancedOptions = context.getNodeParameter('popularPodcastsAdvancedOptions', itemIndex, {}) as IDataObject;

	const filterByGenres = advancedOptions.popularPodcastsFilterByGenres as string[] || [];
	const filterByLanguage = advancedOptions.popularPodcastsFilterByLanguage as string || '';

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
	if (filterByGenres.length > 0) variables.filterByGenres = filterByGenres;
	if (filterByLanguage) variables.filterByLanguage = filterByLanguage;

	const apiResponse = await requestWithPagination(
		Operation.GET_POPULAR_PODCASTS,
		query,
		variables,
		context,
		numResults,
		'getPopularContent'
	);

	const popularContent = apiResponse.data?.getPopularContent as IDataObject || {};
	const podcasts = popularContent.podcastSeries as PodcastSeries[] || [];

	return standardizeResponse(Operation.GET_POPULAR_PODCASTS, {
		podcasts,
		totalReturned: podcasts.length,
		...variables,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getPopularPodcastsFields: INodeProperties[] = [
	numResultsField(Operation.GET_POPULAR_PODCASTS),
	{
		displayName: 'Advanced Options',
		name: 'popularPodcastsAdvancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: [Operation.GET_POPULAR_PODCASTS],
			},
		},
		options: [
			{
				displayName: 'Filter by Genres',
				name: 'popularPodcastsFilterByGenres',
				type: 'multiOptions',
				options: GENRE_OPTIONS,
				default: [],
				description: 'Filter popular podcasts by specific genres',
			},
			{
				displayName: 'Filter by Language',
				name: 'popularPodcastsFilterByLanguage',
				type: 'options',
				options: LANGUAGE_OPTIONS,
				default: '',
				description: 'Filter popular podcasts by language',
			},
		],
	},
];

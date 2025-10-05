import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, LANGUAGE_OPTIONS, SearchVariables, PodcastSeries, MAX_API_LIMIT, PODCAST_SERIES_EXTENDED_FRAGMENT, EPISODE_EXTENDED_FRAGMENT, PODCAST_SERIES_MINI_FRAGMENT, PodcastEpisode } from '../constants';
import { requestWithRetry, standardizeResponse, parseDate } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleSearch(
	itemIndex: number,
	operationType: 'searchPodcasts' | 'searchEpisodes',
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const searchQuery = context.getNodeParameter('searchQuery', itemIndex) as string;
	const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;
	const advancedOptions = context.getNodeParameter('advancedOptions', itemIndex) as IDataObject;

	const variables: SearchVariables = { term: searchQuery };
	variables.filterForTypes = operationType === 'searchPodcasts' 
		? ['PODCASTSERIES'] 
		: ['PODCASTEPISODE'];

	if (advancedOptions.filterForGenres) {
		variables.filterForGenres = advancedOptions.filterForGenres as string[];
	}
	if (advancedOptions.filterForLanguages) {
		variables.filterForLanguages = advancedOptions.filterForLanguages as string[];
	}
	if (advancedOptions.matchBy) {
		variables.matchBy = advancedOptions.matchBy as string;
	}
	if (advancedOptions.sortBy) {
		variables.sortBy = advancedOptions.sortBy as string;
	}
	if (advancedOptions.filterForHasTranscript !== undefined) {
		variables.filterForHasTranscript = advancedOptions.filterForHasTranscript as boolean;
	}
	if (advancedOptions.filterForPublishedAfter) {
		const dateString = advancedOptions.filterForPublishedAfter as string;
		variables.filterForPublishedAfter = parseDate(dateString, context);
	}

	const query = `
		query Search(
			$term: String
			$filterForTypes: [SearchContentType]
			$filterForGenres: [Genre]
			$filterForLanguages: [Language]
			$matchBy: SearchMatchType
			$sortBy: SearchSortOrder
			$filterForHasTranscript: Boolean
			$filterForPublishedAfter: Int
		) {
			search(
				term: $term
				filterForTypes: $filterForTypes
				filterForGenres: $filterForGenres
				filterForLanguages: $filterForLanguages
				matchBy: $matchBy
				sortBy: $sortBy
				filterForHasTranscript: $filterForHasTranscript
				filterForPublishedAfter: $filterForPublishedAfter
				limitPerPage: ${Math.min(maxResults, MAX_API_LIMIT)}
			) {
				searchId
				${operationType === 'searchPodcasts'
					? `podcastSeries {
							${PODCAST_SERIES_EXTENDED_FRAGMENT}
						}`
					: `podcastEpisodes {
						${EPISODE_EXTENDED_FRAGMENT}
						podcastSeries {
							${PODCAST_SERIES_MINI_FRAGMENT}
						}
					}`
				}
			}
		}
	`;

	const apiResponse = await requestWithRetry(query, variables, context);
	const searchData = apiResponse.data?.search as IDataObject || {};

	const podcastResults = searchData.podcastSeries as PodcastSeries[] || [];
	const episodeResults = searchData.podcastEpisodes as PodcastEpisode[] || [];

	return standardizeResponse(Operation.SEARCH_PODCASTS, {
		searchQuery,
		maxResults,
		advancedOptions,
		searchId: searchData.searchId || '',
		...(operationType === 'searchPodcasts' 
			? {
				podcastSeries: podcastResults,
				totalPodcastsReturned: podcastResults.length,
			} 
			: {
				podcastEpisodes: episodeResults,
				totalEpisodesReturned: episodeResults.length,
			}),
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const searchFields: INodeProperties[] = [
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		default: '',
		placeholder: 'e.g., technology, joe rogan, true crime',
		description: 'Enter search terms to find podcasts or episodes. Can be podcast names, topics, or keywords.',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS, Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Advanced Options',
		name: 'advancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS, Operation.SEARCH_EPISODES],
			},
		},
		options: [
			{
				displayName: 'Genres',
				name: 'filterForGenres',
				type: 'multiOptions',
				options: GENRE_OPTIONS,
				default: [],
				description: 'Filter by podcast genres',
			},
			{
				displayName: 'Languages',
				name: 'filterForLanguages',
				type: 'multiOptions',
				options: LANGUAGE_OPTIONS,
				default: [],
				description: 'Filter by podcast languages',
			},
			{
				displayName: 'Match Strategy',
				name: 'matchBy',
				type: 'options',
				options: [
					{ name: 'All Terms', value: 'ALL_TERMS' },
					{ name: 'Exact Phrase', value: 'EXACT_PHRASE' },
					{ name: 'Most Terms', value: 'MOST_TERMS' },
				],
				default: 'MOST_TERMS',
				description: 'How strictly to match search terms',
			},
			{
				displayName: 'Has Transcript',
				name: 'filterForHasTranscript',
				type: 'boolean',
				default: false,
				description: 'Only return episodes with transcripts available',
				hint: 'Useful for AI-powered summaries',
			},
			{
				displayName: 'Published After',
				name: 'filterForPublishedAfter',
				type: 'dateTime',
				default: '',
				description: 'Only return content published after this date',
				hint: 'Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS',
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Relevance', value: 'EXACTNESS' },
					{ name: 'Popularity', value: 'POPULARITY' },
				],
				default: 'EXACTNESS',
				description: 'How to sort search results',
			},
		],
	},
];

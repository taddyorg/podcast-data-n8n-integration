import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, LANGUAGE_OPTIONS, PODCAST_CONTENT_TYPE_OPTIONS, SearchVariables, PodcastEpisode, EPISODE_EXTENDED_FRAGMENT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { requestWithPagination, standardizeResponse, parseDate, numResultsField, expandGenres } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleSearchEpisodes(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const searchQuery = context.getNodeParameter('searchQuery', itemIndex) as string;
	const numResults = context.getNodeParameter('numResults', itemIndex) as number;

	const variables: SearchVariables = { term: searchQuery };
	variables.filterForTypes = ['PODCASTEPISODE'];

	// Get advanced options
	const advancedOptions = context.getNodeParameter('advancedOptions', itemIndex, {}) as IDataObject;

	// Content filters
	const filterForGenres = advancedOptions.filterForGenres as string[] || [];
	if (filterForGenres.length > 0) {
		variables.filterForGenres = expandGenres(filterForGenres);
	}

	const filterForLanguages = advancedOptions.filterForLanguages as string[] || [];
	if (filterForLanguages.length > 0) {
		variables.filterForLanguages = filterForLanguages;
	}

	const filterForPodcastContentType = advancedOptions.filterForPodcastContentType as string[] || [];
	if (filterForPodcastContentType.length > 0) {
		variables.filterForPodcastContentType = filterForPodcastContentType;
	}

	const isSafeMode = advancedOptions.isSafeMode as boolean || false;
	if (isSafeMode) {
		variables.isSafeMode = isSafeMode;
	}

	// Search behavior
	const matchBy = advancedOptions.matchBy as string || '';
	if (matchBy) {
		variables.matchBy = matchBy;
	}

	const sortBy = advancedOptions.sortBy as string || '';
	if (sortBy) {
		variables.sortBy = sortBy;
	}

	// Episode-specific filters
	const filterForHasTranscript = advancedOptions.filterForHasTranscript as boolean || false;
	if (filterForHasTranscript) {
		variables.filterForHasTranscript = filterForHasTranscript;
	}

	const filterForDurationGreaterThan = advancedOptions.filterForDurationGreaterThan as number || 0;
	if (filterForDurationGreaterThan) {
		variables.filterForDurationGreaterThan = filterForDurationGreaterThan;
	}

	const filterForDurationLessThan = advancedOptions.filterForDurationLessThan as number || 0;
	if (filterForDurationLessThan) {
		variables.filterForDurationLessThan = filterForDurationLessThan;
	}

	// Date filters
	const filterForPublishedAfter = advancedOptions.filterForPublishedAfter as string || '';
	if (filterForPublishedAfter) {
		variables.filterForPublishedAfter = parseDate(filterForPublishedAfter, context);
	}

	const filterForPublishedBefore = advancedOptions.filterForPublishedBefore as string || '';
	if (filterForPublishedBefore) {
		variables.filterForPublishedBefore = parseDate(filterForPublishedBefore, context);
	}

	// Series filters
	const filterForSeriesUuids = advancedOptions.filterForSeriesUuids as string || '';
	if (filterForSeriesUuids) {
		variables.filterForSeriesUuids = filterForSeriesUuids.split(',').map(uuid => uuid.trim()).filter(uuid => uuid);
	}

	const filterForNotInSeriesUuids = advancedOptions.filterForNotInSeriesUuids as string || '';
	if (filterForNotInSeriesUuids) {
		variables.filterForNotInSeriesUuids = filterForNotInSeriesUuids.split(',').map(uuid => uuid.trim()).filter(uuid => uuid);
	}

	const query = `
		query Search(
			$term: String
			$filterForTypes: [SearchContentType]
			$filterForGenres: [Genre]
			$filterForLanguages: [Language]
			$filterForPodcastContentType: [PodcastContentType]
			$isSafeMode: Boolean
			$matchBy: SearchMatchType
			$sortBy: SearchSortOrder
			$filterForHasTranscript: Boolean
			$filterForPublishedAfter: Int
			$filterForPublishedBefore: Int
			$filterForDurationGreaterThan: Int
			$filterForDurationLessThan: Int
			$filterForSeriesUuids: [ID]
			$filterForNotInSeriesUuids: [ID]
			$page: Int
			$limitPerPage: Int
		) {
			search(
				term: $term
				filterForTypes: $filterForTypes
				filterForGenres: $filterForGenres
				filterForLanguages: $filterForLanguages
				filterForPodcastContentType: $filterForPodcastContentType
				isSafeMode: $isSafeMode
				matchBy: $matchBy
				sortBy: $sortBy
				filterForHasTranscript: $filterForHasTranscript
				filterForPublishedAfter: $filterForPublishedAfter
				filterForPublishedBefore: $filterForPublishedBefore
				filterForDurationGreaterThan: $filterForDurationGreaterThan
				filterForDurationLessThan: $filterForDurationLessThan
				filterForSeriesUuids: $filterForSeriesUuids
				filterForNotInSeriesUuids: $filterForNotInSeriesUuids
				page: $page
				limitPerPage: $limitPerPage
			) {
				searchId
				podcastEpisodes {
					${EPISODE_EXTENDED_FRAGMENT}
					podcastSeries {
						${PODCAST_SERIES_MINI_FRAGMENT}
					}
				}
			}
		}
	`;

	const apiResponse = await requestWithPagination(
		Operation.SEARCH_EPISODES,
		query,
		variables,
		context,
		numResults,
		'search.podcastEpisodes'
	);

	const searchData = apiResponse.data?.search as IDataObject || {};
	const episodeResults = searchData.podcastEpisodes as PodcastEpisode[] || [];

	return standardizeResponse(Operation.SEARCH_EPISODES, {
		searchId: searchData.searchId || '',
		searchTerm: searchQuery,
		podcastEpisodes: episodeResults,
		totalReturned: episodeResults.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const searchEpisodesFields: INodeProperties[] = [
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		default: '',
		placeholder: 'e.g., technology, joe rogan, true crime',
		description: 'Enter search terms to find episodes. Can be episode titles, topics, or keywords.',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	numResultsField(Operation.SEARCH_EPISODES),
	{
		displayName: 'Advanced Options',
		name: 'advancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
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
				displayName: 'Content Type',
				name: 'filterForPodcastContentType',
				type: 'multiOptions',
				options: PODCAST_CONTENT_TYPE_OPTIONS,
				default: [],
				description: 'Filter by audio or video podcasts',
			},
			{
				displayName: 'Safe Mode',
				name: 'isSafeMode',
				type: 'boolean',
				default: false,
				description: 'Only return safe (non-explicit) content',
				hint: 'Enable to exclude explicit content',
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
				displayName: 'Published Before',
				name: 'filterForPublishedBefore',
				type: 'dateTime',
				default: '',
				description: 'Only return content published before this date',
				hint: 'Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS',
			},
			{
				displayName: 'Minimum Duration (seconds)',
				name: 'filterForDurationGreaterThan',
				type: 'number',
				default: 0,
				description: 'Only return episodes longer than this duration',
				hint: 'E.g., 3600 for episodes over 1 hour',
			},
			{
				displayName: 'Maximum Duration (seconds)',
				name: 'filterForDurationLessThan',
				type: 'number',
				default: 0,
				description: 'Only return episodes shorter than this duration',
				hint: 'E.g., 600 for episodes under 10 minutes',
			},
			{
				displayName: 'Include Only Series (UUIDs)',
				name: 'filterForSeriesUuids',
				type: 'string',
				default: '',
				description: 'Search within specific podcasts only',
				hint: 'Comma-separated UUIDs. E.g., uuid1,uuid2,uuid3',
			},
			{
				displayName: 'Exclude Series (UUIDs)',
				name: 'filterForNotInSeriesUuids',
				type: 'string',
				default: '',
				description: 'Exclude specific podcasts from search',
				hint: 'Comma-separated UUIDs. E.g., uuid1,uuid2,uuid3',
			},
		],
	},
];

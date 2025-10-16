import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, LANGUAGE_OPTIONS, PODCAST_CONTENT_TYPE_OPTIONS, SearchVariables, PodcastEpisode, EPISODE_EXTENDED_FRAGMENT, EPISODE_WITH_TRANSCRIPT_FRAGMENT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { requestWithPagination, standardizeResponse, parseDate, numResultsField, expandGenres, includeTranscriptField } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleSearchEpisodes(
	operation: Operation,
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const searchQuery = context.getNodeParameter('episodeSearchQuery', itemIndex) as string;
	const numResults = context.getNodeParameter(`${operation}-numResults`, itemIndex) as number;
	const includeTranscript = context.getNodeParameter(`${operation}-includeTranscript`, itemIndex) as boolean;

	const variables: SearchVariables = { term: searchQuery };
	variables.filterForTypes = ['PODCASTEPISODE'];

	// Get advanced options
	const advancedOptions = context.getNodeParameter('episodeAdvancedOptions', itemIndex, {}) as IDataObject;

	// Content filters
	const filterForGenres = advancedOptions.episodeFilterForGenres as string[] || [];
	if (filterForGenres.length > 0) {
		variables.filterForGenres = expandGenres(filterForGenres);
	}

	const filterForLanguages = advancedOptions.episodeFilterForLanguages as string[] || [];
	if (filterForLanguages.length > 0) {
		variables.filterForLanguages = filterForLanguages;
	}

	const filterForPodcastContentType = advancedOptions.episodeFilterForPodcastContentType as string[] || [];
	if (filterForPodcastContentType.length > 0) {
		variables.filterForPodcastContentType = filterForPodcastContentType;
	}

	const isSafeMode = advancedOptions.episodeIsSafeMode as boolean || false;
	if (isSafeMode) {
		variables.isSafeMode = isSafeMode;
	}

	// Search behavior
	const matchBy = advancedOptions.episodeMatchBy as string || '';
	if (matchBy) {
		variables.matchBy = matchBy;
	}

	const sortBy = advancedOptions.episodeSortBy as string || '';
	if (sortBy) {
		variables.sortBy = sortBy;
	}

	const filterForDurationGreaterThan = advancedOptions.episodeFilterForDurationGreaterThan as number || 0;
	if (filterForDurationGreaterThan) {
		variables.filterForDurationGreaterThan = filterForDurationGreaterThan;
	}

	const filterForDurationLessThan = advancedOptions.episodeFilterForDurationLessThan as number || 0;
	if (filterForDurationLessThan) {
		variables.filterForDurationLessThan = filterForDurationLessThan;
	}

	// Date filters
	const filterForPublishedAfter = advancedOptions.episodeFilterForPublishedAfter as string || '';
	if (filterForPublishedAfter) {
		variables.filterForPublishedAfter = parseDate(filterForPublishedAfter, context);
	}

	const filterForPublishedBefore = advancedOptions.episodeFilterForPublishedBefore as string || '';
	if (filterForPublishedBefore) {
		variables.filterForPublishedBefore = parseDate(filterForPublishedBefore, context);
	}

	// Series filters
	const filterForSeriesUuids = advancedOptions.episodeFilterForSeriesUuids as string || '';
	if (filterForSeriesUuids) {
		variables.filterForSeriesUuids = filterForSeriesUuids.split(',').map(uuid => uuid.trim()).filter(uuid => uuid);
	}

	const filterForNotInSeriesUuids = advancedOptions.episodeFilterForNotInSeriesUuids as string || '';
	if (filterForNotInSeriesUuids) {
		variables.filterForNotInSeriesUuids = filterForNotInSeriesUuids.split(',').map(uuid => uuid.trim()).filter(uuid => uuid);
	}

	// Dynamically build episode fragment based on includeTranscript
	const episodeFragment = includeTranscript ? EPISODE_WITH_TRANSCRIPT_FRAGMENT : EPISODE_EXTENDED_FRAGMENT;

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
					${episodeFragment}
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
		...variables,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const searchEpisodesFields: INodeProperties[] = [
	{
		displayName: 'Search Query',
		name: 'episodeSearchQuery',
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
	includeTranscriptField(true, Operation.SEARCH_EPISODES),
	{
		displayName: 'Advanced Options',
		name: 'episodeAdvancedOptions',
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
				name: 'episodeFilterForGenres',
				type: 'multiOptions',
				options: GENRE_OPTIONS,
				default: [],
				description: 'Filter by podcast genres',
			},
			{
				displayName: 'Languages',
				name: 'episodeFilterForLanguages',
				type: 'multiOptions',
				options: LANGUAGE_OPTIONS,
				default: [],
				description: 'Filter by podcast languages',
			},
			{
				displayName: 'Content Type',
				name: 'episodeFilterForPodcastContentType',
				type: 'multiOptions',
				options: PODCAST_CONTENT_TYPE_OPTIONS,
				default: [],
				description: 'Filter by audio or video podcasts',
			},
			{
				displayName: 'Safe Mode',
				name: 'episodeIsSafeMode',
				type: 'boolean',
				default: false,
				description: 'Only return safe (non-explicit) content',
				hint: 'Enable to exclude explicit content',
			},
			{
				displayName: 'Match Strategy',
				name: 'episodeMatchBy',
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
				name: 'episodeSortBy',
				type: 'options',
				options: [
					{ name: 'Relevance', value: 'EXACTNESS' },
					{ name: 'Popularity', value: 'POPULARITY' },
				],
				default: 'EXACTNESS',
				description: 'How to sort search results',
			},
			{
				displayName: 'Published After',
				name: 'episodeFilterForPublishedAfter',
				type: 'dateTime',
				default: '',
				description: 'Only return content published after this date',
				hint: 'Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS',
			},
			{
				displayName: 'Published Before',
				name: 'episodeFilterForPublishedBefore',
				type: 'dateTime',
				default: '',
				description: 'Only return content published before this date',
				hint: 'Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS',
			},
			{
				displayName: 'Minimum Duration (seconds)',
				name: 'episodeFilterForDurationGreaterThan',
				type: 'number',
				default: 0,
				description: 'Only return episodes longer than this duration',
				hint: 'E.g., 3600 for episodes over 1 hour',
			},
			{
				displayName: 'Maximum Duration (seconds)',
				name: 'episodeFilterForDurationLessThan',
				type: 'number',
				default: 0,
				description: 'Only return episodes shorter than this duration',
				hint: 'E.g., 600 for episodes under 10 minutes',
			},
			{
				displayName: 'Include Only Series (UUIDs)',
				name: 'episodeFilterForSeriesUuids',
				type: 'string',
				default: '',
				description: 'Search within specific podcasts only',
				hint: 'Comma-separated UUIDs. E.g., uuid1,uuid2,uuid3',
			},
			{
				displayName: 'Exclude Series (UUIDs)',
				name: 'episodeFilterForNotInSeriesUuids',
				type: 'string',
				default: '',
				description: 'Exclude specific podcasts from search',
				hint: 'Comma-separated UUIDs. E.g., uuid1,uuid2,uuid3',
			},
		],
	},
];

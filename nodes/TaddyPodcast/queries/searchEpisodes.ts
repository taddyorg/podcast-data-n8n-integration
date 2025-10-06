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
	const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;

	const variables: SearchVariables = { term: searchQuery };
	variables.filterForTypes = ['PODCASTEPISODE'];

	// Content filters
	const filterForGenres = context.getNodeParameter('filterForGenres', itemIndex, []) as string[];
	if (filterForGenres.length > 0) {
		variables.filterForGenres = expandGenres(filterForGenres);
	}

	const filterForLanguages = context.getNodeParameter('filterForLanguages', itemIndex, []) as string[];
	if (filterForLanguages.length > 0) {
		variables.filterForLanguages = filterForLanguages;
	}

	const filterForPodcastContentType = context.getNodeParameter('filterForPodcastContentType', itemIndex, []) as string[];
	if (filterForPodcastContentType.length > 0) {
		variables.filterForPodcastContentType = filterForPodcastContentType;
	}

	const isSafeMode = context.getNodeParameter('isSafeMode', itemIndex, false) as boolean;
	if (isSafeMode) {
		variables.isSafeMode = isSafeMode;
	}

	// Search behavior
	const matchBy = context.getNodeParameter('matchBy', itemIndex, '') as string;
	if (matchBy) {
		variables.matchBy = matchBy;
	}

	const sortBy = context.getNodeParameter('sortBy', itemIndex, '') as string;
	if (sortBy) {
		variables.sortBy = sortBy;
	}

	// Episode-specific filters
	const filterForHasTranscript = context.getNodeParameter('filterForHasTranscript', itemIndex, false) as boolean;
	if (filterForHasTranscript) {
		variables.filterForHasTranscript = filterForHasTranscript;
	}

	const filterForDurationGreaterThan = context.getNodeParameter('filterForDurationGreaterThan', itemIndex, 0) as number;
	if (filterForDurationGreaterThan) {
		variables.filterForDurationGreaterThan = filterForDurationGreaterThan;
	}

	const filterForDurationLessThan = context.getNodeParameter('filterForDurationLessThan', itemIndex, 0) as number;
	if (filterForDurationLessThan) {
		variables.filterForDurationLessThan = filterForDurationLessThan;
	}

	// Date filters
	const filterForPublishedAfter = context.getNodeParameter('filterForPublishedAfter', itemIndex, '') as string;
	if (filterForPublishedAfter) {
		variables.filterForPublishedAfter = parseDate(filterForPublishedAfter, context);
	}

	const filterForPublishedBefore = context.getNodeParameter('filterForPublishedBefore', itemIndex, '') as string;
	if (filterForPublishedBefore) {
		variables.filterForPublishedBefore = parseDate(filterForPublishedBefore, context);
	}

	// Series filters
	const filterForSeriesUuids = context.getNodeParameter('filterForSeriesUuids', itemIndex, '') as string;
	if (filterForSeriesUuids) {
		variables.filterForSeriesUuids = filterForSeriesUuids.split(',').map(uuid => uuid.trim()).filter(uuid => uuid);
	}

	const filterForNotInSeriesUuids = context.getNodeParameter('filterForNotInSeriesUuids', itemIndex, '') as string;
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
		maxResults,
		'search.podcastEpisodes'
	);

	const searchData = apiResponse.data?.search as IDataObject || {};
	const episodeResults = searchData.podcastEpisodes as PodcastEpisode[] || [];

	return standardizeResponse(Operation.SEARCH_EPISODES, {
		searchQuery,
		maxResults,
		searchId: searchData.searchId || '',
		podcastEpisodes: episodeResults,
		totalEpisodesReturned: episodeResults.length,
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
	numResultsField(10, Operation.SEARCH_EPISODES),
	{
		displayName: 'Genres',
		name: 'filterForGenres',
		type: 'multiOptions',
		options: GENRE_OPTIONS,
		default: [],
		description: 'Filter by podcast genres',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Languages',
		name: 'filterForLanguages',
		type: 'multiOptions',
		options: LANGUAGE_OPTIONS,
		default: [],
		description: 'Filter by podcast languages',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Content Type',
		name: 'filterForPodcastContentType',
		type: 'multiOptions',
		options: PODCAST_CONTENT_TYPE_OPTIONS,
		default: [],
		description: 'Filter by audio or video podcasts',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Safe Mode',
		name: 'isSafeMode',
		type: 'boolean',
		default: false,
		description: 'Only return safe (non-explicit) content',
		hint: 'Enable to exclude explicit content',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
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
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
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
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Has Transcript',
		name: 'filterForHasTranscript',
		type: 'boolean',
		default: false,
		description: 'Only return episodes with transcripts available',
		hint: 'Useful for AI-powered summaries',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Published After',
		name: 'filterForPublishedAfter',
		type: 'dateTime',
		default: '',
		description: 'Only return content published after this date',
		hint: 'Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Published Before',
		name: 'filterForPublishedBefore',
		type: 'dateTime',
		default: '',
		description: 'Only return content published before this date',
		hint: 'Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Minimum Duration (seconds)',
		name: 'filterForDurationGreaterThan',
		type: 'number',
		default: 0,
		description: 'Only return episodes longer than this duration',
		hint: 'E.g., 3600 for episodes over 1 hour',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Maximum Duration (seconds)',
		name: 'filterForDurationLessThan',
		type: 'number',
		default: 0,
		description: 'Only return episodes shorter than this duration',
		hint: 'E.g., 600 for episodes under 10 minutes',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Include Only Series (UUIDs)',
		name: 'filterForSeriesUuids',
		type: 'string',
		default: '',
		description: 'Search within specific podcasts only',
		hint: 'Comma-separated UUIDs. E.g., uuid1,uuid2,uuid3',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
	{
		displayName: 'Exclude Series (UUIDs)',
		name: 'filterForNotInSeriesUuids',
		type: 'string',
		default: '',
		description: 'Exclude specific podcasts from search',
		hint: 'Comma-separated UUIDs. E.g., uuid1,uuid2,uuid3',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_EPISODES],
			},
		},
	},
];

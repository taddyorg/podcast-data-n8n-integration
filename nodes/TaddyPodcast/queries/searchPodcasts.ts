import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, GENRE_OPTIONS, LANGUAGE_OPTIONS, PODCAST_CONTENT_TYPE_OPTIONS, SearchVariables, PodcastSeries, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithPagination, standardizeResponse, parseDate, numResultsField, expandGenres } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleSearchPodcasts(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const searchQuery = context.getNodeParameter('searchQuery', itemIndex) as string;
	const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;

	const variables: SearchVariables = { term: searchQuery };
	variables.filterForTypes = ['PODCASTSERIES'];

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

	// Date filters
	const filterForPublishedAfter = context.getNodeParameter('filterForPublishedAfter', itemIndex, '') as string;
	if (filterForPublishedAfter) {
		variables.filterForPublishedAfter = parseDate(filterForPublishedAfter, context);
	}

	const filterForPublishedBefore = context.getNodeParameter('filterForPublishedBefore', itemIndex, '') as string;
	if (filterForPublishedBefore) {
		variables.filterForPublishedBefore = parseDate(filterForPublishedBefore, context);
	}

	// Podcast-specific filters
	const filterForTotalEpisodesGreaterThan = context.getNodeParameter('filterForTotalEpisodesGreaterThan', itemIndex, 0) as number;
	if (filterForTotalEpisodesGreaterThan) {
		variables.filterForTotalEpisodesGreaterThan = filterForTotalEpisodesGreaterThan;
	}

	const filterForTotalEpisodesLessThan = context.getNodeParameter('filterForTotalEpisodesLessThan', itemIndex, 0) as number;
	if (filterForTotalEpisodesLessThan) {
		variables.filterForTotalEpisodesLessThan = filterForTotalEpisodesLessThan;
	}

	const filterForLastUpdatedAfter = context.getNodeParameter('filterForLastUpdatedAfter', itemIndex, '') as string;
	if (filterForLastUpdatedAfter) {
		variables.filterForLastUpdatedAfter = parseDate(filterForLastUpdatedAfter, context);
	}

	const filterForLastUpdatedBefore = context.getNodeParameter('filterForLastUpdatedBefore', itemIndex, '') as string;
	if (filterForLastUpdatedBefore) {
		variables.filterForLastUpdatedBefore = parseDate(filterForLastUpdatedBefore, context);
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
			$filterForPublishedAfter: Int
			$filterForPublishedBefore: Int
			$filterForTotalEpisodesGreaterThan: Int
			$filterForTotalEpisodesLessThan: Int
			$filterForLastUpdatedAfter: Int
			$filterForLastUpdatedBefore: Int
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
				filterForPublishedAfter: $filterForPublishedAfter
				filterForPublishedBefore: $filterForPublishedBefore
				filterForTotalEpisodesGreaterThan: $filterForTotalEpisodesGreaterThan
				filterForTotalEpisodesLessThan: $filterForTotalEpisodesLessThan
				filterForLastUpdatedAfter: $filterForLastUpdatedAfter
				filterForLastUpdatedBefore: $filterForLastUpdatedBefore
				filterForSeriesUuids: $filterForSeriesUuids
				filterForNotInSeriesUuids: $filterForNotInSeriesUuids
				page: $page
				limitPerPage: $limitPerPage
			) {
				searchId
				podcastSeries {
					${PODCAST_SERIES_EXTENDED_FRAGMENT}
				}
			}
		}
	`;

	const apiResponse = await requestWithPagination(
		Operation.SEARCH_PODCASTS,
		query,
		variables,
		context,
		maxResults,
		'search.podcastSeries'
	);

	const searchData = apiResponse.data?.search as IDataObject || {};
	const podcastResults = searchData.podcastSeries as PodcastSeries[] || [];

	return standardizeResponse(Operation.SEARCH_PODCASTS, {
		searchQuery,
		maxResults,
		searchId: searchData.searchId || '',
		podcastSeries: podcastResults,
		totalPodcastsReturned: podcastResults.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const searchPodcastsFields: INodeProperties[] = [
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		default: '',
		placeholder: 'e.g., technology, joe rogan, true crime',
		description: 'Enter search terms to find podcasts. Can be podcast names, topics, or keywords.',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS],
			},
		},
	},
	numResultsField(10, Operation.SEARCH_PODCASTS),
	{
		displayName: 'Genres',
		name: 'filterForGenres',
		type: 'multiOptions',
		options: GENRE_OPTIONS,
		default: [],
		description: 'Filter by podcast genres',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
			},
		},
	},
	{
		displayName: 'Minimum Episode Count',
		name: 'filterForTotalEpisodesGreaterThan',
		type: 'number',
		default: 0,
		description: 'Only return podcasts with more than this many episodes',
		hint: 'Useful for finding established shows',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS],
			},
		},
	},
	{
		displayName: 'Maximum Episode Count',
		name: 'filterForTotalEpisodesLessThan',
		type: 'number',
		default: 0,
		description: 'Only return podcasts with fewer than this many episodes',
		hint: 'Useful for finding new shows',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS],
			},
		},
	},
	{
		displayName: 'Last Updated After',
		name: 'filterForLastUpdatedAfter',
		type: 'dateTime',
		default: '',
		description: 'Only return podcasts with episodes published after this date',
		hint: 'For finding active shows',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS],
			},
		},
	},
	{
		displayName: 'Last Updated Before',
		name: 'filterForLastUpdatedBefore',
		type: 'dateTime',
		default: '',
		description: 'Only return podcasts with episodes published before this date',
		hint: 'For finding inactive shows',
		displayOptions: {
			show: {
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
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
				operation: [Operation.SEARCH_PODCASTS],
			},
		},
	},
];

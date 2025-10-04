import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData, NodeOperationError, IDataObject } from 'n8n-workflow';

// ============================================================================
// Enums
// ============================================================================

enum Operation {
	CHECK_API_REQUESTS_REMAINING = 'checkApiRequestsRemaining',
	CHECK_TRANSCRIPT_CREDITS_REMAINING = 'checkTranscriptCreditsRemaining',
	GET_EPISODE_TRANSCRIPT = 'getEpisodeTranscript',
	GET_LATEST_EPISODES = 'getLatestEpisodes',
	GET_MULTIPLE_PODCASTS = 'getMultiplePodcasts',
	GET_PODCAST_BY_UUID = 'getPodcastByUuid',
	GET_PODCAST_EPISODES = 'getPodcastEpisodes',
	GET_POPULAR_PODCASTS = 'getPopularPodcasts',
	GET_TOP_CHARTS = 'getTopCharts',
	SEARCH_PODCASTS = 'searchPodcasts',
}

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface PodcastSeries extends IDataObject {
	uuid: string;
	name: string;
	description?: string;
	imageUrl?: string;
	rssUrl?: string;
	itunesId?: number;
	language?: string;
	totalEpisodesCount?: number;
	authorName?: string;
	websiteUrl?: string;
	genres?: string[];
	popularityRank?: number;
	itunesInfo?: {
		uuid: string;
		baseArtworkUrlOf?: string;
		summary?: string;
	};
}

interface PodcastEpisode extends IDataObject {
	uuid: string;
	name: string;
	subtitle?: string;
	description?: string;
	audioUrl?: string;
	imageUrl?: string;
	datePublished?: number;
	duration?: number;
	episodeNumber?: number;
	seasonNumber?: number;
	transcriptUrls?: string[];
	fileType?: string;
	podcastSeries?: {
		uuid: string;
		name: string;
		imageUrl?: string;
	};
}

interface SearchVariables extends IDataObject {
	term?: string;
	filterForTypes?: string[];
	filterForGenres?: string[];
	filterForLanguages?: string[];
	matchBy?: string;
	sortBy?: string;
	filterForHasTranscript?: boolean;
	filterForPublishedAfter?: number;
}

interface ApiResponse {
	data?: IDataObject;
	errors?: Array<{ message: string }>;
}

interface ApiError {
	response?: {
		status?: number;
		statusText?: string;
		data?: unknown;
	};
	message?: string;
}

export class TaddyPodcast implements INodeType {
	// ============================================================================
	// Constants
	// ============================================================================

	private static readonly API_BASE_URL = 'https://api.taddy.org';
	private static readonly MAX_API_LIMIT = 25;
	private static readonly MAX_RETRIES = 3;
	// private static readonly KNOWN_PODCASTS = [
	// 	'The Daily',
	// 	'This American Life',
	// 	'Joe Rogan Experience',
	// 	'Serial',
	// 	'Radiolab',
	// ];

	// ============================================================================
	// GraphQL Fragments
	// ============================================================================

	private static readonly ITUNES_INFO_FIELDS = `
		uuid
		baseArtworkUrlOf(size: 640)
		summary
	`;

	private static readonly PODCAST_SERIES_FIELDS = `
		uuid
		name
		description
		imageUrl
		totalEpisodesCount
		language
		genres
		itunesId
	`;

	private static readonly PODCAST_SERIES_EXTENDED_FIELDS = `
		uuid
		name
		description
		imageUrl
		rssUrl
		language
		totalEpisodesCount
		authorName
		websiteUrl
		itunesInfo {
			${TaddyPodcast.ITUNES_INFO_FIELDS}
		}
		genres
	`;

	private static readonly EPISODE_FIELDS = `
		uuid
		name
		description
		audioUrl
		duration
		datePublished
	`;

	private static readonly EPISODE_EXTENDED_FIELDS = `
		uuid
		name
		subtitle
		description
		audioUrl
		imageUrl
		datePublished
		duration
		episodeNumber
		seasonNumber
		transcriptUrls
		fileType
	`;


	description: INodeTypeDescription = {
		displayName: 'Podcast Data Extractor (Taddy API)',
		name: 'taddyPodcast',
		icon: 'file:taddypodcast.svg',
		group: ['transform'],
		version: 1,
		description: 'Extract and analyze podcast data from 4M+ shows via Taddy API. Perfect for podcast discovery, content analysis, and automated podcast roundups.',
		defaults: {
			name: 'Podcast Data Extractor (Taddy API)',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'taddyPodcastApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: Operation.SEARCH_PODCASTS,
				description: 'Choose the operation to perform',
				options: [
					{
						name: 'Check Taddy API Requests Remaining',
						value: Operation.CHECK_API_REQUESTS_REMAINING,
						description: 'Check the number of Taddy API requests remaining',
						action: 'Check Taddy API requests remaining',
					},
					{
						name: 'Check Transcript Credits Remaining',
						value: Operation.CHECK_TRANSCRIPT_CREDITS_REMAINING,
						description: 'Check the number of transcript credits you have remaining',
						action: 'Check transcript credits remaining',
					},
					{
						name: 'Get Episode Transcript',
						value: Operation.GET_EPISODE_TRANSCRIPT,
						description: 'Extract transcript from a specific episode (uses credits)',
						action: 'Extract transcript from a specific episode',
					},
					{
						name: 'Get Latest Episodes',
						value: Operation.GET_LATEST_EPISODES,
						description: 'Get newly released episodes from multiple podcasts',
						action: 'Get newly released episodes from multiple podcasts',
					},
					{
						name: 'Get Multiple Podcasts',
						value: Operation.GET_MULTIPLE_PODCASTS,
						description: 'Get information about multiple podcasts by UUID',
						action: 'Get information about multiple podcasts by UUID',
					},
					{
						name: 'Get Podcast by UUID',
						value: Operation.GET_PODCAST_BY_UUID,
						description: 'Get detailed information about a specific podcast',
						action: 'Get detailed information about a specific podcast',
					},
					{
						name: 'Get Podcast Episodes',
						value: Operation.GET_PODCAST_EPISODES,
						description: 'Get episodes list for a specific podcast',
						action: 'Get episodes for a specific podcast',
					},
					{
						name: 'Get Popular Podcasts',
						value: Operation.GET_POPULAR_PODCASTS,
						description: 'Get popular podcasts by genre or language',
						action: 'Get popular podcasts by genre or language',
					},
					{
						name: 'Get Top Charts',
						value: Operation.GET_TOP_CHARTS,
						description: 'Get top podcast charts by genre',
						action: 'Get top podcast charts by genre',
					},
					{
						name: 'Search Podcasts',
						value: Operation.SEARCH_PODCASTS,
						description: 'Search for podcasts and episodes with advanced filters',
						action: 'Search for podcasts and episodes with advanced filters',
					},
				],
			},
			// Search Podcasts fields
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				placeholder: 'e.g., technology, joe rogan, true crime',
				description: 'Enter search terms to find podcasts or episodes. Can be podcast names, topics, or keywords.',
				displayOptions: {
					show: {
						operation: [Operation.SEARCH_PODCASTS],
					},
				},
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				default: 10,
				description: 'Maximum number of results to return (1-25)',
				hint: 'Passed directly to API for efficient data retrieval',
				typeOptions: {
					minValue: 1,
					maxValue: 25,
				},
				displayOptions: {
					show: {
						operation: [Operation.SEARCH_PODCASTS, Operation.GET_PODCAST_EPISODES, Operation.GET_POPULAR_PODCASTS, Operation.GET_TOP_CHARTS],
					},
				},
			},
			// Get Multiple Podcasts fields
			{
				displayName: 'Podcast UUIDs',
				name: 'podcastUuids',
				type: 'string',
				default: '',
				placeholder: 'uuid1,uuid2,uuid3',
				description: 'Comma-separated list of podcast UUIDs (max 25)',
				hint: 'Get UUIDs from search results or previous operations',
				displayOptions: {
					show: {
						operation: [Operation.GET_MULTIPLE_PODCASTS],
					},
				},
			},
			// Get Latest Episodes fields
			{
				displayName: 'Input Type',
				name: 'latestEpisodesInputType',
				type: 'options',
				options: [
					{ name: 'Podcast UUIDs', value: 'uuids' },
					{ name: 'RSS URLs', value: 'rssUrls' },
				],
				default: 'uuids',
				description: 'Choose how to specify the podcasts',
				displayOptions: {
					show: {
						operation: [Operation.GET_LATEST_EPISODES],
					},
				},
			},
			{
				displayName: 'Podcast UUIDs',
				name: 'latestEpisodesUuids',
				type: 'string',
				default: '',
				placeholder: 'uuid1,uuid2,uuid3',
				description: 'Comma-separated list of podcast UUIDs (max 1000)',
				hint: 'Perfect for tracking multiple podcasts for weekly roundups',
				displayOptions: {
					show: {
						operation: [Operation.GET_LATEST_EPISODES],
						latestEpisodesInputType: ['uuids'],
					},
				},
			},
			{
				displayName: 'RSS URLs',
				name: 'latestEpisodesRssUrls',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/feed1.xml,https://example.com/feed2.xml',
				description: 'Comma-separated list of RSS feed URLs (max 1000)',
				displayOptions: {
					show: {
						operation: [Operation.GET_LATEST_EPISODES],
						latestEpisodesInputType: ['rssUrls'],
					},
				},
			},
			// Popular & Top Charts fields
			{
				displayName: 'Filter by Genres',
				name: 'popularGenres',
				type: 'multiOptions',
				options: [
					{ name: 'Arts', value: 'PODCASTSERIES_ARTS' },
					{ name: 'Business', value: 'PODCASTSERIES_BUSINESS' },
					{ name: 'Comedy', value: 'PODCASTSERIES_COMEDY' },
					{ name: 'Education', value: 'PODCASTSERIES_EDUCATION' },
					{ name: 'Fiction', value: 'PODCASTSERIES_FICTION' },
					{ name: 'Government', value: 'PODCASTSERIES_GOVERNMENT' },
					{ name: 'Health & Fitness', value: 'PODCASTSERIES_HEALTH_AND_FITNESS' },
					{ name: 'History', value: 'PODCASTSERIES_HISTORY' },
					{ name: 'Kids & Family', value: 'PODCASTSERIES_KIDS_AND_FAMILY' },
					{ name: 'Music', value: 'PODCASTSERIES_MUSIC' },
					{ name: 'News', value: 'PODCASTSERIES_NEWS' },
					{ name: 'Religion & Spirituality', value: 'PODCASTSERIES_RELIGION_AND_SPIRITUALITY' },
					{ name: 'Science', value: 'PODCASTSERIES_SCIENCE' },
					{ name: 'Society & Culture', value: 'PODCASTSERIES_SOCIETY_AND_CULTURE' },
					{ name: 'Sports', value: 'PODCASTSERIES_SPORTS' },
					{ name: 'Technology', value: 'PODCASTSERIES_TECHNOLOGY' },
					{ name: 'True Crime', value: 'PODCASTSERIES_TRUE_CRIME' },
					{ name: 'TV & Film', value: 'PODCASTSERIES_TV_AND_FILM' },
				],
				default: [],
				description: 'Filter popular podcasts by specific genres',
				displayOptions: {
					show: {
						operation: [Operation.GET_POPULAR_PODCASTS, Operation.GET_TOP_CHARTS],
					},
				},
			},
			{
				displayName: 'Filter by Language',
				name: 'popularLanguage',
				type: 'options',
				options: [
					{ name: 'All Languages', value: '' },
					{ name: 'Arabic', value: 'ARABIC' },
					{ name: 'Chinese', value: 'CHINESE' },
					{ name: 'Dutch', value: 'DUTCH_FLEMISH' },
					{ name: 'English', value: 'ENGLISH' },
					{ name: 'French', value: 'FRENCH' },
					{ name: 'German', value: 'GERMAN' },
					{ name: 'Hindi', value: 'HINDI' },
					{ name: 'Italian', value: 'ITALIAN' },
					{ name: 'Japanese', value: 'JAPANESE' },
					{ name: 'Korean', value: 'KOREAN' },
					{ name: 'Portuguese', value: 'PORTUGUESE' },
					{ name: 'Russian', value: 'RUSSIAN' },
					{ name: 'Spanish', value: 'SPANISH' },
					{ name: 'Swedish', value: 'SWEDISH' },
				],
				default: '',
				description: 'Filter popular podcasts by language',
				displayOptions: {
					show: {
						operation: [Operation.GET_POPULAR_PODCASTS],
					},
				},
			},
			// Advanced Search Options
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: [Operation.SEARCH_PODCASTS],
					},
				},
				options: [
					{
						displayName: 'Content Types',
						name: 'filterForTypes',
						type: 'multiOptions',
						options: [
							{ name: 'Podcast Episodes', value: 'PODCASTEPISODE' },
							{ name: 'Podcast Series', value: 'PODCASTSERIES' },
						],
						default: ['PODCASTSERIES'],
						description: 'Types of content to search for',
					},
					{
						displayName: 'Genres',
						name: 'filterForGenres',
						type: 'multiOptions',
						options: [
							{ name: 'Arts', value: 'PODCASTSERIES_ARTS' },
							{ name: 'Business', value: 'PODCASTSERIES_BUSINESS' },
							{ name: 'Comedy', value: 'PODCASTSERIES_COMEDY' },
							{ name: 'Education', value: 'PODCASTSERIES_EDUCATION' },
							{ name: 'Fiction', value: 'PODCASTSERIES_FICTION' },
							{ name: 'Health & Fitness', value: 'PODCASTSERIES_HEALTH_AND_FITNESS' },
							{ name: 'News', value: 'PODCASTSERIES_NEWS' },
							{ name: 'Science', value: 'PODCASTSERIES_SCIENCE' },
							{ name: 'Sports', value: 'PODCASTSERIES_SPORTS' },
							{ name: 'Technology', value: 'PODCASTSERIES_TECHNOLOGY' },
							{ name: 'True Crime', value: 'PODCASTSERIES_TRUE_CRIME' },
						],
						default: [],
						description: 'Filter by podcast genres',
					},
					{
						displayName: 'Languages',
						name: 'filterForLanguages',
						type: 'multiOptions',
						options: [
							{ name: 'Chinese', value: 'CHINESE' },
							{ name: 'English', value: 'ENGLISH' },
							{ name: 'French', value: 'FRENCH' },
							{ name: 'German', value: 'GERMAN' },
							{ name: 'Japanese', value: 'JAPANESE' },
							{ name: 'Portuguese', value: 'PORTUGUESE' },
							{ name: 'Russian', value: 'RUSSIAN' },
							{ name: 'Spanish', value: 'SPANISH' },
						],
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
			// Single Podcast fields
			{
				displayName: 'Podcast UUID',
				name: 'podcastUuid',
				type: 'string',
				default: '',
				placeholder: 'e.g., cb8d858a-3ef4-4645-8942-67e55c0927f2',
				description: 'The unique identifier of the podcast',
				hint: 'Get this from search results or other operations',
				displayOptions: {
					show: {
						operation: [Operation.GET_PODCAST_EPISODES, Operation.GET_PODCAST_BY_UUID],
					},
				},
			},
			// Episode fields
			{
				displayName: 'Episode UUID',
				name: 'episodeUuid',
				type: 'string',
				default: '',
				placeholder: 'e.g., 123e4567-e89b-12d3-a456-426614174000',
				description: 'The unique identifier of the episode',
				hint: 'Get this from episode results. Transcript extraction uses API credits.',
				displayOptions: {
					show: {
						operation: [Operation.GET_EPISODE_TRANSCRIPT],
					},
				},
			},
		],
	};

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Validates a UUID string format
	 * @param uuid - The UUID string to validate
	 * @returns True if the UUID is valid, false otherwise
	 */
	private static validateUuid(uuid: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	}

	/**
	 * Validates and parses a comma-separated list of UUIDs
	 * @param uuidsInput - Comma-separated UUID string
	 * @param maxCount - Maximum number of UUIDs allowed
	 * @returns Array of valid UUIDs
	 * @throws NodeOperationError if any UUID is invalid
	 */
	private static parseAndValidateUuids(
		uuidsInput: string,
		maxCount: number,
		context: IExecuteFunctions,
	): string[] {
		const uuids = uuidsInput
			.split(',')
			.map(u => u.trim())
			.filter(u => u)
			.slice(0, maxCount);

		const invalidUuids = uuids.filter(uuid => !TaddyPodcast.validateUuid(uuid));
		if (invalidUuids.length > 0) {
			throw new NodeOperationError(
				context.getNode(),
				`Invalid UUID format: ${invalidUuids.join(', ')}. UUIDs must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
			);
		}

		return uuids;
	}

	/**
	 * Validates and parses a date string for API use
	 * @param dateString - Date string to parse
	 * @returns Unix timestamp in seconds
	 * @throws NodeOperationError if date is invalid
	 */
	private static parseDate(dateString: string, context: IExecuteFunctions): number {
		const timestamp = new Date(dateString).getTime();
		if (isNaN(timestamp)) {
			throw new NodeOperationError(
				context.getNode(),
				`Invalid date format: ${dateString}. Use format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS`,
			);
		}
		return Math.floor(timestamp / 1000);
	}

	/**
	 * Sleep helper for retry logic
	 * @param ms - Milliseconds to sleep
	 */
	private static sleep(ms: number): Promise<void> {
		// eslint-disable-next-line no-undef
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Makes an API request to Taddy's GraphQL endpoint
	 * @param query - GraphQL query string
	 * @param variables - Query variables
	 * @param useGraphqlPath - Whether to use /graphql path instead of base URL
	 * @param context - n8n execution context
	 * @returns API response data
	 */
	private static async makeApiRequest(
		query: string,
		variables: IDataObject | undefined,
		context: IExecuteFunctions,
	): Promise<ApiResponse> {
		const credentials = await context.getCredentials('taddyPodcastApi');
		const userId = credentials.userId as string;
		const apiKey = credentials.apiKey as string;
		const url = TaddyPodcast.API_BASE_URL;

		return await context.helpers.httpRequest({
			method: 'POST',
			url,
			headers: {
				'X-USER-ID': userId,
				'X-API-KEY': apiKey,
				'Content-Type': 'application/json',
			},
			body: variables ? { query, variables } : { query },
		});
	}

	/**
	 * Makes an API request with retry logic and exponential backoff
	 * @param query - GraphQL query string
	 * @param variables - Query variables
	 * @param context - n8n execution context
	 * @returns API response data
	 */
	private static async requestWithRetry(
		query: string,
		variables: IDataObject | undefined,
		context: IExecuteFunctions,
	): Promise<ApiResponse> {
		let lastError: unknown;

		for (let attempt = 1; attempt <= TaddyPodcast.MAX_RETRIES; attempt++) {
			try {
				// Try base URL first
				return await TaddyPodcast.makeApiRequest(query, variables, context);
			} catch (err: unknown) {
				lastError = err;
				// If this is not the last attempt, wait with exponential backoff
				if (attempt < TaddyPodcast.MAX_RETRIES) {
					const backoffMs = Math.pow(2, attempt) * 1000;
					await TaddyPodcast.sleep(backoffMs);
				}
			}
		}

		// All retries failed
		throw lastError;
	}

	/**
	 * Standardizes response data format across all operations
	 * @param operation - Operation name
	 * @param data - Raw response data
	 * @param metadata - Additional metadata to include
	 * @returns Standardized response object
	 */
	private static standardizeResponse(
		operation: string,
		data: IDataObject,
		metadata?: IDataObject,
	): IDataObject {
		return {
			operation,
			timestamp: new Date().toISOString(),
			...data,
			...metadata,
		};
	}

	// ============================================================================
	// Operation Handler
	// ============================================================================

	/**
	 * Handles the execution of a specific operation
	 * @param operation - The operation to execute
	 * @param itemIndex - The index of the current item being processed
	 * @param context - The n8n execution context
	 * @returns The response data for the operation
	 */
	private static async handleOperation(
		operation: Operation,
		itemIndex: number,
		context: IExecuteFunctions,
	): Promise<IDataObject> {
		switch (operation) {
			// ============================================================================
			// Check API Requests Remaining
			// ============================================================================
			case Operation.CHECK_API_REQUESTS_REMAINING: {
				const query = `{ getApiRequestsRemaining }`;
				const apiResponse = await TaddyPodcast.requestWithRetry(query, undefined, context);

				return TaddyPodcast.standardizeResponse(operation, {
					requestsRemaining: apiResponse.data?.getApiRequestsRemaining || 0,
					message: `You have ${apiResponse.data?.getApiRequestsRemaining || 0} API requests remaining`,
				});
			}

			// ============================================================================
			// Check Transcript Credits Remaining
			// ============================================================================
			case Operation.CHECK_TRANSCRIPT_CREDITS_REMAINING: {
				const query = `{ getTranscriptCreditsRemaining }`;
				const apiResponse = await TaddyPodcast.requestWithRetry(query, undefined, context);

				return TaddyPodcast.standardizeResponse(operation, {
					creditsRemaining: apiResponse.data?.getTranscriptCreditsRemaining || 0,
					message: `You have ${apiResponse.data?.getTranscriptCreditsRemaining || 0} transcript credits remaining`,
				});
			}

			// ============================================================================
			// Get Latest Episodes
			// ============================================================================
			case Operation.GET_LATEST_EPISODES: {
				const inputType = context.getNodeParameter('latestEpisodesInputType', itemIndex) as string;
				let uuids: string[] = [];
				let rssUrls: string[] = [];

				if (inputType === 'uuids') {
					const uuidsInput = context.getNodeParameter('latestEpisodesUuids', itemIndex) as string;
					uuids = TaddyPodcast.parseAndValidateUuids(uuidsInput, 1000, context);
				} else {
					const rssUrlsInput = context.getNodeParameter('latestEpisodesRssUrls', itemIndex) as string;
					rssUrls = rssUrlsInput
						.split(',')
						.map(u => u.trim())
						.filter(u => u);
				}

				const query = `
					query GetLatestEpisodes($uuids: [ID], $rssUrls: [String]) {
						getLatestPodcastEpisodes(uuids: $uuids, rssUrls: $rssUrls) {
							${TaddyPodcast.EPISODE_FIELDS}
							podcastSeries {
								uuid
								name
								imageUrl
							}
						}
					}
				`;

				const variables: IDataObject = {};
				if (uuids.length > 0) variables.uuids = uuids;
				if (rssUrls.length > 0) variables.rssUrls = rssUrls;

				const apiResponse = await TaddyPodcast.requestWithRetry(query, variables, context);

				const episodes = (apiResponse.data?.getLatestPodcastEpisodes as PodcastEpisode[]) || [];
				return TaddyPodcast.standardizeResponse(operation, {
					episodes,
					totalEpisodes: episodes.length,
					inputType,
					inputCount: uuids.length || rssUrls.length,
				});
			}

			// ============================================================================
			// Get Multiple Podcasts
			// ============================================================================
			case Operation.GET_MULTIPLE_PODCASTS: {
				const uuidsInput = context.getNodeParameter('podcastUuids', itemIndex) as string;
				const uuids = TaddyPodcast.parseAndValidateUuids(uuidsInput, TaddyPodcast.MAX_API_LIMIT, context);

				const query = `
					query GetMultiplePodcasts($uuids: [ID]) {
						getMultiplePodcastSeries(uuids: $uuids) {
							${TaddyPodcast.PODCAST_SERIES_EXTENDED_FIELDS}
						}
					}
				`;

				const apiResponse = await TaddyPodcast.requestWithRetry(query, { uuids }, context);

				const podcasts = (apiResponse.data?.getMultiplePodcastSeries as PodcastSeries[]) || [];
				return TaddyPodcast.standardizeResponse(operation, {
					podcasts,
					totalReturned: podcasts.length,
					requestedCount: uuids.length,
				});
			}

			// ============================================================================
			// Get Popular Podcasts
			// ============================================================================
			case Operation.GET_POPULAR_PODCASTS: {
				const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;
				const genres = context.getNodeParameter('popularGenres', itemIndex) as string[];
				const language = context.getNodeParameter('popularLanguage', itemIndex) as string;

				const query = `
					query GetPopularContent($filterByGenres: [Genre!], $filterByLanguage: Language, $limitPerPage: Int) {
						getPopularContent(
							filterByGenres: $filterByGenres
							filterByLanguage: $filterByLanguage
							limitPerPage: $limitPerPage
							taddyType: PODCASTSERIES
						) {
							popularityRankId
							podcastSeries {
								${TaddyPodcast.PODCAST_SERIES_FIELDS}
								popularityRank
							}
						}
					}
				`;

				const variables: IDataObject = {
					limitPerPage: Math.min(maxResults, TaddyPodcast.MAX_API_LIMIT),
				};

				if (genres.length > 0) variables.filterByGenres = genres;
				if (language) variables.filterByLanguage = language;

				const apiResponse = await TaddyPodcast.requestWithRetry(query, variables, context);

				// Extract podcast series from the nested structure
				const popularContent = apiResponse.data?.getPopularContent as Array<{ podcastSeries: PodcastSeries }> || [];
				const podcasts = popularContent.map(item => item.podcastSeries);

				return TaddyPodcast.standardizeResponse(operation, {
					podcasts,
					totalReturned: podcasts.length,
					filters: {
						genres: genres.length > 0 ? genres : 'all',
						language: language || 'all',
					},
				});
			}

			// ============================================================================
			// Get Top Charts
			// ============================================================================
			case Operation.GET_TOP_CHARTS: {
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
								${TaddyPodcast.PODCAST_SERIES_FIELDS}
								itunesId
							}
						}
					}
				`;

				if (genres.length === 0) {
					throw new NodeOperationError(context.getNode(), 'At least one genre is required');
				}

				const variables: IDataObject = {
					limitPerPage: Math.min(maxResults, TaddyPodcast.MAX_API_LIMIT),
					genres: genres,
				};

				const apiResponse = await TaddyPodcast.requestWithRetry(query, variables, context);

				// Extract podcast series from the nested structure
				const topCharts = apiResponse.data?.getTopChartsByGenres as Array<{ podcastSeries: PodcastSeries }> || [];
				const podcasts = topCharts.map(item => item.podcastSeries);

				return TaddyPodcast.standardizeResponse(operation, {
					podcasts,
					totalReturned: podcasts.length,
					genres: genres.length > 0 ? genres : ['default'],
				});
			}

			// ============================================================================
			// Search Podcasts
			// ============================================================================
			case Operation.SEARCH_PODCASTS: {
				const searchQuery = context.getNodeParameter('searchQuery', itemIndex) as string;
				const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;
				const advancedOptions = context.getNodeParameter('advancedOptions', itemIndex) as IDataObject;

				const variables: SearchVariables = { term: searchQuery };

				if (advancedOptions.filterForTypes) {
					variables.filterForTypes = advancedOptions.filterForTypes as string[];
				}
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
					variables.filterForPublishedAfter = TaddyPodcast.parseDate(dateString, context);
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
							limitPerPage: ${Math.min(maxResults, TaddyPodcast.MAX_API_LIMIT)}
						) {
							searchId
							podcastSeries {
								${TaddyPodcast.PODCAST_SERIES_FIELDS}
								rssUrl
								itunesId
								popularityRank
								itunesInfo {
									uuid
									baseArtworkUrlOf(size: 640)
								}
							}
							podcastEpisodes {
								${TaddyPodcast.EPISODE_EXTENDED_FIELDS}
								subtitle
								podcastSeries {
									uuid
									name
									imageUrl
								}
							}
						}
					}
				`;

				const apiResponse = await TaddyPodcast.requestWithRetry(query, variables, context);
				const searchData = apiResponse.data?.search as IDataObject || {};

				const podcastResults = searchData.podcastSeries as PodcastSeries[] || [];
				const episodeResults = searchData.podcastEpisodes as PodcastEpisode[] || [];

				return TaddyPodcast.standardizeResponse(operation, {
					searchQuery,
					maxResults,
					advancedOptions,
					searchId: searchData.searchId || '',
					podcastSeries: podcastResults,
					podcastEpisodes: episodeResults,
					totalPodcastsReturned: podcastResults.length,
					totalEpisodesReturned: episodeResults.length,
				});
			}

			// ============================================================================
			// Get Podcast by UUID
			// ============================================================================
			case Operation.GET_PODCAST_BY_UUID: {
				const podcastUuid = context.getNodeParameter('podcastUuid', itemIndex) as string;

				if (!podcastUuid) {
					throw new NodeOperationError(context.getNode(), 'Podcast UUID is required');
				}

				if (!TaddyPodcast.validateUuid(podcastUuid)) {
					throw new NodeOperationError(
						context.getNode(),
						`Invalid UUID format: ${podcastUuid}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
					);
				}

				const query = `
					query getPodcastSeries($uuid: ID!) {
						getPodcastSeries(uuid: $uuid) {
							${TaddyPodcast.PODCAST_SERIES_EXTENDED_FIELDS}
						}
					}
				`;

				const apiResponse = await TaddyPodcast.requestWithRetry(query, { uuid: podcastUuid }, context);

				return TaddyPodcast.standardizeResponse(operation, {
					podcastUuid,
					podcast: apiResponse.data?.getPodcastSeries || null,
				});
			}

			// ============================================================================
			// Get Podcast Episodes
			// ============================================================================
			case Operation.GET_PODCAST_EPISODES: {
				const podcastUuid = context.getNodeParameter('podcastUuid', itemIndex) as string;
				const maxResults = context.getNodeParameter('maxResults', itemIndex) as number;

				if (!podcastUuid) {
					throw new NodeOperationError(context.getNode(), 'Podcast UUID is required');
				}

				if (!TaddyPodcast.validateUuid(podcastUuid)) {
					throw new NodeOperationError(
						context.getNode(),
						`Invalid UUID format: ${podcastUuid}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
					);
				}

				const query = `
					query GetPodcastEpisodes($uuid: ID!, $limitPerPage: Int!) {
						getPodcastSeries(uuid: $uuid) {
							uuid
							name
							episodes(limitPerPage: $limitPerPage, sortOrder: LATEST) {
								${TaddyPodcast.EPISODE_EXTENDED_FIELDS}
							}
						}
					}
				`;

				const apiResponse = await TaddyPodcast.requestWithRetry(
					query,
					{ uuid: podcastUuid, limitPerPage: Math.min(maxResults, TaddyPodcast.MAX_API_LIMIT) },
					context,
				);
				const podcast = apiResponse.data?.getPodcastSeries as { uuid: string; name: string; episodes: PodcastEpisode[] };
				const episodes = podcast?.episodes || [];

				return TaddyPodcast.standardizeResponse(operation, {
					podcastUuid,
					podcastName: podcast?.name || 'Unknown',
					episodes,
					totalReturned: episodes.length,
				});
			}

			// ============================================================================
			// Get Episode Transcript
			// ============================================================================
			case Operation.GET_EPISODE_TRANSCRIPT: {
				const episodeUuid = context.getNodeParameter('episodeUuid', itemIndex) as string;

				if (!episodeUuid) {
					throw new NodeOperationError(context.getNode(), 'Episode UUID is required');
				}

				if (!TaddyPodcast.validateUuid(episodeUuid)) {
					throw new NodeOperationError(
						context.getNode(),
						`Invalid UUID format: ${episodeUuid}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
					);
				}

				const query = `
					query GetEpisodeTranscript($uuid: ID!) {
						getPodcastEpisode(uuid: $uuid) {
							uuid
							name
							description
							transcript
							transcriptUrlsWithDetails {
								url
								type
								language
								hasTimecodes
								isTaddyExclusive
							}
						}
					}
				`;

				const apiResponse = await TaddyPodcast.requestWithRetry(query, { uuid: episodeUuid }, context);
				const episode = apiResponse.data?.getPodcastEpisode as {
					uuid: string;
					name: string;
					transcript?: string[];
					transcriptUrlsWithDetails?: Array<{ url: string; type: string; language: string }>;
				};

				return TaddyPodcast.standardizeResponse(operation, {
					episodeUuid,
					episodeName: episode?.name || 'Unknown',
					transcript: episode?.transcript || [],
					transcriptSegments: episode?.transcript?.length || 0,
					transcriptText: (episode?.transcript || []).join('\n'),
					transcriptUrls: episode?.transcriptUrlsWithDetails || [],
				});
			}

			default:
				throw new NodeOperationError(context.getNode(), `Unknown operation: ${operation}`);
		}
	}

	// ============================================================================
	// Main Execute Method
	// ============================================================================

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as Operation;

			try {
				const responseData = await TaddyPodcast.handleOperation(operation, i, this);
				returnData.push({ json: responseData });
			} catch (error: unknown) {
				const apiError = error as ApiError;
				const errorData: IDataObject = {
					operation,
					timestamp: new Date().toISOString(),
					error: apiError.message || 'Unknown error',
					status: apiError.response?.status || 0,
					statusText: apiError.response?.statusText || '',
					responseBody: JSON.stringify(apiError.response?.data || {}),
				};

				if (this.continueOnFail()) {
					returnData.push({ json: errorData });
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Taddy API Error: ${JSON.stringify(errorData, null, 2)}`,
					);
				}
			}
		}

		return [returnData];
	}
}

import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, ApiResponse, API_BASE_URL, MAX_RETRIES, GENRE_HIERARCHY, PAGINATION_CONFIGS } from '../constants';

// ============================================================================
// UI Field Definitions
// ============================================================================

export const numResultsField = (defaultValue: number, operation: Operation): INodeProperties => {
	const paginationConfig = PAGINATION_CONFIGS[operation];

	if (!paginationConfig) {
		throw new Error(`Pagination config is required for operation: ${operation}`);
	}
	
	return {
		displayName: 'Number of Results to Return',
		name: 'maxResults',
		type: 'number',
		default: defaultValue,
		description: `Number of results to return (1-${paginationConfig.limitPerPage * paginationConfig.maxPages})`,
		hint: 'Taddy API supports pagination, this will make multiple requests to the API to fetch all results (if needed)',
		typeOptions: {
			minValue: 1,
			maxValue: paginationConfig.limitPerPage * paginationConfig.maxPages,
		},
		displayOptions: {
			show: {
				operation: [operation],
			},
		},
	};
};

export const includeTranscriptField = (defaultValue: boolean, operations: Operation[]): INodeProperties => ({
	displayName: 'Include Free Transcript for each episode (if available)',
	name: 'includeTranscript',
	type: 'boolean',
	default: defaultValue,
	description: 'Whether to include episode transcripts if the podcast provides the transcript themselves (if available)',
	displayOptions: {
		show: {
			operation: operations,
		},
	},
});


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates a UUID string format
 * @param uuid - The UUID string to validate
 * @returns True if the UUID is valid, false otherwise
 */
export function validateUuid(uuid: string): boolean {
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
export function parseAndValidateUuids(
	uuidsInput: string,
	maxCount: number,
	context: IExecuteFunctions,
): string[] {
	const uuids = uuidsInput
		.split(',')
		.map(u => u.trim())
		.filter(u => u)
		.slice(0, maxCount);

	const invalidUuids = uuids.filter(uuid => !validateUuid(uuid));
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
export function parseDate(dateString: string, context: IExecuteFunctions): number {
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
 * Expands top-level genre selections to include all their subgenres
 * @param selectedGenres - Array of genre values selected by the user
 * @returns Expanded array including all subgenres for selected parent genres
 * @example
 * expandGenres(['PODCASTSERIES_BUSINESS'])
 * // Returns: ['PODCASTSERIES_BUSINESS', 'PODCASTSERIES_BUSINESS_CAREERS', 'PODCASTSERIES_BUSINESS_ENTREPRENEURSHIP', ...]
 */
export function expandGenres(selectedGenres: string[]): string[] {
	const expandedGenres = new Set<string>();

	for (const genre of selectedGenres) {
		// If the genre is a parent genre in our hierarchy, add all its children
		if (GENRE_HIERARCHY[genre]) {
			GENRE_HIERARCHY[genre].forEach(subgenre => expandedGenres.add(subgenre));
		} else {
			// If it's not in the hierarchy (shouldn't happen), add it as-is
			expandedGenres.add(genre);
		}
	}

	return Array.from(expandedGenres);
}

/**
 * Sleep helper for retry logic
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
	// eslint-disable-next-line no-undef
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Makes an API request to Taddy's GraphQL endpoint
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param context - n8n execution context
 * @returns API response data
 */
export async function makeApiRequest(
	query: string,
	variables: IDataObject | undefined,
	context: IExecuteFunctions,
): Promise<ApiResponse> {
	const credentials = await context.getCredentials('taddyPodcastApi');
	const userId = credentials.userId as string;
	const apiKey = credentials.apiKey as string;
	const url = API_BASE_URL;

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
export async function requestWithRetry(
	query: string,
	variables: IDataObject | undefined,
	context: IExecuteFunctions,
): Promise<ApiResponse> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			// Try base URL first
			return await makeApiRequest(query, variables, context);
		} catch (err: unknown) {
			lastError = err;
			// If this is not the last attempt, wait with exponential backoff
			if (attempt < MAX_RETRIES) {
				const backoffMs = Math.pow(2, attempt) * 1000;
				await sleep(backoffMs);
			}
		}
	}

	// All retries failed
	throw lastError;
}

/**
 * Makes paginated API requests and aggregates results
 * @param operation - Operation name
 * @param query - GraphQL query string (must include $page and $limitPerPage variables)
 * @param variables - Query variables (excluding page and limitPerPage)
 * @param context - n8n execution context
 * @param paginationConfig - Pagination configuration for this operation
 * @param numResults - Number of results to return
 * @param resultPath - Path to results array in response (e.g., 'search.podcastSeries')
 * @returns Aggregated API response with all results
 */
export async function requestWithPagination(
	operation: Operation,
	query: string,
	variables: IDataObject | undefined,
	context: IExecuteFunctions,
	numResults: number,
	resultPath: string,
): Promise<ApiResponse> {
	const paginationConfig = PAGINATION_CONFIGS[operation];
	if (!paginationConfig) { throw new NodeOperationError(context.getNode(), 'Pagination is not supported for this operation'); }
	// Ensure maxResults doesn't exceed API limits
	const cappedMaxResults = Math.min(numResults, paginationConfig.limitPerPage * paginationConfig.maxPages);

	// Calculate how many pages we need to fetch
	const limitPerPage = paginationConfig.limitPerPage;
	const totalPages = Math.min(
		Math.ceil(cappedMaxResults / limitPerPage),
		paginationConfig.maxPages
	);

	const allResults: unknown[] = [];
	let lastResponse: ApiResponse = { data: {} };

	// Fetch all required pages
	for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
		const pageVariables = {
			...variables,
			page: currentPage,
			limitPerPage: limitPerPage,
		};

		const pageResponse = await requestWithRetry(query, pageVariables, context);
		lastResponse = pageResponse;

		// Extract results from the response using the result path
		const pathParts = resultPath.split('.');
		let currentData: unknown = pageResponse.data;

		for (const part of pathParts) {
			if (currentData && typeof currentData === 'object' && part in currentData) {
				currentData = (currentData as IDataObject)[part];
			} else {
				currentData = undefined;
				break;
			}
		}

		if (Array.isArray(currentData)) {
			allResults.push(...currentData);

			// If we received fewer results than limitPerPage, we've reached the end
			if (currentData.length < limitPerPage) {
				break;
			}

			// If we have enough results, stop fetching
			if (allResults.length >= cappedMaxResults) {
				break;
			}
		} else {
			// No results or unexpected structure, stop pagination
			break;
		}
	}

	// Trim results to exact maxResults if we fetched more
	const trimmedResults = allResults.slice(0, cappedMaxResults);

	// Reconstruct the response with all aggregated results
	const aggregatedResponse: ApiResponse = {
		...lastResponse,
		data: {},
	};

	// Rebuild the nested structure
	if (aggregatedResponse.data) {
		const pathParts = resultPath.split('.');
		let current: IDataObject = aggregatedResponse.data;

		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			current[part] = current[part] || {};
			current = current[part] as IDataObject;
		}

		// Set the aggregated results at the final path
		const lastPart = pathParts[pathParts.length - 1];
		current[lastPart] = trimmedResults;

		// Preserve other fields from the last response (like searchId, etc.)
		if (lastResponse.data) {
			const firstLevelKey = pathParts[0];
			const sourceData = lastResponse.data[firstLevelKey] as IDataObject;
			if (sourceData && typeof sourceData === 'object') {
				const targetData = aggregatedResponse.data[firstLevelKey] as IDataObject;
				for (const key of Object.keys(sourceData)) {
					if (key !== pathParts[1] && !(key in targetData)) {
						targetData[key] = sourceData[key];
					}
				}
			}
		}
	}

	return aggregatedResponse;
}

/**
 * Standardizes response data format across all operations
 * @param operation - Operation name
 * @param data - Raw response data
 * @param metadata - Additional metadata to include
 * @returns Standardized response object
 */
export function standardizeResponse(
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

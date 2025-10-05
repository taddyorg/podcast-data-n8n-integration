import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, ApiResponse, API_BASE_URL, MAX_RETRIES } from '../constants';

// ============================================================================
// UI Field Definitions
// ============================================================================

export const maxResultsField: INodeProperties = {
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
			operation: [
				Operation.SEARCH_PODCASTS,
				Operation.SEARCH_EPISODES,
				Operation.GET_PODCAST_EPISODES,
				Operation.GET_POPULAR_PODCASTS,
				Operation.GET_DAILY_TOP_CHARTS,
			],
		},
	},
};

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

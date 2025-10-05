import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation } from '../constants';
import { requestWithRetry, standardizeResponse } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleCheckApiRequestsRemaining(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const query = `{ getApiRequestsRemaining }`;
	const apiResponse = await requestWithRetry(query, undefined, context);

	return standardizeResponse(Operation.CHECK_API_REQUESTS_REMAINING, {
		requestsRemaining: apiResponse.data?.getApiRequestsRemaining || 0,
		message: `You have ${apiResponse.data?.getApiRequestsRemaining || 0} API requests remaining`,
	});
}

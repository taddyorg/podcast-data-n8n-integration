import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation } from '../constants';
import { requestWithRetry, standardizeResponse } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleCheckTranscriptCreditsRemaining(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const query = `{ getTranscriptCreditsRemaining }`;
	const apiResponse = await requestWithRetry(query, undefined, context);

	return standardizeResponse(Operation.CHECK_TRANSCRIPT_CREDITS_REMAINING, {
		creditsRemaining: apiResponse.data?.getTranscriptCreditsRemaining || 0,
		message: `You have ${apiResponse.data?.getTranscriptCreditsRemaining || 0} transcript credits remaining`,
	});
}

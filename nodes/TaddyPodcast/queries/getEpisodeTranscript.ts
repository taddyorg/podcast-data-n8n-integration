import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetEpisodeTranscript(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const episodeUuid = context.getNodeParameter('episodeUuid', itemIndex) as string;

	if (!episodeUuid) {
		throw new NodeOperationError(context.getNode(), 'Episode UUID is required');
	}

	if (!validateUuid(episodeUuid)) {
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

	const apiResponse = await requestWithRetry(query, { uuid: episodeUuid }, context);
	const episode = apiResponse.data?.getPodcastEpisode as {
		uuid: string;
		name: string;
		transcript?: string[];
		transcriptUrlsWithDetails?: Array<{ url: string; type: string; language: string }>;
	};

	return standardizeResponse(Operation.GET_EPISODE_TRANSCRIPT, {
		episodeUuid,
		episodeName: episode?.name || 'Unknown',
		transcript: episode?.transcript || [],
		transcriptSegments: episode?.transcript?.length || 0,
		transcriptText: (episode?.transcript || []).join('\n'),
		transcriptUrls: episode?.transcriptUrlsWithDetails || [],
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getEpisodeTranscriptFields: INodeProperties[] = [
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
];

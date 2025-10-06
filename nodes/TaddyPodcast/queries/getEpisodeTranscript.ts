import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EPISODE_WITH_TRANSCRIPT_FRAGMENT, EPISODE_WITH_DETAILED_TRANSCRIPT_FRAGMENT, Operation } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetEpisodeTranscript(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const episodeUuid = context.getNodeParameter('episodeUuid', itemIndex) as string;
	const includeDetailedTranscript = context.getNodeParameter('includeDetailedTranscript', itemIndex, false) as boolean;
	const transcriptStyle = context.getNodeParameter('transcriptStyle', itemIndex, 'PARAGRAPH') as string;

	if (!episodeUuid) {
		throw new NodeOperationError(context.getNode(), 'Episode UUID is required');
	}

	if (!validateUuid(episodeUuid)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid UUID format: ${episodeUuid}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
		);
	}

	let query: string;
	let variables: IDataObject;

	if (includeDetailedTranscript) {
		query = `
			query GetEpisodeTranscript($uuid: ID!, $style: TranscriptItemStyle!) {
				getPodcastEpisode(uuid: $uuid) {
					${EPISODE_WITH_DETAILED_TRANSCRIPT_FRAGMENT}
				}
			}
		`;
		variables = { uuid: episodeUuid, style: transcriptStyle };
	} else {
		query = `
			query GetEpisodeTranscript($uuid: ID!) {
				getPodcastEpisode(uuid: $uuid) {
					${EPISODE_WITH_TRANSCRIPT_FRAGMENT}
				}
			}
		`;
		variables = { uuid: episodeUuid };
	}

	const apiResponse = await requestWithRetry(query, variables, context);
	const episode = apiResponse.data?.getPodcastEpisode as {
		uuid: string;
		name: string;
		description: string;
		transcript?: string[];
		transcriptWithSpeakersAndTimecodes?: Array<{
			id: string;
			text: string;
			speaker?: string;
			startTimecode?: number;
			endTimecode?: number;
		}>;
	};

	if (includeDetailedTranscript) {
		return standardizeResponse(Operation.GENERATE_EPISODE_TRANSCRIPT, {
			uuid: episodeUuid,
			name: episode?.name || 'Unknown',
			description: episode?.description || 'Unknown',
			transcript: (episode?.transcriptWithSpeakersAndTimecodes?.map(item => item.text) || []).join('\n'),
			transcriptItems: episode?.transcriptWithSpeakersAndTimecodes || [],
			transcriptItemsCount: episode?.transcriptWithSpeakersAndTimecodes?.length || 0,
		});
	}

	return standardizeResponse(Operation.GENERATE_EPISODE_TRANSCRIPT, {
		uuid: episodeUuid,
		name: episode?.name || 'Unknown',
		description: episode?.description || 'Unknown',
		transcript: (episode?.transcript || []).join('\n'),
		transcriptItems: episode?.transcript || [],
		transcriptItemsCount: episode?.transcript?.length || 0,
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
		hint: 'Transcript extraction uses API credits.',
		displayOptions: {
			show: {
				operation: [Operation.GENERATE_EPISODE_TRANSCRIPT],
			},
		},
	},
	{
		displayName: 'Include Speakers and Timecodes',
		name: 'includeDetailedTranscript',
		type: 'boolean',
		default: false,
		description: 'Whether to include speaker names and timecodes with the transcript',
		displayOptions: {
			show: {
				operation: [Operation.GENERATE_EPISODE_TRANSCRIPT],
			},
		},
	},
	{
		displayName: 'Transcript Style',
		name: 'transcriptStyle',
		type: 'options',
		options: [
			{ name: 'Paragraph', value: 'PARAGRAPH' },
			{ name: 'Utterance', value: 'UTTERANCE' },
		],
		default: 'PARAGRAPH',
		description: 'Style of transcript items. Paragraph groups text by paragraphs, Utterance by individual utterances.',
		displayOptions: {
			show: {
				operation: [Operation.GENERATE_EPISODE_TRANSCRIPT],
				includeDetailedTranscript: [true],
			},
		},
	},
];

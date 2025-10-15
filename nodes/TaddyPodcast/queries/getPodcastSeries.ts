import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Helper Functions
// ============================================================================

enum InputType {
	UUID = 'uuid',
	Name = 'name',
	RssUrl = 'rssUrl',
	ItunesId = 'itunesId',
}

interface InputValidationResult {
	queryVariable: string;
	queryVariableType: string;
	inputValue: string | number;
	inputLabel: string;
}

function validatePodcastInput(inputType: string, itemIndex: number, context: IExecuteFunctions): InputValidationResult {
	// Determine which input type to use and validate accordingly
	switch (inputType) {
		case InputType.UUID: {
			const inputValue = context.getNodeParameter('podcastUuid', itemIndex) as string;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'Podcast UUID is required');
			}
			if (!validateUuid(inputValue)) {
				throw new NodeOperationError(
					context.getNode(),
					`Invalid UUID format: ${inputValue}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
				);
			}
			return {
				queryVariable: 'uuid',
				queryVariableType: 'ID!',
				inputValue,
				inputLabel: 'podcastUuid',
			};
		}

		case InputType.Name: {
			const inputValue = context.getNodeParameter('podcastName', itemIndex) as string;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'Podcast name is required');
			}
			return {
				queryVariable: 'name',
				queryVariableType: 'String!',
				inputValue,
				inputLabel: 'podcastName',
			};
		}

		case InputType.RssUrl: {
			const inputValue = context.getNodeParameter('rssUrl', itemIndex) as string;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'RSS URL is required');
			}
			return {
				queryVariable: 'rssUrl',
				queryVariableType: 'String!',
				inputValue,
				inputLabel: 'rssUrl',
			};
		}

		case InputType.ItunesId: {
			const inputValue = context.getNodeParameter('itunesId', itemIndex) as number;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'iTunes ID is required');
			}
			return {
				queryVariable: 'itunesId',
				queryVariableType: 'Int!',
				inputValue,
				inputLabel: 'itunesId',
			};
		}

		default:
			throw new NodeOperationError(context.getNode(), `Unknown input type: ${inputType}`);
	}
}

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetPodcastSeries(
	operation: Operation,
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const inputType = context.getNodeParameter('inputType', itemIndex) as string;

	// Validate input and get query parameters
	const { queryVariable, queryVariableType, inputValue, inputLabel } = validatePodcastInput(inputType, itemIndex, context);

	const query = `
		query getPodcastSeries($${queryVariable}: ${queryVariableType}) {
			getPodcastSeries(${queryVariable}: $${queryVariable}) {
				${PODCAST_SERIES_EXTENDED_FRAGMENT}
			}
		}
	`;

	const variables = { [queryVariable]: inputValue };
	const apiResponse = await requestWithRetry(query, variables, context);

	return standardizeResponse(Operation.GET_PODCAST_SERIES, {
		inputType,
		[inputLabel]: inputValue,
		podcast: apiResponse.data?.getPodcastSeries || null,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getPodcastSeriesFields: INodeProperties[] = [
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		default: 'uuid',
		description: 'How to identify the podcast',
		options: [
			{
				name: 'UUID',
				value: InputType.UUID,
				description: 'Get podcast by its unique identifier (UUID)',
			},
			{
				name: 'Name',
				value: InputType.Name,
				description: 'Get podcast by its title/name',
			},
			{
				name: 'RSS URL',
				value: InputType.RssUrl,
				description: 'Get podcast by its RSS feed URL',
			},
			{
				name: 'iTunes ID',
				value: InputType.ItunesId,
				description: 'Get podcast by its iTunes ID',
			},
		],
		displayOptions: {
			show: {
				operation: [Operation.GET_PODCAST_SERIES],
			},
		},
	},
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
				operation: [Operation.GET_PODCAST_SERIES],
				inputType: [InputType.UUID],
			},
		},
	},
	{
		displayName: 'Podcast Name',
		name: 'podcastName',
		type: 'string',
		default: '',
		placeholder: 'e.g., This American Life',
		description: 'The name/title of the podcast',
		hint: 'If multiple podcasts have the same name, the most popular one will be returned',
		displayOptions: {
			show: {
				operation: [Operation.GET_PODCAST_SERIES],
				inputType: [InputType.Name],
			},
		},
	},
	{
		displayName: 'RSS URL',
		name: 'rssUrl',
		type: 'string',
		default: '',
		placeholder: 'e.g., https://feeds.example.com/podcast.rss',
		description: 'The RSS feed URL of the podcast',
		displayOptions: {
			show: {
				operation: [Operation.GET_PODCAST_SERIES],
				inputType: [InputType.RssUrl],
			},
		},
	},
	{
		displayName: 'iTunes ID',
		name: 'itunesId',
		type: 'number',
		default: null,
		placeholder: 'e.g., 1234567890',
		description: 'The iTunes ID of the podcast',
		displayOptions: {
			show: {
				operation: [Operation.GET_PODCAST_SERIES],
				inputType: [InputType.ItunesId],
			},
		},
	},
];

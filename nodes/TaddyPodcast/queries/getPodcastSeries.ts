import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetPodcastSeries(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const inputType = context.getNodeParameter('inputType', itemIndex) as string;

	let queryVariable: string;
	let queryVariableType: string;
	let inputValue: string | number;
	let inputLabel: string;

	// Determine which input type to use and validate accordingly
	switch (inputType) {
		case 'uuid':
			inputValue = context.getNodeParameter('podcastUuid', itemIndex) as string;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'Podcast UUID is required');
			}
			if (!validateUuid(inputValue)) {
				throw new NodeOperationError(
					context.getNode(),
					`Invalid UUID format: ${inputValue}. UUID must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
				);
			}
			queryVariable = 'uuid';
			queryVariableType = 'ID!';
			inputLabel = 'podcastUuid';
			break;

		case 'name':
			inputValue = context.getNodeParameter('podcastName', itemIndex) as string;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'Podcast name is required');
			}
			queryVariable = 'name';
			queryVariableType = 'String!';
			inputLabel = 'podcastName';
			break;

		case 'rssUrl':
			inputValue = context.getNodeParameter('rssUrl', itemIndex) as string;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'RSS URL is required');
			}
			queryVariable = 'rssUrl';
			queryVariableType = 'String!';
			inputLabel = 'rssUrl';
			break;

		case 'itunesId':
			inputValue = context.getNodeParameter('itunesId', itemIndex) as number;
			if (!inputValue) {
				throw new NodeOperationError(context.getNode(), 'iTunes ID is required');
			}
			queryVariable = 'itunesId';
			queryVariableType = 'Int!';
			inputLabel = 'itunesId';
			break;

		default:
			throw new NodeOperationError(context.getNode(), `Unknown input type: ${inputType}`);
	}

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
				value: 'uuid',
				description: 'Get podcast by its unique identifier (UUID)',
			},
			{
				name: 'Name',
				value: 'name',
				description: 'Get podcast by its title/name',
			},
			{
				name: 'RSS URL',
				value: 'rssUrl',
				description: 'Get podcast by its RSS feed URL',
			},
			{
				name: 'iTunes ID',
				value: 'itunesId',
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
				inputType: ['uuid'],
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
				inputType: ['name'],
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
				inputType: ['rssUrl'],
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
				inputType: ['itunesId'],
			},
		},
	},
];

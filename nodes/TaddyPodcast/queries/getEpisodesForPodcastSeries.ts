import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, PodcastEpisode, EPISODE_EXTENDED_FRAGMENT, MAX_API_LIMIT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { maxResultsField, requestWithRetry, standardizeResponse, validateUuid } from './shared';

// ============================================================================
// Handler Function
// ============================================================================

export async function handleGetEpisodesForPodcastSeries(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const inputType = context.getNodeParameter('episodesInputType', itemIndex) as string;
	const maxResults = context.getNodeParameter('maxResults', itemIndex, 25) as number;

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
		query GetPodcastEpisodes($${queryVariable}: ${queryVariableType}, $limitPerPage: Int!) {
			getPodcastSeries(${queryVariable}: $${queryVariable}) {
				${PODCAST_SERIES_MINI_FRAGMENT}
				episodes(limitPerPage: $limitPerPage, sortOrder: LATEST) {
					${EPISODE_EXTENDED_FRAGMENT}
				}
			}
		}
	`;

	const variables = {
		[queryVariable]: inputValue,
		limitPerPage: Math.min(maxResults, MAX_API_LIMIT)
	};

	const apiResponse = await requestWithRetry(query, variables, context);
	const podcast = apiResponse.data?.getPodcastSeries as { uuid: string; name: string; episodes: PodcastEpisode[] };
	const episodes = podcast?.episodes || [];

	return standardizeResponse(Operation.GET_EPISODES_FOR_PODCAST_SERIES, {
		inputType,
		[inputLabel]: inputValue,
		podcastName: podcast?.name || 'Unknown',
		episodes,
		totalEpisodesReturned: episodes.length,
	});
}

// ============================================================================
// Field Definitions
// ============================================================================

export const getEpisodesForPodcastSeriesFields: INodeProperties[] = [
	{
		displayName: 'Input Type',
		name: 'episodesInputType',
		type: 'options',
		default: 'uuid',
		description: 'How to identify the podcast',
		options: [
			{
				name: 'UUID',
				value: 'uuid',
				description: 'Get episodes by podcast unique identifier (UUID)',
			},
			{
				name: 'Name',
				value: 'name',
				description: 'Get episodes by podcast title/name',
			},
			{
				name: 'RSS URL',
				value: 'rssUrl',
				description: 'Get episodes by podcast RSS feed URL',
			},
			{
				name: 'iTunes ID',
				value: 'itunesId',
				description: 'Get episodes by podcast iTunes ID',
			},
		],
		displayOptions: {
			show: {
				operation: [Operation.GET_EPISODES_FOR_PODCAST_SERIES],
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
				operation: [Operation.GET_EPISODES_FOR_PODCAST_SERIES],
				episodesInputType: ['uuid'],
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
				operation: [Operation.GET_EPISODES_FOR_PODCAST_SERIES],
				episodesInputType: ['name'],
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
				operation: [Operation.GET_EPISODES_FOR_PODCAST_SERIES],
				episodesInputType: ['rssUrl'],
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
				operation: [Operation.GET_EPISODES_FOR_PODCAST_SERIES],
				episodesInputType: ['itunesId'],
			},
		},
	},
	maxResultsField(10, 25, [Operation.GET_EPISODES_FOR_PODCAST_SERIES]),
];

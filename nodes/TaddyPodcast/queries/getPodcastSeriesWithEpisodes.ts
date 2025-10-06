import { INodeProperties, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation, PodcastEpisode, EPISODE_EXTENDED_FRAGMENT, EPISODE_WITH_TRANSCRIPT_FRAGMENT, PODCAST_SERIES_MINI_FRAGMENT } from '../constants';
import { includeTranscriptField, numResultsField, requestWithPagination, standardizeResponse, validateUuid } from './shared';

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

export async function handleGetEpisodesForPodcastSeries(
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	const inputType = context.getNodeParameter('episodesInputType', itemIndex) as InputType;
	const numResults = context.getNodeParameter('numResults', itemIndex) as number;
	const includeTranscript = context.getNodeParameter('includeTranscript', itemIndex, true) as boolean;

	// Validate input and get query parameters
	const { queryVariable, queryVariableType, inputValue } = validatePodcastInput(inputType, itemIndex, context);

	// Dynamically build episode fragment based on includeTranscript
	const episodeFragment = includeTranscript ? EPISODE_WITH_TRANSCRIPT_FRAGMENT : EPISODE_EXTENDED_FRAGMENT;

	const query = `
		query GetPodcastEpisodes($${queryVariable}: ${queryVariableType}, $page: Int, $limitPerPage: Int) {
			getPodcastSeries(${queryVariable}: $${queryVariable}) {
				${PODCAST_SERIES_MINI_FRAGMENT}
				episodes(page: $page, limitPerPage: $limitPerPage, sortOrder: LATEST) {
					${episodeFragment}
				}
			}
		}
	`;

	const variables = {
		[queryVariable]: inputValue,
	};

	const apiResponse = await requestWithPagination(
		Operation.GET_EPISODES_FOR_PODCAST_SERIES,
		query,
		variables,
		context,
		numResults,
		'getPodcastSeries.episodes'
	);
	const podcast = apiResponse.data?.getPodcastSeries as { uuid: string; name: string; episodes: PodcastEpisode[] };
	const episodes = podcast?.episodes || [];

	return standardizeResponse(Operation.GET_EPISODES_FOR_PODCAST_SERIES, {
		podcastName: podcast?.name || 'Unknown',
		episodes,
		totalReturned: episodes.length,
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
				value: InputType.UUID,
				description: 'Get episodes by podcast unique identifier (UUID)',
			},
			{
				name: 'Name',
				value: InputType.Name,
				description: 'Get episodes by podcast title/name',
			},
			{
				name: 'RSS URL',
				value: InputType.RssUrl,
				description: 'Get episodes by podcast RSS feed URL',
			},
			{
				name: 'iTunes ID',
				value: InputType.ItunesId,
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
				episodesInputType: [InputType.UUID],
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
				episodesInputType: [InputType.Name],
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
				episodesInputType: [InputType.RssUrl],
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
				episodesInputType: [InputType.ItunesId],
			},
		},
	},
	numResultsField(Operation.GET_EPISODES_FOR_PODCAST_SERIES),
	includeTranscriptField(true, [Operation.GET_EPISODES_FOR_PODCAST_SERIES]),
];

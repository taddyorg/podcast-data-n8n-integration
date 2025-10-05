import { INodeTypeDescription, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation } from '../constants';
import { maxResultsField } from './shared';
import { searchFields, handleSearch } from './search';
import { getPodcastByUuidFields, handleGetPodcastByUuid } from './getPodcastByUuid';
import { getMultiplePodcastsFields, handleGetMultiplePodcasts } from './getMultiplePodcasts';
import { getPodcastEpisodesFields, handleGetPodcastEpisodes } from './getPodcastEpisodes';
import { getLatestEpisodesFields, handleGetLatestEpisodes } from './getLatestEpisodes';
import { getPopularPodcastsFields, handleGetPopularPodcasts } from './getPopularPodcasts';
import { getTopChartsFields, handleGetTopCharts } from './getTopCharts';
import { getEpisodeTranscriptFields, handleGetEpisodeTranscript } from './getEpisodeTranscript';
import { handleCheckApiRequestsRemaining } from './checkApiRequestsRemaining';
import { handleCheckTranscriptCreditsRemaining } from './checkTranscriptCreditsRemaining';

// ============================================================================
// Node Type Description
// ============================================================================

export const taddyPodcastDescription: INodeTypeDescription = {
	displayName: 'Podcast Data Extractor (Taddy API)',
	name: 'taddyPodcast',
	icon: 'file:taddy-api-logo.png',
	group: ['transform'],
	version: 1,
	description: 'Extract and analyze podcast data from 4M+ shows via Taddy API. Perfect for podcast discovery, content analysis, and automated podcast roundups.',
	defaults: {
		name: 'Podcast Data Extractor (Taddy API)',
	},
	inputs: ['main'],
	outputs: ['main'],
	credentials: [{ name: 'taddyPodcastApi', required: true }],
	properties: [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			default: Operation.SEARCH_PODCASTS,
			description: 'Choose the operation to perform',
			options: [
				{
					name: 'Search for a podcast',
					value: Operation.SEARCH_PODCASTS,
					description: 'Search for a podcast with advanced filters',
					action: 'Search for a podcast with advanced filters',
				},
				{
					name: 'Search Episodes',
					value: Operation.SEARCH_EPISODES,
					description: 'Search for episodes with advanced filters',
					action: 'Search for episodes with advanced filters',
				},
				{
					name: 'Check Taddy API Requests Remaining',
					value: Operation.CHECK_API_REQUESTS_REMAINING,
					description: 'Check the number of Taddy API requests remaining',
					action: 'Check Taddy API requests remaining',
				},
				{
					name: 'Check Transcript Credits Remaining',
					value: Operation.CHECK_TRANSCRIPT_CREDITS_REMAINING,
					description: 'Check the number of transcript credits you have remaining',
					action: 'Check transcript credits remaining',
				},
				{
					name: 'Get Episode Transcript',
					value: Operation.GET_EPISODE_TRANSCRIPT,
					description: 'Extract transcript from a specific episode (uses credits)',
					action: 'Extract transcript from a specific episode',
				},
				{
					name: 'Get Latest Episodes',
					value: Operation.GET_LATEST_EPISODES,
					description: 'Get newly released episodes from multiple podcasts',
					action: 'Get newly released episodes from multiple podcasts',
				},
				{
					name: 'Get Multiple Podcasts',
					value: Operation.GET_MULTIPLE_PODCASTS,
					description: 'Get information about multiple podcasts by UUID',
					action: 'Get information about multiple podcasts by UUID',
				},
				{
					name: 'Get Podcast by UUID',
					value: Operation.GET_PODCAST_BY_UUID,
					description: 'Get detailed information about a specific podcast',
					action: 'Get detailed information about a specific podcast',
				},
				{
					name: 'Get Podcast Episodes',
					value: Operation.GET_PODCAST_EPISODES,
					description: 'Get episodes list for a specific podcast',
					action: 'Get episodes for a specific podcast',
				},
				{
					name: 'Get Popular Podcasts',
					value: Operation.GET_POPULAR_PODCASTS,
					description: 'Get popular podcasts by genre or language',
					action: 'Get popular podcasts by genre or language',
				},
				{
					name: 'Get Top Charts',
					value: Operation.GET_DAILY_TOP_CHARTS,
					description: 'Get top podcast charts by genre',
					action: 'Get top podcast charts by genre',
				},
			],
		},
		maxResultsField,
		...searchFields,
		...getPodcastByUuidFields,
		...getMultiplePodcastsFields,
		...getPodcastEpisodesFields,
		...getLatestEpisodesFields,
		...getPopularPodcastsFields,
		...getTopChartsFields,
		...getEpisodeTranscriptFields,
	],
};

// ============================================================================
// Central Operation Handler Router
// ============================================================================

/**
 * Routes operations to their respective handler functions
 * @param operation - The operation to execute
 * @param itemIndex - The index of the current item being processed
 * @param context - The n8n execution context
 * @returns The response data for the operation
 */
export async function handleOperation(
	operation: Operation,
	itemIndex: number,
	context: IExecuteFunctions,
): Promise<IDataObject> {
	switch (operation) {
		case Operation.CHECK_API_REQUESTS_REMAINING:
			return handleCheckApiRequestsRemaining(itemIndex, context);

		case Operation.CHECK_TRANSCRIPT_CREDITS_REMAINING:
			return handleCheckTranscriptCreditsRemaining(itemIndex, context);

		case Operation.GET_LATEST_EPISODES:
			return handleGetLatestEpisodes(itemIndex, context);

		case Operation.GET_MULTIPLE_PODCASTS:
			return handleGetMultiplePodcasts(itemIndex, context);

		case Operation.GET_POPULAR_PODCASTS:
			return handleGetPopularPodcasts(itemIndex, context);

		case Operation.GET_DAILY_TOP_CHARTS:
			return handleGetTopCharts(itemIndex, context);

		case Operation.SEARCH_PODCASTS:
			return handleSearch(itemIndex, 'searchPodcasts', context);

		case Operation.SEARCH_EPISODES:
			return handleSearch(itemIndex, 'searchEpisodes', context);

		case Operation.GET_PODCAST_BY_UUID:
			return handleGetPodcastByUuid(itemIndex, context);

		case Operation.GET_PODCAST_EPISODES:
			return handleGetPodcastEpisodes(itemIndex, context);

		case Operation.GET_EPISODE_TRANSCRIPT:
			return handleGetEpisodeTranscript(itemIndex, context);

		default:
			throw new NodeOperationError(context.getNode(), `Unknown operation: ${operation}`);
	}
}

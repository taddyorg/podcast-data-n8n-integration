import { INodeTypeDescription, IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { Operation } from '../constants';
import { searchPodcastsFields, handleSearchPodcasts } from './searchPodcasts';
import { searchEpisodesFields, handleSearchEpisodes } from './searchEpisodes';
import { getPodcastSeriesFields, handleGetPodcastSeries } from './getPodcastSeries';
import { getMultiplePodcastsFields, handleGetMultiplePodcasts } from './getMultiplePodcasts';
import { getEpisodesForPodcastSeriesFields, handleGetEpisodesForPodcastSeries } from './getPodcastSeriesWithEpisodes';
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
					name: 'Search for an episode',
					value: Operation.SEARCH_EPISODES,
					description: 'Search for episodes with advanced filters',
					action: 'Search for episodes with advanced filters',
				},
				{
					name: 'Get Podcast Details',
					value: Operation.GET_PODCAST_SERIES,
					description: 'Get details about a podcast by its UUID, name, RSS URL, or iTunes ID',
					action: 'Get details about a podcast',
				},
				{
					name: 'Get Newly Released Episodes for a Podcast',
					value: Operation.GET_EPISODES_FOR_PODCAST_SERIES,
					description: 'Get the latest episodes for a podcast by its unique identifier (UUID), title/name, RSS URL, or iTunes ID',
					action: 'Get newly released episodes for a podcast',
				},
				{
					name: 'Get Newly Released Episodes for Multiple Podcasts',
					value: Operation.GET_LATEST_EPISODES,
					description: 'Get the latest episodes for a list of podcasts',
					action: 'Get newly released episodes from a list of podcasts',
				},
				{
					name: 'Generate Episode Transcript',
					value: Operation.GENERATE_EPISODE_TRANSCRIPT,
					description: 'If a transcript is not available, you can generate a transcript for an episode (uses Taddy API transcript credits)',
					action: 'If a transcript is not available, you can generate a transcript for an episode (uses Taddy API transcript credits)',
				},
				{
					name: 'Get Most Popular Podcasts',
					value: Operation.GET_POPULAR_PODCASTS,
					description: 'Get popular podcasts by genre or language',
					action: 'Get popular podcasts by genre or language',
				},
				{
					name: 'Get Daily Top Charts',
					value: Operation.GET_DAILY_TOP_CHARTS,
					description: 'Get top podcast charts by genre',
					action: 'Get top podcast charts by genre',
				},
				{
					name: 'Get Multiple Podcasts',
					value: Operation.GET_MULTIPLE_PODCASTS,
					description: 'Get information about multiple podcasts by UUID',
					action: 'Get information about multiple podcasts by UUID',
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
			],
		},
		...searchPodcastsFields,
		...searchEpisodesFields,
		...getPodcastSeriesFields,
		...getMultiplePodcastsFields,
		...getEpisodesForPodcastSeriesFields,
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
			return handleSearchPodcasts(itemIndex, context);

		case Operation.SEARCH_EPISODES:
			return handleSearchEpisodes(itemIndex, context);

		case Operation.GET_PODCAST_SERIES:
			return handleGetPodcastSeries(itemIndex, context);

		case Operation.GET_EPISODES_FOR_PODCAST_SERIES:
			return handleGetEpisodesForPodcastSeries(itemIndex, context);

		case Operation.GENERATE_EPISODE_TRANSCRIPT:
			return handleGetEpisodeTranscript(itemIndex, context);

		default:
			throw new NodeOperationError(context.getNode(), `Unknown operation: ${operation}`);
	}
}

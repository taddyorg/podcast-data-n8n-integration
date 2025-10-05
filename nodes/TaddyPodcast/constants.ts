import { IDataObject } from 'n8n-workflow';

// ============================================================================
// Enums
// ============================================================================

export enum Operation {
	SEARCH_PODCASTS = 'searchPodcasts',
	SEARCH_EPISODES = 'searchEpisodes',
	CHECK_API_REQUESTS_REMAINING = 'checkApiRequestsRemaining',
	CHECK_TRANSCRIPT_CREDITS_REMAINING = 'checkTranscriptCreditsRemaining',
	GET_EPISODE_TRANSCRIPT = 'getEpisodeTranscript',
	GET_LATEST_EPISODES = 'getLatestEpisodes',
	GET_MULTIPLE_PODCASTS = 'getMultiplePodcasts',
	GET_PODCAST_BY_UUID = 'getPodcastByUuid',
	GET_PODCAST_EPISODES = 'getPodcastEpisodes',
	GET_POPULAR_PODCASTS = 'getPopularPodcasts',
	GET_DAILY_TOP_CHARTS = 'getDailyTopCharts',
}

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface PodcastSeries extends IDataObject {
	uuid: string;
	name: string;
	description?: string;
	imageUrl?: string;
	rssUrl?: string;
	itunesId?: number;
	language?: string;
	totalEpisodesCount?: number;
	authorName?: string;
	websiteUrl?: string;
	genres?: string[];
	popularityRank?: number;
	itunesInfo?: {
		uuid: string;
		baseArtworkUrlOf?: string;
		summary?: string;
	};
}

export interface PodcastEpisode extends IDataObject {
	uuid: string;
	name: string;
	subtitle?: string;
	description?: string;
	audioUrl?: string;
	imageUrl?: string;
	datePublished?: number;
	duration?: number;
	episodeNumber?: number;
	seasonNumber?: number;
	transcriptUrls?: string[];
	fileType?: string;
	podcastSeries?: {
		uuid: string;
		name: string;
		imageUrl?: string;
	};
}

export interface SearchVariables extends IDataObject {
	term?: string;
	filterForTypes?: string[];
	filterForGenres?: string[];
	filterForLanguages?: string[];
	matchBy?: string;
	sortBy?: string;
	filterForHasTranscript?: boolean;
	filterForPublishedAfter?: number;
}

export interface ApiResponse {
	data?: IDataObject;
	errors?: Array<{ message: string }>;
}

export interface ApiError {
	response?: {
		status?: number;
		statusText?: string;
		data?: unknown;
	};
	message?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const API_BASE_URL = 'https://api.taddy.org';
export const MAX_API_LIMIT = 25;
export const MAX_RETRIES = 3;

// ============================================================================
// GraphQL Fragments
// ============================================================================

export const ITUNES_INFO_FRAGMENT = `
	uuid
	baseArtworkUrlOf(size: 640)
	summary
`;

export const PODCAST_SERIES_MINI_FRAGMENT = `
	uuid
	name
	imageUrl
`;

export const PODCAST_SERIES_FRAGMENT = `
	uuid
	name
	description
	imageUrl
	totalEpisodesCount
	language
	genres
	itunesId
	popularityRank
`;

export const PODCAST_SERIES_EXTENDED_FRAGMENT = `
	uuid
	name
	description
	imageUrl
	rssUrl
	language
	totalEpisodesCount
	authorName
	websiteUrl
	itunesInfo {
		${ITUNES_INFO_FRAGMENT}
	}
	genres
`;

export const EPISODE_FRAGMENT = `
	uuid
	name
	description
	audioUrl
	duration
	datePublished
`;

export const EPISODE_EXTENDED_FRAGMENT = `
	uuid
	name
	subtitle
	description
	audioUrl
	imageUrl
	datePublished
	duration
	episodeNumber
	seasonNumber
	transcriptUrls
	fileType
`;

// ============================================================================
// UI Options for Properties
// ============================================================================

export const GENRE_OPTIONS = [
	{ name: 'Arts', value: 'PODCASTSERIES_ARTS' },
	{ name: 'Business', value: 'PODCASTSERIES_BUSINESS' },
	{ name: 'Comedy', value: 'PODCASTSERIES_COMEDY' },
	{ name: 'Education', value: 'PODCASTSERIES_EDUCATION' },
	{ name: 'Fiction', value: 'PODCASTSERIES_FICTION' },
	{ name: 'Government', value: 'PODCASTSERIES_GOVERNMENT' },
	{ name: 'Health & Fitness', value: 'PODCASTSERIES_HEALTH_AND_FITNESS' },
	{ name: 'History', value: 'PODCASTSERIES_HISTORY' },
	{ name: 'Kids & Family', value: 'PODCASTSERIES_KIDS_AND_FAMILY' },
	{ name: 'Music', value: 'PODCASTSERIES_MUSIC' },
	{ name: 'News', value: 'PODCASTSERIES_NEWS' },
	{ name: 'Religion & Spirituality', value: 'PODCASTSERIES_RELIGION_AND_SPIRITUALITY' },
	{ name: 'Science', value: 'PODCASTSERIES_SCIENCE' },
	{ name: 'Society & Culture', value: 'PODCASTSERIES_SOCIETY_AND_CULTURE' },
	{ name: 'Sports', value: 'PODCASTSERIES_SPORTS' },
	{ name: 'Technology', value: 'PODCASTSERIES_TECHNOLOGY' },
	{ name: 'True Crime', value: 'PODCASTSERIES_TRUE_CRIME' },
	{ name: 'TV & Film', value: 'PODCASTSERIES_TV_AND_FILM' },
];

export const LANGUAGE_OPTIONS = [
	{ name: 'Arabic', value: 'ARABIC' },
	{ name: 'Chinese', value: 'CHINESE' },
	{ name: 'Dutch', value: 'DUTCH_FLEMISH' },
	{ name: 'English', value: 'ENGLISH' },
	{ name: 'French', value: 'FRENCH' },
	{ name: 'German', value: 'GERMAN' },
	{ name: 'Hindi', value: 'HINDI' },
	{ name: 'Italian', value: 'ITALIAN' },
	{ name: 'Japanese', value: 'JAPANESE' },
	{ name: 'Korean', value: 'KOREAN' },
	{ name: 'Portuguese', value: 'PORTUGUESE' },
	{ name: 'Russian', value: 'RUSSIAN' },
	{ name: 'Spanish', value: 'SPANISH' },
	{ name: 'Swedish', value: 'SWEDISH' },
];

export const LANGUAGE_OPTIONS_WITH_ALL = [
	{ name: 'All Languages', value: '' },
	...LANGUAGE_OPTIONS,
];

import { IDataObject } from 'n8n-workflow';

// ============================================================================
// Enums
// ============================================================================

export enum Operation {
	SEARCH_PODCASTS = 'searchPodcasts',
	SEARCH_EPISODES = 'searchEpisodes',
	CHECK_API_REQUESTS_REMAINING = 'checkApiRequestsRemaining',
	CHECK_TRANSCRIPT_CREDITS_REMAINING = 'checkTranscriptCreditsRemaining',
	GENERATE_EPISODE_TRANSCRIPT = 'getEpisodeTranscript',
	GET_LATEST_EPISODES = 'getLatestEpisodes',
	GET_MULTIPLE_PODCASTS = 'getMultiplePodcasts',
	GET_PODCAST_SERIES = 'getPodcastSeries',
	GET_EPISODES_FOR_PODCAST_SERIES = 'getEpisodesForPodcastSeries',
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
	filterForCountries?: string[];
	matchBy?: string;
	sortBy?: string;
	filterForHasTranscript?: boolean;
	filterForPublishedAfter?: number;
	filterForPublishedBefore?: number;
	filterForPodcastContentType?: string[];
	isSafeMode?: boolean;
	filterForDurationGreaterThan?: number;
	filterForDurationLessThan?: number;
	filterForTotalEpisodesGreaterThan?: number;
	filterForTotalEpisodesLessThan?: number;
	filterForLastUpdatedAfter?: number;
	filterForLastUpdatedBefore?: number;
	filterForSeriesUuids?: string[];
	filterForNotInSeriesUuids?: string[];
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

// Pagination limits per operation (from Taddy API documentation)
export interface PaginationConfig {
	limitPerPage: number;  // Max results per page
	maxPages: number;      // Max page number allowed by API
}

export const PAGINATION_CONFIGS: Partial<Record<Operation, PaginationConfig>> = {
	[Operation.SEARCH_PODCASTS]: {
		limitPerPage: 25,
		maxPages: 20,
	},
	[Operation.SEARCH_EPISODES]: {
		limitPerPage: 25,
		maxPages: 20,
	},
	[Operation.GET_POPULAR_PODCASTS]: {
		limitPerPage: 25,
		maxPages: 20,
	},
	[Operation.GET_DAILY_TOP_CHARTS]: {
		limitPerPage: 25,
		maxPages: 20,
	},
	[Operation.GET_EPISODES_FOR_PODCAST_SERIES]: {
		limitPerPage: 25,
		maxPages: 1000,
	},
	[Operation.GET_LATEST_EPISODES]: {
		limitPerPage: 50,
		maxPages: 20,
	},
};

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
	description(shouldStripHtmlTags: true)
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
	description(shouldStripHtmlTags: true)
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
	description(shouldStripHtmlTags: true)
	audioUrl
	duration
	datePublished
`;

export const EPISODE_EXTENDED_FRAGMENT = `
	uuid
	name
	description(shouldStripHtmlTags: true)
	audioUrl
	imageUrl
	datePublished
	duration
	episodeNumber
	seasonNumber
	fileType
`;

export const EPISODE_WITH_TRANSCRIPT_FRAGMENT = `
	${EPISODE_EXTENDED_FRAGMENT}
	transcript
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
	{ name: 'Leisure', value: 'PODCASTSERIES_LEISURE' },
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

// Maps parent genres to their complete hierarchy (parent + all subgenres)
export const GENRE_HIERARCHY: Record<string, string[]> = {
	PODCASTSERIES_ARTS: [
		'PODCASTSERIES_ARTS',
		'PODCASTSERIES_ARTS_BOOKS',
		'PODCASTSERIES_ARTS_DESIGN',
		'PODCASTSERIES_ARTS_FASHION_AND_BEAUTY',
		'PODCASTSERIES_ARTS_FOOD',
		'PODCASTSERIES_ARTS_PERFORMING_ARTS',
		'PODCASTSERIES_ARTS_VISUAL_ARTS',
	],
	PODCASTSERIES_BUSINESS: [
		'PODCASTSERIES_BUSINESS',
		'PODCASTSERIES_BUSINESS_CAREERS',
		'PODCASTSERIES_BUSINESS_ENTREPRENEURSHIP',
		'PODCASTSERIES_BUSINESS_INVESTING',
		'PODCASTSERIES_BUSINESS_MANAGEMENT',
		'PODCASTSERIES_BUSINESS_MARKETING',
		'PODCASTSERIES_BUSINESS_NON_PROFIT',
	],
	PODCASTSERIES_COMEDY: [
		'PODCASTSERIES_COMEDY',
		'PODCASTSERIES_COMEDY_IMPROV',
		'PODCASTSERIES_COMEDY_INTERVIEWS',
		'PODCASTSERIES_COMEDY_STANDUP',
	],
	PODCASTSERIES_EDUCATION: [
		'PODCASTSERIES_EDUCATION',
		'PODCASTSERIES_EDUCATION_COURSES',
		'PODCASTSERIES_EDUCATION_HOW_TO',
		'PODCASTSERIES_EDUCATION_LANGUAGE_LEARNING',
		'PODCASTSERIES_EDUCATION_SELF_IMPROVEMENT',
	],
	PODCASTSERIES_FICTION: [
		'PODCASTSERIES_FICTION',
		'PODCASTSERIES_FICTION_COMEDY_FICTION',
		'PODCASTSERIES_FICTION_DRAMA',
		'PODCASTSERIES_FICTION_SCIENCE_FICTION',
	],
	PODCASTSERIES_GOVERNMENT: ['PODCASTSERIES_GOVERNMENT'],
	PODCASTSERIES_HEALTH_AND_FITNESS: [
		'PODCASTSERIES_HEALTH_AND_FITNESS',
		'PODCASTSERIES_HEALTH_AND_FITNESS_ALTERNATIVE_HEALTH',
		'PODCASTSERIES_HEALTH_AND_FITNESS_FITNESS',
		'PODCASTSERIES_HEALTH_AND_FITNESS_MEDICINE',
		'PODCASTSERIES_HEALTH_AND_FITNESS_MENTAL_HEALTH',
		'PODCASTSERIES_HEALTH_AND_FITNESS_NUTRITION',
		'PODCASTSERIES_HEALTH_AND_FITNESS_SEXUALITY',
	],
	PODCASTSERIES_HISTORY: ['PODCASTSERIES_HISTORY'],
	PODCASTSERIES_KIDS_AND_FAMILY: [
		'PODCASTSERIES_KIDS_AND_FAMILY',
		'PODCASTSERIES_KIDS_AND_FAMILY_EDUCATION_FOR_KIDS',
		'PODCASTSERIES_KIDS_AND_FAMILY_PARENTING',
		'PODCASTSERIES_KIDS_AND_FAMILY_PETS_AND_ANIMALS',
		'PODCASTSERIES_KIDS_AND_FAMILY_STORIES_FOR_KIDS',
	],
	PODCASTSERIES_LEISURE: [
		'PODCASTSERIES_LEISURE',
		'PODCASTSERIES_LEISURE_ANIMATION_AND_MANGA',
		'PODCASTSERIES_LEISURE_AUTOMOTIVE',
		'PODCASTSERIES_LEISURE_AVIATION',
		'PODCASTSERIES_LEISURE_CRAFTS',
		'PODCASTSERIES_LEISURE_GAMES',
		'PODCASTSERIES_LEISURE_HOBBIES',
		'PODCASTSERIES_LEISURE_HOME_AND_GARDEN',
		'PODCASTSERIES_LEISURE_VIDEO_GAMES',
	],
	PODCASTSERIES_MUSIC: [
		'PODCASTSERIES_MUSIC',
		'PODCASTSERIES_MUSIC_COMMENTARY',
		'PODCASTSERIES_MUSIC_HISTORY',
		'PODCASTSERIES_MUSIC_INTERVIEWS',
	],
	PODCASTSERIES_NEWS: [
		'PODCASTSERIES_NEWS',
		'PODCASTSERIES_NEWS_BUSINESS',
		'PODCASTSERIES_NEWS_COMMENTARY',
		'PODCASTSERIES_NEWS_DAILY_NEWS',
		'PODCASTSERIES_NEWS_ENTERTAINMENT',
		'PODCASTSERIES_NEWS_POLITICS',
		'PODCASTSERIES_NEWS_SPORTS',
		'PODCASTSERIES_NEWS_TECH',
	],
	PODCASTSERIES_RELIGION_AND_SPIRITUALITY: [
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_BUDDHISM',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_CHRISTIANITY',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_HINDUISM',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_ISLAM',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_JUDAISM',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_RELIGION',
		'PODCASTSERIES_RELIGION_AND_SPIRITUALITY_SPIRITUALITY',
	],
	PODCASTSERIES_SCIENCE: [
		'PODCASTSERIES_SCIENCE',
		'PODCASTSERIES_SCIENCE_ASTRONOMY',
		'PODCASTSERIES_SCIENCE_CHEMISTRY',
		'PODCASTSERIES_SCIENCE_EARTH_SCIENCES',
		'PODCASTSERIES_SCIENCE_LIFE_SCIENCES',
		'PODCASTSERIES_SCIENCE_MATHEMATICS',
		'PODCASTSERIES_SCIENCE_NATURAL_SCIENCES',
		'PODCASTSERIES_SCIENCE_NATURE',
		'PODCASTSERIES_SCIENCE_PHYSICS',
		'PODCASTSERIES_SCIENCE_SOCIAL_SCIENCES',
	],
	PODCASTSERIES_SOCIETY_AND_CULTURE: [
		'PODCASTSERIES_SOCIETY_AND_CULTURE',
		'PODCASTSERIES_SOCIETY_AND_CULTURE_DOCUMENTARY',
		'PODCASTSERIES_SOCIETY_AND_CULTURE_PERSONAL_JOURNALS',
		'PODCASTSERIES_SOCIETY_AND_CULTURE_PHILOSOPHY',
		'PODCASTSERIES_SOCIETY_AND_CULTURE_PLACES_AND_TRAVEL',
		'PODCASTSERIES_SOCIETY_AND_CULTURE_RELATIONSHIPS',
	],
	PODCASTSERIES_SPORTS: [
		'PODCASTSERIES_SPORTS',
		'PODCASTSERIES_SPORTS_BASEBALL',
		'PODCASTSERIES_SPORTS_BASKETBALL',
		'PODCASTSERIES_SPORTS_CRICKET',
		'PODCASTSERIES_SPORTS_FANTASY_SPORTS',
		'PODCASTSERIES_SPORTS_FOOTBALL',
		'PODCASTSERIES_SPORTS_GOLF',
		'PODCASTSERIES_SPORTS_HOCKEY',
		'PODCASTSERIES_SPORTS_RUGBY',
		'PODCASTSERIES_SPORTS_RUNNING',
		'PODCASTSERIES_SPORTS_SOCCER',
		'PODCASTSERIES_SPORTS_SWIMMING',
		'PODCASTSERIES_SPORTS_TENNIS',
		'PODCASTSERIES_SPORTS_VOLLEYBALL',
		'PODCASTSERIES_SPORTS_WILDERNESS',
		'PODCASTSERIES_SPORTS_WRESTLING',
	],
	PODCASTSERIES_TECHNOLOGY: ['PODCASTSERIES_TECHNOLOGY'],
	PODCASTSERIES_TRUE_CRIME: ['PODCASTSERIES_TRUE_CRIME'],
	PODCASTSERIES_TV_AND_FILM: [
		'PODCASTSERIES_TV_AND_FILM',
		'PODCASTSERIES_TV_AND_FILM_AFTER_SHOWS',
		'PODCASTSERIES_TV_AND_FILM_FILM_REVIEWS',
		'PODCASTSERIES_TV_AND_FILM_HISTORY',
		'PODCASTSERIES_TV_AND_FILM_INTERVIEWS',
		'PODCASTSERIES_TV_AND_FILM_TV_REVIEWS',
	],
};

export const PODCAST_CONTENT_TYPE_OPTIONS = [
	{ name: 'Audio Podcasts', value: 'AUDIO' },
	{ name: 'Video Podcasts', value: 'VIDEO' },
];

export const LANGUAGE_OPTIONS = [
	// Most popular languages for podcasts
	{ name: 'English', value: 'ENGLISH' },
	{ name: 'Spanish', value: 'SPANISH' },
	{ name: 'Portuguese', value: 'PORTUGUESE' },
	{ name: 'Chinese', value: 'CHINESE' },
	{ name: 'French', value: 'FRENCH' },
	{ name: 'German', value: 'GERMAN' },
	{ name: 'Japanese', value: 'JAPANESE' },
	{ name: 'Italian', value: 'ITALIAN' },
	{ name: 'Korean', value: 'KOREAN' },
	{ name: 'Russian', value: 'RUSSIAN' },
	{ name: 'Hindi', value: 'HINDI' },
	{ name: 'Arabic', value: 'ARABIC' },
	// All other languages (alphabetically)
	{ name: 'Abkhazian', value: 'ABKHAZIAN' },
	{ name: 'Afar', value: 'AFAR' },
	{ name: 'Afrikaans', value: 'AFRIKAANS' },
	{ name: 'Akan', value: 'AKAN' },
	{ name: 'Albanian', value: 'ALBANIAN' },
	{ name: 'Amharic', value: 'AMHARIC' },
	{ name: 'Aragonese', value: 'ARAGONESE' },
	{ name: 'Armenian', value: 'ARMENIAN' },
	{ name: 'Assamese', value: 'ASSAMESE' },
	{ name: 'Avaric', value: 'AVARIC' },
	{ name: 'Avestan', value: 'AVESTAN' },
	{ name: 'Aymara', value: 'AYMARA' },
	{ name: 'Azerbaijani', value: 'AZERBAIJANI' },
	{ name: 'Bambara', value: 'BAMBARA' },
	{ name: 'Bashkir', value: 'BASHKIR' },
	{ name: 'Basque', value: 'BASQUE' },
	{ name: 'Belarusian', value: 'BELARUSIAN' },
	{ name: 'Bengali', value: 'BENGALI' },
	{ name: 'Bihari Languages', value: 'BIHARI_LANGUAGES' },
	{ name: 'Bislama', value: 'BISLAMA' },
	{ name: 'Bosnian', value: 'BOSNIAN' },
	{ name: 'Breton', value: 'BRETON' },
	{ name: 'Bulgarian', value: 'BULGARIAN' },
	{ name: 'Burmese', value: 'BURMESE' },
	{ name: 'Central Khmer', value: 'CENTRAL_KHMER' },
	{ name: 'Chamorro', value: 'CHAMORRO' },
	{ name: 'Chechen', value: 'CHECHEN' },
	{ name: 'Chichewa, Chewa, Nyanja', value: 'CHICHEWA_CHEWA_NYANJA' },
	{ name: 'Church Slavonic', value: 'CHURCH_SLAVONIC' },
	{ name: 'Chuvash', value: 'CHUVASH' },
	{ name: 'Cornish', value: 'CORNISH' },
	{ name: 'Corsican', value: 'CORSICAN' },
	{ name: 'Cree', value: 'CREE' },
	{ name: 'Croatian', value: 'CROATIAN' },
	{ name: 'Czech', value: 'CZECH' },
	{ name: 'Danish', value: 'DANISH' },
	{ name: 'Dhivehi, Maldivian', value: 'DHIVEHI_MALDIVIAN' },
	{ name: 'Dutch, Flemish', value: 'DUTCH_FLEMISH' },
	{ name: 'Dzongkha', value: 'DZONGKHA' },
	{ name: 'Esperanto', value: 'ESPERANTO' },
	{ name: 'Estonian', value: 'ESTONIAN' },
	{ name: 'Ewe', value: 'EWE' },
	{ name: 'Faroese', value: 'FAROESE' },
	{ name: 'Farsi', value: 'FARSI' },
	{ name: 'Fijian', value: 'FIJIAN' },
	{ name: 'Finnish', value: 'FINNISH' },
	{ name: 'Fulah', value: 'FULAH' },
	{ name: 'Gaelic', value: 'GAELIC' },
	{ name: 'Galician', value: 'GALICIAN' },
	{ name: 'Ganda', value: 'GANDA' },
	{ name: 'Georgian', value: 'GEORGIAN' },
	{ name: 'Gikuyu', value: 'GIKUYU' },
	{ name: 'Greek', value: 'GREEK' },
	{ name: 'Guarani', value: 'GUARANI' },
	{ name: 'Gujarati', value: 'GUJARATI' },
	{ name: 'Haitian Creole', value: 'HAITIAN_CREOLE' },
	{ name: 'Hausa', value: 'HAUSA' },
	{ name: 'Hebrew', value: 'HEBREW' },
	{ name: 'Herero', value: 'HERERO' },
	{ name: 'Hiri Motu', value: 'HIRI_MOTU' },
	{ name: 'Hungarian', value: 'HUNGARIAN' },
	{ name: 'Icelandic', value: 'ICELANDIC' },
	{ name: 'Ido', value: 'IDO' },
	{ name: 'Igbo', value: 'IGBO' },
	{ name: 'Indonesian', value: 'INDONESIAN' },
	{ name: 'Interlingua', value: 'INTERLINGUA' },
	{ name: 'Interlingue, Occidental', value: 'INTERLINGUE_OCCIDENTAL' },
	{ name: 'Inuktitut', value: 'INUKTITUT' },
	{ name: 'Inupiaq', value: 'INUPIAQ' },
	{ name: 'Irish', value: 'IRISH' },
	{ name: 'Javanese', value: 'JAVANESE' },
	{ name: 'Kalaallisut, Greenlandic', value: 'KALAALLISUT_GREENLANDIC' },
	{ name: 'Kannada', value: 'KANNADA' },
	{ name: 'Kanuri', value: 'KANURI' },
	{ name: 'Kashmiri', value: 'KASHMIRI' },
	{ name: 'Kazakh', value: 'KAZAKH' },
	{ name: 'Kinyarwanda', value: 'KINYARWANDA' },
	{ name: 'Komi', value: 'KOMI' },
	{ name: 'Kongo', value: 'KONGO' },
	{ name: 'Kurdish', value: 'KURDISH' },
	{ name: 'Kwanyama', value: 'KWANYAMA' },
	{ name: 'Kyrgyz', value: 'KYRGYZ' },
	{ name: 'Lao', value: 'LAO' },
	{ name: 'Latin', value: 'LATIN' },
	{ name: 'Latvian', value: 'LATVIAN' },
	{ name: 'Letzeburgesch', value: 'LETZEBURGESCH' },
	{ name: 'Limburgish', value: 'LIMBURGISH' },
	{ name: 'Lingala', value: 'LINGALA' },
	{ name: 'Lithuanian', value: 'LITHUANIAN' },
	{ name: 'Luba-Katanga', value: 'LUBA_KATANGA' },
	{ name: 'Macedonian', value: 'MACEDONIAN' },
	{ name: 'Malagasy', value: 'MALAGASY' },
	{ name: 'Malay', value: 'MALAY' },
	{ name: 'Malayalam', value: 'MALAYALAM' },
	{ name: 'Maltese', value: 'MALTESE' },
	{ name: 'Manx', value: 'MANX' },
	{ name: 'Maori', value: 'MAORI' },
	{ name: 'Marathi', value: 'MARATHI' },
	{ name: 'Marshallese', value: 'MARSHALLESE' },
	{ name: 'Mongolian', value: 'MONGOLIAN' },
	{ name: 'Nauru', value: 'NAURU' },
	{ name: 'Navajo', value: 'NAVAJO' },
	{ name: 'Ndonga', value: 'NDONGA' },
	{ name: 'Nepali', value: 'NEPALI' },
	{ name: 'Northern Sami', value: 'NORTHERN_SAMI' },
	{ name: 'North Ndebele', value: 'NORTH_NDEBELE' },
	{ name: 'Norwegian', value: 'NORWEGIAN' },
	{ name: 'Norwegian Bokmål', value: 'NORWEGIAN_BOKMAL' },
	{ name: 'Norwegian Nynorsk', value: 'NORWEGIAN_NYNORSK' },
	{ name: 'Nuosu, Sichuan Yi', value: 'NUOSU_SICHUAN_YI' },
	{ name: 'Occitan', value: 'OCCITAN' },
	{ name: 'Ojibwa', value: 'OJIBWA' },
	{ name: 'Oriya', value: 'ORIYA' },
	{ name: 'Oromo', value: 'OROMO' },
	{ name: 'Ossetian', value: 'OSSETIAN' },
	{ name: 'Pali', value: 'PALI' },
	{ name: 'Pashto', value: 'PASHTO' },
	{ name: 'Polish', value: 'POLISH' },
	{ name: 'Punjabi', value: 'PUNJABI' },
	{ name: 'Quechua', value: 'QUECHUA' },
	{ name: 'Romanian, Moldovan', value: 'ROMANIAN_MOLDOVAN' },
	{ name: 'Romansh', value: 'ROMANSH' },
	{ name: 'Rundi', value: 'RUNDI' },
	{ name: 'Samoan', value: 'SAMOAN' },
	{ name: 'Sango', value: 'SANGO' },
	{ name: 'Sanskrit', value: 'SANSKRIT' },
	{ name: 'Sardinian', value: 'SARDINIAN' },
	{ name: 'Serbian', value: 'SERBIAN' },
	{ name: 'Shona', value: 'SHONA' },
	{ name: 'Sindhi', value: 'SINDHI' },
	{ name: 'Sinhala', value: 'SINHALA' },
	{ name: 'Slovak', value: 'SLOVAK' },
	{ name: 'Slovenian', value: 'SLOVENIAN' },
	{ name: 'Somali', value: 'SOMALI' },
	{ name: 'Sotho', value: 'SOTHO' },
	{ name: 'South Ndebele', value: 'SOUTH_NDEBELE' },
	{ name: 'Sundanese', value: 'SUNDANESE' },
	{ name: 'Swahili', value: 'SWAHILI' },
	{ name: 'Swati', value: 'SWATI' },
	{ name: 'Swedish', value: 'SWEDISH' },
	{ name: 'Tagalog', value: 'TAGALOG' },
	{ name: 'Tahitian', value: 'TAHITIAN' },
	{ name: 'Tajik', value: 'TAJIK' },
	{ name: 'Tamil', value: 'TAMIL' },
	{ name: 'Tatar', value: 'TATAR' },
	{ name: 'Telugu', value: 'TELUGU' },
	{ name: 'Thai', value: 'THAI' },
	{ name: 'Tibetan', value: 'TIBETAN' },
	{ name: 'Tigrinya', value: 'TIGRINYA' },
	{ name: 'Tonga', value: 'TONGA' },
	{ name: 'Tsonga', value: 'TSONGA' },
	{ name: 'Tswana', value: 'TSWANA' },
	{ name: 'Turkish', value: 'TURKISH' },
	{ name: 'Turkmen', value: 'TURKMEN' },
	{ name: 'Twi', value: 'TWI' },
	{ name: 'Ukrainian', value: 'UKRAINIAN' },
	{ name: 'Urdu', value: 'URDU' },
	{ name: 'Uyghur', value: 'UYGHUR' },
	{ name: 'Uzbek', value: 'UZBEK' },
	{ name: 'Valencian, Catalan', value: 'VALENCIAN_CATALAN' },
	{ name: 'Venda', value: 'VENDA' },
	{ name: 'Vietnamese', value: 'VIETNAMESE' },
	{ name: 'Volapük', value: 'VOLAPUK' },
	{ name: 'Walloon', value: 'WALLOON' },
	{ name: 'Welsh', value: 'WELSH' },
	{ name: 'Western Frisian', value: 'WESTERN_FRISIAN' },
	{ name: 'Wolof', value: 'WOLOF' },
	{ name: 'Xhosa', value: 'XHOSA' },
	{ name: 'Yiddish', value: 'YIDDISH' },
	{ name: 'Yoruba', value: 'YORUBA' },
	{ name: 'Zhuang', value: 'ZHUANG' },
	{ name: 'Zulu', value: 'ZULU' },
];

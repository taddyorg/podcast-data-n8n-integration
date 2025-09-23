"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaddyPodcast = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class TaddyPodcast {
    constructor() {
        this.description = {
            displayName: 'Podcast Data Extractor (Taddy API)',
            name: 'taddyPodcast',
            icon: 'file:taddyPodcast.svg',
            group: ['transform'],
            version: 1,
            description: 'Interact with the Taddy Podcast API',
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
                    options: [
                        {
                            name: 'Check API Credits',
                            value: 'checkCredits',
                            description: 'Check remaining transcript credits',
                            action: 'Check remaining transcript credits',
                        },
                        {
                            name: 'Get Episode Transcript',
                            value: 'getTranscript',
                            description: 'Extract transcript from a specific episode',
                            action: 'Extract transcript from a specific episode',
                        },
                        {
                            name: 'Get Known Podcasts',
                            value: 'getKnown',
                            description: 'Get well-known podcasts (guaranteed to work)',
                            action: 'Get well known podcasts guaranteed to work',
                        },
                        {
                            name: 'Get Podcast by UUID',
                            value: 'getPodcastByUuid',
                            description: 'Get detailed information about a specific podcast',
                            action: 'Get detailed information about a specific podcast',
                        },
                        {
                            name: 'Get Podcast Episodes',
                            value: 'getPodcastEpisodes',
                            description: 'Get episodes for a specific podcast',
                            action: 'Get episodes for a specific podcast',
                        },
                        {
                            name: 'Search Podcasts',
                            value: 'searchPodcasts',
                            description: 'Search for podcasts and episodes with advanced filters',
                            action: 'Search for podcasts and episodes with advanced filters',
                        },
                    ],
                    default: 'getKnown',
                },
                {
                    displayName: 'Search Query',
                    name: 'searchQuery',
                    type: 'string',
                    default: '',
                    placeholder: 'e.g., technology',
                    description: 'Search term for podcasts',
                    displayOptions: {
                        show: {
                            operation: ['searchPodcasts'],
                        },
                    },
                },
                {
                    displayName: 'Max Results',
                    name: 'maxResults',
                    type: 'number',
                    default: 10,
                    description: 'Maximum number of results to return (handled client-side)',
                    displayOptions: {
                        show: {
                            operation: ['searchPodcasts', 'getPodcastEpisodes'],
                        },
                    },
                },
                {
                    displayName: 'Advanced Options',
                    name: 'advancedOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    displayOptions: {
                        show: {
                            operation: ['searchPodcasts'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Content Types',
                            name: 'filterForTypes',
                            type: 'multiOptions',
                            options: [
                                { name: 'Comic Series', value: 'COMICSERIES' },
                                { name: 'Creators', value: 'CREATOR' },
                                { name: 'Podcast Episodes', value: 'PODCASTEPISODE' },
                                { name: 'Podcast Series', value: 'PODCASTSERIES' },
                            ],
                            default: ['PODCASTSERIES'],
                            description: 'Types of content to search for',
                        },
                        {
                            displayName: 'Genres',
                            name: 'filterForGenres',
                            type: 'multiOptions',
                            options: [
                                { name: 'Arts', value: 'PODCASTSERIES_ARTS' },
                                { name: 'Business', value: 'PODCASTSERIES_BUSINESS' },
                                { name: 'Comedy', value: 'PODCASTSERIES_COMEDY' },
                                { name: 'Education', value: 'PODCASTSERIES_EDUCATION' },
                                { name: 'Health & Fitness', value: 'PODCASTSERIES_HEALTH_FITNESS' },
                                { name: 'News', value: 'PODCASTSERIES_NEWS' },
                                { name: 'Science', value: 'PODCASTSERIES_SCIENCE' },
                                { name: 'Sports', value: 'PODCASTSERIES_SPORTS' },
                                { name: 'Technology', value: 'PODCASTSERIES_TECHNOLOGY' },
                                { name: 'True Crime', value: 'PODCASTSERIES_TRUE_CRIME' },
                            ],
                            default: [],
                            description: 'Filter by genres',
                        },
                        {
                            displayName: 'Languages',
                            name: 'filterForLanguages',
                            type: 'multiOptions',
                            options: [
                                { name: 'Chinese', value: 'CHINESE' },
                                { name: 'English', value: 'ENGLISH' },
                                { name: 'French', value: 'FRENCH' },
                                { name: 'German', value: 'GERMAN' },
                                { name: 'Japanese', value: 'JAPANESE' },
                                { name: 'Portuguese', value: 'PORTUGUESE' },
                                { name: 'Russian', value: 'RUSSIAN' },
                                { name: 'Spanish', value: 'SPANISH' },
                            ],
                            default: [],
                            description: 'Filter by languages',
                        },
                        {
                            displayName: 'Match Strategy',
                            name: 'matchBy',
                            type: 'options',
                            options: [
                                { name: 'All Terms', value: 'ALL_TERMS' },
                                { name: 'Exact Phrase', value: 'EXACT_PHRASE' },
                                { name: 'Most Terms (Default)', value: 'MOST_TERMS' },
                            ],
                            default: 'MOST_TERMS',
                            description: 'How strictly to match search terms',
                        },
                        {
                            displayName: 'Published After Date',
                            name: 'filterForPublishedAfter',
                            type: 'dateTime',
                            default: '',
                            description: 'Only return content published after this date (YYYY-MM-DD HH:MM:SS)',
                        },
                        {
                            displayName: 'Require Transcript',
                            name: 'filterForHasTranscript',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to return only episodes that have transcripts available',
                        },
                        {
                            displayName: 'Sort By',
                            name: 'sortBy',
                            type: 'options',
                            options: [
                                { name: 'Exactness (Default)', value: 'EXACTNESS' },
                                { name: 'Popularity', value: 'POPULARITY' },
                            ],
                            default: 'EXACTNESS',
                            description: 'How to sort results',
                        },
                    ],
                },
                {
                    displayName: 'Podcast UUID',
                    name: 'podcastUuid',
                    type: 'string',
                    default: '',
                    placeholder: 'e.g., cb8d858a-3ef4-4645-8942-67e55c0927f2',
                    description: 'UUID of the podcast (from search results)',
                    displayOptions: {
                        show: {
                            operation: ['getPodcastEpisodes', 'getPodcastByUuid'],
                        },
                    },
                },
                {
                    displayName: 'Episode UUID',
                    name: 'episodeUuid',
                    type: 'string',
                    default: '',
                    placeholder: 'e.g., episode-uuid-here',
                    description: 'UUID of the episode (from episode results)',
                    displayOptions: {
                        show: {
                            operation: ['getTranscript'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const items = this.getInputData();
        const returnData = [];
        const makeApiRequest = async (query, variables, useGraphqlPath = false) => {
            const credentials = await this.getCredentials('taddyPodcastApi');
            const userId = credentials.userId;
            const apiKey = credentials.apiKey;
            const url = useGraphqlPath ? 'https://api.taddy.org/graphql' : 'https://api.taddy.org';
            return await this.helpers.httpRequest({
                method: 'POST',
                url,
                headers: {
                    'X-USER-ID': userId,
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json',
                },
                body: variables ? { query, variables } : { query },
            });
        };
        const requestWithRetry = async (query, variables) => {
            var _a;
            try {
                return await makeApiRequest(query, variables, false);
            }
            catch (err) {
                const error = err;
                const needsGraphqlPath = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 400 ||
                    /Cannot query field|Unknown argument|Bad Request/i.test(String(error));
                if (needsGraphqlPath) {
                    return await makeApiRequest(query, variables, true);
                }
                throw err;
            }
        };
        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i);
            let responseData = {};
            try {
                if (operation === 'checkCredits') {
                    const query = `{ getTranscriptCreditsRemaining }`;
                    const apiResponse = await requestWithRetry(query);
                    responseData = {
                        operation: 'checkCredits',
                        credits: ((_a = apiResponse.data) === null || _a === void 0 ? void 0 : _a.getTranscriptCreditsRemaining) || 0,
                    };
                }
                else if (operation === 'getKnown') {
                    const knownPodcasts = ['The Daily', 'This American Life', 'Joe Rogan Experience', 'Serial', 'Radiolab'];
                    const results = [];
                    const query = `
            query getPodcastSeries($name: String!) {
              getPodcastSeries(name: $name) {
                uuid
                name
                itunesId
                description
                imageUrl
                totalEpisodesCount
              }
            }
          `;
                    for (const name of knownPodcasts) {
                        try {
                            const apiResponse = await requestWithRetry(query, { name });
                            if ((_b = apiResponse.data) === null || _b === void 0 ? void 0 : _b.getPodcastSeries) {
                                results.push(apiResponse.data.getPodcastSeries);
                            }
                        }
                        catch {
                        }
                    }
                    responseData = {
                        operation: 'getKnown',
                        results,
                        count: results.length,
                    };
                }
                else if (operation === 'searchPodcasts') {
                    const searchQuery = this.getNodeParameter('searchQuery', i);
                    const maxResults = this.getNodeParameter('maxResults', i);
                    const advancedOptions = this.getNodeParameter('advancedOptions', i, {});
                    if (!searchQuery) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Search query is required for searchPodcasts operation');
                    }
                    const queryParams = [`term: "${searchQuery}"`];
                    if (advancedOptions.filterForTypes && Array.isArray(advancedOptions.filterForTypes) && advancedOptions.filterForTypes.length > 0) {
                        queryParams.push(`filterForTypes: [${advancedOptions.filterForTypes.join(', ')}]`);
                    }
                    if (advancedOptions.matchBy && advancedOptions.matchBy !== 'MOST_TERMS') {
                        queryParams.push(`matchBy: ${advancedOptions.matchBy}`);
                    }
                    if (advancedOptions.sortBy && advancedOptions.sortBy !== 'EXACTNESS') {
                        queryParams.push(`sortBy: ${advancedOptions.sortBy}`);
                    }
                    if (advancedOptions.filterForLanguages && Array.isArray(advancedOptions.filterForLanguages) && advancedOptions.filterForLanguages.length > 0) {
                        queryParams.push(`filterForLanguages: [${advancedOptions.filterForLanguages.join(', ')}]`);
                    }
                    if (advancedOptions.filterForGenres && Array.isArray(advancedOptions.filterForGenres) && advancedOptions.filterForGenres.length > 0) {
                        queryParams.push(`filterForGenres: [${advancedOptions.filterForGenres.join(', ')}]`);
                    }
                    if (advancedOptions.filterForHasTranscript === true) {
                        queryParams.push(`filterForHasTranscript: true`);
                    }
                    if (advancedOptions.filterForPublishedAfter) {
                        const timestamp = Math.floor(new Date(advancedOptions.filterForPublishedAfter).getTime() / 1000);
                        queryParams.push(`filterForPublishedAfter: ${timestamp}`);
                    }
                    const query = `
            query SearchPodcasts {
              search(${queryParams.join(', ')}) {
                searchId
                podcastSeries {
                  uuid
                  name
                  description
                  imageUrl
                  rssUrl
                  itunesId
                  language
                  totalEpisodesCount
                  popularityRank
                  itunesInfo { 
                    uuid 
                    baseArtworkUrlOf(size: 640) 
                  }
                  genres
                }
                podcastEpisodes {
                  uuid
                  name
                  subtitle
                  description
                  audioUrl
                  imageUrl
                  datePublished
                  transcript
                  podcastSeries {
                    uuid
                    name
                    imageUrl
                  }
                }
              }
            }
          `;
                    const apiResponse = await requestWithRetry(query);
                    const searchData = ((_c = apiResponse.data) === null || _c === void 0 ? void 0 : _c.search) || {};
                    let podcastResults = searchData.podcastSeries || [];
                    let episodeResults = searchData.podcastEpisodes || [];
                    if (podcastResults.length > maxResults) {
                        podcastResults = podcastResults.slice(0, maxResults);
                    }
                    if (episodeResults.length > maxResults) {
                        episodeResults = episodeResults.slice(0, maxResults);
                    }
                    responseData = {
                        operation,
                        searchQuery,
                        maxResults,
                        advancedOptions,
                        searchId: searchData.searchId || '',
                        podcastSeries: podcastResults,
                        podcastEpisodes: episodeResults,
                        totalPodcastsFound: ((_d = searchData.podcastSeries) === null || _d === void 0 ? void 0 : _d.length) || 0,
                        totalEpisodesFound: ((_e = searchData.podcastEpisodes) === null || _e === void 0 ? void 0 : _e.length) || 0,
                        podcastsReturned: podcastResults.length,
                        episodesReturned: episodeResults.length,
                    };
                }
                else if (operation === 'getPodcastByUuid') {
                    const podcastUuid = this.getNodeParameter('podcastUuid', i);
                    if (!podcastUuid) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Podcast UUID is required for getPodcastByUuid operation');
                    }
                    const query = `
            query getPodcastSeries($uuid: ID!) {
              getPodcastSeries(uuid: $uuid) {
                uuid
                name
                itunesId
                description
                imageUrl
                rssUrl
                language
                totalEpisodesCount
                authorName
                websiteUrl
                itunesInfo { 
                  uuid 
                  baseArtworkUrlOf(size: 640)
                  summary
                }
                genres
              }
            }
          `;
                    const apiResponse = await requestWithRetry(query, { uuid: podcastUuid });
                    responseData = {
                        operation,
                        podcastUuid,
                        result: ((_f = apiResponse.data) === null || _f === void 0 ? void 0 : _f.getPodcastSeries) || null,
                    };
                }
                else if (operation === 'getPodcastEpisodes') {
                    const podcastUuid = this.getNodeParameter('podcastUuid', i);
                    const maxResults = this.getNodeParameter('maxResults', i);
                    if (!podcastUuid) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Podcast UUID is required for getPodcastEpisodes operation');
                    }
                    const query = `
            query GetPodcastEpisodes($uuid: ID!) {
              getPodcastSeries(uuid: $uuid) {
                uuid
                name
                episodes {
                  uuid
                  name
                  description
                  audioUrl
                  duration
                  episodeNumber
                  seasonNumber
                  transcriptUrls
                  imageUrl
                  fileType
                }
              }
            }
          `;
                    const apiResponse = await requestWithRetry(query, { uuid: podcastUuid });
                    const podcast = (_g = apiResponse.data) === null || _g === void 0 ? void 0 : _g.getPodcastSeries;
                    let episodes = (podcast === null || podcast === void 0 ? void 0 : podcast.episodes) || [];
                    if (episodes.length > maxResults) {
                        episodes = episodes.slice(0, maxResults);
                    }
                    responseData = {
                        operation,
                        podcastUuid,
                        podcastName: (podcast === null || podcast === void 0 ? void 0 : podcast.name) || 'Unknown',
                        episodes,
                        totalEpisodes: ((_h = podcast === null || podcast === void 0 ? void 0 : podcast.episodes) === null || _h === void 0 ? void 0 : _h.length) || 0,
                        returned: episodes.length,
                    };
                }
                else if (operation === 'getTranscript') {
                    const episodeUuid = this.getNodeParameter('episodeUuid', i);
                    if (!episodeUuid) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Episode UUID is required for getTranscript operation');
                    }
                    const query = `
            query GetEpisodeTranscript($uuid: ID!) {
              getPodcastEpisode(uuid: $uuid) {
                uuid
                name
                description
                transcript
              }
            }
          `;
                    const apiResponse = await requestWithRetry(query, { uuid: episodeUuid });
                    const episode = (_j = apiResponse.data) === null || _j === void 0 ? void 0 : _j.getPodcastEpisode;
                    responseData = {
                        operation,
                        episodeUuid,
                        episodeName: (episode === null || episode === void 0 ? void 0 : episode.name) || 'Unknown',
                        transcript: (episode === null || episode === void 0 ? void 0 : episode.transcript) || [],
                        transcriptSegments: ((_k = episode === null || episode === void 0 ? void 0 : episode.transcript) === null || _k === void 0 ? void 0 : _k.length) || 0,
                        transcriptText: ((episode === null || episode === void 0 ? void 0 : episode.transcript) || []).join('\n'),
                    };
                }
                returnData.push({ json: responseData });
            }
            catch (error) {
                const apiError = error;
                const errorData = {
                    operation,
                    error: apiError.message || 'Unknown error',
                    status: ((_l = apiError.response) === null || _l === void 0 ? void 0 : _l.status) || 0,
                    statusText: ((_m = apiError.response) === null || _m === void 0 ? void 0 : _m.statusText) || '',
                    responseBody: JSON.stringify(((_o = apiError.response) === null || _o === void 0 ? void 0 : _o.data) || {}),
                };
                if (this.continueOnFail()) {
                    returnData.push({ json: errorData });
                }
                else {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Taddy API Error: ${JSON.stringify(errorData, null, 2)}`);
                }
            }
        }
        return [returnData];
    }
}
exports.TaddyPodcast = TaddyPodcast;
//# sourceMappingURL=TaddyPodcast.node.js.map
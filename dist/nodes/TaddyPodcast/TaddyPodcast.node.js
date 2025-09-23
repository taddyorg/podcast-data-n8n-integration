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
                            description: 'Search for podcasts by keyword',
                            action: 'Search for podcasts by keyword',
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
                {
                    displayName: 'Max Results',
                    name: 'maxResults',
                    type: 'number',
                    default: 5,
                    description: 'Maximum number of results to return',
                    displayOptions: {
                        show: {
                            operation: ['searchPodcasts', 'getPodcastEpisodes'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
                    if (!searchQuery) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Search query is required for searchPodcasts operation');
                    }
                    const query = `
            query SearchPodcasts($term: String!) {
              searchForTerm(term: $term) {
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
              }
            }
          `;
                    const variables = { term: searchQuery };
                    const apiResponse = await requestWithRetry(query, variables);
                    let results = ((_d = (_c = apiResponse.data) === null || _c === void 0 ? void 0 : _c.searchForTerm) === null || _d === void 0 ? void 0 : _d.podcastSeries) || [];
                    if (results.length > maxResults) {
                        results = results.slice(0, maxResults);
                    }
                    responseData = {
                        operation,
                        searchQuery,
                        maxResults,
                        searchId: ((_f = (_e = apiResponse.data) === null || _e === void 0 ? void 0 : _e.searchForTerm) === null || _f === void 0 ? void 0 : _f.searchId) || '',
                        results,
                        totalFound: ((_j = (_h = (_g = apiResponse.data) === null || _g === void 0 ? void 0 : _g.searchForTerm) === null || _h === void 0 ? void 0 : _h.podcastSeries) === null || _j === void 0 ? void 0 : _j.length) || 0,
                        returned: results.length,
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
                itunesInfo { 
                  uuid 
                  baseArtworkUrlOf(size: 640) 
                }
                genres
              }
            }
          `;
                    const apiResponse = await requestWithRetry(query, { uuid: podcastUuid });
                    responseData = {
                        operation,
                        podcastUuid,
                        result: ((_k = apiResponse.data) === null || _k === void 0 ? void 0 : _k.getPodcastSeries) || null,
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
                }
              }
            }
          `;
                    const apiResponse = await requestWithRetry(query, { uuid: podcastUuid });
                    const podcast = (_l = apiResponse.data) === null || _l === void 0 ? void 0 : _l.getPodcastSeries;
                    let episodes = (podcast === null || podcast === void 0 ? void 0 : podcast.episodes) || [];
                    if (episodes.length > maxResults) {
                        episodes = episodes.slice(0, maxResults);
                    }
                    responseData = {
                        operation,
                        podcastUuid,
                        podcastName: (podcast === null || podcast === void 0 ? void 0 : podcast.name) || 'Unknown',
                        episodes,
                        totalEpisodes: ((_m = podcast === null || podcast === void 0 ? void 0 : podcast.episodes) === null || _m === void 0 ? void 0 : _m.length) || 0,
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
                    const episode = (_o = apiResponse.data) === null || _o === void 0 ? void 0 : _o.getPodcastEpisode;
                    responseData = {
                        operation,
                        episodeUuid,
                        episodeName: (episode === null || episode === void 0 ? void 0 : episode.name) || 'Unknown',
                        transcript: (episode === null || episode === void 0 ? void 0 : episode.transcript) || [],
                        transcriptSegments: ((_p = episode === null || episode === void 0 ? void 0 : episode.transcript) === null || _p === void 0 ? void 0 : _p.length) || 0,
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
                    status: ((_q = apiError.response) === null || _q === void 0 ? void 0 : _q.status) || 0,
                    statusText: ((_r = apiError.response) === null || _r === void 0 ? void 0 : _r.statusText) || '',
                    responseBody: JSON.stringify(((_s = apiError.response) === null || _s === void 0 ? void 0 : _s.data) || {}),
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
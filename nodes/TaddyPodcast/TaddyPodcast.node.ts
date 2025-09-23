import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData, NodeOperationError, IDataObject } from 'n8n-workflow';

export class TaddyPodcast implements INodeType {
  description: INodeTypeDescription = {
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
      // Advanced Search Options - ALPHABETICALLY ORDERED
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Helper function for making API requests with retry logic
    const makeApiRequest = async (query: string, variables?: IDataObject, useGraphqlPath: boolean = false) => {
      const credentials = await this.getCredentials('taddyPodcastApi');
      const userId = credentials.userId as string;
      const apiKey = credentials.apiKey as string;
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

    const requestWithRetry = async (query: string, variables?: IDataObject) => {
      try {
        return await makeApiRequest(query, variables, false);
      } catch (err: unknown) {
        // Retry with /graphql endpoint if we get schema errors
        const error = err as { response?: { status?: number }; message?: string };
        const needsGraphqlPath = 
          error?.response?.status === 400 ||
          /Cannot query field|Unknown argument|Bad Request/i.test(String(error));

        if (needsGraphqlPath) {
          return await makeApiRequest(query, variables, true);
        }
        throw err;
      }
    };

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;
      let responseData: IDataObject = {};

      try {
        if (operation === 'checkCredits') {
          const query = `{ getTranscriptCreditsRemaining }`;
          const apiResponse = await requestWithRetry(query);

          responseData = {
            operation: 'checkCredits',
            credits: apiResponse.data?.getTranscriptCreditsRemaining || 0,
          };

        } else if (operation === 'getKnown') {
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
              if (apiResponse.data?.getPodcastSeries) {
                results.push(apiResponse.data.getPodcastSeries);
              }
            } catch {
              // Skip failed podcasts, don't fail the whole operation
            }
          }

          responseData = {
            operation: 'getKnown',
            results,
            count: results.length,
          };

        } else if (operation === 'searchPodcasts') {
          const searchQuery = this.getNodeParameter('searchQuery', i) as string;
          const maxResults = this.getNodeParameter('maxResults', i) as number;
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as IDataObject;
          
          if (!searchQuery) {
            throw new NodeOperationError(this.getNode(), 'Search query is required for searchPodcasts operation');
          }

          // Build search query with ONLY WORKING PARAMETERS
          const queryParams: string[] = [`term: "${searchQuery}"`];
          
          // Content Types
          if (advancedOptions.filterForTypes && Array.isArray(advancedOptions.filterForTypes) && advancedOptions.filterForTypes.length > 0) {
            queryParams.push(`filterForTypes: [${advancedOptions.filterForTypes.join(', ')}]`);
          }
          
          // Match strategy
          if (advancedOptions.matchBy && advancedOptions.matchBy !== 'MOST_TERMS') {
            queryParams.push(`matchBy: ${advancedOptions.matchBy}`);
          }
          
          // Sort by
          if (advancedOptions.sortBy && advancedOptions.sortBy !== 'EXACTNESS') {
            queryParams.push(`sortBy: ${advancedOptions.sortBy}`);
          }
          
          // Languages
          if (advancedOptions.filterForLanguages && Array.isArray(advancedOptions.filterForLanguages) && advancedOptions.filterForLanguages.length > 0) {
            queryParams.push(`filterForLanguages: [${advancedOptions.filterForLanguages.join(', ')}]`);
          }
          
          // Genres
          if (advancedOptions.filterForGenres && Array.isArray(advancedOptions.filterForGenres) && advancedOptions.filterForGenres.length > 0) {
            queryParams.push(`filterForGenres: [${advancedOptions.filterForGenres.join(', ')}]`);
          }
          
          // Boolean transcript filter
          if (advancedOptions.filterForHasTranscript === true) {
            queryParams.push(`filterForHasTranscript: true`);
          }
          
          // Published after timestamp
          if (advancedOptions.filterForPublishedAfter) {
            const timestamp = Math.floor(new Date(advancedOptions.filterForPublishedAfter as string).getTime() / 1000);
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
          const searchData = apiResponse.data?.search || {};
          
          let podcastResults = searchData.podcastSeries || [];
          let episodeResults = searchData.podcastEpisodes || [];
          
          // Apply client-side limit
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
            totalPodcastsFound: searchData.podcastSeries?.length || 0,
            totalEpisodesFound: searchData.podcastEpisodes?.length || 0,
            podcastsReturned: podcastResults.length,
            episodesReturned: episodeResults.length,
          };

        } else if (operation === 'getPodcastByUuid') {
          const podcastUuid = this.getNodeParameter('podcastUuid', i) as string;
          
          if (!podcastUuid) {
            throw new NodeOperationError(this.getNode(), 'Podcast UUID is required for getPodcastByUuid operation');
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
            result: apiResponse.data?.getPodcastSeries || null,
          };

        } else if (operation === 'getPodcastEpisodes') {
          const podcastUuid = this.getNodeParameter('podcastUuid', i) as string;
          const maxResults = this.getNodeParameter('maxResults', i) as number;
          
          if (!podcastUuid) {
            throw new NodeOperationError(this.getNode(), 'Podcast UUID is required for getPodcastEpisodes operation');
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
          const podcast = apiResponse.data?.getPodcastSeries;
          let episodes = podcast?.episodes || [];

          if (episodes.length > maxResults) {
            episodes = episodes.slice(0, maxResults);
          }

          responseData = {
            operation,
            podcastUuid,
            podcastName: podcast?.name || 'Unknown',
            episodes,
            totalEpisodes: podcast?.episodes?.length || 0,
            returned: episodes.length,
          };

        } else if (operation === 'getTranscript') {
          const episodeUuid = this.getNodeParameter('episodeUuid', i) as string;
          
          if (!episodeUuid) {
            throw new NodeOperationError(this.getNode(), 'Episode UUID is required for getTranscript operation');
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
          const episode = apiResponse.data?.getPodcastEpisode;

          responseData = {
            operation,
            episodeUuid,
            episodeName: episode?.name || 'Unknown',
            transcript: episode?.transcript || [],
            transcriptSegments: episode?.transcript?.length || 0,
            transcriptText: (episode?.transcript || []).join('\n'),
          };
        }

        returnData.push({ json: responseData });

      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
        const errorData: IDataObject = {
          operation,
          error: apiError.message || 'Unknown error',
          status: apiError.response?.status || 0,
          statusText: apiError.response?.statusText || '',
          responseBody: JSON.stringify(apiError.response?.data || {}),
        };

        if (this.continueOnFail()) {
          returnData.push({ json: errorData });
        } else {
          throw new NodeOperationError(this.getNode(), `Taddy API Error: ${JSON.stringify(errorData, null, 2)}`);
        }
      }
    }

    return [returnData];
  }
}

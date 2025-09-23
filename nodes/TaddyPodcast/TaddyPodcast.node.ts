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
          
          if (!searchQuery) {
            throw new NodeOperationError(this.getNode(), 'Search query is required for searchPodcasts operation');
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

          let results = apiResponse.data?.searchForTerm?.podcastSeries || [];
          
          if (results.length > maxResults) {
            results = results.slice(0, maxResults);
          }

          responseData = {
            operation,
            searchQuery,
            maxResults,
            searchId: apiResponse.data?.searchForTerm?.searchId || '',
            results,
            totalFound: apiResponse.data?.searchForTerm?.podcastSeries?.length || 0,
            returned: results.length,
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

import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class TaddyPodcastApi implements ICredentialType {
  name = 'taddyPodcastApi';
  displayName = 'Taddy Podcast API';
  documentationUrl = 'https://taddy.org/developers/podcast-api';
  properties: INodeProperties[] = [
    {
      displayName: 'User ID',
      name: 'userId',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.taddy.org',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': '={{$credentials.userId}}',
        'X-API-KEY': '={{$credentials.apiKey}}',
      },
      body: {
        query: '{ getApiRequestsRemaining }',
      },
    },
  };
}

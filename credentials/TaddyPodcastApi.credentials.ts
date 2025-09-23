import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TaddyPodcastApi implements ICredentialType {
  name = 'taddyPodcastApi';
  displayName = 'Taddy Podcast API';
  documentationUrl = 'https://docs.taddy.org';
  properties: INodeProperties[] = [
    {
      displayName: 'User ID',
      name: 'userId',
      type: 'string',
      default: '',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    },
  ];
}

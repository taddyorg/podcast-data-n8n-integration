"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaddyPodcastApi = void 0;
class TaddyPodcastApi {
    constructor() {
        this.name = 'taddyPodcastApi';
        this.displayName = 'Taddy Podcast API';
        this.documentationUrl = 'https://docs.taddy.org';
        this.properties = [
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
        this.test = {
            request: {
                baseURL: 'https://api.taddy.org',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-ID': '={{$credentials.userId}}',
                    'X-API-KEY': '={{$credentials.apiKey}}',
                },
                body: {
                    query: '{ getTranscriptCreditsRemaining }',
                },
            },
        };
    }
}
exports.TaddyPodcastApi = TaddyPodcastApi;
//# sourceMappingURL=TaddyPodcastApi.credentials.js.map
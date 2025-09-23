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
}
exports.TaddyPodcastApi = TaddyPodcastApi;
//# sourceMappingURL=TaddyPodcastApi.credentials.js.map
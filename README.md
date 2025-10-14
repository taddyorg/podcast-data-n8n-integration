# n8n-nodes-taddy

> Community node for integrating the Taddy Podcast API with your n8n workflows.

This n8n community node enables seamless integration of **[Taddy Podcast API](https://taddy.org/developers/podcast-api)** in your **[n8n](https://n8n.io)** workflows.

**[Taddy Podcast API](https://taddy.org/developers/podcast-api)** provides comprehensive podcast and episode data through its GraphQL API, including search, charts, metadata, and AI-powered transcription.

**[n8n](https://n8n.io)** is a powerful, AI-native, open-source workflow automation tool. Connect hundreds of services and rapidly create complex solutions with ease.

## Features

- **Advanced Search** - Find podcasts and episodes with filters for keywords, genres, language, popularity, date ranges, and duration
- **Charts & Discovery** - Access daily top charts by country or genre, discover trending podcasts
- **Batch Operations** - Retrieve multiple podcasts or episodes in a single request with automatic pagination
- **AI Transcription** - Generate or retrieve episode transcripts (uses Taddy API transcript credits)
- **RSS Integration** - Fetch podcast data using RSS URLs for seamless integration with existing feeds
- **Quota Management** - Monitor your API request limits and transcript credits

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

1. Go to **Settings > Community Nodes**
2. Enter: `n8n-nodes-taddy`
3. Click **Install**

## Operations

### Search & Discovery
* **Search for podcasts** - Search with advanced filters (keywords, genres, language, popularity, etc.)
* **Search for episodes** - Search episodes with advanced filters (keywords, date ranges, duration, etc.)
* **Get popular podcasts** - Discover trending podcasts by genre or language
* **Get daily top charts** - Access top podcast and episode charts by country or genre

### Podcast & Episode Data
* **Get podcast details** - Retrieve detailed information about a podcast by UUID, name, RSS URL, or iTunes ID
* **Get episodes for a podcast** - Get newly released episodes for a specific podcast (supports UUID, name, RSS URL, or iTunes ID)
* **Get multiple podcasts** - Batch retrieve multiple podcasts by UUIDs in a single request
* **Get multiple episodes** - Batch retrieve multiple episodes by UUIDs in a single request
* **Get newly released episodes** - Get the latest episodes from multiple podcasts

### Transcripts
* **Generate episode transcript** - Extract or generate transcript for an episode (uses Taddy API transcript credits)

### Account Management
* **Check API requests remaining** - Monitor your monthly Taddy API request quota
* **Check transcript credits remaining** - Check your available transcript generation credits

## Credentials

To use this node, you need a [Taddy API](https://taddy.org) account:

1. Sign up at [taddy.org](https://taddy.org)
2. Get your **API Key** and **User ID** from your account dashboard
3. Configure credentials in n8n under **Credentials > New > Taddy API**

## Example Workflows

Example workflows demonstrating common use cases are available:
- **Podcast Monitoring** - Track new episodes from your favorite podcasts
- **Transcript Generation** - Automatically generate and process episode transcripts
- **Chart Tracking** - Monitor podcast rankings over time
- **Search Podcasts** - Use advanced search to find podcasts and store them in Airtable
- **Import OPML File** - Import the podcasts you subscribe to from your favorite player and find latest episodes

_(Links to be added once node is published to n8n and templates submitted here: https://creators.n8n.io/workflows/edit)_

## Compatibility

Tested with n8n version 1.39.1 and above.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Taddy API documentation](https://taddy.org/developers/podcast-api)
* [Example workflows](https://n8n.io/workflows/) (coming soon)

## Version History

* **0.3.0** - Added new queries, pagination, and error handling
* **0.2.3** - Refactored into separate operations
* **0.2.2** - Added icon support
* **0.2.0** - Added advanced search functionality
* **0.1.0** - Initial release
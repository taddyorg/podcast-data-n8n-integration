# podcast-data-n8n-node

This is an n8n community node that lets you access the Taddy Podcast API for podcast data extraction and analysis.

[Taddy Podcast API](https://taddy.org/developers/podcast-api) provides podcast and episode data through its GraphQL API.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) to add community nodes to n8n.

1. Go to Settings > Community Nodes
2. Enter: `podcast-data-n8n-integration`
3. Install

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

You'll need a Taddy API account:
1. Sign up at [taddy.org](https://taddy.org)
2. Get your API Key and User ID
3. Configure credentials in n8n

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Taddy API documentation](https://taddy.org/developers/docs)

## Version History

* 0.3.0 - Added new queries, pagination, and error handling
* 0.2.3 - Refactored into separate operations
* 0.2.2 - Added icon support
* 0.2.0 - Added advanced search functionality
* 0.1.0 - Initial release

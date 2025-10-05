# podcast-data-n8n-node

This is an n8n community node that lets you access the Taddy Podcast API for podcast data extraction and analysis.

[Taddy Podcast API](https://taddy.org/developers/podcast-api) provides podcast and episode data through its GraphQL API.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) to add community nodes to n8n.

1. Go to Settings > Community Nodes
2. Enter: `podcast-data-n8n-integration`
3. Install

## Operations

* Search for a podcast or episode with advanced filters
* Get the transcript for a specific episode (uses transcript credits)
* Get detailed information about a specific podcast
* Get episodes for a specific podcast
* Check number of Taddy API requests remaining
* Check number of transcript credits remaining

## Credentials

You'll need a Taddy API account:
1. Sign up at [taddy.org](https://taddy.org)
2. Get your API Key and User ID
3. Configure credentials in n8n

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Taddy API documentation](https://taddy.org/developers/docs)

## Version History

* 0.2.3 - Refactored into separate operations
* 0.2.2 - Added icon support
* 0.2.0 - Added advanced search functionality
* 0.1.0 - Initial release

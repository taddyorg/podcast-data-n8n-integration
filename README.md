# Podcast Data Extractor (Taddy API)

Extract comprehensive data from 4+ million podcasts and 180+ million episodes using the Taddy API. Perfect for podcast analysis, content research, and automation workflows in n8n.

## Features

- **Search Podcasts** - Find podcasts by keyword across millions of shows
- **Get Podcast Details** - Extract metadata, descriptions, and analytics
- **Get Episodes** - Retrieve episode lists with rich metadata
- **Extract Transcripts** - Get episode transcripts when available
- **Check API Credits** - Monitor your Taddy API usage
- **Built-in Retry Logic** - Robust error handling and fallback strategies

## Quick Start

1. Get your free Taddy API credentials at [taddy.org/signup/developers](https://taddy.org/signup/developers)
2. Install the node: `npm install n8n-nodes-podcast-data-extractor-taddy`
3. Add "Podcast Data Extractor (Taddy API)" to your n8n workflow
4. Configure your API credentials
5. Start extracting podcast data!

## Use Cases

- **Content Research** - Analyze podcast trends and topics
- **Competitive Analysis** - Monitor competitor podcasts
- **Data Export** - Send podcast data to Google Sheets, databases
- **AI Analysis** - Feed transcripts to AI models for insights
- **Automation** - Build workflows for podcast monitoring

## API Credits

This node uses the Taddy API which offers:
- **500 free API calls per month**
- **Paid plans** available for higher usage
- **Rich podcast database** with 4M+ shows

Sign up at [taddy.org](https://taddy.org) for API access.

## Operations

### Search Podcasts
Search across millions of podcasts by keyword with rich metadata including genres, popularity rankings, and iTunes information.

### Get Known Podcasts  
Retrieve popular, well-known podcasts as a reliable fallback or starting point.

### Get Podcast by UUID
Get detailed information about a specific podcast using its UUID from search results.

### Get Podcast Episodes
Extract episode lists with descriptions, audio URLs, durations, and transcript availability.

### Get Episode Transcript
Extract full episode transcripts when available (requires transcript credits).

### Check API Credits
Monitor your remaining API credits to manage usage.

## Installation

Install via npm in your n8n instance or use the community nodes installation feature.

## Configuration

1. In n8n, create new credentials for "Taddy Podcast API"
2. Enter your User ID and API Key from taddy.org
3. Add the node to your workflow and select your credentials

## Support

- **Documentation**: [Taddy API Docs](https://docs.taddy.org)
- **API Dashboard**: [taddy.org/dashboard](https://taddy.org/dashboard)
- **Issues**: Report issues on GitHub

Built with the Taddy API - helping developers access comprehensive podcast data.

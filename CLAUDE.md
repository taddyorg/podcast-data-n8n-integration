# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node for the Taddy API, enabling podcast data extraction and analysis from 4M+ podcasts. The node integrates with Taddy's GraphQL API to provide operations like podcast search, episode transcript extraction, and podcast metadata retrieval.

## Common Commands

### Building and Development
```bash
npm run build       # Clean build (removes dist/ and compiles TypeScript)
npm run dev         # Watch mode for continuous TypeScript compilation
npm run lint        # Run ESLint on nodes, credentials, and package.json
npm run lintfix     # Auto-fix ESLint issues
npm run format      # Format code with Prettier
```

### Publishing
```bash
npm run prepublishOnly  # Runs build and lint with stricter rules before publishing
```

**Important**: The build process compiles TypeScript to `dist/` but does NOT automatically copy icon files (`.png`). If working with icons, manually copy them to `dist/nodes/TaddyPodcast/` after building, or rely on CI/CD which handles this via the GitHub Actions workflow.

## Code Architecture

### Project Structure
```
credentials/
  TaddyPodcastApi.credentials.ts    # Credentials handler (User ID + API Key)
nodes/
  TaddyPodcast/
    TaddyPodcast.node.ts            # Main node implementation
    taddypodcast.png                # Node icon
dist/                               # Build output (git-ignored)
```

### Node Implementation Pattern

The main node (`TaddyPodcast.node.ts`) follows the n8n INodeType interface:

1. **Operation-based structure**: Each operation (searchPodcasts, getPodcastByUuid, getTranscript, etc.) is a separate code path within the `execute()` method
2. **GraphQL queries**: All API calls use GraphQL queries sent to `https://api.taddy.org`
3. **Retry mechanism**: API requests include retry logic with exponential backoff for resilience
4. **Credentials**: Accessed via `this.getCredentials('taddyPodcastApi')` to get userId and apiKey

### Key Architectural Details

**GraphQL API Integration**:
- Taddy API uses GraphQL exclusively
- Queries are constructed as strings and sent via POST to `https://api.taddy.org`
- Authentication uses headers: `X-USER-ID` and `X-API-KEY`
- The `requestWithRetry()` helper function handles retries and error handling

**Operation Types**:
- **Search operations**: searchPodcasts, getPopularPodcasts, getTopCharts
- **Retrieval operations**: getPodcastByUuid, getMultiplePodcasts, getPodcastEpisodes
- **Transcript operations**: getTranscript (uses API credits), checkCredits
- **Latest content**: getLatestEpisodes (accepts UUIDs or RSS URLs)
- **Testing**: getKnown (returns well-known podcasts for testing)

**Data Flow**:
1. User configures operation and parameters in n8n UI
2. Node extracts parameters via `this.getNodeParameter()`
3. GraphQL query is built based on operation and parameters
4. API request is made with credentials and retry logic
5. Response data is formatted and returned to n8n workflow

### Credentials Structure

The `TaddyPodcastApi.credentials.ts` file:
- Requires two fields: userId (string) and apiKey (password-protected string)
- Includes credential test via GraphQL query `getTranscriptCreditsRemaining`
- Test validates both authentication and API connectivity

## n8n-Specific Conventions

### Node Properties
- Use `displayOptions` to show/hide fields based on the selected operation
- Set `noDataExpression: true` for operation selector to prevent expression usage
- Use proper field types: `string`, `number`, `boolean`, `options`, `multiOptions`, `dateTime`, `collection`

### Error Handling
- Use `NodeOperationError` for user-facing errors
- Include helpful error messages that guide users to fix issues
- Catch and re-throw API errors with context

### Publishing to npm
- Package is published as `n8n-nodes-podcast-data-extractor-taddy`
- Only `dist/` contents are included in the npm package (see `files` in package.json)
- Must include n8n configuration in package.json under the `n8n` key

## Development Notes

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Target: ES2019 with CommonJS modules
- Output includes source maps and declaration files for debugging

### Linting
- Uses ESLint with TypeScript parser
- Includes n8n-specific linting rules via `eslint-plugin-n8n-nodes-base`
- Pre-publish lint uses stricter configuration (`.eslintrc.prepublish.js`)

### Testing
- **No test framework is currently configured** in this project
- Manual testing should be done within n8n by installing the node locally

### CI/CD
- GitHub Actions workflow in `.github/workflows/ci.yml`
- Runs on pushes/PRs to `main` branch
- Steps: Install → Build → Copy icons → Verify output
- Icons must be manually copied to dist after build (handled by CI)

## Adding New Operations

When adding a new operation to the Taddy node:

1. Add the operation to the `options` array in the Operation property
2. Add conditional fields using `displayOptions.show.operation: ['yourOperation']`
3. Add the operation handler in the `execute()` method's if-else chain
4. Construct the appropriate GraphQL query based on Taddy API documentation
5. Format the response data consistently with existing operations
6. Update README.md with the new operation description

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node for the Taddy API, enabling podcast data extraction and analysis from 4M+ podcasts. The node integrates with Taddy's GraphQL API to provide operations like podcast search, episode transcript extraction, and podcast metadata retrieval.

## Taddy API Documentation
You can find the Taddy API documentation:
- [GraphQL Schema](./taddy-api-docs/schema.graphql)
- [Documentation](./taddy-api-docs/documentation.md)

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
    TaddyPodcast.node.ts            # Main node implementation (delegates to query handlers)
    constants.ts                    # Enums, interfaces, GraphQL fragments
    queries/                        # Modular query handlers (one file per operation)
      index.ts                      # Central router and node description
      shared.ts                     # Shared utilities (requestWithRetry, validation)
      search.ts                     # Search operations
      getPodcastSeries.ts           # Get podcast by UUID/name/RSS/iTunes ID
      getEpisodesForPodcastSeries.ts # Get episodes for a podcast
      getLatestEpisodes.ts          # Get latest episodes
      getMultiplePodcasts.ts        # Batch podcast retrieval
      getPopularPodcasts.ts         # Popular podcasts
      getTopCharts.ts               # Daily top charts
      getEpisodeTranscript.ts       # Transcript extraction
      checkApiRequestsRemaining.ts  # API quota check
      checkTranscriptCreditsRemaining.ts # Credit balance check
    taddypodcast.png                # Node icon
dist/                               # Build output (git-ignored)
```

### Node Implementation Pattern

The node follows a **modular architecture** with clear separation of concerns:

1. **Main Node** (`TaddyPodcast.node.ts`): Implements the n8n INodeType interface, delegates all operations to `handleOperation()` router
2. **Central Router** (`queries/index.ts`): Contains the node description and routes operations to their respective handler functions via a switch statement
3. **Query Handlers** (`queries/*.ts`): Each operation has its own file containing:
   - Handler function (e.g., `handleGetPodcastSeries()`)
   - Field definitions (e.g., `getPodcastSeriesFields`)
   - Operation-specific logic and GraphQL queries
4. **Shared Utilities** (`queries/shared.ts`): Contains `requestWithRetry()`, validation helpers, and response standardization
5. **Constants** (`constants.ts`): Defines Operation enum, TypeScript interfaces, GraphQL fragments, and UI options

**Key Patterns**:
- **GraphQL queries**: All API calls use GraphQL queries sent to `https://api.taddy.org`
- **Retry mechanism**: API requests include retry logic with exponential backoff for resilience
- **Credentials**: Accessed via `this.getCredentials('taddyPodcastApi')` to get userId and apiKey
- **Modular exports**: Each query file exports both handler function and field definitions, imported centrally in `queries/index.ts`

### Key Architectural Details

**GraphQL API Integration**:
- Taddy API uses GraphQL exclusively
- Queries are constructed as strings and sent via POST to `https://api.taddy.org`
- Authentication uses headers: `X-USER-ID` and `X-API-KEY`
- The `requestWithRetry()` helper function handles retries and error handling

**Operation Types**:
- **Search operations**: searchPodcasts, searchEpisodes, getPopularPodcasts, getTopCharts
- **Retrieval operations**:
  - `getPodcastSeries`: Get podcast details by UUID, name, RSS URL, or iTunes ID
  - `getEpisodesForPodcastSeries`: Get episodes by UUID, name, RSS URL, or iTunes ID
  - `getMultiplePodcasts`: Batch retrieve multiple podcasts by UUIDs
  - `getLatestEpisodes`: Get newly released episodes from multiple podcasts
- **Transcript operations**: getEpisodeTranscript (uses API credits)
- **Account management**: checkApiRequestsRemaining, checkTranscriptCreditsRemaining

**Data Flow**:
1. User configures operation and parameters in n8n UI
2. `TaddyPodcast.node.ts` calls `handleOperation()` router with operation type
3. Router delegates to appropriate handler function (e.g., `handleGetPodcastSeries()`)
4. Handler extracts parameters via `this.getNodeParameter()`
5. Handler builds GraphQL query and calls `requestWithRetry()` from `shared.ts`
6. API request is made with credentials and retry logic
7. Response data is standardized via `standardizeResponse()` and returned to n8n workflow

**Modular Query Architecture**:

Each query handler file follows this pattern:

```typescript
// Example: queries/getPodcastSeries.ts
import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation, PODCAST_SERIES_EXTENDED_FRAGMENT } from '../constants';
import { requestWithRetry, standardizeResponse, validateUuid } from './shared';

// Handler function - performs the operation
export async function handleGetPodcastSeries(
  itemIndex: number,
  context: IExecuteFunctions,
): Promise<IDataObject> {
  // 1. Extract and validate parameters
  // 2. Build GraphQL query
  // 3. Call requestWithRetry()
  // 4. Return standardized response
}

// Field definitions - UI configuration for n8n
export const getPodcastSeriesFields: INodeProperties[] = [
  // Array of field definitions with displayOptions
];
```

The `queries/index.ts` file imports all handlers and fields, then:
1. Exports `taddyPodcastDescription` with all fields combined
2. Exports `handleOperation()` router that switches on operation type

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

When adding a new operation to the Taddy node, follow this modular pattern:

### 1. Add Operation to Enum
Edit `nodes/TaddyPodcast/constants.ts`:
```typescript
export enum Operation {
  // ... existing operations
  YOUR_NEW_OPERATION = 'yourNewOperation',
}
```

### 2. Create Query Handler File
Create `nodes/TaddyPodcast/queries/yourNewOperation.ts`:
```typescript
import { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { Operation } from '../constants';
import { requestWithRetry, standardizeResponse } from './shared';

// Handler function
export async function handleYourNewOperation(
  itemIndex: number,
  context: IExecuteFunctions,
): Promise<IDataObject> {
  // 1. Extract parameters
  const param = context.getNodeParameter('paramName', itemIndex) as string;

  // 2. Build GraphQL query
  const query = `query { ... }`;

  // 3. Make API request
  const apiResponse = await requestWithRetry(query, { param }, context);

  // 4. Return standardized response
  return standardizeResponse(Operation.YOUR_NEW_OPERATION, {
    // response data
  });
}

// Field definitions
export const yourNewOperationFields: INodeProperties[] = [
  {
    displayName: 'Parameter Name',
    name: 'paramName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: [Operation.YOUR_NEW_OPERATION],
      },
    },
  },
];
```

### 3. Update Central Router
Edit `nodes/TaddyPodcast/queries/index.ts`:

**Import the new handler:**
```typescript
import { yourNewOperationFields, handleYourNewOperation } from './yourNewOperation';
```

**Add to node description options:**
```typescript
options: [
  // ... existing options
  {
    name: 'Your New Operation',
    value: Operation.YOUR_NEW_OPERATION,
    description: 'Description of what this does',
    action: 'Action description',
  },
]
```

**Add fields to properties:**
```typescript
properties: [
  // ... existing fields
  ...yourNewOperationFields,
],
```

**Add case to handleOperation() switch:**
```typescript
case Operation.YOUR_NEW_OPERATION:
  return handleYourNewOperation(itemIndex, context);
```

### 4. Test and Document
- Build the project: `npm run build`
- Test manually in n8n
- Update README.md with the new operation description
- Add examples and usage notes if needed

This modular approach keeps each operation isolated in its own file, making the codebase easier to maintain and test.

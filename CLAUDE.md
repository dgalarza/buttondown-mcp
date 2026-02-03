# Buttondown MCP Server

## Project Overview

This is an MCP server that provides tools for interacting with the Buttondown newsletter API.

## Tech Stack

- TypeScript
- MCP SDK (`@modelcontextprotocol/sdk`)
- Zod for schema validation
- Node.js native fetch for HTTP requests
- Vitest for testing
- MSW (Mock Service Worker) for API mocking

## Project Structure

```
src/
  index.ts      # Entry point - starts the server
  server.ts     # MCP server setup and tool definitions
  client.ts     # ButtondownClient API wrapper
  utils.ts      # Shared utilities (getApiKey, jsonResponse)
  __tests__/
    setup.ts        # MSW server setup
    handlers.ts     # Mock API handlers and fixtures
    client.test.ts  # Client method tests
    server.test.ts  # MCP tool integration tests
    utils.test.ts   # Utility function tests
```

## Key Patterns

- `ButtondownClient` class handles all API communication
- Each MCP tool maps to one or more Buttondown API endpoints
- API key is read from `BUTTONDOWN_API_KEY` environment variable
- All tools return JSON via `jsonResponse()` helper

## Building & Running

```bash
npm run build    # Compile TypeScript
npm run dev      # Run with tsx (development)
npm start        # Run compiled output
npm test         # Run tests with Vitest
```

## Testing

Tests use Vitest with MSW for mocking the Buttondown API.

- `handlers.ts` - Mock API responses and fixtures
- `client.test.ts` - Unit tests for `ButtondownClient` methods
- `server.test.ts` - Integration tests for MCP tools using in-memory transport

Run tests:
```bash
npm test           # Watch mode
npm test -- --run  # Single run
```

## Buttondown API

- Base URL: `https://api.buttondown.com/v1`
- Auth: `Authorization: Token <api-key>`
- Docs: https://docs.buttondown.com/api-emails-introduction

### Email Statuses

- `draft` - Not sent, editable
- `scheduled` - Will send at `publish_date`
- `about_to_send` - Queued for sending
- `in_flight` - Currently sending
- `sent` - Delivered

## Adding New Tools

1. Add method to `ButtondownClient` class in `client.ts`
2. Add mock handler in `__tests__/handlers.ts`
3. Register tool with `server.tool()` in `server.ts`
4. Add client tests in `__tests__/client.test.ts`
5. Add server integration tests in `__tests__/server.test.ts`

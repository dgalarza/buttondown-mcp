# Buttondown MCP Server

## Project Overview

This is an MCP server that provides tools for interacting with the Buttondown newsletter API.

## Tech Stack

- TypeScript
- MCP SDK (`@modelcontextprotocol/sdk`)
- Zod for schema validation
- Node.js native fetch for HTTP requests

## Project Structure

```
src/
  index.ts    # Main server entry point with all tools and API client
```

## Key Patterns

- `ButtondownClient` class handles all API communication
- Each MCP tool maps to one or more Buttondown API endpoints
- API key is read from `BUTTONDOWN_API_KEY` environment variable
- All tools return formatted text responses

## Building & Running

```bash
npm run build    # Compile TypeScript
npm run dev      # Run with tsx (development)
npm start        # Run compiled output
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

1. Add method to `ButtondownClient` class
2. Register tool with `server.tool()` including name, description, Zod schema, and handler
3. Return `{ content: [{ type: "text", text: "..." }] }`

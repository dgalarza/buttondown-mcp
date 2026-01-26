# Buttondown MCP Server

An MCP (Model Context Protocol) server for interacting with the [Buttondown](https://buttondown.com) newsletter API.

## Tools

| Tool | Description |
|------|-------------|
| `list_emails` | List emails with optional status filter (draft/scheduled/sent) |
| `get_email` | Get single email details by ID |
| `create_draft` | Create new draft with markdown content |
| `update_draft` | Edit existing draft |
| `send_draft` | Send a draft immediately |
| `schedule_draft` | Schedule a draft for later |
| `get_analytics` | Get open/click rates for sent emails |

## Installation

### Claude Code

```bash
claude mcp add buttondown -- npx -y buttondown-mcp
```

Then set your API key:

```bash
claude mcp add-json buttondown '{"command":"npx","args":["-y","buttondown-mcp"],"env":{"BUTTONDOWN_API_KEY":"your-api-key"}}'
```

### Manual Configuration

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "buttondown": {
      "command": "npx",
      "args": ["-y", "buttondown-mcp"],
      "env": {
        "BUTTONDOWN_API_KEY": "your-api-key"
      }
    }
  }
}
```

Get your API key from https://buttondown.com/settings/api

## License

MIT

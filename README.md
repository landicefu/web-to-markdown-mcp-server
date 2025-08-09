# Web to Markdown MCP Server

An MCP server that retrieves web content as markdown using the [Jina AI](https://jina.ai/) API.

## Features

- Convert web pages to clean markdown format
- Simple API that works with any valid URL
- Uses Jina AI's Reader service for high-quality content extraction

## Installation

```bash
# Install globally
npm install -g @landicefu/web-to-markdown-mcp-server

# Or install locally
npm install @landicefu/web-to-markdown-mcp-server
```

## Getting Started with Jina AI

This package uses Jina AI's Reader API to convert web content to markdown. To use this service:

1. Visit [Jina AI](https://jina.ai/) and create an account
2. Navigate to your account settings to generate an API token
3. Use this token as the `JINA_API_TOKEN` environment variable when running the server

## Usage

### Environment Variables

- `JINA_API_TOKEN`: Your Jina AI API token for authentication. **Required for reliable operation**.
  Without a valid token, the service may not work properly or may be rate-limited.

### Running the server

```bash
# With environment variable
JINA_API_TOKEN=your_jina_token web-to-markdown-mcp-server

# Or using npx
JINA_API_TOKEN=your_jina_token npx @landicefu/web-to-markdown-mcp-server
```

### Tool: get_web_content_as_markdown

This tool retrieves web content from a specified URL and converts it to markdown format using the Jina AI API.

**Input Schema:**

```json
{
  "url": "https://example.com"
}
```

**Example Usage:**

```javascript
const result = await useMcpTool({
  serverName: "web-to-markdown-mcp-server",
  toolName: "get_web_content_as_markdown",
  arguments: {
    url: "https://example.com"
  }
});
```

## How it Works

The server uses the Jina AI Reader API by prepending `https://r.jina.ai/` to the target URL. For example, to convert `https://example.com` to markdown, it sends a request to `https://r.jina.ai/https://example.com`.

Authentication is handled by including an `Authorization` header with a Bearer token:

```
Authorization: Bearer jina_your_token_here
```

For reliable operation, you should obtain your own Jina AI API token and provide it via the `JINA_API_TOKEN` environment variable.

## License

MIT
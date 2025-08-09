#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Environment variables
const JINA_API_TOKEN = process.env.JINA_API_TOKEN;

// Validate the URL input
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Validate the tool arguments
const isValidGetWebContentArgs = (
  args: any
): args is {
  url: string;
} =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.url === 'string' &&
  isValidUrl(args.url);

class WebContentRetrieverServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: '@landicefu/web-content-retriever',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Validate Jina API token
    if (!JINA_API_TOKEN) {
      console.warn('JINA_API_TOKEN environment variable is not set. Please obtain a token from https://jina.ai/ for reliable operation.');
    }

    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; @landicefu/web-content-retriever/1.0.0)',
        ...(JINA_API_TOKEN ? { 'Authorization': `Bearer ${JINA_API_TOKEN}` } : {}),
      },
    });

    this.setupToolHandlers();
    
    // Error handling - removed console.error to prevent interference with MCP protocol
    this.server.onerror = (error) => {
      // Errors are handled through the MCP protocol, no need for console.error
    };
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // Define the available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_web_content_as_markdown',
          description: 'Retrieve web content as markdown using Jina AI API. Uses the JINA_API_TOKEN environment variable for authentication, or falls back to a default token.',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL of the web page to convert to markdown',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    // Implement the tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'get_web_content_as_markdown') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      // Ensure arguments exist with default values
      if (!request.params.arguments) {
        request.params.arguments = { url: '' };
      }

      if (!isValidGetWebContentArgs(request.params.arguments)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid arguments: url must be a valid URL string'
        );
      }

      const targetUrl = request.params.arguments.url;
      const jinaUrl = `https://r.jina.ai/${targetUrl}`;

      try {
        const response = await this.axiosInstance.get(jinaUrl);
        const content = response.data;
        
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Check for authentication errors (401 Unauthorized)
          if (error.response?.status === 401) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Authentication error: Invalid or expired Jina API token. Please obtain a valid token from https://jina.ai/ and set it as the JINA_API_TOKEN environment variable.`,
                },
              ],
              isError: true,
            };
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `Error retrieving web content: ${
                  error.response?.statusText || error.message
                }`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Removed console.error logs to prevent interference with MCP protocol
  }
}

const server = new WebContentRetrieverServer();
server.run().catch(console.error);
/**
 * Shared MCP Server creation logic
 * Used by both Node.js entry (index.ts) and CF Worker entry (worker.ts)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { GeminiRagClient } from './gemini-client.js';
import { TOOLS } from './tools.js';
import type { CustomMetadata } from './types.js';

/**
 * Handle MCP tool calls by routing to GeminiRagClient methods
 */
export async function handleToolCall(toolName: string, args: any, client: GeminiRagClient): Promise<any> {
  switch (toolName) {
    // Store Operations
    case 'gemini_create_store':
      return client.createStore(args.display_name);
    case 'gemini_list_stores':
      return client.listStores(args.page_size, args.page_token);
    case 'gemini_get_store':
      return client.getStore(args.store_name);
    case 'gemini_delete_store':
      return client.deleteStore(args.store_name, args.force);

    // Upload & Import
    case 'gemini_upload_to_store':
      return client.uploadToStore(args.store_name, {
        mimeType: args.mime_type,
        content: args.content,
        displayName: args.display_name,
        contentEncoding: args.content_encoding || 'text',
        customMetadata: args.custom_metadata as CustomMetadata[] | undefined,
        chunkingConfig: args.chunking_config,
      });
    case 'gemini_import_file_to_store':
      return client.importFileToStore(args.store_name, {
        fileName: args.file_name,
        customMetadata: args.custom_metadata as CustomMetadata[] | undefined,
        chunkingConfig: args.chunking_config,
      });

    // Operations
    case 'gemini_get_operation':
      return client.getOperation(args.operation_name);
    case 'gemini_get_upload_operation':
      return client.getUploadOperation(args.operation_name);

    // Document Operations
    case 'gemini_list_documents':
      return client.listDocuments(args.store_name, args.page_size, args.page_token);
    case 'gemini_get_document':
      return client.getDocument(args.document_name);
    case 'gemini_delete_document':
      return client.deleteDocument(args.document_name, args.force);

    // RAG Query
    case 'gemini_rag_query':
      return client.ragQuery({
        query: args.query,
        storeNames: args.store_names,
        model: args.model,
        metadataFilter: args.metadata_filter,
      });

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Create a configured MCP Server instance
 * Config is optional — tools/list works without config, tool calls require it
 */
export function createServer(config?: { apiKey: string }): Server {
  const server = new Server(
    {
      name: 'gemini-file-search-rag-mcp',
      version: '1.0.2',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  let client: GeminiRagClient | null = null;

  function getClient(): GeminiRagClient {
    if (!client) {
      if (!config) {
        throw new Error(
          'Missing required configuration: GEMINI_API_KEY. ' +
          'Set it before using any tools.'
        );
      }
      client = new GeminiRagClient(config);
    }
    return client;
  }

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, args || {}, getClient());

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'setup-rag',
          description: 'Guide for setting up RAG — create stores, upload documents, and index content',
        },
        {
          name: 'query-rag',
          description: 'Guide for querying your indexed documents using Gemini RAG',
        },
      ],
    };
  });

  // Get prompt content
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    switch (name) {
      case 'setup-rag':
        return {
          messages: [{
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                'You are a Gemini RAG setup assistant. Help me create and populate a knowledge base.',
                '',
                'Setup steps:',
                '1. **Create store** — Use gemini_create_store with a display name',
                '2. **Upload files** — Use gemini_upload_to_store to upload local files',
                '3. **Import URLs** — Use gemini_import_file_to_store to import from URLs',
                '4. **Check status** — Use gemini_get_operation to monitor indexing progress',
                '5. **List documents** — Use gemini_list_documents to verify uploaded content',
                '',
                'Start by listing existing stores with gemini_list_stores.',
              ].join('\n'),
            },
          }],
        };
      case 'query-rag':
        return {
          messages: [{
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                'You are a Gemini RAG query assistant. Help me search my indexed documents.',
                '',
                'Query steps:',
                '1. **List stores** — Use gemini_list_stores to see available knowledge bases',
                '2. **Query** — Use gemini_rag_query with store name and your question',
                '3. **Check documents** — Use gemini_list_documents to see what is indexed',
                '4. **Get details** — Use gemini_get_document for document metadata',
                '',
                'What would you like to search for?',
              ].join('\n'),
            },
          }],
        };
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [{
        uri: 'gemini://server-info',
        name: 'Gemini RAG Server Info',
        description: 'Connection status and available tools for this Gemini RAG MCP server',
        mimeType: 'application/json',
      }],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    switch (uri) {
      case 'gemini://server-info':
        return {
          contents: [{
            uri: 'gemini://server-info',
            mimeType: 'application/json',
            text: JSON.stringify({
              name: 'gemini-file-search-rag-mcp',
              version: '1.0.2',
              connected: !!config,
              tools_available: TOOLS.length,
              tool_categories: {
                stores: 4,
                upload: 2,
                operations: 2,
                documents: 3,
                rag_query: 1,
              },
            }, null, 2),
          }],
        };
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  return server;
}

/**
 * Shared MCP Server creation logic
 * Used by both Node.js entry (index.ts) and CF Worker entry (worker.ts)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
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

  return server;
}

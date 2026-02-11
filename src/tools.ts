/**
 * Gemini RAG File Search - MCP Tool Definitions (12 tools)
 */

export const TOOLS = [
  // ========== Store Tools (4) ==========
  {
    name: 'gemini_create_store',
    description:
      'Create a new Gemini File Search store for RAG documents. Returns the created store resource. Use this to create a knowledge base before uploading documents.',
    annotations: {
      title: 'Create Store',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        display_name: {
          type: 'string',
          description: 'Display name for the store (max 512 characters)',
        },
      },
      required: ['display_name'],
    },
  },
  {
    name: 'gemini_list_stores',
    description:
      'List all Gemini File Search stores. Returns store names, display names, and timestamps. Use to see available knowledge bases.',
    annotations: {
      title: 'List Stores',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of stores to return per page (default 10, max 20)',
        },
        page_token: {
          type: 'string',
          description: 'Token for next page from previous response',
        },
      },
    },
  },
  {
    name: 'gemini_get_store',
    description:
      'Get details of a specific Gemini File Search store by its resource name.',
    annotations: {
      title: 'Get Store',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        store_name: {
          type: 'string',
          description: 'Store resource name, e.g. "fileSearchStores/abc123"',
        },
      },
      required: ['store_name'],
    },
  },
  {
    name: 'gemini_delete_store',
    description:
      'Delete a Gemini File Search store. Use force=true to also delete all documents inside it.',
    annotations: {
      title: 'Delete Store',
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        store_name: {
          type: 'string',
          description: 'Store resource name, e.g. "fileSearchStores/abc123"',
        },
        force: {
          type: 'boolean',
          description: 'If true, cascade delete all documents in the store',
        },
      },
      required: ['store_name'],
    },
  },

  // ========== Upload & Import Tools (2) ==========
  {
    name: 'gemini_upload_to_store',
    description:
      'Upload content directly to a Gemini File Search store. Accepts text content or base64-encoded binary. For large files, use gemini_import_file_to_store instead. Returns an operation to track upload progress.',
    annotations: {
      title: 'Upload to Store',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        store_name: {
          type: 'string',
          description: 'Store resource name, e.g. "fileSearchStores/abc123"',
        },
        mime_type: {
          type: 'string',
          description: 'MIME type of the content, e.g. "text/plain", "application/pdf", "text/markdown"',
        },
        content: {
          type: 'string',
          description: 'The content to upload. Plain text by default, or base64-encoded if content_encoding is "base64"',
        },
        display_name: {
          type: 'string',
          description: 'Display name for the document (optional)',
        },
        content_encoding: {
          type: 'string',
          enum: ['text', 'base64'],
          description: 'How the content is encoded: "text" (default) or "base64" for binary files',
        },
        custom_metadata: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              stringValue: { type: 'string' },
              numericValue: { type: 'number' },
            },
            required: ['key'],
          },
          description: 'Custom metadata key-value pairs for filtering (max 20)',
        },
      },
      required: ['store_name', 'mime_type', 'content'],
    },
  },
  {
    name: 'gemini_import_file_to_store',
    description:
      'Import a file from the Gemini Files API into a File Search store. Use this for large files that were uploaded separately via the Files API. Returns an operation to track import progress.',
    annotations: {
      title: 'Import File to Store',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        store_name: {
          type: 'string',
          description: 'Store resource name, e.g. "fileSearchStores/abc123"',
        },
        file_name: {
          type: 'string',
          description: 'Gemini file resource name, e.g. "files/abc-123"',
        },
        custom_metadata: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              stringValue: { type: 'string' },
              numericValue: { type: 'number' },
            },
            required: ['key'],
          },
          description: 'Custom metadata key-value pairs for filtering (max 20)',
        },
      },
      required: ['store_name', 'file_name'],
    },
  },

  // ========== Operation Tools (2) ==========
  {
    name: 'gemini_get_operation',
    description:
      'Check the status of a store operation (create, delete, import). Returns whether the operation is done and any error details.',
    annotations: {
      title: 'Get Operation Status',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        operation_name: {
          type: 'string',
          description: 'Operation resource name, e.g. "fileSearchStores/abc123/operations/op456"',
        },
      },
      required: ['operation_name'],
    },
  },
  {
    name: 'gemini_get_upload_operation',
    description:
      'Check the status of a file upload operation. Returns whether the upload is done and any error details.',
    annotations: {
      title: 'Get Upload Operation Status',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        operation_name: {
          type: 'string',
          description: 'Upload operation resource name, e.g. "fileSearchStores/abc123/upload/operations/op789"',
        },
      },
      required: ['operation_name'],
    },
  },

  // ========== Document Tools (3) ==========
  {
    name: 'gemini_list_documents',
    description:
      'List documents in a Gemini File Search store. Returns document names, display names, state, size, and MIME types.',
    annotations: {
      title: 'List Documents',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        store_name: {
          type: 'string',
          description: 'Store resource name, e.g. "fileSearchStores/abc123"',
        },
        page_size: {
          type: 'number',
          description: 'Number of documents to return per page (default 10, max 20)',
        },
        page_token: {
          type: 'string',
          description: 'Token for next page from previous response',
        },
      },
      required: ['store_name'],
    },
  },
  {
    name: 'gemini_get_document',
    description:
      'Get details of a specific document in a File Search store, including state, size, and metadata.',
    annotations: {
      title: 'Get Document',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        document_name: {
          type: 'string',
          description: 'Document resource name, e.g. "fileSearchStores/abc123/documents/doc456"',
        },
      },
      required: ['document_name'],
    },
  },
  {
    name: 'gemini_delete_document',
    description:
      'Delete a document from a File Search store. Use force=true to also delete associated chunks.',
    annotations: {
      title: 'Delete Document',
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        document_name: {
          type: 'string',
          description: 'Document resource name, e.g. "fileSearchStores/abc123/documents/doc456"',
        },
        force: {
          type: 'boolean',
          description: 'If true, also delete associated chunks',
        },
      },
      required: ['document_name'],
    },
  },

  // ========== RAG Query Tool (1) ==========
  {
    name: 'gemini_rag_query',
    description:
      'Query your documents using Gemini RAG. Sends a natural language query grounded in your File Search stores. Returns AI-generated answer with source citations from your documents.',
    annotations: {
      title: 'RAG Query',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query to search your documents',
        },
        store_names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of store resource names to search, e.g. ["fileSearchStores/abc123"]',
        },
        model: {
          type: 'string',
          description: 'Gemini model to use (default: "gemini-2.5-flash-lite"). Options: gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.5-pro',
        },
        metadata_filter: {
          type: 'string',
          description: 'Optional metadata filter expression (Google AIP-160 syntax)',
        },
      },
      required: ['query', 'store_names'],
    },
  },
];

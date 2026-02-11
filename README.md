# Gemini RAG MCP Server

[![smithery badge](https://smithery.ai/badge/node2flow/gemini-file-search-rag)](https://smithery.ai/server/node2flow/gemini-file-search-rag)
[![npm version](https://img.shields.io/npm/v/@node2flow/gemini-rag-mcp.svg)](https://www.npmjs.com/package/@node2flow/gemini-rag-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for Google's Gemini File Search (RAG). Manage file search stores, upload documents, and query with RAG through 12 tools.

Works with Claude Desktop, Cursor, VS Code, and any MCP client.

---

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gemini-rag": {
      "command": "npx",
      "args": ["-y", "@node2flow/gemini-rag-mcp"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key"
      }
    }
  }
}
```

### Cursor / VS Code

Add to MCP settings:

```json
{
  "mcpServers": {
    "gemini-rag": {
      "command": "npx",
      "args": ["-y", "@node2flow/gemini-rag-mcp"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key"
      }
    }
  }
}
```

### HTTP Mode (Streamable HTTP)

For remote deployment or shared access:

```bash
GEMINI_API_KEY=your_key npx @node2flow/gemini-rag-mcp --http
```

Server starts on port 3000 (configurable via `PORT` env var). MCP endpoint: `http://localhost:3000/mcp`

---

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key ([get one here](https://aistudio.google.com/apikey)) |
| `PORT` | No | Port for HTTP server (default: `3000`, only used with `--http`) |

---

## All Tools (12 tools)

### Store Management (4 tools)

| Tool | Description |
|---|---|
| `gemini_create_store` | Create a new file search store |
| `gemini_list_stores` | List all file search stores |
| `gemini_get_store` | Get store details |
| `gemini_delete_store` | Delete a store (with optional force) |

### Upload & Import (2 tools)

| Tool | Description |
|---|---|
| `gemini_upload_to_store` | Upload content directly to a store (text, base64) |
| `gemini_import_file_to_store` | Import an existing Gemini file into a store |

### Operations (2 tools)

| Tool | Description |
|---|---|
| `gemini_get_operation` | Check status of a store operation |
| `gemini_get_upload_operation` | Check status of an upload operation |

### Document Management (3 tools)

| Tool | Description |
|---|---|
| `gemini_list_documents` | List documents in a store |
| `gemini_get_document` | Get document details |
| `gemini_delete_document` | Delete a document from a store |

### RAG Query (1 tool)

| Tool | Description |
|---|---|
| `gemini_rag_query` | Query documents using RAG with Gemini models |

---

## Requirements

- **Node.js** 18+
- **Google Gemini API key**

### How to Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API key"
3. Copy the key and use it as `GEMINI_API_KEY`

---

## For Developers

```bash
git clone https://github.com/node2flow-th/gemini-files-search-rag-mcp-community.git
cd gemini-files-search-rag-mcp-community
npm install
npm run build

# Run in stdio mode
GEMINI_API_KEY=your_key npm start

# Run in dev mode (hot reload)
GEMINI_API_KEY=your_key npm run dev

# Run in HTTP mode
GEMINI_API_KEY=your_key npm start -- --http
```

---

## License

MIT License - see [LICENSE](LICENSE)

Copyright (c) 2026 [Node2Flow](https://node2flow.net)

## Links

- [npm Package](https://www.npmjs.com/package/@node2flow/gemini-rag-mcp)
- [Google AI Studio](https://aistudio.google.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Node2Flow](https://node2flow.net)

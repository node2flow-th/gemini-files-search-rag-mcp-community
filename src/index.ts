#!/usr/bin/env node
/**
 * Gemini RAG MCP Server
 *
 * Community edition — connects directly to Google's Gemini API.
 *
 * Usage (stdio - for Claude Desktop / Cursor / VS Code):
 *   GEMINI_API_KEY=your_key npx @node2flow/gemini-file-search-rag-mcp
 *
 * Usage (HTTP - Streamable HTTP transport):
 *   GEMINI_API_KEY=your_key npx @node2flow/gemini-file-search-rag-mcp --http
 */

import { randomUUID } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  StreamableHTTPServerTransport,
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { createServer } from './server.js';
import { TOOLS } from './tools.js';

/**
 * Read config from environment variables
 */
function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return { apiKey };
}

/**
 * Start in stdio mode (for Claude Desktop, Cursor, VS Code)
 */
async function startStdio() {
  const config = getConfig();
  const server = createServer(config ?? undefined);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Gemini RAG MCP Server running on stdio');
  console.error(`API Key: ${config ? '***configured***' : '(not configured yet)'}`);
  console.error(`Tools available: ${TOOLS.length}`);
  console.error('Ready for MCP client\n');
}

/**
 * Start in HTTP mode (Streamable HTTP transport)
 */
async function startHttp() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const app = createMcpExpressApp({ host: '0.0.0.0' });

  // Map of active transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  // POST /mcp — handle MCP requests
  app.post('/mcp', async (req: any, res: any) => {
    // Read config from query params (Smithery gateway) or env vars
    const url = new URL(req.url, `http://${req.headers.host}`);
    const qKey = url.searchParams.get('GEMINI_API_KEY');
    if (qKey) process.env.GEMINI_API_KEY = qKey;

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid: string) => {
            transports[sid] = transport;
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };

        const config = getConfig();
        const server = createServer(config ?? undefined);
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // GET /mcp — SSE stream for existing sessions
  app.get('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // DELETE /mcp — session termination
  app.delete('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // Health check
  app.get('/', (_req: any, res: any) => {
    res.json({
      name: 'gemini-file-search-rag-mcp',
      version: '1.0.2',
      status: 'ok',
      tools: TOOLS.length,
      transport: 'streamable-http',
      endpoints: {
        mcp: '/mcp',
      },
    });
  });

  const config = getConfig();
  app.listen(port, () => {
    console.log(`Gemini RAG MCP Server (HTTP) listening on port ${port}`);
    console.log(`API Key: ${config ? '***configured***' : '(not configured yet)'}`);
    console.log(`Tools available: ${TOOLS.length}`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  });

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    for (const sessionId in transports) {
      try {
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch {
        // Ignore cleanup errors
      }
    }
    process.exit(0);
  });
}

/**
 * Main entry point
 */
async function main() {
  const useHttp = process.argv.includes('--http');

  if (useHttp) {
    await startHttp();
  } else {
    await startStdio();
  }
}

/**
 * Smithery expects a default export that returns a Server instance.
 * Config (GEMINI_API_KEY) is provided by users at runtime via Smithery UI.
 */
export default function createSmitheryServer(opts?: { config?: { GEMINI_API_KEY?: string } }) {
  if (opts?.config?.GEMINI_API_KEY) process.env.GEMINI_API_KEY = opts.config.GEMINI_API_KEY;
  const config = getConfig();
  return createServer(config ?? undefined);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

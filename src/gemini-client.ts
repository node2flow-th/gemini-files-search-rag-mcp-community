/**
 * Gemini RAG File Search API Client
 * Uses Google Generative Language API with API key authentication
 */

import type {
  GeminiRagConfig,
  FileSearchStore,
  FileSearchStoreList,
  FileSearchDocument,
  FileSearchDocumentList,
  GeminiOperation,
  GenerateContentResponse,
  CustomMetadata,
  ChunkingConfig,
} from './types.js';

export class GeminiRagClient {
  private config: GeminiRagConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private uploadUrl = 'https://generativelanguage.googleapis.com/upload/v1beta';

  constructor(config: GeminiRagConfig) {
    this.config = config;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${separator}key=${this.config.apiKey}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // ========== Store Operations ==========

  async createStore(displayName: string): Promise<FileSearchStore> {
    return this.request('/fileSearchStores', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
  }

  async listStores(pageSize?: number, pageToken?: string): Promise<FileSearchStoreList> {
    const query = new URLSearchParams();
    if (pageSize) query.set('pageSize', String(pageSize));
    if (pageToken) query.set('pageToken', pageToken);
    const qs = query.toString();
    return this.request(`/fileSearchStores${qs ? `?${qs}` : ''}`);
  }

  async getStore(storeName: string): Promise<FileSearchStore> {
    return this.request(`/${storeName}`);
  }

  async deleteStore(storeName: string, force?: boolean): Promise<Record<string, unknown>> {
    const query = force ? '?force=true' : '';
    return this.request(`/${storeName}${query}`, { method: 'DELETE' });
  }

  // ========== Upload & Import ==========

  async uploadToStore(
    storeName: string,
    opts: {
      mimeType: string;
      content: string;
      displayName?: string;
      contentEncoding?: 'base64' | 'text';
      customMetadata?: CustomMetadata[];
      chunkingConfig?: ChunkingConfig;
    }
  ): Promise<GeminiOperation> {
    const boundary = '---n2f-boundary-' + Date.now();

    // Build metadata part
    const metadata: Record<string, unknown> = { mimeType: opts.mimeType };
    if (opts.displayName) metadata.displayName = opts.displayName;
    if (opts.customMetadata) metadata.customMetadata = opts.customMetadata;
    if (opts.chunkingConfig) metadata.chunkingConfig = opts.chunkingConfig;

    // Decode content
    let contentBytes: Uint8Array;
    if (opts.contentEncoding === 'base64') {
      const binaryStr = atob(opts.content);
      contentBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        contentBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      contentBytes = new TextEncoder().encode(opts.content);
    }

    // Build multipart body
    const metadataJson = JSON.stringify(metadata);
    const parts = [
      `--${boundary}\r\n`,
      'Content-Type: application/json\r\n\r\n',
      metadataJson,
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${opts.mimeType}\r\n\r\n`,
    ];

    const prefix = new TextEncoder().encode(parts.join(''));
    const suffix = new TextEncoder().encode(`\r\n--${boundary}--`);

    const body = new Uint8Array(prefix.length + contentBytes.length + suffix.length);
    body.set(prefix, 0);
    body.set(contentBytes, prefix.length);
    body.set(suffix, prefix.length + contentBytes.length);

    const url = `${this.uploadUrl}/${storeName}:uploadToFileSearchStore?key=${this.config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Upload Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async importFileToStore(
    storeName: string,
    opts: {
      fileName: string;
      customMetadata?: CustomMetadata[];
      chunkingConfig?: ChunkingConfig;
    }
  ): Promise<GeminiOperation> {
    const body: Record<string, unknown> = { fileName: opts.fileName };
    if (opts.customMetadata) body.customMetadata = opts.customMetadata;
    if (opts.chunkingConfig) body.chunkingConfig = opts.chunkingConfig;

    return this.request(`/${storeName}:importFile`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ========== Operations ==========

  async getOperation(operationName: string): Promise<GeminiOperation> {
    return this.request(`/${operationName}`);
  }

  async getUploadOperation(operationName: string): Promise<GeminiOperation> {
    return this.request(`/${operationName}`);
  }

  // ========== Document Operations ==========

  async listDocuments(
    storeName: string,
    pageSize?: number,
    pageToken?: string
  ): Promise<FileSearchDocumentList> {
    const query = new URLSearchParams();
    if (pageSize) query.set('pageSize', String(pageSize));
    if (pageToken) query.set('pageToken', pageToken);
    const qs = query.toString();
    return this.request(`/${storeName}/documents${qs ? `?${qs}` : ''}`);
  }

  async getDocument(documentName: string): Promise<FileSearchDocument> {
    return this.request(`/${documentName}`);
  }

  async deleteDocument(
    documentName: string,
    force?: boolean
  ): Promise<Record<string, unknown>> {
    const query = force ? '?force=true' : '';
    return this.request(`/${documentName}${query}`, { method: 'DELETE' });
  }

  // ========== RAG Query ==========

  async ragQuery(opts: {
    query: string;
    storeNames: string[];
    model?: string;
    metadataFilter?: string;
  }): Promise<GenerateContentResponse> {
    const model = opts.model || 'gemini-2.5-flash-lite';
    const fileSearch: Record<string, unknown> = {
      fileSearchStoreNames: opts.storeNames,
    };
    if (opts.metadataFilter) {
      fileSearch.metadataFilter = opts.metadataFilter;
    }

    return this.request(`/models/${model}:generateContent`, {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.query }] }],
        tools: [{ fileSearch }],
      }),
    });
  }
}

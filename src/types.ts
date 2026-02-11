/**
 * Gemini RAG File Search - Type Definitions
 */

export interface GeminiRagConfig {
  apiKey: string;
}

export interface FileSearchStore {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
}

export interface FileSearchStoreList {
  fileSearchStores: FileSearchStore[];
  nextPageToken?: string;
}

export interface FileSearchDocument {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
  state: 'PENDING' | 'ACTIVE' | 'FAILED';
  sizeBytes?: string;
  mimeType?: string;
  customMetadata?: CustomMetadata[];
}

export interface FileSearchDocumentList {
  documents: FileSearchDocument[];
  nextPageToken?: string;
}

export interface StringList {
  values: string[];
}

export interface CustomMetadata {
  key: string;
  stringValue?: string;
  numericValue?: number;
  stringListValue?: StringList;
}

export interface ChunkingConfig {
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface GeminiOperation {
  name: string;
  done: boolean;
  metadata?: Record<string, unknown>;
  error?: { code: number; message: string; details?: unknown[] };
  response?: Record<string, unknown>;
}

export interface GenerateContentResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        retrievedContext?: {
          uri: string;
          title: string;
          text: string;
        };
      }>;
    };
  }>;
}

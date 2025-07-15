export interface IVectorStoreClient {
  initialize?(): Promise<void>;
  upsertVector?(id: string, text: string, vector: number[], metadata?: any): Promise<void>;
  getVector?(id: string): Promise<VectorSearchResponse | null>;
  searchVector?(queryVector: number[], topK: number, threshold?: number): Promise<VectorSearchResponse[]>;
  searchText?(query: string, topK: number, threshold?: number): Promise<VectorSearchResponse[]>;
  deleteVector?(id: string): Promise<boolean>;
  upsertVectorsBatch?(vectors: Array<{ id: string; text: string; vector: number[]; metadata?: any }>): Promise<void>;
  size?(): Promise<number>;
  clear?(): Promise<void>;
  isInitialized?(): boolean;
  addDocuments?(documents: Document[]): Promise<void>;
  searchDocuments?(
    query: string,
    topK: number,
    metadataFilter?: Record<string, any>,
    threshold?: number
  ): Promise<DocumentSearchResponse[]>;
  getAllMemoryVectors?(): Promise<MemoryVector[]>;
}

export interface MemoryVector {
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  id?: string;
}

export interface VectorSearchResponse {
  id: string;
  score: number; // Similarity score (0-1, higher = more similar)
  text: string; // Original text content
  metadata?: any;
}

export enum VectorStoreProvider {
  InMemory = "in-memory",
  PostgreSQL = "postgresql",
  Milvus = "milvus",
  Chroma = "chroma",
  Pinecone = "pinecone",
}

export interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

export interface DocumentSearchResponse extends VectorSearchResponse {
  document: Document;
}

// === Vector Store Request/Response Interfaces ===

export interface VectorStoreRequest<TArgs = any> {
  provider?: VectorStoreProvider;
  args?: TArgs;
  config?: VectorStoreConfig;
}

export interface VectorStoreConfig {
  batchSize?: number;
  threshold?: number;
  topK?: number;
  autoInitialize?: boolean;
  providerExtras?: Record<string, any>;
}

export interface AddDocumentsRequest extends VectorStoreRequest {
  documents: Document[];
}

export interface AddDocumentsResponse {
  success: boolean;
  documentsAdded: number;
  totalDocuments: number;
  processingTimeMs: number;
}

export interface SearchDocumentsRequest extends VectorStoreRequest {
  query: string;
  topK?: number;
  metadataFilter?: Record<string, any>;
  threshold?: number;
}

export interface SearchDocumentsResponse {
  results: DocumentSearchResponse[];
  totalFound: number;
  query: string;
  provider: VectorStoreProvider;
  processingTimeMs: number;
}

export interface GetDocumentRequest extends VectorStoreRequest {
  id: string;
}

export interface GetDocumentResponse {
  result: VectorSearchResponse | null;
  found: boolean;
  provider: VectorStoreProvider;
}

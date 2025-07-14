export interface IVectorStoreClient {
  initialize?(): Promise<void>;
  upsertVector?(id: string, text: string, vector: number[], metadata?: any): Promise<void>;
  getVector?(id: string): Promise<VectorSearchResult | null>;
  searchVector?(queryVector: number[], topK: number, threshold?: number): Promise<VectorSearchResult[]>;
  searchText?(query: string, topK: number, threshold?: number): Promise<VectorSearchResult[]>;
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
  ): Promise<DocumentSearchResult[]>;
}

export interface VectorSearchResult {
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

export interface DocumentSearchResult extends VectorSearchResult {
  document: Document;
}

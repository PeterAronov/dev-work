// packages/vector/clients/in-memory-vector-store.client.ts
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddingModels } from "../../../llm";
import {
  DocumentSearchResponse,
  IVectorStoreClient,
  MemoryVector,
  VectorSearchResponse,
} from "../../src/vector-store.interface";

/**
 * Simplified InMemoryVectorStoreClient for user profile search
 *
 * Focus: Similarity search + metadata filtering for user queries
 * Core features:
 * - Store user profiles as documents with metadata
 * - Semantic similarity search using embeddings
 * - Metadata filtering for precise user matching
 * - Simple document tracking for retrieval
 */
export class InMemoryVectorStoreClient implements IVectorStoreClient {
  private vectorStore: MemoryVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private documentMap: Map<string, Document> = new Map(); // Track documents by ID for user retrieval

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: OpenAIEmbeddingModels.LARGE,
      openAIApiKey: process.env.OPEN_AI_API_KEY!,
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log("InMemoryVectorStoreClient | Initializing simplified vector store for user search...");
      this.vectorStore = new MemoryVectorStore(this.embeddings);
      console.log("InMemoryVectorStoreClient | Vector store initialized successfully");
    } catch (error: any) {
      console.error("Failed to initialize vector store:", error?.message);
      throw new Error(`Vector store initialization failed: ${error?.message}`);
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`InMemoryVectorStoreClient | Adding ${documents.length} user documents...`);

      await this.vectorStore!.addDocuments(documents);

      documents.forEach((doc) => {
        if (doc.metadata?.uuid) {
          this.documentMap.set(doc.metadata.uuid, doc);
        }
      });

      console.log(`InMemoryVectorStoreClient | Successfully added ${documents.length} user documents`);
      console.log(`InMemoryVectorStoreClient | Current total documents count: ${this.documentMap.size}`);
    } catch (error: any) {
      console.error("Failed to add documents:", error?.message);
      throw new Error(`Add documents failed: ${error?.message}`);
    }
  }

  /**
   * Search documents using natural language query with optional metadata filtering
   * Perfect for queries like "Find data scientists in Germany" or "Users with React experience"
   */
  async searchDocuments(
    query: string,
    topK: number = 5,
    metadataFilter?: Record<string, any>,
    threshold: number = 0.7
  ): Promise<DocumentSearchResponse[]> {
    this.ensureInitialized();

    try {
      console.log(`🔍 Searching for: "${query}" (topK: ${topK}, threshold: ${threshold})`);

      // Use LangChain's similarity search with scores
      const results = await this.vectorStore!.similaritySearchWithScore(query, topK * 2); // Get more for filtering

      // Convert to our format and apply filters
      const searchResults: DocumentSearchResponse[] = results
        .map(([doc, distance]) => ({
          id: doc.metadata.id || "unknown",
          score: this.convertDistanceToSimilarity(distance),
          text: doc.pageContent,
          metadata: doc.metadata,
          document: doc,
        }))
        .filter((result) => {
          // Apply similarity threshold
          if (result.score < threshold) return false;

          // Apply metadata filter if provided
          if (metadataFilter) {
            return this.matchesMetadataFilter(result.metadata, metadataFilter);
          }

          return true;
        })
        .sort((a, b) => b.score - a.score) // Sort by similarity
        .slice(0, topK); // Take only topK

      console.log(`✅ Found ${searchResults.length} matching users`);
      return searchResults;
    } catch (error) {
      console.error("Document search failed:", error);
      throw new Error(`Document search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getVector(id: string): Promise<VectorSearchResponse | null> {
    this.ensureInitialized();

    try {
      const document = this.documentMap.get(id);
      if (!document) {
        return null;
      }

      return {
        id,
        score: 1.0,
        text: document.pageContent,
        metadata: document.metadata,
      };
    } catch (error: any) {
      console.error(`Failed to get document for ID: ${id}`, error?.message);
      return null;
    }
  }

  /**
   * Helper method to check if document metadata matches filter criteria
   * Supports exact matches and array contains logic
   */
  private matchesMetadataFilter(metadata: Record<string, any>, filter: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      const metaValue = metadata[key];

      if (metaValue === undefined) return false;

      if (Array.isArray(metaValue)) {
        // For arrays (like skills), check if any element matches
        if (Array.isArray(value)) {
          // Both are arrays - check intersection
          if (!value.some((v) => metaValue.includes(v))) return false;
        } else {
          // Filter value is single - check if contained in array
          if (!metaValue.includes(value)) return false;
        }
      } else {
        // Direct comparison
        if (metaValue !== value) return false;
      }
    }
    return true;
  }

  /**
   * Convert LangChain distance to similarity score (0-1, higher = more similar)
   */
  private convertDistanceToSimilarity(distance: number): number {
    return Math.max(0, Math.min(1, 1 - distance / 2));
  }

  isInitialized(): boolean {
    return this.vectorStore !== null;
  }

  async size(): Promise<number> {
    return this.documentMap.size;
  }

  private ensureInitialized(): void {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized. Call initialize() first.");
    }
  }

  async getAllMemoryVectors(): Promise<MemoryVector[]> {
    this.ensureInitialized();

    try {
      console.log("InMemoryVectorStoreClient | Retrieving all memory vectors...");

      const vectors = this.vectorStore!.memoryVectors.map((vec) => ({
        content: vec.content,
        embedding: vec.embedding,
        metadata: vec.metadata,
        id: vec.id,
      }));

      console.log(`InMemoryVectorStoreClient | Found ${vectors.length} memory vectors`);
      return vectors;
    } catch (error: any) {
      console.error("Failed to retrieve memory vectors:", error?.message);
      throw new Error(`Get memory vectors failed: ${error?.message}`);
    }
  }
}

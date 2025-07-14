// packages/vector/clients/in-memory-vector-store.client.ts
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { IVectorStoreClient, VectorSearchResult } from "../src/vector-store.interface";

/**
 * Professional InMemoryVectorStoreClient using LangChain's MemoryVectorStore
 *
 * This client provides a clean abstraction over LangChain's MemoryVectorStore,
 * implementing the IVectorStoreClient interface for consistent usage across
 * different vector store implementations.
 *
 * Key Features:
 * - Uses LangChain's optimized MemoryVectorStore under the hood
 * - Works with pre-computed embeddings from LLMService
 * - NO embedding creation logic - maintains clean separation of concerns
 * - Professional error handling and logging
 * - Efficient batch operations using LangChain
 *
 * Note: Embedding creation is handled by LLMService.executeEmbedding()
 */
export class InMemoryVectorStoreClient implements IVectorStoreClient {
  private vectorStore: MemoryVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private initialized: boolean = false;
  private documentMap: Map<string, Document> = new Map(); // Track documents by ID for retrieval

  constructor() {
    // Initialize embeddings but only for LangChain compatibility
    // We won't use it for embedding creation - LLMService handles that
    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-large",
      openAIApiKey: process.env.OPEN_AI_API_KEY!,
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log("🚀 Initializing InMemoryVectorStoreClient with LangChain MemoryVectorStore");

      // Initialize LangChain's MemoryVectorStore
      this.vectorStore = new MemoryVectorStore(this.embeddings);
      this.initialized = true;

      console.log("✅ InMemoryVectorStoreClient initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize InMemoryVectorStoreClient:", error);
      throw new Error(
        `Vector store initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async upsertVector(id: string, text: string, vector: number[], metadata?: any): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`📦 Upserting vector for ID: ${id} (${vector.length}D)`);

      // Remove existing document if it exists
      await this.deleteVector(id);

      const document = new Document({
        pageContent: text,
        metadata: {
          id,
          ...metadata,
          upsertedAt: new Date().toISOString(),
        },
      });

      // Add document with pre-computed embedding to LangChain's MemoryVectorStore
      await this.vectorStore!.addVectors([vector], [document]);

      // Track the document for efficient retrieval and deletion
      this.documentMap.set(id, document);

      console.log(`✅ Vector upserted successfully for ID: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to upsert vector for ID: ${id}`, error);
      throw new Error(`Vector upsert failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getVector(id: string): Promise<VectorSearchResult | null> {
    this.ensureInitialized();

    try {
      const document = this.documentMap.get(id);
      if (!document) {
        return null;
      }

      return {
        id,
        score: 1.0, // Perfect match for exact retrieval
        text: document.pageContent,
        metadata: document.metadata,
      };
    } catch (error) {
      console.error(`❌ Failed to get vector for ID: ${id}`, error);
      return null;
    }
  }

  async searchVector(queryVector: number[], topK: number = 5, threshold: number = 0.7): Promise<VectorSearchResult[]> {
    this.ensureInitialized();

    try {
      console.log(`🔍 Searching vectors with query vector (topK: ${topK}, threshold: ${threshold})`);

      // Use LangChain's similarity search by vector with scores
      const results = await this.vectorStore!.similaritySearchVectorWithScore(
        queryVector,
        Math.max(topK, 50) // Get more results for filtering
      );

      // Convert LangChain results to our interface format and filter by threshold
      const searchResults: VectorSearchResult[] = results
        .map(([doc, distance]) => ({
          id: doc.metadata.id,
          score: this.convertDistanceToSimilarity(distance),
          text: doc.pageContent,
          metadata: doc.metadata,
        }))
        .filter((result) => result.score >= threshold && this.documentMap.has(result.id)) // Filter deleted docs
        .sort((a, b) => b.score - a.score) // Sort by similarity descending
        .slice(0, topK); // Take only topK

      console.log(`✅ Found ${searchResults.length} vectors above threshold ${threshold}`);
      return searchResults;
    } catch (error) {
      console.error("❌ Vector search failed:", error);
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async searchText(query: string, topK: number = 5, threshold: number = 0.7): Promise<VectorSearchResult[]> {
    // This method should NOT be implemented here since we don't handle embeddings
    // The VectorStoreService should use LLMService.executeEmbedding() first
    throw new Error("searchText not supported - use LLMService.executeEmbedding() + searchVector() instead");
  }

  async deleteVector(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log(`🗑️ Deleting vector for ID: ${id}`);

      // Remove from our document map (LangChain MemoryVectorStore doesn't support direct deletion)
      const wasDeleted = this.documentMap.delete(id);

      // Note: LangChain MemoryVectorStore doesn't have a direct delete method
      // We handle this by filtering during searches using our documentMap

      if (wasDeleted) {
        console.log(`✅ Vector marked for deletion: ${id}`);
      } else {
        console.log(`ℹ️ Vector not found for deletion: ${id}`);
      }

      return wasDeleted;
    } catch (error) {
      console.error(`❌ Failed to delete vector for ID: ${id}`, error);
      return false;
    }
  }

  async upsertVectorsBatch(
    vectors: Array<{
      id: string;
      text: string;
      vector: number[];
      metadata?: any;
    }>
  ): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`📦 Batch upserting ${vectors.length} vectors...`);

      // Prepare documents and embeddings for LangChain batch operation
      const documents: Document[] = [];
      const embeddings: number[][] = [];

      for (const { id, text, vector, metadata } of vectors) {
        // Remove existing if present
        this.documentMap.delete(id);

        const document = new Document({
          pageContent: text,
          metadata: {
            id,
            ...metadata,
            batchUpsertedAt: new Date().toISOString(),
          },
        });

        documents.push(document);
        embeddings.push(vector);

        // Track the document
        this.documentMap.set(id, document);
      }

      // Use LangChain's batch add vectors method
      await this.vectorStore!.addVectors(embeddings, documents);

      console.log(`✅ Batch upserted ${vectors.length} vectors successfully using LangChain`);
    } catch (error) {
      console.error("❌ Batch upsert failed:", error);
      throw new Error(`Batch upsert failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async size(): Promise<number> {
    this.ensureInitialized();

    try {
      // Return the count of active documents in our map
      return this.documentMap.size;
    } catch (error) {
      console.error("❌ Failed to get vector store size:", error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log("🧹 Clearing all vectors from InMemoryVectorStoreClient");

      // Reinitialize the LangChain MemoryVectorStore (effectively clearing it)
      this.vectorStore = new MemoryVectorStore(this.embeddings);
      this.documentMap.clear();

      console.log("✅ All vectors cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear vectors:", error);
      throw new Error(`Clear operation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.vectorStore !== null;
  }

  /**
   * Convert LangChain distance to similarity score
   * LangChain typically returns cosine distance (0 = identical, higher = more different)
   * We convert to similarity score (1 = identical, 0 = completely different)
   */
  private convertDistanceToSimilarity(distance: number): number {
    // For cosine distance: similarity = 1 - (distance / 2)
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, 1 - distance / 2));
  }

  /**
   * Get LangChain MemoryVectorStore instance (for advanced operations if needed)
   */
  public getLangChainStore(): MemoryVectorStore | null {
    return this.vectorStore;
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized() && this.vectorStore !== null;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return false;
    }
  }

  /**
   * Get storage info including LangChain details
   */
  getStorageInfo(): {
    vectorCount: number;
    isInitialized: boolean;
    usesLangChain: boolean;
    embeddingModel: string;
  } {
    return {
      vectorCount: this.documentMap.size,
      isInitialized: this.initialized,
      usesLangChain: true,
      embeddingModel: "text-embedding-3-large",
    };
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.vectorStore) {
      throw new Error("InMemoryVectorStoreClient not initialized. Call initialize() first.");
    }
  }
}

// packages/vector-store/src/vector-store.service.ts
import { Document } from "@langchain/core/documents";
import { InMemoryVectorStoreClient } from "../clients/in-memory/in-memory-vector-store.client";
import {
  AddDocumentsRequest,
  AddDocumentsResponse,
  DocumentSearchResponse,
  GetDocumentRequest,
  GetDocumentResponse,
  IVectorStoreClient,
  SearchDocumentsRequest,
  SearchDocumentsResponse,
  VectorSearchResponse,
  VectorStoreProvider,
} from "./vector-store.interface";

class VectorStoreService {
  private clients: Map<VectorStoreProvider, IVectorStoreClient> = new Map();
  private static instance: VectorStoreService;
  private defaultProvider: VectorStoreProvider = VectorStoreProvider.InMemory;

  constructor() {
    this.initializeClients();
  }

  static getInstance(): VectorStoreService {
    if (!VectorStoreService.instance) {
      VectorStoreService.instance = new VectorStoreService();
    }
    return VectorStoreService.instance;
  }

  private initializeClients(): void {
    this.clients.set(VectorStoreProvider.InMemory, new InMemoryVectorStoreClient());
    // Future providers:
    // this.clients.set(VectorStoreProvider.PostgreSQL, new PostgreSQLVectorStoreClient());
    // this.clients.set(VectorStoreProvider.Milvus, new MilvusVectorStoreClient());
    // this.clients.set(VectorStoreProvider.Pinecone, new PineconeVectorStoreClient());
  }

  private getClient(provider?: VectorStoreProvider): IVectorStoreClient {
    const selectedProvider = provider || this.defaultProvider;
    const client = this.clients.get(selectedProvider);

    if (!client) {
      throw new Error(`No client available for provider: ${selectedProvider}`);
    }

    return client;
  }

  /**
   * Initialize vector store client
   */
  async initialize(provider?: VectorStoreProvider): Promise<void> {
    console.log("VectorStoreService | Initializing vector store...");

    const client = this.getClient(provider);

    if (client.initialize) {
      await client.initialize();
    }

    console.log(`VectorStoreService | Initialized with provider: ${provider || this.defaultProvider}`);
  }

  async addDocuments(req: AddDocumentsRequest): Promise<AddDocumentsResponse> {
    const startTime = Date.now();
    console.log("VectorStoreService | Adding documents to vector store...");

    const { documents, provider, config } = req;

    if (!documents || documents.length === 0) {
      throw new Error("Documents array is required and cannot be empty");
    }

    const selectedProvider: VectorStoreProvider = provider || this.defaultProvider;
    const client: IVectorStoreClient = this.getClient(selectedProvider);

    // Auto-initialize if needed
    if (config?.autoInitialize !== false && !client.isInitialized?.()) {
      await this.initialize(selectedProvider);
    }

    console.log(`VectorStoreService | Using provider: ${selectedProvider} for ${documents.length} documents`);

    if (!client.addDocuments) {
      throw new Error(`Provider ${selectedProvider} does not support addDocuments operation`);
    }

    await client.addDocuments(documents);

    const processingTimeMs: number = Date.now() - startTime;
    const totalDocuments: number = (await client.size?.()) || 0;

    console.log(`VectorStoreService | Added ${documents.length} documents in ${processingTimeMs}ms`);

    return {
      success: true,
      documentsAdded: documents.length,
      totalDocuments,
      processingTimeMs,
    } as AddDocumentsResponse;
  }

  async searchDocuments(req: SearchDocumentsRequest): Promise<SearchDocumentsResponse> {
    const startTime = Date.now();
    console.log(`VectorStoreService | Searching documents: "${req.query}"`);

    const { query, provider, topK = 5, metadataFilter, threshold = 0.7 } = req;

    if (!query || query.trim().length === 0) {
      throw new Error("Search query is required and cannot be empty");
    }

    const selectedProvider = provider || this.defaultProvider;
    const client = this.getClient(selectedProvider);

    if (!client.searchDocuments) {
      throw new Error(`Provider ${selectedProvider} does not support searchDocuments operation`);
    }

    const results = await client.searchDocuments(query, topK, metadataFilter, threshold);
    const processingTimeMs = Date.now() - startTime;

    console.log(`VectorStoreService | Found ${results.length} results in ${processingTimeMs}ms`);

    return {
      results,
      totalFound: results.length,
      query,
      provider: selectedProvider,
      processingTimeMs,
    };
  }

  async getDocument(req: GetDocumentRequest): Promise<GetDocumentResponse> {
    console.log(`VectorStoreService | Getting document: ${req.id}`);

    const { id, provider } = req;

    if (!id || id.trim().length === 0) {
      throw new Error("Document ID is required and cannot be empty");
    }

    const selectedProvider: VectorStoreProvider = provider || this.defaultProvider;
    const client: IVectorStoreClient = this.getClient(selectedProvider);

    if (!client.getVector) {
      throw new Error(`Provider ${selectedProvider} does not support getVector operation`);
    }

    const result = await client.getVector(id);

    return {
      result,
      found: result !== null,
      provider: selectedProvider,
    };
  }

  async getStats(provider?: VectorStoreProvider): Promise<{
    provider: VectorStoreProvider;
    totalDocuments: number;
    isInitialized: boolean;
  }> {
    const selectedProvider: VectorStoreProvider = provider || this.defaultProvider;
    const client: IVectorStoreClient = this.getClient(selectedProvider);

    const totalDocuments = (await client.size?.()) || 0;
    const isInitialized = client.isInitialized?.() || false;

    return {
      provider: selectedProvider,
      totalDocuments,
      isInitialized,
    };
  }

  setDefaultProvider(provider: VectorStoreProvider): void {
    if (!this.clients.has(provider)) {
      throw new Error(`Provider ${provider} is not available`);
    }

    this.defaultProvider = provider;
    console.log(`VectorStoreService | Default provider set to: ${provider}`);
  }

  getAvailableProviders(): VectorStoreProvider[] {
    return Array.from(this.clients.keys());
  }

  async healthCheck(provider?: VectorStoreProvider): Promise<boolean> {
    try {
      const client = this.getClient(provider);
      return client.isInitialized?.() || false;
    } catch (error) {
      console.error("VectorStoreService | Health check failed:", error);
      return false;
    }
  }
}

export default VectorStoreService.getInstance();

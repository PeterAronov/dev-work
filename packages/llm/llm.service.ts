// packages/llm/llm.service.ts
import { OpenAIClient } from "./clients/open-ai";
import {
  ILLMClient,
  LLMEmbeddingRequest,
  LLMEmbeddingResponse,
  LLMGenerateStructuredOutputRequest,
  LLMModel,
  LLMProvider,
  LLMRequest,
} from "./llm.interface";
import { ModelRegistry, ModelSelector } from "./model.registry";

class LLMService {
  private clients: Map<LLMProvider, ILLMClient> = new Map();
  private static instance: LLMService;

  constructor() {
    this.initializeClients();
  }

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private initializeClients(): void {
    this.clients.set(LLMProvider.OpenAI, new OpenAIClient());
    // this.clients.set(LLMProvider.Vertex, new VertexClient());
    // this.clients.set(LLMProvider.Anthropic, new AnthropicClient());
  }

  private getClient(model: LLMModel): ILLMClient {
    const client: ILLMClient | undefined = this.clients.get(model.provider);

    if (!client) {
      throw new Error(`No client available for provider: ${model.provider}`);
    }

    return client;
  }

  async generateText<T = any>(req: LLMRequest): Promise<string> {
    console.log("LLMService | Generating text response...");

    const { prompt, priority, config } = req;

    if (!prompt) {
      throw new Error("Prompt is required for text generation");
    }

    const model: LLMModel = priority?.[0] || ModelRegistry.Gpt4O;
    const client: ILLMClient = this.getClient(model);

    console.log(`LLMService | Using model: ${model.name} and provider: ${model.provider}`);

    if (!client.generateText) {
      throw new Error(`generateText not implemented for provider: ${model.provider}`);
    }

    return await client.generateText({
      ...req,
      config: { ...config, modelName: model.id },
    });
  }

  async generateStructuredOutput<T>(req: LLMGenerateStructuredOutputRequest): Promise<T> {
    console.log("LLMService | Generating structured output...");

    const { prompt, priority, config } = req;

    if (!prompt) {
      throw new Error("Prompt is required for structured output generation");
    }

    // Use provided model or default to Gpt4O (best for function calling)
    const model: LLMModel = priority?.[0] || ModelRegistry.Gpt4O;
    const client: ILLMClient = this.getClient(model);

    console.log(`LLMService | Using model: ${model.name} and provider: ${model.provider}`);

    return await client.generateStructuredOutput<T>({
      ...req,
      config: { ...config, modelName: model.id }, //need to cast modelName to model.id(in model registry we have id as the model name)
    });
  }
  async executeEmbedding(req: LLMEmbeddingRequest): Promise<LLMEmbeddingResponse> {
    const { input, priority, config } = req;

    const model: LLMModel = priority?.[0] || ModelRegistry.OpenAIEmbeddingSmall;
    const client: ILLMClient = this.getClient(model);

    return await client.embed({
      input,
      config: { ...config, modelName: model.id },
    });
  }
}

// Export singleton instance
export default LLMService.getInstance();

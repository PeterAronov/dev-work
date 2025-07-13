// packages/llm/llm.service.ts
import { OpenAIClient } from "./clients/open-ai";
import {
  ILLMClient,
  LLMEmbeddingRequest,
  LLMGenerateStructuredOutputReq,
  LLMModel,
  LLMModelCapability,
  LLMModelConfig,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMTask,
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

  async generateStructuredOutput<T>(req: LLMGenerateStructuredOutputReq): Promise<T> {
    console.log("LLMService | Generating structured output...");

    if (!req.prompt) {
      throw new Error("Prompt is required for structured output generation");
    }

    // Use provided model or default to Gpt4O (best for function calling)
    const model: LLMModel = req.priority?.[0] || ModelRegistry.Gpt4O;
    const client: ILLMClient = this.getClient(model);

    console.log(`LLMService | Using model: ${model.name} and provider: ${model.provider}`);

    return await client.generateStructuredOutput<T>({
      ...req,
      config: { ...req.config, modelName: model.id }, //need to cast modelName to model.id(in model registry we have id as the model name)
    });
  }

  async executeEmbedding(
    input: string | object | (string | object)[],
    options?: {
      priority?: LLMModel[];
      config?: LLMModelConfig;
    }
  ): Promise<number[][]> {
    const model = options?.priority?.[0] || ModelRegistry.OpenAIEmbeddingSmall;
    const client = this.getClient(model);

    return await client.embed({
      input,
      config: { ...options?.config, modelName: model.id },
    });
  }
}

// Export singleton instance
export default LLMService.getInstance();

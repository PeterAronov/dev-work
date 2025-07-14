import { OpenAIChatModels, OpenAIEmbeddingModels } from "./clients/open-ai/openai.interface";
import { LLMModel, LLMModelCapability, LLMProvider, LLMTask } from "./llm.interface";

export const ModelRegistry: Record<string, LLMModel> = {
  Gpt4O: {
    id: OpenAIChatModels.GPT_4O,
    name: "GPT 4o",
    provider: LLMProvider.OpenAI,
    capabilities: [LLMModelCapability.Completion, LLMModelCapability.Chat, LLMModelCapability.Vision],
    tasks: [LLMTask.FunctionCall, LLMTask.ToolUse, LLMTask.CodeGen, LLMTask.RAG, LLMTask.MetadataSearch],
    cost: {
      inputToken: 0.005, // per 1K tokens
      outputToken: 0.015, // per 1K tokens
    },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },

  Gpt4: {
    id: OpenAIChatModels.GPT_4,
    name: "GPT-4",
    provider: LLMProvider.OpenAI,
    capabilities: [LLMModelCapability.Completion, LLMModelCapability.Chat, LLMModelCapability.Vision],
    tasks: [LLMTask.FunctionCall, LLMTask.ToolUse, LLMTask.CodeGen, LLMTask.RAG],
    cost: {
      inputToken: 0.03, // per 1K tokens
      outputToken: 0.06, // per 1K tokens
    },
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },

  Gpt4Turbo: {
    id: OpenAIChatModels.GPT_4_TURBO,
    name: "GPT 4 Turbo",
    provider: LLMProvider.OpenAI,
    capabilities: [LLMModelCapability.Completion, LLMModelCapability.Chat, LLMModelCapability.Vision],
    tasks: [LLMTask.FunctionCall, LLMTask.ToolUse, LLMTask.CodeGen, LLMTask.RAG],
    cost: {
      inputToken: 0.01, // per 1K tokens
      outputToken: 0.03, // per 1K tokens
    },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },

  Gpt35Turbo: {
    id: OpenAIChatModels.GPT_35,
    name: "GPT 3.5 Turbo",
    provider: LLMProvider.OpenAI,
    capabilities: [LLMModelCapability.Completion],
    tasks: [LLMTask.CodeGen, LLMTask.RAG, LLMTask.MetadataSearch],
    cost: {
      inputToken: 0.0015, // per 1K tokens
      outputToken: 0.002, // per 1K tokens
    },
    contextWindow: 16385,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },

  OpenAIEmbeddingSmall: {
    id: OpenAIEmbeddingModels.SMALL,
    name: "OpenAI Text Embedding Small",
    provider: LLMProvider.OpenAI,
    capabilities: [LLMModelCapability.Embedding],
    tasks: [LLMTask.RAG, LLMTask.MetadataSearch],
    cost: {
      inputToken: 0.00002, // per 1K tokens
      outputToken: 0,
    },
    contextWindow: 8191,
    supportsStreaming: false,
    supportsVision: false,
    supportsFunctionCalling: false,
  },

  OpenAIEmbeddingLarge: {
    id: OpenAIEmbeddingModels.LARGE,
    name: "OpenAI Text Embedding Large",
    provider: LLMProvider.OpenAI,
    capabilities: [LLMModelCapability.Embedding],
    tasks: [LLMTask.RAG, LLMTask.MetadataSearch],
    cost: {
      inputToken: 0.00013, // per 1K tokens
      outputToken: 0,
    },
    contextWindow: 8191,
    supportsStreaming: false,
    supportsVision: false,
    supportsFunctionCalling: false,
  },
};

export class ModelSelector {
  static getByCapability(capability: LLMModelCapability): LLMModel[] {
    return Object.values(ModelRegistry).filter((model) => model.capabilities.includes(capability));
  }

  static getByProvider(provider: LLMProvider): LLMModel[] {
    return Object.values(ModelRegistry).filter((model) => model.provider === provider);
  }

  static getByTask(task: LLMTask): LLMModel[] {
    return Object.values(ModelRegistry).filter((model) => model.tasks?.includes(task));
  }

  static getByCapabilities(capabilities: LLMModelCapability[]): LLMModel[] {
    return Object.values(ModelRegistry).filter((model) =>
      capabilities.every((cap) => model.capabilities.includes(cap))
    );
  }

  static getCheapestByCapabilityAndTask(capability: LLMModelCapability, task?: LLMTask): LLMModel | null {
    let models = this.getByCapability(capability);

    if (task) {
      models = models.filter((model) => model.tasks?.includes(task));
    }

    if (models.length === 0) return null;

    return models.reduce((cheapest, current) => {
      const cheapestCost = (cheapest.cost?.inputToken || 0) + (cheapest.cost?.outputToken || 0);
      const currentCost = (current.cost?.inputToken || 0) + (current.cost?.outputToken || 0);
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  static getBestModelForUseCase(config: {
    capability: LLMModelCapability;
    task?: LLMTask;
    requiresVision?: boolean;
    requiresFunctionCalling?: boolean;
    maxBudget?: number; // cost per 1K tokens
    preferredProvider?: LLMProvider;
  }): LLMModel | null {
    let models = this.getByCapability(config.capability);

    if (config.task !== undefined) {
      models = models.filter((model) => model.tasks?.includes(config.task as LLMTask));
    }

    if (config.requiresVision) {
      models = models.filter((model) => model.supportsVision);
    }

    if (config.requiresFunctionCalling) {
      models = models.filter((model) => model.supportsFunctionCalling);
    }

    if (typeof config.maxBudget === "number") {
      models = models.filter((model) => {
        const totalCost = (model.cost?.inputToken || 0) + (model.cost?.outputToken || 0);
        return totalCost <= config.maxBudget!;
      });
    }

    if (config.preferredProvider) {
      const preferredModels = models.filter((model) => model.provider === config.preferredProvider);
      if (preferredModels.length > 0) {
        models = preferredModels;
      }
    }

    if (models.length === 0) return null;

    // Return the most capable model (based on context window and features)
    return models.reduce((best, current) => {
      const bestScore = this.calculateModelScore(best);
      const currentScore = this.calculateModelScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  private static calculateModelScore(model: LLMModel): number {
    let score = 0;

    // Context window contributes to score
    score += (model.contextWindow || 0) / 1000;

    // Additional capabilities add to score
    score += model.capabilities.length * 10;

    // Function calling and vision support
    if (model.supportsFunctionCalling) score += 20;
    if (model.supportsVision) score += 15;
    if (model.supportsStreaming) score += 5;

    // Subtract cost penalty (lower cost = higher score)
    const totalCost = (model.cost?.inputToken || 0) + (model.cost?.outputToken || 0);
    score -= totalCost * 100; // Scale cost impact

    return score;
  }

  static getModelsForScenario(
    scenario: "chat" | "completion" | "embedding" | "vision" | "function-calling"
  ): LLMModel[] {
    switch (scenario) {
      case "chat":
        return this.getByCapability(LLMModelCapability.Chat).sort(
          (a, b) => this.calculateModelScore(b) - this.calculateModelScore(a)
        );

      case "completion":
        return this.getByCapability(LLMModelCapability.Completion).sort(
          (a, b) => this.calculateModelScore(b) - this.calculateModelScore(a)
        );

      case "embedding":
        return this.getByCapability(LLMModelCapability.Embedding).sort(
          (a, b) => (a.cost?.inputToken || 0) - (b.cost?.inputToken || 0)
        ); // Sort by cost for embeddings

      case "vision":
        return this.getByCapability(LLMModelCapability.Vision)
          .filter((model) => model.supportsVision)
          .sort((a, b) => this.calculateModelScore(b) - this.calculateModelScore(a));

      case "function-calling":
        return Object.values(ModelRegistry)
          .filter((model) => model.supportsFunctionCalling)
          .sort((a, b) => this.calculateModelScore(b) - this.calculateModelScore(a));

      default:
        return Object.values(ModelRegistry);
    }
  }
}

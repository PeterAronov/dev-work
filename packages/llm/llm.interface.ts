// packages/llm/llm.interface.ts
import { z } from "zod";

export enum LLMProvider {
  OpenAI = "openai",
  Vertex = "vertex",
  Anthropic = "anthropic",
  Mistral = "mistral",
  Cohere = "cohere",
  Ollama = "ollama", // self-hosted / local
  Custom = "custom", // e.g. fine-tuned or user-defined endpoint
}

export enum LLMModelCapability {
  Chat = "chat", // Multi-turn conversational (messages array)
  Completion = "completion", // Single-turn prompt → text (single prompt string)
  Embedding = "embedding", // Text/data → vectors
  Vision = "vision", // Text + image inputs
  Audio = "audio", // Speech-to-text, text-to-speech
  ImageGeneration = "image_generation", // Text → image
}

export enum LLMTask {
  FunctionCall = "function_call", // Extract structured data (Zod, tool calling)
  ToolUse = "tool_use", // Agent uses external tools
  CodeGen = "code_generation", // Generate source code
  SQLGen = "sql_generation", // SQL, SOQL, etc.
  RAG = "retrieval_augmented_gen", // RAG-style response
  MetadataSearch = "metadata_search", // Structured filtering
  Translation = "translation", // Language translation
  Summarization = "summarization", // Text summarization
  Classification = "classification", // Text classification
  SentimentAnalysis = "sentiment", // Sentiment analysis
}
export enum ChatMessageRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Function = "function",
}

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  capabilities: LLMModelCapability[];
  tasks?: LLMTask[];
  cost?: {
    inputToken: number; // per 1K tokens
    outputToken: number; // per 1K tokens
  };
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsFunctionCalling?: boolean;
}

export interface LLMModelConfig {
  modelName?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
  stopSequences?: string[];
  functionCall?: "auto" | "none" | { name: string };
  stream?: boolean;
  providerExtras?: Record<string, any>;
}

// LLM Request and Response Interfaces ///

export interface LLMRequest<TArgs = any> {
  prompt?: string;
  args?: TArgs;
  config?: LLMModelConfig;
  model?: LLMModel; // optional, fallback to config.modelName
  // Service-level model selection
  priority?: LLMModel[];
  criteria?: ModelSelectionCriteria;
}

export interface LLMGenerateStructuredOutputRequest extends LLMRequest {
  schema: z.ZodTypeAny;
}

export interface LLMGenerateStructuredOutputWithExamplesRequest<T> extends LLMGenerateStructuredOutputRequest {
  examples?: Array<{ input: string; output: T }>;
}

export interface LLMEmbeddingRequest extends LLMRequest {
  input: string | object | (string | object)[];
}

export interface LLMEmbeddingResponse {
  embeddings: number[][];
}

// === Final Interface ===
export interface ILLMClient {
  /**
   * Generates a free-form or chat-based response.
   */
  generateText?<T = any>(req: LLMRequest<T>): Promise<T>;

  /**
   * Extracts structured data from a prompt using schema validation.
   */
  generateStructuredOutput<T>(req: LLMGenerateStructuredOutputRequest): Promise<T>;

  /**
   * Converts input(s) into embedding vectors.
   */
  embed(req: LLMEmbeddingRequest): Promise<LLMEmbeddingResponse>;
}

export interface ModelSelectionCriteria {
  capability: LLMModelCapability;
  task?: LLMTask;
  requiresVision?: boolean;
  requiresFunctionCalling?: boolean;
  maxBudget?: number;
  preferredProvider?: LLMProvider;
  minContextWindow?: number;
}

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
  Chat = "chat", // Conversational, multi-turn
  Completion = "completion", // Single-turn prompt → text
  Embedding = "embedding", // Converts text/data into vectors
  Vision = "vision", // Text + image multimodal inputs
}

export enum LLMTask {
  FunctionCall = "function_call", // Extract structured data (Zod, tool calling)
  ToolUse = "tool_use", // Agent uses external tools
  CodeGen = "code_generation", // Generate source code
  SQLGen = "sql_generation", // SQL, SOQL, etc.
  RAG = "retrieval_augmented_gen", // RAG-style response
  MetadataSearch = "metadata_search", // Structured filtering
}

export enum ChatMessageRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Function = "function",
}

// OpenAI interfaces //

export enum OpenAIChatModels {
  GPT_4O = "gpt-4o",
  GPT_4 = "gpt-4",
  GPT_4_TURBO = "gpt-4-turbo",
  GPT_35 = "gpt-3.5-turbo",
  GPT_35_1106 = "gpt-3.5-turbo-1106",
}

export enum OpenAIEmbeddingModels {
  SMALL = "text-embedding-3-small",
  LARGE = "text-embedding-3-large",
  ADA = "text-embedding-ada-002",
}

// === Static Model Info (for registry or system-wide metadata) ===
export interface LLMModel {
  id: string; // UUID, slug, or config key
  provider: LLMProvider;
  capability: LLMModelCapability;
  tasks?: LLMTask[];
  cost?: {
    inputToken: number;
    outputToken: number;
  };
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

export interface LLMRequest<TArgs = any> {
  prompt?: string;
  messages?: ChatMessage[]; // for chat-based models
  args?: TArgs;
  config?: LLMModelConfig;
  tools?: string[];
  model?: LLMModel; // optional, fallback to config.modelName
}

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  name?: string; // e.g., function/tool name
  tool_call_id?: string;
}

export interface LLMResponse<T = any> {
  output: string;
  raw?: any; // full API payload
  parsed?: T;
}

// === Final Interface ===
export interface ILLMClient {
  /**
   * Generates a free-form or chat-based response.
   */
  generateText?<T = any>(req: LLMRequest<T>): Promise<LLMResponse<T>>;

  /**
   * Extracts structured data from a prompt using schema validation.
   */
  generateStructuredOutput?<T>(req: GenerateStructuredOutputReq<T>): Promise<T>;

  /**
   * Converts input(s) into embedding vectors.
   */
  embed(input: string | object | (string | object)[]): Promise<number[][]>; // batched
}

export interface GenerateStructuredOutputReq<T> {
  prompt: string;
  schema: z.ZodType<T>;
  config?: LLMModelConfig;
}

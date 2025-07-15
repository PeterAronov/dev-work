import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";
import { convertToPlainText } from "../../../utils/convert.user.to.plain.text";
import {
  ILLMClient,
  LLMEmbeddingRequest,
  LLMEmbeddingResponse,
  LLMGenerateStructuredOutputRequest,
  LLMGenerateStructuredOutputWithExamplesRequest,
  LLMModelConfig,
  LLMRequest,
} from "../../llm.interface";
import { OpenAIChatModels, OpenAIEmbeddingModels } from "./openai.interface";

export default class OpenAIClient implements ILLMClient {
  constructor(private readonly defaultConfig?: LLMModelConfig) {}

  private makeChatModel(config?: LLMModelConfig): ChatOpenAI {
    return new ChatOpenAI({
      modelName: config?.modelName ?? this.defaultConfig?.modelName ?? OpenAIChatModels.GPT_4O,
      temperature: config?.temperature ?? this.defaultConfig?.temperature ?? 0,
      openAIApiKey: process.env.OPEN_AI_API_KEY!,
    });
  }

  private makeEmbeddingModel(config?: LLMModelConfig): OpenAIEmbeddings {
    return new OpenAIEmbeddings({
      modelName: config?.modelName ?? this.defaultConfig?.modelName ?? OpenAIEmbeddingModels.SMALL,
      openAIApiKey: process.env.OPEN_AI_API_KEY!,
    });
  }

  async generateText<T = any>(req: LLMRequest): Promise<string> {
    const { prompt, config } = req;

    if (!prompt) {
      throw new Error("Prompt is required for text generation");
    }

    const model = this.makeChatModel(config);
    const result = await model.invoke(prompt);

    return result.content as string;
  }

  async generateStructuredOutput<T>(req: LLMGenerateStructuredOutputRequest): Promise<T> {
    const { prompt, schema, config } = req;

    // Create the prompt template following the reference pattern
    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an expert extraction algorithm.
Only extract relevant information from the text.
If you do not know the value of an attribute asked to extract,
return null for the attribute's value.`,
      ],
      ["human", "{text}"],
    ]);

    const model = this.makeChatModel(config);
    const structuredLLM = model.withStructuredOutput(schema as any);

    const formattedPrompt = await promptTemplate.invoke({
      text: prompt,
    });

    const result = await structuredLLM.invoke(formattedPrompt);

    return result as T;
  }

  async generateStructuredOutputWithExamples<T>(req: LLMGenerateStructuredOutputWithExamplesRequest<T>): Promise<T> {
    const { prompt, schema, config, examples = [] } = req;

    const messages: Array<[string, string]> = [
      [
        "system",
        `You are an expert extraction algorithm. I will provide you with reference examples to guide your extraction.
Learn from these examples to understand the expected extraction patterns and quality.
Only extract relevant information from the text.
If you do not know the value of an attribute asked to extract, return null for the attribute's value.
Follow the patterns demonstrated in the examples below.`,
      ],
    ];

    if (examples && examples.length > 0) {
      examples.forEach((example) => {
        messages.push(["human", example.input]);
        messages.push(["assistant", convertToPlainText(example.output)]);
      });
    }

    messages.push(["human", "{text}"]);

    const promptTemplate = ChatPromptTemplate.fromMessages(messages);

    const model = this.makeChatModel(config);
    const structuredLLM = model.withStructuredOutput(schema as any);

    const formattedPrompt = await promptTemplate.invoke({
      text: prompt,
    });

    const result = await structuredLLM.invoke(formattedPrompt);

    return result as T;
  }

  async embed(req: LLMEmbeddingRequest): Promise<LLMEmbeddingResponse> {
    const { input } = req;

    const texts = Array.isArray(input) ? input : [input];
    const stringified = texts.map((t) => (typeof t === "string" ? t : JSON.stringify(t)));

    const model = this.makeEmbeddingModel();
    const embeddings: number[][] = await model.embedDocuments(stringified);
    return { embeddings };
  }
}

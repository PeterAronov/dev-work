import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import {
  ChatMessage,
  GenerateStructuredOutputReq,
  ILLMClient,
  LLMModelConfig,
  OpenAIChatModels,
  OpenAIEmbeddingModels,
} from "../llm.interface";

export class OpenAIClient implements ILLMClient {
  constructor(private readonly config: LLMModelConfig) {}

  private makeChatModel(config: LLMModelConfig): ChatOpenAI {
    return new ChatOpenAI({
      modelName: config?.modelName ?? OpenAIChatModels.GPT_4O,
      temperature: config?.temperature ?? 0,
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });
  }

  private makeEmbeddingModel(): OpenAIEmbeddings {
    return new OpenAIEmbeddings({
      modelName: this.config.modelName ?? OpenAIEmbeddingModels.TEXT_EMBEDDING_ADA_002,
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async generateStructuredOutput<T>(req: GenerateStructuredOutputReq<T>): Promise<T> {
    const { prompt, schema, config } = req;
    const parser = StructuredOutputParser.fromZodSchema(schema);

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "Extract structured data from the user input."],
      ["user", "{input}"],
      ["system", `Format the output to match this JSON schema:\n${parser.getFormatInstructions()}`],
    ]);

    const formattedMessages = await promptTemplate.formatMessages({ input: prompt });

    const model = this.makeChatModel(config);
    const response = await model.invoke(formattedMessages);

    return await parser.parse(response.content);
  }

  async embed(input: string | object | (string | object)[]): Promise<number[][]> {
    const texts = Array.isArray(input) ? input : [input];
    const stringified = texts.map((t) => (typeof t === "string" ? t : JSON.stringify(t)));
    const model = this.makeEmbeddingModel();
    return model.embedDocuments(stringified);
  }
}

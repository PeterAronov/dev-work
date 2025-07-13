import { OpenAIClient } from "../../llm/clients/openai.client";
import { ILLMClient, OpenAIChatModels } from "../../llm/llm.interface";
import { IUser, IUserService } from "./user.interface";
import { User, UserSchema } from "./user.schema";

export class UserService implements IUserService {
  private users: IUser[] = []; // In-memory storage for demo

  async extractUserFromText(text: string): Promise<IUser> {
    try {
      console.log("Extracting user data from text...");

      const llmClient: ILLMClient = new OpenAIClient();

      const extractedUser = await llmClient.generateStructuredOutput<User>({
        prompt: text,
        schema: UserSchema,
        config: {
          temperature: 0,
          modelName: OpenAIChatModels.GPT_4O,
        },
      });

      // Add timestamps
      const userWithTimestamps: IUser = {
        ...extractedUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Successfully extracted user data:", userWithTimestamps);
      return userWithTimestamps;
    } catch (error: any) {
      console.error("Error extracting user data:", error?.message || error);
      throw new Error(`Failed to extract user data: ${error?.message}`);
    }
  }

  async extractUserFromTextWithExamples(
    text: string,
    examples?: Array<{ input: string; output: User }>
  ): Promise<IUser> {
    try {
      console.log("Extracting user data with examples...");

      // Initialize client for this operation
      const llmClient = new OpenAIClient();

      const extractedUser = await llmClient.generateStructuredOutputWithExamples<User>({
        prompt: text,
        schema: UserSchema,
        examples,
        config: {
          temperature: 0,
          modelName: OpenAIChatModels.GPT_4O,
        },
      });

      const userWithTimestamps: IUser = {
        ...extractedUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Successfully extracted user data with examples:", userWithTimestamps);
      return userWithTimestamps;
    } catch (error: any) {
      console.error("Error extracting user data with examples:", error?.message || error);
      throw new Error(`Failed to extract user data with examples: ${error?.message}`);
    }
  }

  async saveUser(user: IUser): Promise<IUser> {
    const newUser: IUser = {
      ...user,
      id: this.users.length + 1,
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    console.log(`User saved with ID: ${newUser.id}`);
    return newUser;
  }

  async getUserById(id: number): Promise<IUser | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async getAllUsers(): Promise<IUser[]> {
    return [...this.users];
  }
}

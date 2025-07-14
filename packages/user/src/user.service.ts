import { v4 as uuidv4 } from "uuid";
import { LLMService } from "../../llm";
import { ModelRegistry } from "../../llm/model.registry";
import { IUser, IUserService } from "./user.interface";
import { User, UserSchema } from "./user.schema";

export class UserService implements IUserService {
  private users: IUser[] = []; // In-memory storage for demo

  /**
   * Extract user data from plain text - simplified interface
   */
  private async extractUserFromPlainTextLLM(plainText: string): Promise<IUser> {
    const instructions = `
You are an expert data extraction agent specialized in extracting user information from various text formats.

Your task is to:
1. Carefully analyze the provided text
2. Extract relevant user information according to the provided schema
3. Return structured data that matches the schema exactly
4. If a field cannot be determined from the text, set it to null
5. Be precise and conservative - only extract information that is clearly stated

The text may contain:
- Personal information (name, email, location)
- Professional details (job title, company, experience)
- Skills and technologies
- Additional notes or context

Extract all relevant information and structure it according to the provided schema.

Text to analyze:
${plainText}
    `;

    try {
      const extractedUser = await LLMService.generateStructuredOutput<User>({
        prompt: instructions,
        schema: UserSchema,
        priority: [ModelRegistry.Gpt4O, ModelRegistry.Gpt4],
        config: {
          temperature: 0,
          maxTokens: 2000,
        },
      });

      // Convert extracted user to IUser with metadata
      const user: IUser = {
        ...extractedUser,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return user;
    } catch (error) {
      console.error("Error in extractUserFromPlainTextLLM:", error);
      throw new Error(`Failed to extract user data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async extractUserFromPlainText(text: string): Promise<IUser> {
    try {
      console.log("Extracting user data from text...");

      const user = await this.extractUserFromPlainTextLLM(text);

      console.log("Successfully extracted user data:", user);
      return user;
    } catch (error: any) {
      console.error("Error extracting user data:", error?.message || error);
      throw new Error(`Failed to extract user data: ${error?.message}`);
    }
  }


  

  private async createUserEmbeddingLLM(user: IUser): Promise<number[]> {
    try {
      // Create a comprehensive text representation of the user
      const userText: string = this.userToSearchableText(user);

      console.log(`Creating embedding for user: ${user.name}`);

      const embeddingResponse = await LLMService.executeEmbedding({
        input: userText,
        priority: [ModelRegistry.OpenAIEmbeddingLarge], // Using the Large model as requested
        config: {
          // No additional config needed for embeddings
        },
      });

      // Return the first (and only) embedding vector
      return embeddingResponse.embeddings[0];
    } catch (error) {
      console.error("Error creating user embedding:", error);
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async saveUser(user: IUser): Promise<IUser> {
    const newUser: IUser = {
      ...user,
      id: user.id || uuidv4(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    console.log(`User saved with ID: ${newUser.id}`);

    // Create embedding for the user after saving using OpenAIEmbeddingLarge
    try {
      const embedding = await this.createUserEmbeddingLLM(newUser);
      console.log(`Created embedding for user ${newUser.id} using OpenAI Large model`);
      console.log(`Vector dimension: ${embedding.length}`);
      console.log(
        `Embedding preview: [${embedding
          .slice(0, 5)
          .map((n) => n.toFixed(4))
          .join(", ")}...]`
      );

      // Here you could store the embedding in a vector database
      // For now, we're just logging it
      // Example: await this.vectorDB.store(newUser.id, embedding);
    } catch (error) {
      console.warn(`Failed to create embedding for user ${newUser.id}:`, error);
      // Don't fail the save operation if embedding fails
    }

    return newUser;
  }

  async saveUsers(users: IUser[]): Promise<IUser[]> {
    const savedUsers: IUser[] = [];
    for (const user of users) {
      const savedUser = await this.saveUser(user);
      savedUsers.push(savedUser);
    }
    return savedUsers;
  }

  async getUserById(id: string): Promise<IUser | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async getAllUsers(): Promise<IUser[]> {
    return [...this.users];
  }

  private userToSearchableText(user: IUser): string {
    const parts: string[] = [];

    if (user.description) parts.push(`Description: ${user.description}`);
    if (user.id) parts.push(`ID: ${user.id}`);
    if (user.name) parts.push(`Name: ${user.name}`);
    if (user.email) parts.push(`Email: ${user.email}`);
    if (user.role) parts.push(`Role: ${user.role}`);
    if (user.location) parts.push(`Location: ${user.location}`);
    if (user.skills?.length) parts.push(`Skills: ${user.skills.join(", ")}`);
    if (user.previousCompanies?.length) parts.push(`Previous Companies: ${user.previousCompanies.join(", ")}`);
    if (user.interests?.length) parts.push(`Interests: ${user.interests.join(", ")}`);
    if (user.experience) parts.push(`Experience: ${user.experience}`);

    return parts.join("\n");
  }
}

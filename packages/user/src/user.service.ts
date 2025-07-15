import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";
import { LLMService } from "../../llm";
import { ModelRegistry } from "../../llm/model.registry";
import {
  AddDocumentsRequest,
  SimilaritySearchResponse,
  VectorStoreProvider,
  VectorStoreService,
} from "../../vector-store";
import { IUser, IUserService } from "./user.interface";
import { User, UserSchema } from "./user.schema";

export class UserService implements IUserService {
  private users: IUser[] = []; // In-memory storage for demo

  /**
   * Generate final answer from user search results using LLM
   */
  async getUsersFinalAnswerLLM(query: string, documents: SimilaritySearchResponse): Promise<string> {
    try {
      console.log(`UserService | Generating final answer for query: "${query}"`);
      console.log(`Processing ${documents.results.length} user profiles...`);

      if (!documents || documents.results.length === 0) {
        return "I couldn't find any relevant users matching your query. Please try a different search term or check if users have been added to the system.";
      }

      const userProfiles = documents.results
        .map((doc, index) => {
          const relevanceScore = Math.round((1 - doc.score) * 100);
          return `--- User Profile ${index + 1} (Similarity Score: ${relevanceScore}%) ---\n${doc.text}\n`;
        })
        .join("\n");

      console.log("UserService | User profiles prepared for LLM processing:\n", JSON.stringify(userProfiles, null, 2));

      const prompt = `
You are an intelligent search assistant for a user profile database. A user has searched for: "${query}"

I found ${documents.results} user profile(s) using vector similarity search:

${userProfiles}

IMPORTANT: The similarity scores are based on vector embeddings and may not always reflect true relevance. Please carefully analyze each user profile to determine if they actually match the query requirements.

Instructions:
1. Carefully examine each user profile to verify if they truly match the query requirements
2. Identify which users (if any) best match the query requirements  
3. Provide specific details about the matching users (names, locations, skills, experience, etc.)
4. If multiple users match, present them in order of actual relevance (not just similarity score)
5. If no users truly match the query, clearly state this and suggest alternative search terms
6. Keep the response natural, conversational, and helpful

Your response:`;

      console.log("UserSSending user profiles to LLM for final answer generation...");

      const finalAnswer = await LLMService.generateText({
        prompt,
        priority: [ModelRegistry.Gpt4O, ModelRegistry.Gpt4],
        config: {
          temperature: 0.3,
          maxTokens: 1000,
        },
      });

      console.log("UserService | Final answer generated successfully");
      return finalAnswer;
    } catch (error: any) {
      console.error("Error in getUsersFinalAnswerLLM:", error?.message || error);
      throw new Error(`Failed to generate final answer: ${error?.message}`);
    }
  }

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
4. If a field **cannot be confidently determined**, DO NOT include it in the output
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
      const extractedUser: IUser = await LLMService.generateStructuredOutput<User>({
        prompt: instructions,
        schema: UserSchema,
        priority: [ModelRegistry.Gpt4O, ModelRegistry.Gpt4],
        config: {
          temperature: 0,
          maxTokens: 2000,
        },
      });

      return extractedUser;
    } catch (error: any) {
      console.error(`UserService | Failed to extract user data:`, error?.message);
      throw new Error(`Failed to extract user data: ${error?.message}`);
    }
  }

  async extractUserFromPlainText(text: string): Promise<IUser> {
    try {
      console.log("UserService | Extracting user data from text:\n\n", text);

      const user = await this.extractUserFromPlainTextLLM(text);

      console.log("UserService | Successfully extracted user data:\n", user);
      return user;
    } catch (error: any) {
      console.error("Error extracting user data:", error?.message || error);
      throw new Error(`Failed to extract user data: ${error?.message}`);
    }
  }

  private async createUserEmbeddingLLM(user: IUser): Promise<number[]> {
    try {
      const userText: string = this.userToSearchableText(user);

      console.log(`Creating embedding for user: ${user.name}`);

      const embeddingResponse = await LLMService.executeEmbedding({
        input: userText,
        priority: [ModelRegistry.OpenAIEmbeddingLarge],
        config: {
          // No additional config needed for embeddings
        },
      });

      return embeddingResponse.embeddings[0];
    } catch (error: any) {
      console.error("Error creating user embedding:", error?.message);
      throw new Error(`Failed to create embedding: ${error?.message}`);
    }
  }

  async saveUser(user: IUser): Promise<IUser | null> {
    try {
      if (isInvalidField(user.name) || isInvalidField(user.role) || isInvalidField(user.location)) {
        console.warn("UserService | Incomplete user data, cannot save:", JSON.stringify(user, null, 2));
        return null;
      }

      const newUser: IUser = {
        ...user,
        uuid: user.uuid || uuidv4(),
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date(),
      };

      console.log(`UserService | Saving user ${newUser.name}(${newUser.id}) via VectorStoreService...`);

      const userDocument: Document = this.userToDocument(newUser);

      const addDocumentsRequest: AddDocumentsRequest = {
        provider: VectorStoreProvider.InMemory,
        documents: [userDocument],
      };

      await VectorStoreService.addDocuments(addDocumentsRequest);

      this.users.push(newUser);

      console.log(`UserService | Successfully saved user ${newUser.name}(${newUser.id})`);

      return newUser;
    } catch (error: any) {
      console.error(`UserService | Failed to save user:`, error?.message);
      throw new Error(`Failed to save user via VectorStore: ${error?.message}`);
    }
  }

  async saveUsers(users: IUser[]): Promise<IUser[]> {
    const results = await Promise.all(users.map((user) => this.saveUser(user)));
    return results.filter((user): user is IUser => user !== null);
  }

  async getUserById(id: string): Promise<IUser | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async getAllUsers(): Promise<IUser[]> {
    return [...this.users];
  }

  // API's methods for VectorStoreService upserting  users

  private userToSearchableText(user: IUser): string {
    const parts: string[] = [];

    if (user.description) parts.push(`Description: ${user.description}`);
    if (user.id) parts.push(`user ${user.id}`);
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

  private userToDocument(user: IUser): Document {
    const pageContent = this.userToSearchableText(user);

    const metadata = {
      uuid: user.uuid || uuidv4(),
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      skills: user.skills,
      previousCompanies: user.previousCompanies,
      interests: user.interests,
      experience: user.experience,
    };

    return {
      pageContent,
      metadata,
    };
  }
}

function isInvalidField(value: any): boolean {
  return (
    value === null || value === undefined || value === "null" || (typeof value === "string" && value.trim() === "")
  );
}

//todo: tbd
// peter add singelton instance

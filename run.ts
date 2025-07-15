import dotenv from "dotenv";
dotenv.config();

import { CSVUserParserService, JSONUserParserService, PlainTextParserService } from "./packages/paresrs";
import { IUser } from "./packages/user/src/user.interface";
import { UserService } from "./packages/user/src/user.service";
import { saveToJsonFile } from "./packages/utils/save.to.file";
import { MemoryVector, VectorStoreService } from "./packages/vector-store";
import { SalesforceService } from "./salesforce/src/salesforce.service";

console.log("Running Salesforce Service...");
console.log(`OPEN_AI_API_KEY: ${JSON.stringify(process.env.OPEN_AI_API_KEY, null, 2)}`);

const salesforceService = new SalesforceService();
const userService = new UserService();

const allUsers = async () => {
  try {
    const { users } = await salesforceService.getAllUsers();
    saveToJsonFile("allUsers", users);
    console.log("All Users:", users);
  } catch (error: any) {
    console.error("Error fetching accounts:", error?.message || error);
  }
};
const getUserById = async (id: number) => {
  try {
    const user = await salesforceService.getUserById({ id });
    saveToJsonFile(`user.${id}.json`, user);
    console.log(`User with ID ${id}:`, user);
  } catch (error: any) {
    console.error(`Error fetching user with ID ${id}:`, error?.message || error);
  }
};

/************ LLM User Extraction *************/

const extractFromPlainTextAndSaveUser = async (text: string, filename?: string) => {
  try {
    const extractedUser: IUser = await userService.extractUserFromPlainText(text);
    extractedUser.description = text;

    const savedUser: IUser | null = await userService.saveUser(extractedUser);

    if (!savedUser) {
      return;
    }

    if (filename) {
      saveToJsonFile(filename, savedUser);
      console.log(`Saved user to ${filename}`);
    }

    return savedUser;
  } catch (error: any) {
    console.error("Error in extractFromPlainTextAndSaveUser:", error?.message || error);
    throw error;
  }
};

const runAll = async () => {
  /*
  console.log("=== Starting Salesforce Operations ===");

  await allUsers();
  await getUserById(2);
  await getUserById(3);
*/
  console.log("\n=== Starting LLM User Extraction ===");

  // Basic extraction

  const textFiles = await PlainTextParserService.readTextFiles("static-data/users/plain-text");

  for (const file of textFiles) {
    console.log(`\n--- Processing: ${file.filename} ---`);
    console.log("File content:", file.content);
    await extractFromPlainTextAndSaveUser(file.content, file.filename);
  }

  /// JSON User Extraction

  console.log("\n=== Starting JSON User Extraction ===");

  const jsonUsers: IUser[] = await JSONUserParserService.parseJSONFiles("static-data/users/json");
  console.log(`Parsed ${jsonUsers.length} JSON users from static-data/users/json`);
  for (const user of jsonUsers) {
    saveToJsonFile(`json-user-${user.id}`, user);
    console.log(`\n--- Processing JSON User: ${user.name} ---`);
    console.log("User data:", JSON.stringify(user, null, 2));
  }
  await userService.saveUsers(jsonUsers);

  // CSV User Extraction

  console.log("\n=== Starting CSV User Extraction ===");
  const csvUsers: IUser[] = await CSVUserParserService.parseCSVFiles("static-data/users/csv");
  console.log(`Parsed ${csvUsers.length} CSV users from static-data/users/csv`);
  for (const user of csvUsers) {
    saveToJsonFile(`csv-user-${user.name}`, user);
    console.log(`\n--- Processing CSV User: ${user.name} ---`);
    console.log("User data:", JSON.stringify(user, null, 2));
  }
  await userService.saveUsers(csvUsers);

  // Show all users in memory
  console.log("\n=== All Users in UserService ===");

  const getAllMemoryVectors: MemoryVector[] = await VectorStoreService.getAllMemoryVectors();
  saveToJsonFile("vector-store-memory-vectors", getAllMemoryVectors);

  const allUsers: IUser[] = await userService.getAllUsers();
  saveToJsonFile("all-extracted-users", allUsers);
};

runAll()
  .then(() => {
    console.log("\n🎉 All operations completed successfully!");
  })
  .catch((error) => {
    console.error("Error in runAll:", error);
  });

console.log("Hello from TypeScript!!");

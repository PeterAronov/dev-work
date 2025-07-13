import dotenv from "dotenv";
dotenv.config();

import { UserService } from "./packages/user/src/user.service";
import { saveToJsonFile } from "./packages/utils/save.to.file";
import { SalesforceService } from "./salesforce/src/salesforce.service";

console.log("Running Salesforce Service...");
console.log(`OPEN_AI_API_KEY: ${JSON.stringify(process.env.OPEN_AI_API_KEY, null, 2)}`);

const salesforceService = new SalesforceService();
const userService = new UserService();

const allUsers = async () => {
  try {
    const { users } = await salesforceService.getAllUsers();
    saveToJsonFile("allUsers.json", users);
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

// Enhanced function using UserService
const extractAndSaveUser = async (text: string, filename?: string) => {
  try {
    // Extract user from text using LLM
    const extractedUser = await userService.extractUserFromText(text);

    // Save to user service (in-memory for demo)
    const savedUser = await userService.saveUser(extractedUser);

    // Save to file
    if (filename) {
      saveToJsonFile(filename, savedUser);
      console.log(`Saved user to ${filename}`);
    }

    return savedUser;
  } catch (error: any) {
    console.error("Error in extractAndSaveUser:", error?.message || error);
    throw error;
  }
};

// Demonstrate few-shot learning
const extractUserWithExamples = async (text: string, filename?: string) => {
  try {
    // Define examples for better extraction
    const examples = [
      {
        input:
          "Alice Johnson (alice.j@tech.com) is a data scientist from New York. She works with Python, machine learning, and has worked at Netflix.",
        output: {
          id: null,
          name: "Alice Johnson",
          email: "alice.j@tech.com",
          role: "data scientist",
          location: "New York",
          skills: ["Python", "machine learning"],
          previousCompanies: ["Netflix"],
          interests: null,
          experience: null,
        },
      },
      {
        input: "The weather is nice today with sunny skies.",
        output: {
          id: null,
          name: null,
          email: null,
          role: null,
          location: null,
          skills: null,
          previousCompanies: null,
          interests: null,
          experience: null,
        },
      },
    ];

    const extractedUser = await userService.extractUserFromTextWithExamples(text, examples);
    const savedUser = await userService.saveUser(extractedUser);

    if (filename) {
      saveToJsonFile(filename, savedUser);
      console.log(`Saved user with examples to ${filename}`);
    }

    return savedUser;
  } catch (error: any) {
    console.error("Error in extractUserWithExamples:", error?.message || error);
    throw error;
  }
};

// Example texts
const exampleTexts = [
  {
    text: `John Doe (john.doe@tech.com) is a backend engineer based in Berlin. He has experience
    with Kubernetes, Python, and cloud infrastructure. Formerly worked
    at Google and loves open-source.`,
    filename: "extracted-user-john-doe.json",
  },
  {
    text: `Sarah Smith (sarah@frontend.dev) is a frontend developer from San Francisco. 
    She specializes in React, TypeScript, and UI/UX design. 
    Previously worked at Meta and Airbnb. She's passionate about accessibility and performance optimization.`,
    filename: "extracted-user-sarah-smith.json",
  },
  {
    text: `The sun is shining and it's a beautiful day for a walk in the park.`,
    filename: "extracted-no-user-info.json",
  },
];

// Main execution function
const runAll = async () => {
  console.log("=== Starting Salesforce Operations ===");
  await allUsers();
  await getUserById(2);
  await getUserById(3);

  console.log("\n=== Starting LLM User Extraction ===");

  // Basic extraction
  for (const { text, filename } of exampleTexts) {
    console.log(`\n--- Processing: ${filename} ---`);
    await extractAndSaveUser(text, filename);
  }

  // Demonstrate few-shot learning
  console.log("\n=== Demonstrating Few-Shot Learning ===");
  await extractUserWithExamples(
    "Mike Wilson (m.wilson@devops.io) is a DevOps engineer in Austin. He knows Docker, AWS, and Jenkins. Used to work at Microsoft.",
    "extracted-user-with-examples.json"
  );

  // Show all users in memory
  console.log("\n=== All Users in UserService ===");
  const allUsersInService = await userService.getAllUsers();
  console.log("Users in service:", JSON.stringify(allUsersInService, null, 2));
  saveToJsonFile("all-extracted-users.json", allUsersInService);
};

runAll()
  .then(() => {
    console.log("\n🎉 All operations completed successfully!");
  })
  .catch((error) => {
    console.error("❌ Error in runAll:", error);
  });

console.log("Hello from TypeScript!!");

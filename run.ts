import dotenv from "dotenv";
dotenv.config();

// Let's import the service and run getAccounts and print it to the console

console.log("Running Salesforce Service...");
console.log(`OPEN_AI_API_KEY: ${JSON.stringify(process.env.OPEN_AI_API_KEY, null, 2)}`);

import { saveToJsonFile } from "./packages/utils/save.to.file";
import { SalesforceService } from "./salesforce/src/salesforce.service";

const salesforceService = new SalesforceService();

const allUsers = async () => {
  try {
    const { users } = await salesforceService.getAllUsers();
    saveToJsonFile("allUsers.json", users);
    console.log("All Users:", users);
  } catch (error: any) {
    console.error("Error fetching accounts:", error?.message || error);
  }
};

// now let's bring user with id 1 and save it to a file called user.1.json

const getUserById = async (id: number) => {
  try {
    const user = await salesforceService.getUserById({ id });
    saveToJsonFile(`user.${id}.json`, user);
    console.log(`User with ID ${id}:`, user);
  } catch (error: any) {
    console.error(`Error fetching user with ID ${id}:`, error?.message || error);
  }
};

allUsers();
getUserById(2);
getUserById(3);

console.log("Hello from TypeScript!!");

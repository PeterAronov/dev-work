// Let's import the service and run getAccounts and print it to the console
import { saveToJsonFile } from "../packages/utils/save.to.file";
import { SalesforceService } from "./src/salesforce.service";

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
getUserById(4);
getUserById(5);

console.log("Hello from TypeScript!!");

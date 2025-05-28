import axios from "axios";
import {
  ISalesforceClient,
  getAllUsersResponse,
  getUserByIdRequest,
  getUserByIdResponse,
} from "./salesforce.interface";

/*
To keep my service loosely coupled, I abstract the HTTP logic behind an interface. 
This lets me inject either the real implementation or a test stub — 
which keeps the system scalable, mockable, and decoupled from any specific transport logic.
*/

export class SalesforceClient implements ISalesforceClient {
  private baseUrl: string;

  constructor(baseUrl = "https://jsonplaceholder.typicode.com") {
    this.baseUrl = baseUrl;
  }

  // This is a mock API, so we are using jsonplaceholder.typicode.com
  // to simulate the Salesforce API. In a real-world scenario, you would
  // replace this with the actual Salesforce API URL.
  getAllUsers = async (): Promise<getAllUsersResponse> => {
    const response = await axios.get(`${this.baseUrl}/users`);
    return { users: response.data };
  };

  getUserById = async (req: getUserByIdRequest): Promise<getUserByIdResponse> => {
    const { id } = req;

    const response = await axios.get(`${this.baseUrl}/users/${id}`);
    return { user: response.data };
  };
}

/* 
✅ Export a singleton instance
✅ Why Your Singleton Is Safe
You only use the singleton to hold shared configuration (like baseUrl, interceptors, axios instance).
The class doesn’t store or mutate state — it just acts like a utility.

Plus, you're doing this:

constructor(private client = salesforceClient)
This is dependency injection: you can override it in tests or use other clients in the future.

That means your service is still:
✅ Modular
✅ Testable
✅ Easy to swap with mocks or stubs
*/
export const salesforceClient = new SalesforceClient();

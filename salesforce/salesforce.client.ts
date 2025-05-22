import axios from "axios";

class SalesforceClient {
  private baseUrl: string;

  constructor(baseUrl = "https://jsonplaceholder.typicode.com") {
    this.baseUrl = baseUrl;
  }

  // This is a mock API, so we are using jsonplaceholder.typicode.com
  // to simulate the Salesforce API. In a real-world scenario, you would
  // replace this with the actual Salesforce API URL.
  getUsers = async () => {
    const response = await axios.get(`${this.baseUrl}/users`);
    return response.data;
  };

  getUserById = async (id: number) => {
    const response = await axios.get(`${this.baseUrl}/users/${id}`);
    return response.data;
  };
}

// ✅ Export a singleton instance
export const salesforceClient = new SalesforceClient();

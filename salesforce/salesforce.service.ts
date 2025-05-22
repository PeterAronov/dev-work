import { salesforceClient } from "./salesforce.client";

export class SalesforceService {
  constructor(private client = salesforceClient) {}

  getAccounts = async () => {
    return await this.client.getUsers();
  };

  getAccountById = async (id: number) => {
    return await this.client.getUserById(id);
  };
}

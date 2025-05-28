import { salesforceClient } from "./salesforce.client";
import {
  ISalesforceClient,
  getAllUsersResponse,
  getUserByIdRequest,
  getUserByIdResponse,
} from "./salesforce.interface";

export class SalesforceService {
  private client: ISalesforceClient;

  constructor(client: ISalesforceClient = salesforceClient) {
    this.client = client;
  }

  getAllUsers = async (): Promise<getAllUsersResponse> => {
    return await this.client.getAllUsers();
  };

  getUserById = async (req: getUserByIdRequest): Promise<getUserByIdResponse> => {
    return await this.client.getUserById(req);
  };
}

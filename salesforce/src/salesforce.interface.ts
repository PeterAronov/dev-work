export interface ISalesforceClient {
  getAllUsers(): Promise<getAllUsersResponse>;
  getUserById(req: getUserByIdRequest): Promise<getUserByIdResponse>;
}

export interface getAllUsersResponse {
  users: any[];
}
export interface getUserByIdRequest {
  id: number;
}

export interface getUserByIdResponse {
  user: any;
}

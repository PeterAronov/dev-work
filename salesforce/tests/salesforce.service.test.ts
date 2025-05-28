import { ISalesforceClient } from "../src/salesforce.interface";
import { SalesforceService } from "../src/salesforce.service";

describe("SalesforceService", () => {
  const mockClient: ISalesforceClient = {
    getAllUsers: jest.fn().mockResolvedValue([{ id: 1, name: "Test User" }]),
    getUserById: jest.fn().mockResolvedValue({ id: 1, name: "Test User" }),
  };

  const service = new SalesforceService(mockClient);

  it("should return list of users", async () => {
    const result = await service.getAllUsers();
    expect(result).toEqual([{ id: 1, name: "Test User" }]);
    expect(mockClient.getAllUsers).toHaveBeenCalled();
  });

  it("should return user by ID", async () => {
    const result = await service.getUserById({ id: 1 });
    expect(result).toEqual({ id: 1, name: "Test User" });
    expect(mockClient.getUserById).toHaveBeenCalledWith(1);
  });
});

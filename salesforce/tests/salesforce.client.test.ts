import { SalesforceClient } from "../src/salesforce.client";

describe("SalesforceClient", () => {
  const client = new SalesforceClient();

  it("should fetch all users", async () => {
    const users = await client.getAllUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it("should fetch user by ID", async () => {
    const user = await client.getUserById({ id: 1 });
    expect(user).toHaveProperty("id", 1);
  });
});

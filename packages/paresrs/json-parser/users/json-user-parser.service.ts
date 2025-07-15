import fs from "fs/promises";
import path from "path";
import { IUser } from "../../../user/src/user.interface";
import { JSONUserData } from "./json-user-parser.interface";

export class JSONUserParserService {
  static parseJSONContent(jsonContent: string): JSONUserData {
    return JSON.parse(jsonContent);
  }

  static convertToIUser(jsonUser: JSONUserData): IUser {
    return {
      id: jsonUser.user_id,
      name: jsonUser.full_name || null,
      email: null,
      role: jsonUser.job_title || null,
      location: jsonUser.location || null,
      skills: jsonUser.skills || null,
      previousCompanies: null,
      interests: null,
      experience: null,
      description: jsonUser.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static async parseJSONFile(filePath: string): Promise<IUser[]> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const jsonContent = await fs.readFile(resolvedPath, "utf-8");
    const parsed = JSON.parse(jsonContent);

    const users: IUser[] = [];

    if (Array.isArray(parsed)) {
      // in case of multiple users in a single json file
      for (const jsonUser of parsed) {
        users.push(this.convertToIUser(jsonUser));
      }
    } else {
      users.push(this.convertToIUser(parsed));
    }

    return users;
  }

  static async parseJSONFiles(folderPath: string): Promise<IUser[]> {
    const resolvedPath = path.resolve(process.cwd(), folderPath);
    const files = await fs.readdir(resolvedPath);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const allUsers: IUser[] = [];

    for (const jsonFile of jsonFiles) {
      const filePath = path.join(resolvedPath, jsonFile);
      const usersFromFile: IUser[] = await this.parseJSONFile(filePath);
      allUsers.push(...usersFromFile); // flatten into one array
    }

    return allUsers;
  }
}

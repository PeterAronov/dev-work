// First install: npm install papaparse @types/papaparse

import fs from "fs/promises";
import Papa from "papaparse";
import path from "path";
import { IUser } from "../../../user/src/user.interface";
import { CSVUserRow } from "./csv-user-parser.interface";

export class CSVUserParserService {
  static parseCSVContent(csvContent: string): CSVUserRow[] {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings
    });

    return result.data as CSVUserRow[];
  }
  static convertToIUser(csvUser: CSVUserRow): IUser {
    const skills = csvUser.skills ? csvUser.skills.split(",").map((skill) => skill.trim().replace(/^"|"$/g, "")) : null;

    return {
      id: null,
      name: csvUser.name || null,
      email: null,
      role: csvUser.role || null,
      location: csvUser.location || null,
      skills,
      previousCompanies: null,
      interests: null,
      experience: csvUser.experience_years ? `${csvUser.experience_years} years` : null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static async parseCSVFile(filePath: string): Promise<IUser[]> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const csvContent = await fs.readFile(resolvedPath, "utf-8");
    const csvUsers = this.parseCSVContent(csvContent);
    return csvUsers.map((csvUser) => this.convertToIUser(csvUser));
  }

  static async parseCSVFiles(folderPath: string): Promise<IUser[]> {
    const resolvedPath = path.resolve(process.cwd(), folderPath);
    const files = await fs.readdir(resolvedPath);
    const csvFiles = files.filter((file) => file.endsWith(".csv"));

    const allUsers: IUser[] = [];
    for (const csvFile of csvFiles) {
      const filePath = path.join(resolvedPath, csvFile);
      const users = await this.parseCSVFile(filePath);
      allUsers.push(...users);
    }

    return allUsers;
  }
}

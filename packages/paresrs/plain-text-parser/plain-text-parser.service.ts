import fs from "fs/promises";
import path from "path";
import { PlainTextFile } from "./plain-text-parser.interface";

export class PlainTextParserService {
  async readTextFiles(folderPath: string): Promise<PlainTextFile[]> {
    try {
      const resolvedPath = path.resolve(process.cwd(), folderPath);
      const files = await fs.readdir(resolvedPath);

      const textFiles = files.filter((file) => file.endsWith(".txt") || file.endsWith(".md"));

      const results: PlainTextFile[] = [];

      for (const file of textFiles) {
        const filePath = path.join(resolvedPath, file);
        const content = await fs.readFile(filePath, "utf-8");
        const filename = path.parse(file).name;

        results.push({
          filename,
          content: content.trim(),
        });
      }

      console.log(`Loaded ${results.length} text files from ${folderPath}`);
      return results;
    } catch (error: any) {
      throw new Error(`Failed to read text files from ${folderPath}: ${error.message}`);
    }
  }
}

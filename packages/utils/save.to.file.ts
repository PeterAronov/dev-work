import * as fs from "fs";
import * as path from "path";

/**
 * Saves any JavaScript object (usually API response) to a JSON file,
 * nicely formatted, inside the 'json-files' directory at project root.
 *
 * @param fileName - Name of the file (without .json extension)
 * @param data - The data to save (object/array/etc.)
 */
export const saveToJsonFile = (fileName: string, data: any): void => {
  const dirPath = path.resolve(__dirname, "../../json-files");
  const filePath = path.join(dirPath, `${fileName}.json`);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Write data to file with pretty formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

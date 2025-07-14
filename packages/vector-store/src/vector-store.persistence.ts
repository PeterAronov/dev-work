import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
import path from "path";

const VECTOR_FILE_PATH = path.resolve("vectors", "vector-store.json");

export async function saveDocumentsToFile(docs: Document[]): Promise<void> {
  const serializableDocs = docs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata,
  }));
  await fs.writeFile(VECTOR_FILE_PATH, JSON.stringify(serializableDocs, null, 2), "utf-8");
}

export async function loadDocumentsFromFile(): Promise<Document[]> {
  try {
    const raw = await fs.readFile(VECTOR_FILE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data.map((doc: any) => new Document(doc));
  } catch {
    return []; // File doesn't exist yet
  }
}

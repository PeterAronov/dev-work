export enum OpenAIChatModels {
  GPT_4O = "gpt-4o",
  GPT_4 = "gpt-4",
  GPT_4_TURBO = "gpt-4-turbo",
  GPT_35 = "gpt-3.5-turbo",
  GPT_35_1106 = "gpt-3.5-turbo-1106",
}

export enum OpenAIEmbeddingModels {
  SMALL = "text-embedding-3-small", // dim = 1536
  LARGE = "text-embedding-3-large", // dim = 3072
  ADA = "text-embedding-ada-002", //legacy
}

/** 
| Model                    | MIRACL Avg | MTEB Avg |
| ------------------------ | ---------- | -------- |
| `ada-002`                | 31.4       | 61.0     |
| `text-embedding-3-small` | 44.0       | 62.3     |
| `text-embedding-3-large` | 54.9       | 64.6     |
**/
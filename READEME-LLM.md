## ✅ Prompt-Based Examples by `LLMModelFunction`

### Chat

**Prompt:**

```vbnet
Hi, I'm preparing for a product manager interview. Can you ask me 3 behavioral questions and rate my answers?
```

👉 `generateText()` (chat-based model)

---

### Completion

**Prompt:**

```css
Write 3 punchy email subject lines for a newsletter about AI job trends.
```

👉 `generateText()` (completion model)

---

### Embedding

**Input (not a prompt):**

```json
{
  "name": "John Doe",
  "skills": ["Kubernetes", "GCP", "Terraform"],
  "notes": "Former SRE at Google, lives in Berlin"
}
```

👉 `embed()` (used to store in vector DB)

---

### FunctionCall (Structured Output)

**Prompt:**

```pgsql
Extract all the users from the following text and return them as JSON with fields: full_name, location, role, and skills.

Text:
- Jane is a frontend dev in Berlin. React, Vue.
- Tom is a data scientist in Munich. Python, SQL.
```

👉 `generateStructuredOutput<T>()` with Zod schema

---

### Vision

**Prompt (with image):**

```kotlin
What’s the main error shown in this screenshot?
```

(+ image URL in OpenAI API)

👉 `generateText()` with Vision model

---

### ToolUse

**Prompt:**

```css
What’s the current weather in Madrid? Use a weather tool if needed.
```

👉 `generateText()` with agent + tools setup

---

### CodeGen

**Prompt:**

```pgsql
Write a TypeScript function that parses a CSV string into an array of objects.
```

👉 `generateText()` (but possibly using a "code" model)

---

### SQLGen

**Prompt:**

```nginx
Generate a SOQL query to find opportunities in Germany worth more than $1M.
```

👉 `generateStructuredOutput<T>()` or just `generateText()` with post-parsing

---

### RAG

**Prompt:**

```pgsql
Find backend engineers in Berlin with Kubernetes experience from the database.
```

👉 `embed()` → vector search → inject docs → `generateText()` with context

---

### MetadataSearch

**Prompt:**

```sql
Who are the frontend developers with 5+ years of experience located in Germany?
```

👉 `filter()` on metadata, no LLM needed
(or combine with `generateText()` to explain results)

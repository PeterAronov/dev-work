import { z } from "zod";

export const UserSchema = z.object({
  // Make all fields required but nullable (simpler for OpenAI API)
  id: z.number().nullable(),
  name: z.string().nullable().describe("The person's full name"),
  email: z.string().nullable().describe("The person's email address"),
  role: z.string().nullable().describe("Their job title or professional role"),
  location: z.string().nullable().describe("City, country, or region where they're based"),
  skills: z.array(z.string()).nullable().describe("Technical skills, programming languages, tools they know"),
  previousCompanies: z.array(z.string()).nullable().describe("Companies they previously worked at"),
  interests: z.array(z.string()).nullable().describe("Personal interests, hobbies, or professional preferences"),
  experience: z.string().nullable().describe("Summary of their professional experience"),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export type User = z.infer<typeof UserSchema>;

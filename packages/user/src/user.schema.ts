import { z } from "zod";
import { UserRelevancy } from "./user.interface";

export const UserSchema = z.object({
  name: z.string().nullable().describe("The person's full name"),
  email: z.string().nullable().describe("The person's email address"),
  role: z.string().nullable().describe("Their job title or professional role"),
  location: z.string().nullable().describe("City, country, or region where they're based"),
  skills: z.array(z.string()).nullable().describe("Technical skills, programming languages, tools they know"),
  previousCompanies: z.array(z.string()).nullable().describe("Companies they previously worked at"),
  interests: z.array(z.string()).nullable().describe("Personal interests, hobbies, or professional preferences"),
  experience: z.string().nullable().describe("Summary of their professional experience"),
});

export type User = z.infer<typeof UserSchema>;

export const UserRelevancySchema = z.object({
  relevancy: z.nativeEnum(UserRelevancy).describe("The relevancy level of the user to the search query"),
});

export type UserRelevancyResult = z.infer<typeof UserRelevancySchema>;

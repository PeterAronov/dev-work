export const convertToPlainText = (output: any): string => {
  if (!output || typeof output !== "object") {
    return "No relevant information found.";
  }

  const parts: string[] = [];

  if (output.name) parts.push(`Name: ${output.name}`);
  if (output.email) parts.push(`Email: ${output.email}`);
  if (output.role) parts.push(`Role: ${output.role}`);
  if (output.location) parts.push(`Location: ${output.location}`);

  if (output.skills && Array.isArray(output.skills) && output.skills.length > 0) {
    parts.push(`Skills: ${output.skills.join(", ")}`);
  }

  if (output.previousCompanies && Array.isArray(output.previousCompanies) && output.previousCompanies.length > 0) {
    parts.push(`Previous Companies: ${output.previousCompanies.join(", ")}`);
  }

  if (output.interests && Array.isArray(output.interests) && output.interests.length > 0) {
    parts.push(`Interests: ${output.interests.join(", ")}`);
  }

  if (output.experience) parts.push(`Experience: ${output.experience}`);

  // If no relevant information was found
  if (parts.length === 0) {
    return "No relevant user information found in the text.";
  }

  return `Extracted information:\n${parts.join("\n")}`;
};

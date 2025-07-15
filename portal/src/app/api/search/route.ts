// portal/src/app/api/search/route.ts
import { UserService } from "@neon/users";
import { SimilaritySearchResponse, VectorStoreService } from "@neon/vector-store";
import { NextRequest, NextResponse } from "next/server";

const userService = new UserService();

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
    }

    console.log(`Searching for: "${query}"`);

    const searchResults: SimilaritySearchResponse = await VectorStoreService.similaritySearch({
      query: query.trim(),
      topK: 5,
      threshold: 0.7,
    });

    const finalAnswer = await userService.getUsersFinalAnswerLLM(query, searchResults);

    const transformedResults = searchResults.results.map((result, index) => ({
      id: result.document.metadata.uuid || `result-${index}`,
      name: result.document.metadata.name || "Unknown",
      email: result.document.metadata.email,
      location: result.document.metadata.location,
      role: result.document.metadata.role,
      skills: result.document.metadata.skills || [],
      experience: result.document.metadata.experience,
      interests: result.document.metadata.interests || [],
      previousCompanies: result.document.metadata.previousCompanies || [],
      description: result.document.pageContent,
      matchScore: Math.round((1 - result.score) * 100), // Convert distance to percentage
      matchReason: `User matches based on semantic similarity to "${query}"`, // use LLM peter
    }));

    return NextResponse.json({
      success: true,
      query,
      results: transformedResults,
      totalFound: transformedResults.length,
      finalAnswer,
      processingTime: searchResults.processingTimeMs,
    });
  } catch (error: any) {
    console.error("Error in search:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// portal/src/app/api/search/route.ts
import { UserRelevancy, UserService } from "@neon/users";
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
    });

    console.log(`Found ${searchResults.results.length} similarity matches, now filtering by relevancy...`);

    const resultsWithRelevancy = await Promise.all(
      searchResults.results.map(async (result) => {
        const relevancy = await userService.userRelevancyToQueryLLM(
          result.document.metadata,
          result.document.pageContent,
          query
        );
        return { ...result, relevancy };
      })
    );

    // Filter by relevancy - only keep HIGH and MID relevancy users
    const relevantResults = resultsWithRelevancy.filter((result) => {
      if (result.relevancy === UserRelevancy.HIGH || result.relevancy === UserRelevancy.MID) {
        return true;
      } else {
        console.log(`Filtered out ${result.document.metadata.name} - LOW relevancy`);
        return false;
      }
    });

    console.log(`After relevancy filtering: ${relevantResults.length} users remain`);

    const finalAnswer = await userService.getUsersFinalAnswerLLM(query, {
      results: relevantResults,
      processingTimeMs: searchResults.processingTimeMs,
    });

    console.log(`Final answer generated: ${finalAnswer}`);

    const transformedResults = await Promise.all(
      relevantResults.map(async (result, index) => {
        const matchReason: string = await userService.getUserMatchExplanation(
          result.document.metadata,
          result.document.pageContent,
          query
        );

        return {
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
          matchReason, // Now uses LLM-generated explanation!
        };
      })
    ).then((results) => results.sort((a, b) => b.matchScore - a.matchScore));
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

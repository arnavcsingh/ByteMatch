import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "SPOONACULAR_API_KEY not found in environment variables",
        hasApiKey: false
      });
    }

    // Test the API with a simple request
    const testResponse = await fetch(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?number=1&addRecipeInformation=true`, {
      headers: {
        "x-rapidapi-host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!testResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Spoonacular API error: ${testResponse.status} ${testResponse.statusText}`,
        hasApiKey: true,
        apiKeyPrefix: apiKey.substring(0, 10) + "...",
        status: testResponse.status,
        statusText: testResponse.statusText
      });
    }

    const data = await testResponse.json();
    
    return NextResponse.json({
      success: true,
      message: "Spoonacular API is working",
      hasApiKey: true,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      testResult: {
        totalResults: data.totalResults,
        resultsCount: data.results?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Error testing Spoonacular API: ${error}`,
      hasApiKey: !!process.env.SPOONACULAR_API_KEY
    });
  }
}

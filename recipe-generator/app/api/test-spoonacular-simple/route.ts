import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: "SPOONACULAR_API_KEY not found in environment variables",
        hasApiKey: false
      });
    }

    console.log("Testing Spoonacular API with key:", apiKey.substring(0, 10) + "...");

    // Simple test call to Spoonacular
    const response = await fetch("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?query=pasta&number=1", {
      headers: {
        'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });

    console.log("Spoonacular test response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Spoonacular test error:", errorText);
      return NextResponse.json({
        error: `Spoonacular API test failed: ${response.status} ${response.statusText}`,
        errorDetails: errorText,
        hasApiKey: true,
        apiKeyPrefix: apiKey.substring(0, 10) + "..."
      });
    }

    const data = await response.json();
    console.log("Spoonacular test success, got", data.results?.length || 0, "recipes");

    return NextResponse.json({
      success: true,
      hasApiKey: true,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      recipeCount: data.results?.length || 0,
      sampleRecipe: data.results?.[0]?.title || "No recipes found"
    });

  } catch (error) {
    console.error("Spoonacular test error:", error);
    return NextResponse.json({
      error: "Spoonacular API test failed",
      details: error instanceof Error ? error.message : String(error),
      hasApiKey: !!process.env.SPOONACULAR_API_KEY
    });
  }
}

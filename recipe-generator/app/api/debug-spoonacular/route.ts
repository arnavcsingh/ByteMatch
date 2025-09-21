import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "SPOONACULAR_API_KEY not found"
      });
    }

    // Test with a simple search
    const response = await fetch(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?number=3&addRecipeInformation=true&query=salad`, {
      headers: {
        "x-rapidapi-host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
        status: response.status
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      rawResponse: data,
      resultsCount: data.results?.length || 0,
      totalResults: data.totalResults,
      firstRecipe: data.results?.[0] || null
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Error: ${error}`
    });
  }
}



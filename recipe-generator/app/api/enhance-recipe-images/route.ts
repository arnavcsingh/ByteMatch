import { NextRequest, NextResponse } from "next/server";
import { pexelsService } from "@/lib/pexels";
import { Recipe } from "@/types";

interface EnhancedRecipe extends Recipe {
  originalImage?: string;
  imageSource?: 'original' | 'pexels';
}

export async function POST(request: NextRequest) {
  try {
    const { recipes }: { recipes: Recipe[] } = await request.json();
    
    if (!recipes || !Array.isArray(recipes)) {
      return NextResponse.json(
        { error: "Invalid recipes data" },
        { status: 400 }
      );
    }

    console.log(`Enhancing ${recipes.length} recipe images with Pexels...`);
    
    const enhancedRecipes: EnhancedRecipe[] = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          // Store original image
          const originalImage = recipe.image;
          
          // Try to find a better image from Pexels
          const pexelsImage = await pexelsService.findRecipeImage(recipe.title, recipe.cuisine);
          
          if (pexelsImage) {
            console.log(`Found Pexels image for: ${recipe.title}`);
            return {
              ...recipe,
              originalImage,
              image: pexelsImage,
              imageSource: 'pexels' as const
            };
          } else {
            console.log(`No Pexels image found for: ${recipe.title}, keeping original`);
            return {
              ...recipe,
              originalImage,
              imageSource: 'original' as const
            };
          }
        } catch (error) {
          console.error(`Error enhancing image for ${recipe.title}:`, error);
          return {
            ...recipe,
            originalImage: recipe.image,
            imageSource: 'original' as const
          };
        }
      })
    );

    const enhancedCount = enhancedRecipes.filter(r => r.imageSource === 'pexels').length;
    console.log(`Enhanced ${enhancedCount}/${recipes.length} recipe images with Pexels`);

    return NextResponse.json({
      success: true,
      recipes: enhancedRecipes,
      enhancedCount,
      totalCount: recipes.length
    });

  } catch (error) {
    console.error("Error enhancing recipe images:", error);
    return NextResponse.json(
      { error: "Failed to enhance recipe images" },
      { status: 500 }
    );
  }
}



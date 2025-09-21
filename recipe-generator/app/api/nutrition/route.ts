import { NextRequest, NextResponse } from 'next/server';
import { NutritionInfo } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { ingredients, servings = 1 } = await request.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      console.error('USDA_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Nutrition API not configured' },
        { status: 500 }
      );
    }

    // Calculate nutrition using USDA FoodData Central API
    let totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    const dietaryInfo: string[] = [];
    let processedIngredients = 0;

    // Process each ingredient
    for (const ingredient of ingredients.slice(0, 10)) { // Limit to first 10 ingredients to avoid rate limits
      try {
        // Clean ingredient name (remove measurements, cooking methods, etc.)
        const cleanIngredient = ingredient
          .toLowerCase()
          .replace(/\d+\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?)/g, '')
          .replace(/(chopped|diced|sliced|minced|grated|shredded|fresh|dried|frozen|canned|raw|cooked|boiled|fried|grilled|baked)/g, '')
          .replace(/[^\w\s]/g, '')
          .trim()
          .split(' ')[0]; // Take first word only

        if (!cleanIngredient || cleanIngredient.length < 2) continue;

        // Search for food in USDA database
        const searchResponse = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(cleanIngredient)}&pageSize=1&api_key=${apiKey}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!searchResponse.ok) {
          console.warn(`USDA search failed for ${cleanIngredient}:`, searchResponse.status);
          continue;
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.foods || searchData.foods.length === 0) {
          console.warn(`No USDA data found for ${cleanIngredient}`);
          continue;
        }

        const food = searchData.foods[0];
        const foodNutrients = food.foodNutrients || [];

        // Debug: Log available nutrients for first ingredient
        if (processedIngredients === 0) {
          console.log(`Available nutrients for ${cleanIngredient}:`, 
            foodNutrients.map((n: any) => n.nutrient?.name).filter(Boolean).slice(0, 10)
          );
        }

        // Extract nutrition values (per 100g) - try multiple possible names
        const calories = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Energy' || 
          n.nutrient?.name === 'Energy (Atwater General Factors)' ||
          n.nutrient?.name === 'Energy (Atwater Specific Factors)'
        )?.amount || 0;
        
        const protein = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Protein' ||
          n.nutrient?.name === 'Protein (g)'
        )?.amount || 0;
        
        const carbs = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Carbohydrate, by difference' ||
          n.nutrient?.name === 'Carbohydrate, by difference (g)' ||
          n.nutrient?.name === 'Carbohydrates'
        )?.amount || 0;
        
        const fat = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Total lipid (fat)' ||
          n.nutrient?.name === 'Total lipid (fat) (g)' ||
          n.nutrient?.name === 'Fat'
        )?.amount || 0;
        
        const fiber = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Fiber, total dietary' ||
          n.nutrient?.name === 'Fiber, total dietary (g)' ||
          n.nutrient?.name === 'Dietary Fiber'
        )?.amount || 0;
        
        const sugar = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Sugars, total including NLEA' ||
          n.nutrient?.name === 'Sugars, total including NLEA (g)' ||
          n.nutrient?.name === 'Total Sugars'
        )?.amount || 0;
        
        const sodium = foodNutrients.find((n: any) => 
          n.nutrient?.name === 'Sodium, Na' ||
          n.nutrient?.name === 'Sodium, Na (mg)' ||
          n.nutrient?.name === 'Sodium'
        )?.amount || 0;

        // Estimate portion size (rough estimate: 50g per ingredient)
        const portionSize = 50; // grams
        const multiplier = portionSize / 100; // Convert from per 100g to per portion

        totalNutrition.calories += (calories * multiplier);
        totalNutrition.protein += (protein * multiplier);
        totalNutrition.carbs += (carbs * multiplier);
        totalNutrition.fat += (fat * multiplier);
        totalNutrition.fiber += (fiber * multiplier);
        totalNutrition.sugar += (sugar * multiplier);
        totalNutrition.sodium += (sodium * multiplier);

        // Debug: Log nutrition values for first few ingredients
        if (processedIngredients < 3) {
          console.log(`${cleanIngredient}: calories=${calories}, protein=${protein}, carbs=${carbs}, fat=${fat}`);
        }

        processedIngredients++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.warn(`Error processing ingredient ${ingredient}:`, error);
        continue;
      }
    }

    // If we couldn't process any ingredients, return null
    if (processedIngredients === 0) {
      return NextResponse.json({ nutrition: null });
    }

    // Adjust for number of servings
    const servingMultiplier = 1 / servings;
    const nutrition: NutritionInfo = {
      calories: Math.round(totalNutrition.calories * servingMultiplier),
      protein: Math.round((totalNutrition.protein * servingMultiplier) * 10) / 10,
      carbs: Math.round((totalNutrition.carbs * servingMultiplier) * 10) / 10,
      fat: Math.round((totalNutrition.fat * servingMultiplier) * 10) / 10,
      fiber: Math.round((totalNutrition.fiber * servingMultiplier) * 10) / 10,
      sugar: Math.round((totalNutrition.sugar * servingMultiplier) * 10) / 10,
      sodium: Math.round((totalNutrition.sodium * servingMultiplier) * 10) / 10,
    };

    // Add dietary information based on ingredients
    const ingredientText = ingredients.join(' ').toLowerCase();
    if (ingredientText.includes('vegetable') || ingredientText.includes('lettuce') || ingredientText.includes('tomato')) {
      dietaryInfo.push('vegetarian');
    }
    if (!ingredientText.includes('meat') && !ingredientText.includes('chicken') && !ingredientText.includes('beef') && !ingredientText.includes('pork')) {
      dietaryInfo.push('vegetarian');
    }
    if (!ingredientText.includes('dairy') && !ingredientText.includes('cheese') && !ingredientText.includes('milk') && !ingredientText.includes('butter')) {
      dietaryInfo.push('dairy-free');
    }

    if (dietaryInfo.length > 0) {
      nutrition.dietaryInfo = dietaryInfo;
    }

    console.log(`Processed ${processedIngredients} ingredients for nutrition calculation`);
    return NextResponse.json({ nutrition });

  } catch (error) {
    console.error('Error fetching nutrition information:', error);
    return NextResponse.json({ nutrition: null });
  }
}

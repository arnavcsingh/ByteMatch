import { NextRequest, NextResponse } from 'next/server';

interface OllamaNutritionRequest {
  ingredients: string[];
  servings: number;
}

interface OllamaNutritionResponse {
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  matchedIngredients: string[];
  unmatchedIngredients: string[];
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients, servings }: OllamaNutritionRequest = await request.json();

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'No ingredients provided' },
        { status: 400 }
      );
    }

    // Create a detailed prompt for Mistral to calculate nutrition
    const prompt = `You are a nutrition expert. Calculate the nutrition information for a recipe with the following ingredients and serving size.

INGREDIENTS:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

SERVINGS: ${servings}

INSTRUCTIONS:
1. Parse each ingredient to extract the amount, unit, and food item
2. Convert amounts to standard units (grams) using proper density conversions
3. Look up nutrition data per 100g for each ingredient
4. Calculate total nutrition for the entire recipe
5. Divide by number of servings to get per-serving values
6. Identify which ingredients you can calculate nutrition for and which you cannot

NUTRITION DATABASE (per 100g):
- Chicken breast: 165 cal, 31g protein, 0g carbs, 3.6g fat
- Ground beef: 250 cal, 26g protein, 0g carbs, 15g fat
- Salmon: 208 cal, 25g protein, 0g carbs, 12g fat
- Eggs: 155 cal, 13g protein, 1.1g carbs, 11g fat
- Milk: 42 cal, 3.4g protein, 5g carbs, 1g fat
- Cheese: 113 cal, 7g protein, 1g carbs, 9g fat
- Cheddar cheese: 403 cal, 25g protein, 1.3g carbs, 33g fat
- Mozzarella: 280 cal, 22g protein, 2.2g carbs, 22g fat
- Parmesan: 431 cal, 38g protein, 4.1g carbs, 29g fat
- Butter: 717 cal, 0.9g protein, 0.1g carbs, 81g fat
- Olive oil: 884 cal, 0g protein, 0g carbs, 100g fat
- Vegetable oil: 884 cal, 0g protein, 0g carbs, 100g fat
- Flour: 364 cal, 10g protein, 76g carbs, 1g fat
- White flour: 364 cal, 10g protein, 76g carbs, 1g fat
- Sugar: 387 cal, 0g protein, 100g carbs, 0g fat
- Brown sugar: 380 cal, 0g protein, 98g carbs, 0g fat
- Salt: 0 cal, 0g protein, 0g carbs, 0g fat
- Black pepper: 251 cal, 10g protein, 64g carbs, 3.3g fat
- Garlic: 149 cal, 6.4g protein, 33g carbs, 0.5g fat
- Onion: 40 cal, 1.1g protein, 9.3g carbs, 0.1g fat
- Tomato: 18 cal, 0.9g protein, 3.9g carbs, 0.2g fat
- Lettuce: 15 cal, 1.4g protein, 2.9g carbs, 0.2g fat
- Spinach: 23 cal, 2.9g protein, 3.6g carbs, 0.4g fat
- Carrot: 41 cal, 0.9g protein, 9.6g carbs, 0.2g fat
- Bell pepper: 31 cal, 1g protein, 7.3g carbs, 0.3g fat
- Cucumber: 16 cal, 0.7g protein, 4g carbs, 0.1g fat
- Mushroom: 22 cal, 3.1g protein, 3.3g carbs, 0.3g fat
- Potato: 77 cal, 2g protein, 17g carbs, 0.1g fat
- Sweet potato: 86 cal, 1.6g protein, 20g carbs, 0.1g fat
- Rice: 130 cal, 2.7g protein, 28g carbs, 0.3g fat
- Brown rice: 111 cal, 2.6g protein, 23g carbs, 0.9g fat
- Pasta: 131 cal, 5g protein, 25g carbs, 1.1g fat
- Bread: 265 cal, 9g protein, 49g carbs, 3.2g fat
- Whole wheat bread: 247 cal, 13g protein, 41g carbs, 4.2g fat
- Oats: 389 cal, 17g protein, 66g carbs, 7g fat
- Quinoa: 120 cal, 4.4g protein, 22g carbs, 1.9g fat
- Beans: 127 cal, 8.7g protein, 22.8g carbs, 0.5g fat
- Black beans: 132 cal, 8.9g protein, 23.7g carbs, 0.5g fat
- Chickpeas: 164 cal, 8.9g protein, 27.4g carbs, 2.6g fat
- Lentils: 116 cal, 9g protein, 20g carbs, 0.4g fat
- Almonds: 579 cal, 21g protein, 22g carbs, 50g fat
- Walnuts: 654 cal, 15g protein, 14g carbs, 65g fat
- Peanuts: 567 cal, 26g protein, 16g carbs, 49g fat
- Cashews: 553 cal, 18g protein, 30g carbs, 44g fat
- Avocado: 160 cal, 2g protein, 9g carbs, 15g fat
- Banana: 89 cal, 1.1g protein, 23g carbs, 0.3g fat
- Apple: 52 cal, 0.3g protein, 14g carbs, 0.2g fat
- Orange: 47 cal, 0.9g protein, 12g carbs, 0.1g fat
- Lemon: 29 cal, 1.1g protein, 9g carbs, 0.3g fat
- Lime: 30 cal, 0.7g protein, 11g carbs, 0.2g fat
- Strawberry: 32 cal, 0.7g protein, 8g carbs, 0.3g fat
- Blueberry: 57 cal, 0.7g protein, 14g carbs, 0.3g fat
- Yogurt: 59 cal, 10g protein, 3.6g carbs, 0.4g fat
- Greek yogurt: 59 cal, 10g protein, 3.6g carbs, 0.4g fat
- Sour cream: 198 cal, 2.8g protein, 4.6g carbs, 19g fat
- Cream: 345 cal, 2.8g protein, 2.8g carbs, 37g fat
- Heavy cream: 345 cal, 2.8g protein, 2.8g carbs, 37g fat
- Mayonnaise: 680 cal, 1g protein, 0.6g carbs, 75g fat
- Ketchup: 112 cal, 1.7g protein, 27g carbs, 0.1g fat
- Mustard: 66 cal, 4g protein, 4g carbs, 4g fat
- Soy sauce: 8 cal, 1.3g protein, 0.8g carbs, 0g fat
- Vinegar: 19 cal, 0g protein, 0.9g carbs, 0g fat
- Balsamic vinegar: 88 cal, 0.5g protein, 17g carbs, 0g fat
- Olive: 115 cal, 0.8g protein, 6g carbs, 11g fat
- Capers: 23 cal, 2.4g protein, 5g carbs, 0.9g fat
- Basil: 22 cal, 3.2g protein, 2.6g carbs, 0.6g fat
- Oregano: 265 cal, 9g protein, 69g carbs, 4.3g fat
- Thyme: 276 cal, 9.1g protein, 63.9g carbs, 7.4g fat
- Rosemary: 331 cal, 4.9g protein, 64g carbs, 15.2g fat
- Parsley: 36 cal, 3g protein, 6g carbs, 0.8g fat
- Cilantro: 23 cal, 2.1g protein, 3.7g carbs, 0.5g fat
- Ginger: 80 cal, 1.8g protein, 18g carbs, 0.8g fat
- Cumin: 375 cal, 18g protein, 44g carbs, 22g fat
- Paprika: 282 cal, 14g protein, 54g carbs, 13g fat
- Cinnamon: 247 cal, 4g protein, 81g carbs, 1.2g fat
- Vanilla: 288 cal, 0.1g protein, 13g carbs, 0.1g fat
- Cocoa powder: 228 cal, 20g protein, 58g carbs, 14g fat
- Chocolate: 546 cal, 7.8g protein, 46g carbs, 31g fat
- Dark chocolate: 546 cal, 7.8g protein, 46g carbs, 31g fat
- Bacon: 541 cal, 37g protein, 1.4g carbs, 42g fat
- Ham: 145 cal, 21g protein, 1.5g carbs, 6g fat
- Sausage: 301 cal, 13g protein, 2g carbs, 27g fat
- Shrimp: 99 cal, 24g protein, 0g carbs, 0.3g fat
- Tuna: 132 cal, 30g protein, 0g carbs, 1.3g fat
- Cod: 82 cal, 18g protein, 0g carbs, 0.7g fat
- Tofu: 76 cal, 8g protein, 1.9g carbs, 4.8g fat
- Tempeh: 192 cal, 20g protein, 7.6g carbs, 11g fat
- Coconut milk: 230 cal, 2.3g protein, 6g carbs, 24g fat
- Almond milk: 17 cal, 0.6g protein, 0.6g carbs, 1.1g fat
- Soy milk: 33 cal, 2.9g protein, 1.8g carbs, 1.9g fat
- Corn: 86 cal, 3.3g protein, 19g carbs, 1.2g fat
- Peas: 81 cal, 5.4g protein, 14g carbs, 0.4g fat
- Broccoli: 34 cal, 2.8g protein, 7g carbs, 0.4g fat
- Cauliflower: 25 cal, 1.9g protein, 5g carbs, 0.3g fat
- Cabbage: 25 cal, 1.3g protein, 6g carbs, 0.1g fat
- Celery: 16 cal, 0.7g protein, 3g carbs, 0.2g fat
- Radish: 16 cal, 0.7g protein, 3.4g carbs, 0.1g fat
- Beet: 43 cal, 1.6g protein, 10g carbs, 0.2g fat
- Zucchini: 17 cal, 1.2g protein, 3.1g carbs, 0.3g fat
- Eggplant: 25 cal, 1g protein, 6g carbs, 0.2g fat
- Squash: 40 cal, 1g protein, 10g carbs, 0.2g fat
- Pumpkin: 26 cal, 1g protein, 7g carbs, 0.1g fat

UNIT CONVERSIONS:
- 1 cup oil/butter = 216g
- 1 tbsp oil/butter = 13.5g
- 1 tsp oil/butter = 4.5g
- 1 cup flour/sugar = 120g
- 1 tbsp flour/sugar = 8g
- 1 tsp flour/sugar = 3g
- 1 cup nuts = 150g
- 1 tbsp nuts = 9g
- 1 cup cheese = 100g
- 1 tbsp cheese = 6g
- 1 cup standard = 240g
- 1 tbsp standard = 15g
- 1 tsp standard = 5g
- 1 oz = 28.35g
- 1 lb = 453.59g
- 1 slice = 25g
- 1 piece = 50g
- 1 clove garlic = 3g

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "matchedIngredients": ["ingredient1", "ingredient2", ...],
  "unmatchedIngredients": ["ingredient1", "ingredient2", ...],
  "reasoning": "Brief explanation of the calculation process"
}

Calculate the nutrition per serving and provide accurate values. Be precise with unit conversions and ingredient matching.`;

    // Test Ollama connection first
    try {
      const testResponse = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        throw new Error('Cannot connect to Ollama. Please ensure Ollama is running: ollama serve');
      }
      
      const testData = await testResponse.json();
      const models = testData.models || [];
      const mistralModel = models.find((model: any) => model.name.includes('mistral'));
      
      if (!mistralModel) {
        throw new Error('Mistral model not found. Please run: ollama pull mistral');
      }
    } catch (connectionError) {
      throw new Error(`Ollama connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
    }

    // Call Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent results
          top_p: 0.9,
        }
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      if (ollamaResponse.status === 404) {
        throw new Error('Mistral model not found. Please run: ollama pull mistral');
      } else if (ollamaResponse.status === 500) {
        throw new Error('Ollama server error. Please check if Ollama is running: ollama serve');
      } else {
        throw new Error(`Ollama API error ${ollamaResponse.status}: ${errorText}`);
      }
    }

    const ollamaData = await ollamaResponse.json();
    
    if (!ollamaData.response) {
      throw new Error('No response from Ollama');
    }

    // Parse the JSON response from Mistral
    let nutritionResult: OllamaNutritionResponse;
    try {
      // Extract JSON from the response (it might have extra text)
      const jsonMatch = ollamaData.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      nutritionResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing Ollama response:', ollamaData.response);
      throw new Error('Failed to parse nutrition calculation from Ollama');
    }

    // Validate the response structure
    if (!nutritionResult.nutrition || 
        typeof nutritionResult.nutrition.calories !== 'number' ||
        typeof nutritionResult.nutrition.protein !== 'number' ||
        typeof nutritionResult.nutrition.carbs !== 'number' ||
        typeof nutritionResult.nutrition.fat !== 'number') {
      throw new Error('Invalid nutrition data structure from Ollama');
    }

    return NextResponse.json(nutritionResult);

  } catch (error) {
    console.error('Error in Ollama nutrition calculation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate nutrition using Ollama',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

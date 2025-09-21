import nutritionDatabase from './nutrition-db.json';

// Interface for nutrition data
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Interface for ingredient nutrition result
export interface IngredientNutrition {
  ingredient: string;
  amount: number;
  unit: string;
  nutrition: NutritionData;
}

// Interface for recipe nutrition result
export interface RecipeNutrition {
  nutrition: NutritionData;
  matchedIngredients: IngredientNutrition[];
  unmatchedIngredients: string[];
}

/**
 * Parse ingredient string to extract amount, unit, and clean name
 * Handles formats like "2 cups flour", "1 tbsp olive oil", "3 cloves garlic"
 */
export function parseIngredient(ingredient: string): {
  amount: number;
  unit: string;
  cleanName: string;
} {
  const lowerIngredient = ingredient.toLowerCase().trim();
  
  // Extract amount and unit using regex
  const amountMatch = lowerIngredient.match(/(\d+(?:\.\d+)?)\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?|slices?|pieces?|cloves?|large|medium|small)/i);
  
  let amount = 1; // Default amount
  let unit = 'piece'; // Default unit
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
    unit = amountMatch[2].toLowerCase();
    
    // Handle size descriptors
    if (unit === 'large') {
      amount = amount * 1.5;
      unit = 'piece';
    } else if (unit === 'medium') {
      amount = amount * 1;
      unit = 'piece';
    } else if (unit === 'small') {
      amount = amount * 0.5;
      unit = 'piece';
    }
  }
  
  // Clean ingredient name by removing amounts, units, and descriptors
  let cleanName = lowerIngredient
    .replace(/\d+(?:\.\d+)?\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?|slices?|pieces?|cloves?|large|medium|small)/g, '')
    .replace(/(chopped|diced|sliced|minced|grated|shredded|fresh|dried|frozen|canned|raw|cooked|boiled|fried|grilled|baked|thick|thin)/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  return { amount, unit, cleanName };
}

/**
 * Convert various units to grams for consistent calculation
 * Uses ingredient-specific density for accurate conversions
 */
export function convertToGrams(amount: number, unit: string, ingredientName: string): number {
  const unitLower = unit.toLowerCase();
  const ingredient = ingredientName.toLowerCase();
  
  // Get density multiplier based on ingredient type
  const densityMultiplier = getDensityMultiplier(ingredient);
  
  // Volume to weight conversions
  if (unitLower.includes('cup') || unitLower === 'cups') {
    return Math.min(amount * densityMultiplier.cup, 2000); // Max 2kg
  }
  if (unitLower.includes('tbsp') || unitLower === 'tablespoon' || unitLower === 'tablespoons') {
    return Math.min(amount * densityMultiplier.tbsp, 200); // Max 200g
  }
  if (unitLower.includes('tsp') || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
    return Math.min(amount * densityMultiplier.tsp, 100); // Max 100g
  }
  
  // Metric volume conversions
  if (unitLower.includes('ml') || unitLower === 'milliliter' || unitLower === 'milliliters') {
    return Math.min(amount * densityMultiplier.ml, 1000); // Max 1kg
  }
  if (unitLower.includes('l') || unitLower === 'liter' || unitLower === 'liters') {
    return Math.min(amount * densityMultiplier.liter, 5000); // Max 5kg
  }
  
  // Weight conversions (exact)
  if (unitLower.includes('oz') || unitLower === 'ounce' || unitLower === 'ounces') {
    return Math.min(amount * 28.35, 1000); // 1 oz = 28.35g
  }
  if (unitLower.includes('lb') || unitLower === 'pound' || unitLower === 'pounds') {
    return Math.min(amount * 453.59, 2000); // 1 lb = 453.59g
  }
  if (unitLower.includes('kg') || unitLower === 'kilogram' || unitLower === 'kilograms') {
    return Math.min(amount * 1000, 5000); // 1 kg = 1000g
  }
  if (unitLower.includes('g') || unitLower === 'gram' || unitLower === 'grams') {
    return Math.min(amount, 2000); // Already in grams
  }
  
  // Count-based items
  if (unitLower.includes('slice') || unitLower === 'slices') {
    return Math.min(amount * 25, 500); // 1 slice ≈ 25g
  }
  if (unitLower.includes('piece') || unitLower === 'pieces') {
    return Math.min(amount * 50, 1000); // 1 piece ≈ 50g
  }
  if (unitLower.includes('clove') || unitLower === 'cloves') {
    return Math.min(amount * 3, 50); // 1 clove garlic ≈ 3g
  }
  
  // Default: assume grams
  return Math.min(amount, 1000);
}

/**
 * Get density multipliers for different ingredient types
 * Ensures accurate volume to weight conversions
 */
function getDensityMultiplier(ingredient: string): {
  cup: number;
  tbsp: number;
  tsp: number;
  ml: number;
  liter: number;
} {
  const name = ingredient.toLowerCase();
  
  // Oils and fats (less dense than water)
  if (name.includes('oil') || name.includes('butter') || name.includes('fat') || 
      name.includes('lard') || name.includes('shortening') || name.includes('margarine')) {
    return {
      cup: 216,    // 1 cup oil ≈ 216g
      tbsp: 13.5,  // 1 tbsp oil ≈ 13.5g
      tsp: 4.5,    // 1 tsp oil ≈ 4.5g
      ml: 0.9,     // 1 ml oil ≈ 0.9g
      liter: 900   // 1 liter oil ≈ 900g
    };
  }
  
  // Dense ingredients (flour, sugar, salt)
  if (name.includes('flour') || name.includes('sugar') || name.includes('salt') || 
      name.includes('baking') || name.includes('powder') || name.includes('cornstarch') ||
      name.includes('cocoa') || name.includes('brown sugar')) {
    return {
      cup: 120,    // 1 cup flour ≈ 120g
      tbsp: 8,     // 1 tbsp flour ≈ 8g
      tsp: 3,      // 1 tsp flour ≈ 3g
      ml: 0.5,     // 1 ml flour ≈ 0.5g
      liter: 500   // 1 liter flour ≈ 500g
    };
  }
  
  // Nuts and seeds
  if (name.includes('nut') || name.includes('seed') || name.includes('almond') ||
      name.includes('walnut') || name.includes('pecan') || name.includes('cashew') ||
      name.includes('pistachio') || name.includes('hazelnut') || name.includes('macadamia')) {
    return {
      cup: 150,    // 1 cup nuts ≈ 150g
      tbsp: 9,     // 1 tbsp nuts ≈ 9g
      tsp: 3,      // 1 tsp nuts ≈ 3g
      ml: 0.6,     // 1 ml nuts ≈ 0.6g
      liter: 600   // 1 liter nuts ≈ 600g
    };
  }
  
  // Cheese
  if (name.includes('cheese') || name.includes('cheddar') || name.includes('mozzarella') ||
      name.includes('parmesan') || name.includes('swiss') || name.includes('feta')) {
    return {
      cup: 100,    // 1 cup cheese ≈ 100g
      tbsp: 6,     // 1 tbsp cheese ≈ 6g
      tsp: 2,      // 1 tsp cheese ≈ 2g
      ml: 0.4,     // 1 ml cheese ≈ 0.4g
      liter: 400   // 1 liter cheese ≈ 400g
    };
  }
  
  // Standard density (most vegetables, fruits, etc.)
  return {
    cup: 240,    // 1 cup ≈ 240g (water density)
    tbsp: 15,    // 1 tbsp ≈ 15g
    tsp: 5,      // 1 tsp ≈ 5g
    ml: 1,       // 1 ml ≈ 1g
    liter: 1000  // 1 liter ≈ 1000g
  };
}

/**
 * Find matching ingredient in nutrition database
 * Uses fuzzy matching to handle variations in ingredient names
 */
export function findIngredientMatch(cleanName: string): string | null {
  const ingredients = nutritionDatabase.ingredients;
  
  // Direct match first
  if (ingredients[cleanName]) {
    return cleanName;
  }
  
  // Try exact word matches
  const cleanWords = cleanName.split(' ').filter(word => word.length > 2);
  for (const word of cleanWords) {
    if (ingredients[word]) {
      return word;
    }
  }
  
  // Try partial matches for longer words
  for (const [key, nutrition] of Object.entries(ingredients)) {
    if (key.length >= 4 && cleanName.includes(key)) {
      return key;
    }
    if (cleanName.length >= 4 && key.includes(cleanName)) {
      return key;
    }
  }
  
  // Try word-by-word matching with minimum length requirement
  for (const word of cleanWords) {
    if (word.length >= 4) {
      for (const [key, nutrition] of Object.entries(ingredients)) {
        if (key.length >= 4 && (key.includes(word) || word.includes(key))) {
          return key;
        }
      }
    }
  }
  
  return null;
}

/**
 * Calculate nutrition for a single ingredient
 * Returns null if ingredient not found in database
 */
export function calculateIngredientNutrition(ingredient: string): IngredientNutrition | null {
  const { amount, unit, cleanName } = parseIngredient(ingredient);
  const matchedKey = findIngredientMatch(cleanName);
  
  if (!matchedKey) {
    return null;
  }
  
  const baseNutrition = nutritionDatabase.ingredients[matchedKey];
  const grams = convertToGrams(amount, unit, ingredient);
  const multiplier = grams / 100; // Convert to per 100g basis
  
  // Cap multiplier to prevent unrealistic results
  const maxMultiplier = 20; // Max 20x the base amount (2kg of any ingredient)
  const safeMultiplier = Math.min(multiplier, maxMultiplier);
  
  // Calculate nutrition values
  const nutrition: NutritionData = {
    calories: Math.round(baseNutrition.calories * safeMultiplier),
    protein: Math.round(baseNutrition.protein * safeMultiplier * 10) / 10,
    carbs: Math.round(baseNutrition.carbs * safeMultiplier * 10) / 10,
    fat: Math.round(baseNutrition.fat * safeMultiplier * 10) / 10,
  };
  
  return {
    ingredient: ingredient,
    amount: grams,
    unit: 'g',
    nutrition: nutrition
  };
}

/**
 * Calculate total nutrition for a recipe
 * Sums all ingredient nutrition and divides by serving size
 */
export function calculateRecipeNutrition(ingredients: string[], servings: number = 4): RecipeNutrition {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  
  const matchedIngredients: IngredientNutrition[] = [];
  const unmatchedIngredients: string[] = [];
  
  // Calculate nutrition for each ingredient
  ingredients.forEach((ingredient) => {
    const ingredientNutrition = calculateIngredientNutrition(ingredient);
    
    if (ingredientNutrition) {
      matchedIngredients.push(ingredientNutrition);
      
      totalCalories += ingredientNutrition.nutrition.calories;
      totalProtein += ingredientNutrition.nutrition.protein;
      totalCarbs += ingredientNutrition.nutrition.carbs;
      totalFat += ingredientNutrition.nutrition.fat;
    } else {
      unmatchedIngredients.push(ingredient);
    }
  });
  
  // Calculate per-serving nutrition
  const nutrition: NutritionData = {
    calories: Math.round(totalCalories / servings),
    protein: Math.round((totalProtein / servings) * 10) / 10,
    carbs: Math.round((totalCarbs / servings) * 10) / 10,
    fat: Math.round((totalFat / servings) * 10) / 10,
  };
  
  return {
    nutrition,
    matchedIngredients,
    unmatchedIngredients
  };
}

/**
 * Get list of available ingredients in the database
 * Useful for debugging and validation
 */
export function getAvailableIngredients(): string[] {
  return Object.keys(nutritionDatabase.ingredients);
}

/**
 * Check if an ingredient exists in the database
 */
export function hasIngredient(ingredient: string): boolean {
  const { cleanName } = parseIngredient(ingredient);
  return findIngredientMatch(cleanName) !== null;
}

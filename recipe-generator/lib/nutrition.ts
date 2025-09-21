import nutritionDatabase from '@/data/nutrition-database.json';
import { getCorrectedNutrition, getConservativeHighFatDefault } from './nutrition-fix';

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface IngredientNutrition {
  ingredient: string;
  amount: number;
  unit: string;
  nutrition: NutritionInfo;
}

/**
 * Parse ingredient string to extract amount, unit, and clean ingredient name
 */
export function parseIngredient(ingredient: string): {
  amount: number;
  unit: string;
  cleanName: string;
} {
  const lowerIngredient = ingredient.toLowerCase().trim();
  
  // Extract amount and unit
  const amountMatch = lowerIngredient.match(/(\d+(?:\.\d+)?)\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?|slices?|pieces?|cloves?)/i);
  
  let amount = 1; // Default amount
  let unit = 'piece'; // Default unit
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
    unit = amountMatch[2].toLowerCase();
  }
  
  // Clean ingredient name by removing amounts, units, and common descriptors
  let cleanName = lowerIngredient
    .replace(/\d+(?:\.\d+)?\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?|slices?|pieces?|cloves?)/g, '')
    .replace(/(chopped|diced|sliced|minced|grated|shredded|fresh|dried|frozen|canned|raw|cooked|boiled|fried|grilled|baked|large|small|medium|thick|thin)/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  // If no amount was specified, use conservative defaults based on ingredient type
  if (!amountMatch) {
    const conservativeDefault = getConservativeDefault(cleanName);
    amount = conservativeDefault.amount;
    unit = conservativeDefault.unit;
  }
  
  return { amount, unit, cleanName };
}

/**
 * Get conservative default amount for ingredients without specified amounts
 */
export function getConservativeDefault(cleanName: string): { amount: number; unit: string } {
  const name = cleanName.toLowerCase();
  
  // Seasonings and spices - very small amounts
  if (name.includes('salt') || name.includes('pepper') || name.includes('spice') || 
      name.includes('herb') || name.includes('seasoning') || name.includes('garlic') ||
      name.includes('onion') || name.includes('ginger') || name.includes('cumin') ||
      name.includes('paprika') || name.includes('oregano') || name.includes('basil') ||
      name.includes('thyme') || name.includes('rosemary') || name.includes('parsley')) {
    return { amount: 1, unit: 'tsp' }; // 1 tsp = 5g
  }
  
  // Oils and fats - very small amounts (use conservative high-fat defaults)
  if (name.includes('oil') || name.includes('butter') || name.includes('fat') ||
      name.includes('lard') || name.includes('shortening')) {
    return getConservativeHighFatDefault(cleanName);
  }
  
  // Condiments and sauces - very small amounts (use conservative high-fat defaults)
  if (name.includes('sauce') || name.includes('ketchup') || name.includes('mustard') ||
      name.includes('mayo') || name.includes('vinegar') || name.includes('soy') ||
      name.includes('worcestershire') || name.includes('hot sauce')) {
    return getConservativeHighFatDefault(cleanName);
  }
  
  // Dairy - moderate amounts
  if (name.includes('cheese') || name.includes('milk') || name.includes('cream') ||
      name.includes('yogurt') || name.includes('sour cream')) {
    return { amount: 0.25, unit: 'cup' }; // 0.25 cup = 60g
  }
  
  // Vegetables - moderate amounts
  if (name.includes('lettuce') || name.includes('spinach') || name.includes('tomato') ||
      name.includes('onion') || name.includes('pepper') || name.includes('carrot') ||
      name.includes('celery') || name.includes('cucumber') || name.includes('mushroom')) {
    return { amount: 0.5, unit: 'cup' }; // 0.5 cup = 120g
  }
  
  // Proteins - moderate amounts
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
      name.includes('fish') || name.includes('egg') || name.includes('tofu') ||
      name.includes('bean') || name.includes('lentil')) {
    return { amount: 100, unit: 'g' }; // 100g
  }
  
  // Grains and starches - moderate amounts
  if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
      name.includes('flour') || name.includes('potato') || name.includes('quinoa')) {
    return { amount: 0.5, unit: 'cup' }; // 0.5 cup = 120g
  }
  
  // Nuts and seeds - small amounts
  if (name.includes('nut') || name.includes('seed') || name.includes('almond') ||
      name.includes('walnut') || name.includes('pecan') || name.includes('cashew')) {
    return { amount: 1, unit: 'tbsp' }; // 1 tbsp = 15g
  }
  
  // Default conservative amount for unknown ingredients
  return { amount: 1, unit: 'tbsp' }; // 1 tbsp = 15g (very conservative)
}

/**
 * Convert various units to grams for consistent calculation
 */
export function convertToGrams(amount: number, unit: string, ingredientName?: string): number {
  const unitLower = unit.toLowerCase();
  const ingredient = ingredientName?.toLowerCase() || '';
  
  // Get ingredient-specific density multipliers
  const densityMultipliers = getDensityMultipliers(ingredient);
  
  // Volume to weight conversions with ingredient-specific densities
  if (unitLower.includes('cup') || unitLower === 'cups') {
    return Math.min(amount * densityMultipliers.cup, 2000); // Max 2kg
  }
  if (unitLower.includes('tbsp') || unitLower === 'tablespoon' || unitLower === 'tablespoons') {
    return Math.min(amount * densityMultipliers.tbsp, 200); // Max 200g
  }
  if (unitLower.includes('tsp') || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
    return Math.min(amount * densityMultipliers.tsp, 100); // Max 100g
  }
  
  // Metric volume conversions
  if (unitLower.includes('ml') || unitLower.includes('milliliter') || unitLower === 'ml' || unitLower === 'milliliters') {
    return Math.min(amount * densityMultipliers.ml, 1000); // Max 1kg
  }
  if (unitLower.includes('l') || unitLower.includes('liter') || unitLower === 'liters') {
    return Math.min(amount * densityMultipliers.liter, 5000); // Max 5kg
  }
  
  // Weight conversions (these are exact, no density needed)
  if (unitLower.includes('oz') || unitLower.includes('ounce') || unitLower === 'ounces') {
    return Math.min(amount * 28.35, 1000); // 1 oz = 28.35g, max 1kg
  }
  if (unitLower.includes('lb') || unitLower.includes('pound') || unitLower === 'pounds') {
    return Math.min(amount * 453.59, 2000); // 1 lb = 453.59g, max 2kg
  }
  if (unitLower.includes('kg') || unitLower.includes('kilogram') || unitLower === 'kilograms') {
    return Math.min(amount * 1000, 5000); // 1 kg = 1000g, max 5kg
  }
  if (unitLower.includes('g') || unitLower.includes('gram') || unitLower === 'grams') {
    return Math.min(amount, 2000); // Already in grams, max 2kg
  }
  
  // Count-based items (approximate weights)
  if (unitLower.includes('slice') || unitLower === 'slices') {
    return Math.min(amount * 25, 500); // 1 slice ≈ 25g, max 500g
  }
  if (unitLower.includes('piece') || unitLower === 'pieces') {
    return Math.min(amount * 50, 1000); // 1 piece ≈ 50g, max 1kg
  }
  if (unitLower.includes('clove') || unitLower === 'cloves') {
    return Math.min(amount * 3, 50); // 1 clove garlic ≈ 3g, max 50g
  }
  
  // Default: assume grams with reasonable limit
  return Math.min(amount, 1000);
}

/**
 * Get density multipliers for different ingredient types
 */
function getDensityMultipliers(ingredient: string): {
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
  
  // Dense ingredients (heavier than water)
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
  
  // Nuts and seeds (moderate density)
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
  
  // Dairy products (slightly less dense than water)
  if (name.includes('milk') || name.includes('cream') || name.includes('yogurt') ||
      name.includes('buttermilk') || name.includes('sour cream')) {
    return {
      cup: 240,    // 1 cup milk ≈ 240g
      tbsp: 15,    // 1 tbsp milk ≈ 15g
      tsp: 5,      // 1 tsp milk ≈ 5g
      ml: 1,       // 1 ml milk ≈ 1g
      liter: 1000  // 1 liter milk ≈ 1000g
    };
  }
  
  // Cheese (moderate density)
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
 */
export function findIngredientMatch(cleanName: string): string | null {
  const ingredients = nutritionDatabase.ingredients;
  
  // Direct match first
  if (ingredients[cleanName]) {
    return cleanName;
  }
  
  // Try exact word matches (more precise)
  const cleanWords = cleanName.split(' ').filter(word => word.length > 2);
  for (const word of cleanWords) {
    if (ingredients[word]) {
      return word;
    }
  }
  
  // Try partial matches only for longer words (more precise)
  for (const [key, nutrition] of Object.entries(ingredients)) {
    // Only match if the key is at least 4 characters and is contained in cleanName
    if (key.length >= 4 && cleanName.includes(key)) {
      return key;
    }
    // Or if cleanName is at least 4 characters and is contained in key
    if (cleanName.length >= 4 && key.includes(cleanName)) {
      return key;
    }
  }
  
  // Try word-by-word matching with minimum length requirement
  for (const word of cleanWords) {
    if (word.length >= 4) { // Only match words with 4+ characters
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
 */
export function calculateIngredientNutrition(ingredient: string): IngredientNutrition | null {
  const { amount, unit, cleanName } = parseIngredient(ingredient);
  const matchedKey = findIngredientMatch(cleanName);
  
  if (!matchedKey) {
    return null;
  }
  
    const baseNutrition = nutritionDatabase.ingredients[matchedKey];
    const correctedNutrition = getCorrectedNutrition(ingredient, baseNutrition);
    const grams = convertToGrams(amount, unit, ingredient);
    const multiplier = grams / 100; // Convert to per 100g basis
  
  // Validate reasonable amounts - if multiplier is too high, cap it
  const maxMultiplier = 20; // Max 20x the base amount (2kg of any ingredient)
  const safeMultiplier = Math.min(multiplier, maxMultiplier);
  
    // Calculate macronutrient calories (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
    const proteinCalories = correctedNutrition.protein * safeMultiplier * 4;
    const carbCalories = correctedNutrition.carbs * safeMultiplier * 4;
    const fatCalories = correctedNutrition.fat * safeMultiplier * 9;
    const calculatedTotalCalories = proteinCalories + carbCalories + fatCalories;
    
    // Always use calculated calories for consistency
    // This ensures calories = (protein * 4) + (carbs * 4) + (fat * 9)
    const totalCalories = calculatedTotalCalories;
  
  // Cap individual nutrition values to prevent unrealistic results
  const maxCaloriesPerIngredient = 1000; // Max 1000 calories per ingredient (more reasonable)
  const maxProteinPerIngredient = 100; // Max 100g protein per ingredient
  const maxCarbsPerIngredient = 250; // Max 250g carbs per ingredient
  const maxFatPerIngredient = 100; // Max 100g fat per ingredient
  
    return {
      ingredient: ingredient,
      amount: grams,
      unit: 'g',
      nutrition: {
        calories: Math.min(Math.round(totalCalories), maxCaloriesPerIngredient),
        protein: Math.min(Math.round(correctedNutrition.protein * safeMultiplier * 10) / 10, maxProteinPerIngredient),
        carbs: Math.min(Math.round(correctedNutrition.carbs * safeMultiplier * 10) / 10, maxCarbsPerIngredient),
        fat: Math.min(Math.round(correctedNutrition.fat * safeMultiplier * 10) / 10, maxFatPerIngredient),
        fiber: correctedNutrition.fiber ? Math.min(Math.round(correctedNutrition.fiber * safeMultiplier * 10) / 10, 100) : undefined,
        sugar: correctedNutrition.sugar ? Math.min(Math.round(correctedNutrition.sugar * safeMultiplier * 10) / 10, 200) : undefined,
        sodium: correctedNutrition.sodium ? Math.min(Math.round(correctedNutrition.sodium * safeMultiplier), 10000) : undefined,
      }
    };
}

/**
 * Calculate total nutrition for a list of ingredients
 */
export function calculateRecipeNutrition(ingredients: string[], servings: number = 4): {
  nutrition: NutritionInfo;
  matchedIngredients: IngredientNutrition[];
  unmatchedIngredients: string[];
} {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSugar = 0;
  let totalSodium = 0;
  
  const matchedIngredients: IngredientNutrition[] = [];
  const unmatchedIngredients: string[] = [];
  
  console.log(`Calculating nutrition for ${ingredients.length} ingredients, ${servings} servings`);
  
  ingredients.forEach((ingredient, index) => {
    const ingredientNutrition = calculateIngredientNutrition(ingredient);
    
    if (ingredientNutrition) {
      matchedIngredients.push(ingredientNutrition);
      
      console.log(`Ingredient ${index + 1}: ${ingredient}`);
      console.log(`  Amount: ${ingredientNutrition.amount}g`);
      console.log(`  Nutrition: ${ingredientNutrition.nutrition.calories} cal, ${ingredientNutrition.nutrition.protein}g protein, ${ingredientNutrition.nutrition.carbs}g carbs, ${ingredientNutrition.nutrition.fat}g fat`);
      
      totalCalories += ingredientNutrition.nutrition.calories;
      totalProtein += ingredientNutrition.nutrition.protein;
      totalCarbs += ingredientNutrition.nutrition.carbs;
      totalFat += ingredientNutrition.nutrition.fat;
      
      if (ingredientNutrition.nutrition.fiber) {
        totalFiber += ingredientNutrition.nutrition.fiber;
      }
      if (ingredientNutrition.nutrition.sugar) {
        totalSugar += ingredientNutrition.nutrition.sugar;
      }
      if (ingredientNutrition.nutrition.sodium) {
        totalSodium += ingredientNutrition.nutrition.sodium;
      }
    } else {
      unmatchedIngredients.push(ingredient);
      console.log(`Ingredient ${index + 1}: ${ingredient} - NO MATCH FOUND`);
    }
  });
  
  console.log(`Total recipe nutrition: ${totalCalories} cal, ${totalProtein}g protein, ${totalCarbs}g carbs, ${totalFat}g fat`);
  console.log(`Dividing by ${servings} servings...`);
  
  // Calculate per-serving values
  const proteinPerServing = totalProtein / servings;
  const carbsPerServing = totalCarbs / servings;
  const fatPerServing = totalFat / servings;
  
  // Calculate calories from macronutrients (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
  const caloriesFromMacros = (proteinPerServing * 4) + (carbsPerServing * 4) + (fatPerServing * 9);
  const totalCaloriesPerServing = totalCalories / servings;
  
  console.log(`Per serving: ${totalCaloriesPerServing} cal from database, ${caloriesFromMacros} cal from macros`);
  console.log(`Difference: ${Math.abs(totalCaloriesPerServing - caloriesFromMacros)} cal`);
  
  // Always use macronutrient-based calories for consistency
  // This ensures calories = (protein * 4) + (carbs * 4) + (fat * 9)
  const finalCalories = caloriesFromMacros;
  
  // Cap per-serving values to prevent unrealistic results
  const maxCaloriesPerServing = 1500; // Max 1500 calories per serving (more reasonable)
  const maxProteinPerServing = 80; // Max 80g protein per serving
  const maxCarbsPerServing = 150; // Max 150g carbs per serving
  const maxFatPerServing = 80; // Max 80g fat per serving
  
  const nutrition: NutritionInfo = {
    calories: Math.min(Math.round(finalCalories), maxCaloriesPerServing),
    protein: Math.min(Math.round(proteinPerServing * 10) / 10, maxProteinPerServing),
    carbs: Math.min(Math.round(carbsPerServing * 10) / 10, maxCarbsPerServing),
    fat: Math.min(Math.round(fatPerServing * 10) / 10, maxFatPerServing),
    fiber: totalFiber > 0 ? Math.min(Math.round(totalFiber / servings * 10) / 10, 50) : undefined,
    sugar: totalSugar > 0 ? Math.min(Math.round(totalSugar / servings * 10) / 10, 100) : undefined,
    sodium: totalSodium > 0 ? Math.min(Math.round(totalSodium / servings), 5000) : undefined,
  };
  
  // Check if any values were capped and log warnings
  if (finalCalories > maxCaloriesPerServing) {
    console.warn(`⚠️ Calories capped from ${Math.round(finalCalories)} to ${maxCaloriesPerServing} per serving`);
  }
  if (proteinPerServing > maxProteinPerServing) {
    console.warn(`⚠️ Protein capped from ${Math.round(proteinPerServing * 10) / 10} to ${maxProteinPerServing}g per serving`);
  }
  if (carbsPerServing > maxCarbsPerServing) {
    console.warn(`⚠️ Carbs capped from ${Math.round(carbsPerServing * 10) / 10} to ${maxCarbsPerServing}g per serving`);
  }
  if (fatPerServing > maxFatPerServing) {
    console.warn(`⚠️ Fat capped from ${Math.round(fatPerServing * 10) / 10} to ${maxFatPerServing}g per serving`);
  }
  
  console.log(`Final per-serving nutrition:`, nutrition);
  
  return {
    nutrition,
    matchedIngredients,
    unmatchedIngredients
  };
}

/**
 * Get all available ingredients in the database
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

/**
 * Debug function to validate nutrition calculations
 */
export function validateNutritionCalculation(nutrition: NutritionInfo): {
  isValid: boolean;
  calculatedCalories: number;
  difference: number;
  breakdown: {
    proteinCalories: number;
    carbCalories: number;
    fatCalories: number;
  };
} {
  const proteinCalories = nutrition.protein * 4;
  const carbCalories = nutrition.carbs * 4;
  const fatCalories = nutrition.fat * 9;
  const calculatedCalories = proteinCalories + carbCalories + fatCalories;
  const difference = Math.abs(nutrition.calories - calculatedCalories);
  
  return {
    isValid: difference < 50, // Allow 50 calorie difference
    calculatedCalories: Math.round(calculatedCalories),
    difference: Math.round(difference),
    breakdown: {
      proteinCalories: Math.round(proteinCalories),
      carbCalories: Math.round(carbCalories),
      fatCalories: Math.round(fatCalories),
    }
  };
}

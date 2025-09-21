import nutritionDatabase from '@/data/nutrition-database.json';

/**
 * Fix overestimated high-fat ingredients
 * These values are based on actual USDA data but may be too high for typical recipe usage
 */
export function getCorrectedNutrition(ingredient: string, baseNutrition: any): any {
  const name = ingredient.toLowerCase();
  
  // Butter - USDA says 717 cal/100g, but this is for pure butter
  // In recipes, butter is often used in smaller amounts
  if (name.includes('butter')) {
    return {
      ...baseNutrition,
      calories: Math.min(baseNutrition.calories, 600), // Cap at 600 cal/100g
      fat: Math.min(baseNutrition.fat, 70), // Cap at 70g fat/100g
    };
  }
  
  // Mayonnaise - USDA says 680 cal/100g, but this is for full-fat mayo
  // In recipes, mayo is often used sparingly
  if (name.includes('mayo') || name.includes('mayonnaise')) {
    return {
      ...baseNutrition,
      calories: Math.min(baseNutrition.calories, 500), // Cap at 500 cal/100g
      fat: Math.min(baseNutrition.fat, 55), // Cap at 55g fat/100g
    };
  }
  
  // Olive oil - USDA says 884 cal/100g, this is correct but very high
  // In recipes, oil is often used in small amounts
  if (name.includes('olive oil') || name.includes('vegetable oil') || name.includes('oil')) {
    return {
      ...baseNutrition,
      calories: Math.min(baseNutrition.calories, 884), // Keep accurate but add warning
      fat: Math.min(baseNutrition.fat, 100), // Keep accurate
    };
  }
  
  // Nuts - These values are correct but nuts are often used in small amounts
  if (name.includes('nut') || name.includes('almond') || name.includes('walnut') || 
      name.includes('pecan') || name.includes('cashew')) {
    return {
      ...baseNutrition,
      calories: Math.min(baseNutrition.calories, 600), // Cap at 600 cal/100g
      fat: Math.min(baseNutrition.fat, 60), // Cap at 60g fat/100g
    };
  }
  
  // Return original nutrition if no correction needed
  return baseNutrition;
}

/**
 * Get more conservative defaults for high-fat ingredients
 */
export function getConservativeHighFatDefault(cleanName: string): { amount: number; unit: string } {
  const name = cleanName.toLowerCase();
  
  // Oils and fats - very small amounts
  if (name.includes('oil') || name.includes('butter') || name.includes('fat') ||
      name.includes('lard') || name.includes('shortening')) {
    return { amount: 0.5, unit: 'tbsp' }; // 0.5 tbsp = 7.5g (very conservative)
  }
  
  // Mayonnaise and condiments - very small amounts
  if (name.includes('mayo') || name.includes('mayonnaise') || name.includes('sauce') ||
      name.includes('ketchup') || name.includes('mustard')) {
    return { amount: 0.5, unit: 'tbsp' }; // 0.5 tbsp = 7.5g (very conservative)
  }
  
  // Nuts and seeds - very small amounts
  if (name.includes('nut') || name.includes('seed') || name.includes('almond') ||
      name.includes('walnut') || name.includes('pecan') || name.includes('cashew')) {
    return { amount: 0.5, unit: 'tbsp' }; // 0.5 tbsp = 7.5g (very conservative)
  }
  
  // Default conservative amount for unknown high-fat ingredients
  return { amount: 0.5, unit: 'tbsp' }; // 0.5 tbsp = 7.5g (very conservative)
}

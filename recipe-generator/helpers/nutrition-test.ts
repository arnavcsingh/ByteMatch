import { calculateRecipeNutrition, parseIngredient, convertToGrams, findIngredientMatch } from './nutrition-calculator';

/**
 * Test function to validate nutrition calculations
 * Run this to verify the system is working correctly
 */
export function testNutritionCalculations() {
  console.log('🧪 Testing Nutrition Calculations');
  console.log('================================');
  
  // Test 1: Basic ingredient parsing
  console.log('\n📝 Test 1: Ingredient Parsing');
  const testIngredients = [
    '2 cups flour',
    '1 tbsp olive oil',
    '3 cloves garlic',
    '1 lb ground beef',
    'salt and pepper'
  ];
  
  testIngredients.forEach(ingredient => {
    const parsed = parseIngredient(ingredient);
    console.log(`"${ingredient}" → amount: ${parsed.amount}, unit: "${parsed.unit}", name: "${parsed.cleanName}"`);
  });
  
  // Test 2: Unit conversions
  console.log('\n📏 Test 2: Unit Conversions');
  const conversions = [
    { amount: 1, unit: 'cup', ingredient: 'flour' },
    { amount: 2, unit: 'tbsp', ingredient: 'olive oil' },
    { amount: 1, unit: 'lb', ingredient: 'ground beef' },
    { amount: 3, unit: 'clove', ingredient: 'garlic' }
  ];
  
  conversions.forEach(({ amount, unit, ingredient }) => {
    const grams = convertToGrams(amount, unit, ingredient);
    console.log(`${amount} ${unit} of ${ingredient} = ${grams}g`);
  });
  
  // Test 3: Ingredient matching
  console.log('\n🔍 Test 3: Ingredient Matching');
  const testNames = [
    'flour',
    'olive oil',
    'ground beef',
    'garlic',
    'salt',
    'unknown ingredient'
  ];
  
  testNames.forEach(name => {
    const match = findIngredientMatch(name);
    console.log(`"${name}" → ${match || 'NO MATCH'}`);
  });
  
  // Test 4: Complete recipe calculation
  console.log('\n🍽️ Test 4: Complete Recipe Calculation');
  const testRecipe = [
    '2 cups flour',
    '1 tbsp olive oil',
    '1 lb ground beef',
    '3 cloves garlic',
    'salt and pepper'
  ];
  
  const result = calculateRecipeNutrition(testRecipe, 4);
  
  console.log(`Recipe: ${testRecipe.length} ingredients, 4 servings`);
  console.log(`Matched: ${result.matchedIngredients.length} ingredients`);
  console.log(`Unmatched: ${result.unmatchedIngredients.length} ingredients`);
  
  if (result.unmatchedIngredients.length > 0) {
    console.log(`Unmatched ingredients: ${result.unmatchedIngredients.join(', ')}`);
  }
  
  console.log('\n📊 Per-Serving Nutrition:');
  console.log(`Calories: ${result.nutrition.calories}`);
  console.log(`Protein: ${result.nutrition.protein}g`);
  console.log(`Carbs: ${result.nutrition.carbs}g`);
  console.log(`Fat: ${result.nutrition.fat}g`);
  
  // Test 5: Validation
  console.log('\n✅ Test 5: Validation');
  const calculatedCalories = (result.nutrition.protein * 4) + (result.nutrition.carbs * 4) + (result.nutrition.fat * 9);
  const difference = Math.abs(result.nutrition.calories - calculatedCalories);
  
  console.log(`Database calories: ${result.nutrition.calories}`);
  console.log(`Calculated calories: ${Math.round(calculatedCalories)}`);
  console.log(`Difference: ${Math.round(difference)} cal`);
  console.log(`Status: ${difference < 50 ? '✅ Valid' : '⚠️ Inconsistent'}`);
  
  console.log('\n🎉 Nutrition calculation tests completed!');
  
  return {
    success: true,
    matchedIngredients: result.matchedIngredients.length,
    unmatchedIngredients: result.unmatchedIngredients.length,
    nutrition: result.nutrition,
    isValid: difference < 50
  };
}

// Example usage:
// testNutritionCalculations();

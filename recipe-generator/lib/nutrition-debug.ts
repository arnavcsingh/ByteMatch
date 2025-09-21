import nutritionDatabase from '@/data/nutrition-database.json';
import { parseIngredient, convertToGrams, findIngredientMatch } from './nutrition';

/**
 * Debug tool to analyze nutrition calculation issues
 */
export function debugNutritionCalculation(ingredients: string[], servings: number = 4) {
  console.log('🔍 NUTRITION DEBUG ANALYSIS');
  console.log('================================');
  console.log(`Recipe: ${ingredients.length} ingredients, ${servings} servings`);
  console.log('');

  const issues: string[] = [];
  const results: any[] = [];

  ingredients.forEach((ingredient, index) => {
    console.log(`📝 Ingredient ${index + 1}: "${ingredient}"`);
    
    // Parse ingredient
    const parsed = parseIngredient(ingredient);
    const hasAmount = /\d+(?:\.\d+)?\s*(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?|slices?|pieces?|cloves?)/i.test(ingredient.toLowerCase());
    console.log(`   Parsed: amount=${parsed.amount}, unit="${parsed.unit}", cleanName="${parsed.cleanName}"`);
    if (!hasAmount) {
      console.log(`   ⚠️  NO AMOUNT SPECIFIED - Using conservative default: ${parsed.amount} ${parsed.unit}`);
    }
    
    // Convert to grams
    const grams = convertToGrams(parsed.amount, parsed.unit, ingredient);
    console.log(`   Converted: ${grams}g (multiplier: ${grams/100}x)`);
    
    // Show unit conversion details
    const unitLower = parsed.unit.toLowerCase();
    const ingredientLower = ingredient.toLowerCase();
    
    if (unitLower.includes('tbsp')) {
      if (ingredientLower.includes('oil') || ingredientLower.includes('butter')) {
        console.log(`   📏 Oil/Fat conversion: ${parsed.amount} tbsp = ${grams}g (13.5g per tbsp)`);
      } else if (ingredientLower.includes('flour') || ingredientLower.includes('sugar')) {
        console.log(`   📏 Dense ingredient conversion: ${parsed.amount} tbsp = ${grams}g (8g per tbsp)`);
      } else if (ingredientLower.includes('nut') || ingredientLower.includes('almond')) {
        console.log(`   📏 Nuts conversion: ${parsed.amount} tbsp = ${grams}g (9g per tbsp)`);
      } else if (ingredientLower.includes('cheese')) {
        console.log(`   📏 Cheese conversion: ${parsed.amount} tbsp = ${grams}g (6g per tbsp)`);
      } else {
        console.log(`   📏 Standard conversion: ${parsed.amount} tbsp = ${grams}g (15g per tbsp)`);
      }
    } else if (unitLower.includes('cup')) {
      if (ingredientLower.includes('oil') || ingredientLower.includes('butter')) {
        console.log(`   📏 Oil/Fat conversion: ${parsed.amount} cup = ${grams}g (216g per cup)`);
      } else if (ingredientLower.includes('flour') || ingredientLower.includes('sugar')) {
        console.log(`   📏 Dense ingredient conversion: ${parsed.amount} cup = ${grams}g (120g per cup)`);
      } else if (ingredientLower.includes('nut') || ingredientLower.includes('almond')) {
        console.log(`   📏 Nuts conversion: ${parsed.amount} cup = ${grams}g (150g per cup)`);
      } else if (ingredientLower.includes('cheese')) {
        console.log(`   📏 Cheese conversion: ${parsed.amount} cup = ${grams}g (100g per cup)`);
      } else {
        console.log(`   📏 Standard conversion: ${parsed.amount} cup = ${grams}g (240g per cup)`);
      }
    } else if (unitLower.includes('tsp')) {
      if (ingredientLower.includes('oil') || ingredientLower.includes('butter')) {
        console.log(`   📏 Oil/Fat conversion: ${parsed.amount} tsp = ${grams}g (4.5g per tsp)`);
      } else if (ingredientLower.includes('flour') || ingredientLower.includes('sugar')) {
        console.log(`   📏 Dense ingredient conversion: ${parsed.amount} tsp = ${grams}g (3g per tsp)`);
      } else {
        console.log(`   📏 Standard conversion: ${parsed.amount} tsp = ${grams}g (5g per tsp)`);
      }
    }
    
    // Check for potential issues
    if (parsed.amount > 10) {
      issues.push(`Large amount: ${parsed.amount} ${parsed.unit} of ${parsed.cleanName}`);
    }
    
    if (grams > 1000) {
      issues.push(`Large weight: ${grams}g of ${parsed.cleanName}`);
    }
    
    // Find match
    const matchedKey = findIngredientMatch(parsed.cleanName);
    if (!matchedKey) {
      issues.push(`No match found for: ${parsed.cleanName}`);
      console.log(`   ❌ NO MATCH FOUND`);
      results.push({ ingredient, status: 'no_match' });
    } else {
      console.log(`   ✅ Matched: "${matchedKey}"`);
      
      const baseNutrition = nutritionDatabase.ingredients[matchedKey];
      const multiplier = grams / 100;
      
      console.log(`   Base nutrition (per 100g): ${baseNutrition.calories} cal, ${baseNutrition.protein}g protein, ${baseNutrition.carbs}g carbs, ${baseNutrition.fat}g fat`);
      
      const calculatedNutrition = {
        calories: Math.round(baseNutrition.calories * multiplier),
        protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
        carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
        fat: Math.round(baseNutrition.fat * multiplier * 10) / 10,
      };
      
      console.log(`   Calculated nutrition: ${calculatedNutrition.calories} cal, ${calculatedNutrition.protein}g protein, ${calculatedNutrition.carbs}g carbs, ${calculatedNutrition.fat}g fat`);
      
      // Check for unrealistic values
      if (calculatedNutrition.calories > 1000) {
        issues.push(`High calories: ${calculatedNutrition.calories} cal from ${ingredient}`);
      }
      
      if (calculatedNutrition.protein > 50) {
        issues.push(`High protein: ${calculatedNutrition.protein}g from ${ingredient}`);
      }
      
      results.push({ 
        ingredient, 
        status: 'matched', 
        matchedKey, 
        grams, 
        multiplier, 
        baseNutrition, 
        calculatedNutrition 
      });
    }
    
    console.log('');
  });

  // Summary
  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`Total ingredients: ${ingredients.length}`);
  console.log(`Matched ingredients: ${results.filter(r => r.status === 'matched').length}`);
  console.log(`Unmatched ingredients: ${results.filter(r => r.status === 'no_match').length}`);
  console.log('');

  if (issues.length > 0) {
    console.log('⚠️ POTENTIAL ISSUES:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  }

  // Calculate totals
  const matchedResults = results.filter(r => r.status === 'matched');
  if (matchedResults.length > 0) {
    const totalCalories = matchedResults.reduce((sum, r) => sum + r.calculatedNutrition.calories, 0);
    const totalProtein = matchedResults.reduce((sum, r) => sum + r.calculatedNutrition.protein, 0);
    const totalCarbs = matchedResults.reduce((sum, r) => sum + r.calculatedNutrition.carbs, 0);
    const totalFat = matchedResults.reduce((sum, r) => sum + r.calculatedNutrition.fat, 0);
    
    console.log('🧮 TOTAL RECIPE NUTRITION:');
    console.log(`   Total: ${totalCalories} cal, ${totalProtein}g protein, ${totalCarbs}g carbs, ${totalFat}g fat`);
    console.log(`   Per serving (÷${servings}): ${Math.round(totalCalories/servings)} cal, ${Math.round(totalProtein/servings*10)/10}g protein, ${Math.round(totalCarbs/servings*10)/10}g carbs, ${Math.round(totalFat/servings*10)/10}g fat`);
    
    // Validate macronutrient calories
    const proteinCalories = (totalProtein / servings) * 4;
    const carbCalories = (totalCarbs / servings) * 4;
    const fatCalories = (totalFat / servings) * 9;
    const calculatedTotalCalories = proteinCalories + carbCalories + fatCalories;
    const databaseTotalCalories = totalCalories / servings;
    
    console.log('');
    console.log('🔬 MACRONUTRIENT VALIDATION:');
    console.log(`   Database calories per serving: ${Math.round(databaseTotalCalories)}`);
    console.log(`   Calculated calories per serving: ${Math.round(calculatedTotalCalories)}`);
    console.log(`   Difference: ${Math.round(Math.abs(databaseTotalCalories - calculatedTotalCalories))} cal`);
    console.log(`   Breakdown: P(${Math.round(proteinCalories)}) + C(${Math.round(carbCalories)}) + F(${Math.round(fatCalories)}) = ${Math.round(calculatedTotalCalories)}`);
    console.log(`   ✅ Using calculated calories for consistency: ${Math.round(calculatedTotalCalories)} cal per serving`);
  }

  return { issues, results };
}

/**
 * Test specific problematic ingredients
 */
export function testProblematicIngredients() {
  console.log('🧪 TESTING PROBLEMATIC INGREDIENTS');
  console.log('===================================');
  
  const testCases = [
    '1 cup olive oil',
    '2 cups flour', 
    '1 lb ground beef',
    '1 tbsp salt',
    '1 liter milk',
    '10 cups lettuce',
    '1 kg sugar',
    '1 slice bread',
    '1 piece cheese',
    '1 clove garlic'
  ];
  
  testCases.forEach(ingredient => {
    console.log(`\nTesting: "${ingredient}"`);
    debugNutritionCalculation([ingredient], 1);
  });
}

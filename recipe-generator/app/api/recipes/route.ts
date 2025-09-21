import { NextRequest, NextResponse } from "next/server";
import { Recipe, FilterOptions } from "@/types";
import connectDB from "@/lib/mongodb";
import RecipeModel from "@/models/Recipe";
import { pexelsService } from "@/lib/pexels";

// Spoonacular API integration via RapidAPI
const SPOONACULAR_BASE_URL = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes";

// Fetch detailed recipe information including instructions and ingredients
async function fetchDetailedRecipeInfo(recipeId: number, apiKey: string): Promise<any> {
  try {
    const response = await fetch(`${SPOONACULAR_BASE_URL}/${recipeId}/information?includeNutrition=false`, {
      headers: {
        "x-rapidapi-host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch detailed recipe ${recipeId}: ${response.status}`);
      return {};
    }

    const data = await response.json();
    return {
      extendedIngredients: data.extendedIngredients,
      analyzedInstructions: data.analyzedInstructions,
      preparationMinutes: data.preparationMinutes,
      cookingMinutes: data.cookingMinutes
    };
  } catch (error) {
    console.error(`Error fetching detailed recipe ${recipeId}:`, error);
    return {};
  }
}

// Helper function to enhance recipe image with Pexels if available and highly similar
async function enhanceRecipeImage(recipe: Recipe): Promise<Recipe> {
  try {
    // Only enhance if the current image is low quality or missing
    const currentImage = recipe.image;
    const isLowQuality = !currentImage || 
                        currentImage.includes('placeholder') || 
                        currentImage.includes('via.placeholder') ||
                        currentImage.includes('unsplash.com/photo-1556909114'); // Default fallback image
    
    if (!isLowQuality) {
      console.log(`Keeping original image for: ${recipe.title} (high quality)`);
      return recipe;
    }
    
    // Try to find a better image from Pexels
    const pexelsImage = await pexelsService.findRecipeImage(recipe.title, recipe.cuisine);
    
    if (pexelsImage) {
      console.log(`Enhanced image for: ${recipe.title} (replaced low quality image)`);
      return {
        ...recipe,
        image: pexelsImage
      };
    }
    
    console.log(`No suitable Pexels image found for: ${recipe.title}`);
    return recipe;
  } catch (error) {
    console.error(`Error enhancing image for ${recipe.title}:`, error);
    return recipe;
  }
}

// Helper function to apply filters to a batch of recipes
function applyFiltersToBatch(
  recipes: Recipe[], 
  filters: {
    dish?: string;
    cuisine?: string;
    availableIngredients: string[];
    maxPrepTime?: number;
    maxCookTime?: number;
    difficulty?: string[];
    prioritizeRelevance?: boolean;
  }
): Recipe[] {
  if (!filters.dish) {
    // If no dish specified, apply basic filters only
    return recipes.filter(recipe => {
      // Filter by prep time
      if (filters.maxPrepTime && recipe.prepTime > filters.maxPrepTime) return false;
      
      // Filter by cook time
      if (filters.maxCookTime && recipe.cookTime > filters.maxCookTime) return false;
      
      // Filter by difficulty
      if (filters.difficulty && filters.difficulty.length > 0) {
        if (!filters.difficulty.includes(recipe.difficulty)) return false;
      }
      
      // Filter by cuisine
      if (filters.cuisine && filters.cuisine !== "Unknown" && filters.cuisine !== "Various") {
        if (recipe.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()) return false;
      }
      
      return true;
    });
  }

  const dishLower = filters.dish.toLowerCase();
  
  // Define food type categories for strict filtering
  const foodTypeCategories = {
    pizza: ['pizza', 'margherita', 'pepperoni', 'hawaiian pizza', 'neapolitan pizza', 'deep dish pizza'],
    burger: ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger', 'veggie burger'],
    pasta: ['pasta', 'spaghetti', 'carbonara', 'penne', 'fettuccine', 'lasagna', 'ravioli'],
    salad: ['salad', 'green salad', 'garden salad', 'caesar salad', 'cobb salad', 'greek salad'],
    soup: ['soup', 'chicken soup', 'vegetable soup', 'tomato soup', 'minestrone', 'clam chowder'],
    chicken: ['chicken', 'roasted chicken', 'grilled chicken', 'fried chicken', 'chicken breast', 'chicken thigh'],
    beef: ['beef', 'steak', 'roast beef', 'beef tenderloin', 'beef stew', 'beef brisket'],
    fish: ['fish', 'salmon', 'cod', 'tuna', 'halibut', 'sea bass', 'trout'],
    breakfast: ['pancakes', 'waffles', 'french toast', 'omelette', 'scrambled eggs', 'breakfast burrito', 'bagel'],
    meat: ['chicken', 'steak', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'pork chops'],
    indian: ['curry', 'chicken curry', 'butter chicken', 'biryani', 'tikka masala', 'dal', 'naan']
  };
  
  // Find the category for the detected dish
  let dishCategory: string | null = null;
  for (const [category, dishes] of Object.entries(foodTypeCategories)) {
    if (dishes.some(d => dishLower.includes(d) || d.includes(dishLower))) {
      dishCategory = category;
      break;
    }
  }
  
  return recipes.filter(recipe => {
    const titleLower = recipe.title.toLowerCase();
    const tagsLower = recipe.tags.map(tag => tag.toLowerCase());
    
    // Apply basic filters first
    if (filters.maxPrepTime && recipe.prepTime > filters.maxPrepTime) return false;
    if (filters.maxCookTime && recipe.cookTime > filters.maxCookTime) return false;
    if (filters.difficulty && filters.difficulty.length > 0) {
      if (!filters.difficulty.includes(recipe.difficulty)) return false;
    }
    if (filters.cuisine && filters.cuisine !== "Unknown" && filters.cuisine !== "Various") {
      if (recipe.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()) return false;
    }
    
    // Apply dish-specific filtering
    if (dishCategory) {
      // Use lenient filtering for cache requests (targetCount >= 30)
      const isCacheRequest = filters.prioritizeRelevance || false; // We'll pass this from the API call
      if (isCacheRequest) {
        // Very lenient filtering for cache requests - include more related recipes
        const categoryDishes = foodTypeCategories[dishCategory as keyof typeof foodTypeCategories];
        const isSameCategory = categoryDishes.some(categoryDish => 
          titleLower.includes(categoryDish) || 
          tagsLower.some(tag => tag.includes(categoryDish))
        );
        const hasDishName = titleLower.includes(dishLower);
        
        // For cache requests, also include recipes that share common ingredients or cooking methods
        const dishWords = dishLower.split(' ').filter(word => word.length > 2);
        const hasRelatedWords = dishWords.some(word => 
          titleLower.includes(word) || 
          tagsLower.some(tag => tag.includes(word))
        );
        
        return isSameCategory || hasDishName || hasRelatedWords;
      } else {
        // Strict filtering for display requests
        const categoryDishes = foodTypeCategories[dishCategory as keyof typeof foodTypeCategories];
        const isSameCategory = categoryDishes.some(categoryDish => 
          titleLower.includes(categoryDish) || 
          tagsLower.some(tag => tag.includes(categoryDish))
        );
        const dishWords = dishLower.split(' ');
        const hasProminentDishMatch = dishWords.some(word => 
          word.length > 3 && titleLower.includes(word)
        );
        return isSameCategory && hasProminentDishMatch;
      }
    }
    
    // Fallback: direct title match
    return titleLower.includes(dishLower);
  });
}

// Helper function to calculate realistic difficulty based on time and ingredients
function calculateRealisticDifficulty(prepTime: number, cookTime: number, ingredientCount: number): "easy" | "medium" | "hard" {
  const totalTime = prepTime + cookTime;
  let difficultyScore = 0;

  // Time-based scoring
  if (totalTime <= 30) difficultyScore += 1; // Quick recipes are easier
  else if (totalTime <= 60) difficultyScore += 2; // Medium time
  else if (totalTime <= 120) difficultyScore += 3; // Longer time
  else difficultyScore += 4; // Very long time

  // Ingredient-based scoring
  if (ingredientCount <= 5) difficultyScore += 1; // Few ingredients = easier
  else if (ingredientCount <= 10) difficultyScore += 2; // Moderate ingredients
  else if (ingredientCount <= 15) difficultyScore += 3; // Many ingredients
  else difficultyScore += 4; // Lots of ingredients

  // Prep time complexity
  if (prepTime <= 15) difficultyScore += 1; // Quick prep
  else if (prepTime <= 30) difficultyScore += 2; // Moderate prep
  else if (prepTime <= 60) difficultyScore += 3; // Complex prep
  else difficultyScore += 4; // Very complex prep

  // Determine difficulty based on total score
  if (difficultyScore <= 4) return "easy";
  else if (difficultyScore <= 7) return "medium";
  else return "hard";
}

// Helper function to convert Spoonacular recipe to our Recipe format
function convertSpoonacularRecipe(spoonacularRecipe: any): Recipe {
  // Enhanced instruction processing
  let instructions: string[] = [];
  
  if (spoonacularRecipe.analyzedInstructions?.[0]?.steps) {
    instructions = spoonacularRecipe.analyzedInstructions[0].steps.map((step: any, index: number) => {
      // Add step numbers and enhance with more detail
      const stepNumber = index + 1;
      let enhancedStep = step.step;
      
      // Add helpful tips and details based on step content
      if (enhancedStep.toLowerCase().includes('preheat') || enhancedStep.toLowerCase().includes('heat')) {
        enhancedStep += " (Allow oven to fully preheat for best results)";
      } else if (enhancedStep.toLowerCase().includes('season') || enhancedStep.toLowerCase().includes('salt')) {
        enhancedStep += " (Taste and adjust seasoning as needed)";
      } else if (enhancedStep.toLowerCase().includes('mix') || enhancedStep.toLowerCase().includes('combine')) {
        enhancedStep += " (Mix until well incorporated)";
      } else if (enhancedStep.toLowerCase().includes('bake') || enhancedStep.toLowerCase().includes('cook')) {
        enhancedStep += " (Check for doneness before removing from heat)";
      } else if (enhancedStep.toLowerCase().includes('rest') || enhancedStep.toLowerCase().includes('cool')) {
        enhancedStep += " (This allows flavors to develop and temperature to stabilize)";
      }
      
      return `${stepNumber}. ${enhancedStep}`;
    });
  } else if (spoonacularRecipe.instructions) {
    // Fallback to basic instructions if analyzed instructions aren't available
    instructions = spoonacularRecipe.instructions
      .split('\n')
      .filter((step: string) => step.trim().length > 0)
      .map((step: string, index: number) => `${index + 1}. ${step.trim()}`);
  }

  return {
    id: spoonacularRecipe.id.toString(),
    title: spoonacularRecipe.title,
    image: spoonacularRecipe.image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    ingredients: spoonacularRecipe.extendedIngredients?.map((ing: any) => ing.original) || [],
    instructions: instructions.length > 0 ? instructions : ["Follow the recipe instructions carefully for best results."],
    prepTime: spoonacularRecipe.preparationMinutes || 15,
    cookTime: spoonacularRecipe.cookingMinutes || 15,
    servings: spoonacularRecipe.servings || 4,
    difficulty: calculateRealisticDifficulty(
      spoonacularRecipe.preparationMinutes || 15,
      spoonacularRecipe.cookingMinutes || 15,
      spoonacularRecipe.extendedIngredients?.length || 5
    ),
    cuisine: spoonacularRecipe.cuisines?.[0] || "Various",
    tags: [
      ...(spoonacularRecipe.dishTypes || []),
      ...(spoonacularRecipe.diets || []),
      ...(spoonacularRecipe.occasions || [])
    ],
    sourceUrl: spoonacularRecipe.sourceUrl || spoonacularRecipe.spoonacularSourceUrl,
  };
}

// Fallback mock recipes for when Spoonacular is unavailable
const fallbackRecipes: Recipe[] = [
  // PIZZA RECIPES
  {
    id: "1",
    title: "Classic Margherita Pizza",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400",
    ingredients: [
      "Pizza dough",
      "Tomato sauce",
      "Fresh mozzarella",
      "Fresh basil",
      "Olive oil",
      "Salt",
    ],
    instructions: [
      "Preheat oven to 450°F",
      "Roll out pizza dough",
      "Spread tomato sauce",
      "Add mozzarella and basil",
      "Drizzle with olive oil",
      "Bake for 12-15 minutes",
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "Italian",
    tags: ["vegetarian", "classic", "quick"],
    sourceUrl: "https://www.allrecipes.com/recipe/213742/classic-margherita-pizza/",
  },
  {
    id: "7",
    title: "Pepperoni Pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
    ingredients: [
      "Pizza dough",
      "Tomato sauce",
      "Mozzarella cheese",
      "Pepperoni slices",
      "Oregano",
      "Olive oil",
    ],
    instructions: [
      "Preheat oven to 475°F",
      "Roll out dough",
      "Add sauce and cheese",
      "Top with pepperoni",
      "Bake for 12-15 minutes",
    ],
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "Italian",
    tags: ["classic", "meat", "popular"],
    sourceUrl: "https://www.foodnetwork.com/recipes/pepperoni-pizza-recipe-1911947",
  },
  {
    id: "8",
    title: "BBQ Chicken Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    ingredients: [
      "Pizza dough",
      "BBQ sauce",
      "Cooked chicken",
      "Red onion",
      "Cilantro",
      "Mozzarella cheese",
    ],
    instructions: [
      "Preheat oven to 450°F",
      "Spread BBQ sauce on dough",
      "Add chicken and onions",
      "Top with cheese",
      "Bake for 15 minutes",
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "American",
    tags: ["bbq", "chicken", "savory"],
    sourceUrl: "https://www.tasteofhome.com/recipes/bbq-chicken-pizza/",
  },
  {
    id: "pizza-4",
    title: "Classic Cheese Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    ingredients: [
      "Pizza dough",
      "Tomato sauce",
      "Mozzarella cheese",
      "Parmesan cheese",
      "Oregano",
      "Olive oil",
    ],
    instructions: [
      "Preheat oven to 450°F",
      "Roll out pizza dough",
      "Spread tomato sauce",
      "Add mozzarella and parmesan",
      "Sprinkle with oregano",
      "Bake for 12-15 minutes",
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "Italian",
    tags: ["vegetarian", "classic", "cheese"],
    sourceUrl: "https://www.allrecipes.com/recipe/classic-cheese-pizza/",
  },
  {
    id: "pizza-5",
    title: "Neapolitan Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    ingredients: [
      "Pizza dough",
      "San Marzano tomatoes",
      "Fresh mozzarella",
      "Fresh basil",
      "Extra virgin olive oil",
      "Sea salt",
    ],
    instructions: [
      "Preheat oven to 900°F",
      "Stretch dough by hand",
      "Add crushed tomatoes",
      "Add mozzarella",
      "Bake for 60-90 seconds",
      "Add basil and olive oil",
    ],
    prepTime: 30,
    cookTime: 2,
    servings: 2,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "Italian",
    tags: ["traditional", "authentic", "wood-fired"],
    sourceUrl: "https://www.seriouseats.com/neapolitan-pizza-recipe",
  },
  {
    id: "pizza-6",
    title: "Four Cheese Pizza",
    image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400",
    ingredients: [
      "Pizza dough",
      "Tomato sauce",
      "Mozzarella cheese",
      "Gorgonzola cheese",
      "Parmesan cheese",
      "Ricotta cheese",
    ],
    instructions: [
      "Preheat oven to 450°F",
      "Roll out dough",
      "Add tomato sauce",
      "Add all four cheeses",
      "Bake for 15-18 minutes",
    ],
    prepTime: 25,
    cookTime: 18,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "Italian",
    tags: ["vegetarian", "cheese", "rich"],
    sourceUrl: "https://www.foodnetwork.com/recipes/four-cheese-pizza",
  },

  // BURGER RECIPES
  {
    id: "2",
    title: "Gourmet Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    ingredients: [
      "Ground beef",
      "Burger buns",
      "Lettuce",
      "Tomato",
      "Onion",
      "Cheese",
      "Pickles",
      "Ketchup",
      "Mustard",
    ],
    instructions: [
      "Form beef into patties",
      "Season with salt and pepper",
      "Grill for 4-5 minutes per side",
      "Toast buns",
      "Assemble with toppings",
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "American",
    tags: ["grilled", "comfort food", "burger"],
    sourceUrl: "https://www.foodnetwork.com/recipes/gourmet-burger-recipe-1911947",
  },
  {
    id: "9",
    title: "Cheeseburger Deluxe",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
    ingredients: [
      "Ground beef",
      "Cheddar cheese",
      "Burger buns",
      "Bacon",
      "Lettuce",
      "Tomato",
      "Onion",
      "Special sauce",
    ],
    instructions: [
      "Form beef patties",
      "Cook bacon until crispy",
      "Grill burgers 4-5 minutes per side",
      "Add cheese and bacon",
      "Assemble with all toppings",
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "American",
    tags: ["cheeseburger", "bacon", "deluxe"],
    sourceUrl: "https://www.allrecipes.com/recipe/cheeseburger-deluxe/",
  },
  {
    id: "10",
    title: "Veggie Burger",
    image: "https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400",
    ingredients: [
      "Black beans",
      "Quinoa",
      "Breadcrumbs",
      "Egg",
      "Spices",
      "Burger buns",
      "Avocado",
      "Lettuce",
    ],
    instructions: [
      "Mash black beans",
      "Mix with quinoa and breadcrumbs",
      "Form into patties",
      "Cook for 4-5 minutes per side",
      "Serve with avocado and lettuce",
    ],
    prepTime: 25,
    cookTime: 10,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "American",
    tags: ["vegetarian", "healthy", "burger"],
    sourceUrl: "https://www.epicurious.com/recipes/veggie-burger",
  },
  {
    id: "12",
    title: "Smash Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    ingredients: [
      "Ground beef",
      "Burger buns",
      "American cheese",
      "Onions",
      "Pickles",
      "Ketchup",
      "Mustard",
      "Salt",
      "Pepper",
    ],
    instructions: [
      "Form beef into small balls",
      "Heat griddle to high heat",
      "Smash balls flat with spatula",
      "Cook for 2-3 minutes",
      "Flip and add cheese",
      "Assemble with toppings",
    ],
    prepTime: 10,
    cookTime: 8,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "American",
    tags: ["smash burger", "classic", "quick"],
    sourceUrl: "https://www.seriouseats.com/smash-burger-recipe",
  },
  {
    id: "13",
    title: "Bacon Cheeseburger",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
    ingredients: [
      "Ground beef",
      "Burger buns",
      "Bacon",
      "Cheddar cheese",
      "Lettuce",
      "Tomato",
      "Onion",
      "BBQ sauce",
    ],
    instructions: [
      "Cook bacon until crispy",
      "Form beef into patties",
      "Grill burgers 4-5 minutes per side",
      "Add cheese and bacon",
      "Assemble with fresh toppings",
    ],
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "American",
    tags: ["bacon", "cheeseburger", "bbq"],
    sourceUrl: "https://www.allrecipes.com/recipe/bacon-cheeseburger/",
  },
  {
    id: "14",
    title: "Mushroom Swiss Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    ingredients: [
      "Ground beef",
      "Burger buns",
      "Mushrooms",
      "Swiss cheese",
      "Onions",
      "Butter",
      "Worcestershire sauce",
      "Garlic",
    ],
    instructions: [
      "Sauté mushrooms and onions",
      "Form beef into patties",
      "Grill burgers 4-5 minutes per side",
      "Add Swiss cheese",
      "Top with mushroom mixture",
    ],
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "American",
    tags: ["mushroom", "swiss cheese", "gourmet"],
    sourceUrl: "https://www.foodnetwork.com/recipes/mushroom-swiss-burger",
  },

  // SALAD RECIPES
  {
    id: "4",
    title: "Fresh Garden Salad",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    ingredients: [
      "Mixed greens",
      "Cherry tomatoes",
      "Cucumber",
      "Red onion",
      "Avocado",
      "Feta cheese",
      "Olive oil",
      "Balsamic vinegar",
      "Salt",
      "Pepper",
    ],
    instructions: [
      "Wash and chop all vegetables",
      "Combine in large bowl",
      "Whisk together dressing",
      "Toss salad with dressing",
      "Top with feta cheese",
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "Mediterranean",
    tags: ["healthy", "vegetarian", "fresh", "salad"],
    sourceUrl: "https://www.allrecipes.com/recipe/fresh-garden-salad/",
  },
  {
    id: "11",
    title: "Caesar Salad",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
    ingredients: [
      "Romaine lettuce",
      "Parmesan cheese",
      "Croutons",
      "Caesar dressing",
      "Lemon juice",
      "Garlic",
      "Anchovies",
    ],
    instructions: [
      "Wash and chop romaine",
      "Make Caesar dressing",
      "Toss lettuce with dressing",
      "Add croutons and parmesan",
      "Serve immediately",
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "Italian",
    tags: ["classic", "salad", "creamy"],
    sourceUrl: "https://www.foodnetwork.com/recipes/caesar-salad-recipe",
  },
  {
    id: "12",
    title: "Asian Chicken Salad",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
    ingredients: [
      "Mixed greens",
      "Grilled chicken",
      "Mandarin oranges",
      "Almonds",
      "Sesame seeds",
      "Asian dressing",
      "Green onions",
    ],
    instructions: [
      "Grill chicken and slice",
      "Combine greens and chicken",
      "Add oranges and almonds",
      "Drizzle with Asian dressing",
      "Garnish with sesame seeds",
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "Asian",
    tags: ["chicken", "salad", "asian", "healthy"],
    sourceUrl: "https://www.tasteofhome.com/recipes/asian-chicken-salad/",
  },

  // PASTA RECIPES
  {
    id: "3",
    title: "Creamy Carbonara Pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400",
    ingredients: [
      "Spaghetti",
      "Pancetta",
      "Eggs",
      "Parmesan cheese",
      "Black pepper",
      "Garlic",
    ],
    instructions: [
      "Cook pasta according to package directions",
      "Fry pancetta until crispy",
      "Whisk eggs with parmesan",
      "Combine hot pasta with pancetta",
      "Add egg mixture and toss quickly",
      "Season with black pepper",
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "Italian",
    tags: ["creamy", "comfort food", "pasta"],
    sourceUrl: "https://www.allrecipes.com/recipe/creamy-carbonara-pasta/",
  },
  {
    id: "13",
    title: "Spaghetti Bolognese",
    image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400",
    ingredients: [
      "Spaghetti",
      "Ground beef",
      "Tomatoes",
      "Onion",
      "Carrots",
      "Celery",
      "Red wine",
      "Parmesan cheese",
    ],
    instructions: [
      "Sauté vegetables until soft",
      "Add ground beef and brown",
      "Add tomatoes and wine",
      "Simmer for 2 hours",
      "Serve over cooked spaghetti",
    ],
    prepTime: 30,
    cookTime: 120,
    servings: 6,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "Italian",
    tags: ["meat", "pasta", "classic"],
    sourceUrl: "https://www.epicurious.com/recipes/spaghetti-bolognese",
  },
  {
    id: "14",
    title: "Mac and Cheese",
    image: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400",
    ingredients: [
      "Macaroni pasta",
      "Cheddar cheese",
      "Milk",
      "Butter",
      "Flour",
      "Breadcrumbs",
      "Salt",
      "Pepper",
    ],
    instructions: [
      "Cook macaroni according to package",
      "Make cheese sauce with milk and flour",
      "Combine pasta with sauce",
      "Top with breadcrumbs",
      "Bake for 20 minutes",
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 6,
    difficulty: calculateRealisticDifficulty(20, 15, 6),
    cuisine: "American",
    tags: ["comfort food", "cheese", "pasta"],
    sourceUrl: "https://www.foodnetwork.com/recipes/mac-and-cheese-recipe",
  },

  // CURRY RECIPES
  {
    id: "5",
    title: "Spicy Chicken Curry",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    ingredients: [
      "Chicken thighs",
      "Onion",
      "Garlic",
      "Ginger",
      "Curry powder",
      "Coconut milk",
      "Tomatoes",
      "Basmati rice",
      "Cilantro",
    ],
    instructions: [
      "Sauté onions until golden",
      "Add garlic, ginger, and spices",
      "Add chicken and brown",
      "Pour in coconut milk",
      "Simmer for 30 minutes",
      "Serve over rice",
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "Indian",
    tags: ["spicy", "comfort food", "aromatic", "curry"],
    sourceUrl: "https://www.allrecipes.com/recipe/spicy-chicken-curry/",
  },
  {
    id: "15",
    title: "Thai Green Curry",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
    ingredients: [
      "Chicken breast",
      "Green curry paste",
      "Coconut milk",
      "Thai basil",
      "Bell peppers",
      "Bamboo shoots",
      "Fish sauce",
      "Jasmine rice",
    ],
    instructions: [
      "Sauté curry paste until fragrant",
      "Add coconut milk and bring to boil",
      "Add chicken and vegetables",
      "Simmer for 15 minutes",
      "Add basil and fish sauce",
      "Serve over jasmine rice",
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: calculateRealisticDifficulty(30, 25, 8),
    cuisine: "Thai",
    tags: ["spicy", "curry", "thai", "aromatic"],
    sourceUrl: "https://www.epicurious.com/recipes/thai-green-curry",
  },

  // SUSHI RECIPES
  {
    id: "6",
    title: "California Roll Sushi",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
    ingredients: [
      "Sushi rice",
      "Nori sheets",
      "Crab meat",
      "Avocado",
      "Cucumber",
      "Sesame seeds",
      "Rice vinegar",
      "Sugar",
      "Salt",
    ],
    instructions: [
      "Cook and season sushi rice",
      "Prepare fillings",
      "Roll sushi with rice on outside",
      "Sprinkle with sesame seeds",
      "Slice into pieces",
    ],
    prepTime: 45,
    cookTime: 0,
    servings: 4,
    difficulty: calculateRealisticDifficulty(45, 60, 12),
    cuisine: "Japanese",
    tags: ["fresh", "healthy", "artisanal", "sushi"],
    sourceUrl: "https://www.foodnetwork.com/recipes/california-roll-sushi",
  },
  {
    id: "16",
    title: "Salmon Nigiri",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
    ingredients: [
      "Sushi rice",
      "Fresh salmon",
      "Wasabi",
      "Soy sauce",
      "Pickled ginger",
    ],
    instructions: [
      "Cook and season sushi rice",
      "Slice salmon into thin pieces",
      "Form rice into small ovals",
      "Top with salmon slices",
      "Serve with wasabi and soy sauce",
    ],
    prepTime: 30,
    cookTime: 0,
    servings: 4,
    difficulty: calculateRealisticDifficulty(45, 60, 12),
    cuisine: "Japanese",
    tags: ["sushi", "salmon", "raw", "traditional"],
    sourceUrl: "https://www.allrecipes.com/recipe/salmon-nigiri/",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dish = searchParams.get("dish");
    const cuisine = searchParams.get("cuisine");
    const availableIngredients = searchParams.get("ingredients")?.split(",") || [];
    const maxPrepTime = searchParams.get("maxPrepTime");
    const maxCookTime = searchParams.get("maxCookTime");
    const difficulty = searchParams.get("difficulty");
    const additionalRecipes = searchParams.get("additionalRecipes") === "true";
    const neededCount = parseInt(searchParams.get("neededCount") || "6");
    const prioritizeRelevance = searchParams.get("prioritizeRelevance") === "true";
    const targetCount = parseInt(searchParams.get("targetCount") || "6"); // Configurable display max

    console.log("Recipe API called with:", { dish, cuisine, availableIngredients, maxPrepTime, maxCookTime, difficulty, additionalRecipes, neededCount, prioritizeRelevance, targetCount });

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      console.error("SPOONACULAR_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    let filteredRecipes: Recipe[] = [];
    let allFetchedRecipes: Recipe[] = [];
    let offset = 0;
    const batchSize = 10; // Fetch in batches of 10 (reduced to avoid rate limits)
    const maxBatches = 6; // Fetch 6 batches (60 recipes) for cache

    try {
      // Fetch a fixed number of recipes for cache, regardless of filtering
      for (let batch = 0; batch < maxBatches; batch++) {
        console.log(`Fetching batch ${batch + 1}/${maxBatches}, offset: ${offset}, current filtered count: ${filteredRecipes.length}/${targetCount}`);
        
        // Build Spoonacular API query parameters for this batch
        const queryParams = new URLSearchParams({
          number: batchSize.toString(),
          offset: offset.toString(),
          addRecipeInformation: "true",
          fillIngredients: "true",
          sort: "popularity",
          sortDirection: "desc",
        });

        // Only require instructions for display requests, not cache requests
        if (targetCount < 30) {
          queryParams.append("instructionsRequired", "true");
        }

        // Always use the dish name for search to get related recipes
        if (dish) {
          queryParams.append("query", dish);
        }

        // For cache requests, be more lenient with additional filters
        if (targetCount < 30) {
          // For display requests, add restrictive filters
          if (cuisine && cuisine !== "Unknown" && cuisine !== "Various") {
            // Only add cuisine filter if it's very specific
            if (cuisine.toLowerCase() === 'italian' || cuisine.toLowerCase() === 'american') {
              queryParams.append("cuisine", cuisine);
            }
          }

          // Add time filters
          if (maxPrepTime) {
            queryParams.append("maxReadyTime", maxPrepTime);
          }
        }
        // For cache requests (targetCount >= 30), don't add restrictive filters

        console.log(`Calling Spoonacular API batch ${batch + 1} with params:`, queryParams.toString());

        // Call Spoonacular API via RapidAPI
        const response = await fetch(`${SPOONACULAR_BASE_URL}/complexSearch?${queryParams.toString()}`, {
          headers: {
            'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
          },
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            console.error("Rate limit exceeded for Spoonacular API in batch", batch + 1);
            throw new Error("Rate limit exceeded. Please try again later.");
          }
          console.error(`Spoonacular API error in batch ${batch + 1}: ${response.status} ${response.statusText}`);
          // Continue to next batch instead of throwing
          offset += batchSize;
          continue;
        }

        const data = await response.json();
        console.log(`Spoonacular API batch ${batch + 1} returned ${data.results?.length || 0} recipes`);

        // Convert Spoonacular recipes to our format
        if (data.results && data.results.length > 0) {
          const batchRecipes = data.results.map((recipe: any) => {
            try {
              return convertSpoonacularRecipe(recipe);
            } catch (conversionError) {
              console.error(`Error converting recipe ${recipe.id}:`, conversionError);
              return null;
            }
          }).filter((recipe: Recipe | null) => recipe !== null) as Recipe[];
          
          console.log(`Successfully converted ${batchRecipes.length} recipes from batch ${batch + 1}`);
          
          // Add to all fetched recipes
          allFetchedRecipes.push(...batchRecipes);
          
          // Apply filtering to this batch
          // For cache requests (targetCount >= 30), return all recipes without filtering
          const filteredBatch = targetCount >= 30 
            ? batchRecipes // Return all recipes for cache - no filtering
            : applyFiltersToBatch(batchRecipes, {
                dish: dish || undefined,
                cuisine: cuisine || undefined,
                availableIngredients,
                maxPrepTime: maxPrepTime ? parseInt(maxPrepTime) : undefined,
                maxCookTime: maxCookTime ? parseInt(maxCookTime) : undefined,
                difficulty: difficulty ? [difficulty] : undefined,
                prioritizeRelevance
              });
          
          console.log(`Batch ${batch + 1}: ${batchRecipes.length} recipes -> ${filteredBatch.length} filtered`);
          
          // Add filtered recipes to our result
          filteredRecipes.push(...filteredBatch);
          
          // Update offset for next batch
          offset += batchSize;
          
          // If we have enough recipes, break early
          if (filteredRecipes.length >= targetCount) {
            console.log(`Reached target count of ${targetCount} recipes after ${batch + 1} batches`);
            break;
          }
        } else {
          console.log(`No recipes returned from batch ${batch + 1}, stopping`);
          break;
        }
      }

    } catch (spoonacularError) {
      console.error("Spoonacular API error:", spoonacularError);
      
      // Only fall back to mock recipes for critical errors (rate limits, API key issues)
      const errorMessage = spoonacularError instanceof Error ? spoonacularError.message : String(spoonacularError);
      const isCriticalError = errorMessage.includes("Rate limit exceeded") || 
                             errorMessage.includes("401") || 
                             errorMessage.includes("403") ||
                             errorMessage.includes("API configuration error");
      
      if (isCriticalError) {
        console.log("Critical API error detected, falling back to mock recipes");
        
        // Fallback to mock recipes with enhanced filtering
        const fallbackRecipesList = [...fallbackRecipes];
        
        // Enhance fallback recipe images with Pexels
        console.log("Enhancing fallback recipe images with Pexels...");
        const enhancedFallbackRecipes = await Promise.all(
          fallbackRecipesList.map(recipe => enhanceRecipeImage(recipe))
        );
        
        // Apply filtering to fallback recipes
        filteredRecipes = applyFiltersToBatch(enhancedFallbackRecipes, {
          dish: dish || undefined,
          cuisine: cuisine || undefined,
          availableIngredients,
          maxPrepTime: maxPrepTime ? parseInt(maxPrepTime) : undefined,
          maxCookTime: maxCookTime ? parseInt(maxCookTime) : undefined,
          difficulty: difficulty ? [difficulty] : undefined,
          prioritizeRelevance: true // Use lenient filtering for fallback
        });
        
        console.log(`Fallback: ${enhancedFallbackRecipes.length} recipes -> ${filteredRecipes.length} filtered`);
      } else {
        console.log("Non-critical API error, continuing with available recipes");
        // Continue with whatever recipes we managed to fetch
        filteredRecipes = allFetchedRecipes;
      }
    }

    // For cache requests, return all available recipes (up to 30); for display requests, return filtered recipes
    const availableRecipes = allFetchedRecipes.length > 0 ? allFetchedRecipes : filteredRecipes;
    const finalRecipes = targetCount >= 30 ? availableRecipes.slice(0, 30) : filteredRecipes.slice(0, targetCount);
    
    console.log(`Final result: ${allFetchedRecipes.length} total fetched recipes, ${filteredRecipes.length} filtered recipes, returning ${finalRecipes.length} (target: ${targetCount})`);
    
    // Enhance recipe images with Pexels
    console.log("Enhancing recipe images with Pexels...");
    const enhancedRecipes = await Promise.all(
      finalRecipes.map(recipe => enhanceRecipeImage(recipe))
    );
    
    const enhancedCount = enhancedRecipes.filter((recipe, index) => 
      recipe.image !== finalRecipes[index].image
    ).length;
    
    console.log(`Enhanced ${enhancedCount}/${finalRecipes.length} recipe images with Pexels`);

    return NextResponse.json({
      success: true,
      recipes: enhancedRecipes,
      total: allFetchedRecipes.length,
      filtered: filteredRecipes.length,
      enhancedImages: enhancedCount
    });
  } catch (error) {
    console.error("Recipe fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
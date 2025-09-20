import { NextRequest, NextResponse } from "next/server";
import { Recipe, FilterOptions } from "@/types";
import connectDB from "@/lib/mongodb";
import RecipeModel from "@/models/Recipe";

// Spoonacular API integration via RapidAPI
const SPOONACULAR_BASE_URL = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes";

// Helper function to convert Spoonacular recipe to our Recipe format
function convertSpoonacularRecipe(spoonacularRecipe: any): Recipe {
  return {
    id: spoonacularRecipe.id.toString(),
    title: spoonacularRecipe.title,
    image: spoonacularRecipe.image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    ingredients: spoonacularRecipe.extendedIngredients?.map((ing: any) => ing.original) || [],
    instructions: spoonacularRecipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || [],
    prepTime: spoonacularRecipe.preparationMinutes || 15,
    cookTime: spoonacularRecipe.cookingMinutes || 15,
    servings: spoonacularRecipe.servings || 4,
    difficulty: spoonacularRecipe.difficulty === "Easy" ? "easy" : 
                spoonacularRecipe.difficulty === "Medium" ? "medium" : "hard",
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
    difficulty: "easy",
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
    difficulty: "easy",
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
    difficulty: "medium",
    cuisine: "American",
    tags: ["bbq", "chicken", "savory"],
    sourceUrl: "https://www.tasteofhome.com/recipes/bbq-chicken-pizza/",
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
    difficulty: "easy",
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
    difficulty: "medium",
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
    difficulty: "medium",
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
    difficulty: "easy",
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
    difficulty: "easy",
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
    difficulty: "medium",
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
    difficulty: "easy",
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
    difficulty: "easy",
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
    difficulty: "medium",
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
    difficulty: "medium",
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
    difficulty: "medium",
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
    difficulty: "easy",
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
    difficulty: "medium",
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
    difficulty: "medium",
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
    difficulty: "hard",
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
    difficulty: "hard",
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

    console.log("Recipe API called with:", { dish, cuisine, availableIngredients, maxPrepTime, maxCookTime, difficulty });

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      console.error("SPOONACULAR_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    let recipes: Recipe[] = [];

    try {
      // Build Spoonacular API query parameters for RapidAPI
      const queryParams = new URLSearchParams({
        number: "20", // Get more recipes
        addRecipeInformation: "true",
        fillIngredients: "true",
        instructionsRequired: "true",
        sort: "popularity", // Get popular recipes first
        sortDirection: "desc",
      });

      // Add search query if dish is provided - use broader search terms
      if (dish) {
        // Try multiple search strategies for better results
        const searchTerms = [dish];
        
        // Add related terms for better matching - category-specific only
        const dishMappings: Record<string, string[]> = {
          'cheeseburger': ['burger', 'hamburger', 'smash burger', 'gourmet burger'],
          'burger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger'],
          'hamburger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger'],
          'smash burger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger'],
          'pizza': ['pizza', 'margherita', 'pepperoni', 'hawaiian pizza'],
          'salad': ['salad', 'green salad', 'garden salad', 'caesar salad'],
          'pasta': ['pasta', 'spaghetti', 'carbonara', 'penne'],
          'carbonara': ['carbonara', 'pasta carbonara', 'spaghetti carbonara'],
          'chicken': ['chicken', 'roasted chicken', 'grilled chicken', 'fried chicken'],
          'beef': ['beef', 'steak', 'roast beef', 'beef tenderloin'],
          'fish': ['fish', 'salmon', 'cod', 'tuna'],
          'soup': ['soup', 'chicken soup', 'vegetable soup', 'tomato soup'],
        };
        
        const relatedTerms = dishMappings[dish.toLowerCase()] || [];
        searchTerms.push(...relatedTerms);
        
        // Use the main dish name for search
        queryParams.append("query", dish);
      }

      // Add cuisine filter (but be less restrictive)
      if (cuisine && cuisine !== "Unknown" && cuisine !== "Various") {
        queryParams.append("cuisine", cuisine);
      }

      // Add ingredient filter (but don't be too restrictive)
      if (availableIngredients.length > 0 && availableIngredients.length <= 5) {
        queryParams.append("includeIngredients", availableIngredients.join(","));
      }

      // Add time filters
      if (maxPrepTime) {
        queryParams.append("maxReadyTime", maxPrepTime);
      }

      // Remove difficulty filter as it's not well supported
      // if (difficulty) {
      //   queryParams.append("difficulty", difficulty);
      // }

      console.log("Calling Spoonacular API with params:", queryParams.toString());

      // Call Spoonacular API via RapidAPI
      const response = await fetch(`${SPOONACULAR_BASE_URL}/complexSearch?${queryParams.toString()}`, {
        headers: {
          'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Spoonacular API returned ${data.results?.length || 0} recipes`);

      // Convert Spoonacular recipes to our format
      if (data.results && data.results.length > 0) {
        recipes = data.results.map(convertSpoonacularRecipe);
        console.log(`Successfully converted ${recipes.length} Spoonacular recipes`);
      } else {
        console.log("No recipes returned from Spoonacular API, using fallback");
        throw new Error("No recipes found");
      }

    } catch (spoonacularError) {
      console.error("Spoonacular API error:", spoonacularError);
      console.log("Falling back to mock recipes");
      
      // Fallback to mock recipes with enhanced filtering
      recipes = [...fallbackRecipes];
      
      if (dish) {
        const dishLower = dish.toLowerCase();
        const matchingRecipes = recipes.filter((recipe) => {
          const titleLower = recipe.title.toLowerCase();
          const cuisineLower = recipe.cuisine.toLowerCase();
          
          // Direct title match
          if (titleLower.includes(dishLower)) return true;
          
          // Tag match
          if (recipe.tags.some((tag) => tag.toLowerCase().includes(dishLower))) return true;
          
          // Cuisine match for similar dishes
          if (cuisineLower.includes(dishLower)) return true;
          
          // Special mappings for common dish types - more specific to avoid cross-contamination
          const dishMappings: Record<string, string[]> = {
            'pizza': ['pizza', 'margherita', 'pepperoni', 'hawaiian', 'meat lovers', 'veggie'],
            'burger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger', 'deluxe burger'],
            'cheeseburger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger', 'deluxe burger'],
            'hamburger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger', 'deluxe burger'],
            'smash burger': ['burger', 'cheeseburger', 'hamburger', 'smash burger', 'gourmet burger', 'deluxe burger'],
            'carbonara': ['carbonara', 'pasta carbonara', 'spaghetti carbonara'],
            'salad': ['salad', 'garden salad', 'caesar salad', 'greek salad', 'green salad', 'mixed salad'],
            'sushi': ['sushi', 'sushi roll', 'maki', 'nigiri', 'sashimi'],
            'curry': ['curry', 'chicken curry', 'beef curry', 'vegetable curry'],
            'pasta': ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'rigatoni'],
            'mac and cheese': ['mac and cheese', 'macaroni and cheese', 'macaroni'],
            'sandwich': ['sandwich', 'club sandwich', 'grilled cheese', 'panini', 'sub'],
            'soup': ['soup', 'chicken soup', 'vegetable soup', 'tomato soup', 'broth'],
            'chicken': ['chicken', 'roasted chicken', 'grilled chicken', 'fried chicken', 'chicken breast'],
            'beef': ['beef', 'steak', 'roast beef', 'beef tenderloin', 'ribeye'],
            'fish': ['fish', 'salmon', 'cod', 'tuna', 'seafood'],
          };
          
          const mappings = dishMappings[dishLower] || [];
          return mappings.some(mapping => 
            titleLower.includes(mapping) || 
            recipe.tags.some(tag => tag.toLowerCase().includes(mapping)) ||
            recipe.cuisine.toLowerCase().includes(mapping)
          );
        });
        
        // If we found matching recipes, use them
        if (matchingRecipes.length > 0) {
          recipes = matchingRecipes;
        } else {
          // If no specific matches, show cuisine-based recipes
          if (cuisine && cuisine !== "Unknown" && cuisine !== "Various") {
            console.log(`No specific recipes found for "${dish}", showing ${cuisine} cuisine recipes`);
            recipes = recipes.filter((recipe) =>
              recipe.cuisine.toLowerCase() === cuisine.toLowerCase()
            );
          }
          
          // If still no recipes, show a variety of popular recipes
          if (recipes.length === 0) {
            console.log(`No recipes found for "${dish}", showing popular recipes`);
            recipes = fallbackRecipes.slice(0, 8); // Show first 8 recipes
          }
        }
      }
    }

    // Apply additional filters
    if (cuisine && cuisine !== "Unknown" && cuisine !== "Various") {
      recipes = recipes.filter((recipe) =>
        recipe.cuisine.toLowerCase() === cuisine.toLowerCase()
      );
    }

    if (availableIngredients.length > 0) {
      recipes = recipes.filter((recipe) =>
        availableIngredients.some((ingredient) =>
          recipe.ingredients.some((recipeIngredient) =>
            recipeIngredient.toLowerCase().includes(ingredient.toLowerCase())
          )
        )
      );
    }

    if (maxPrepTime) {
      const maxPrep = parseInt(maxPrepTime);
      recipes = recipes.filter((recipe) => recipe.prepTime <= maxPrep);
    }

    if (maxCookTime) {
      const maxCook = parseInt(maxCookTime);
      recipes = recipes.filter((recipe) => recipe.cookTime <= maxCook);
    }

    if (difficulty) {
      recipes = recipes.filter((recipe) => recipe.difficulty === difficulty);
    }

    // If we have very few recipes, try to supplement with more category-specific options
    if (recipes.length < 4) {
      console.log(`Only found ${recipes.length} recipes, supplementing with category-specific options`);
      
      // Get the dish category to find related recipes
      const dishLower = dish?.toLowerCase() || '';
      
      // Find category-specific recipes that match the dish type
      const categoryRecipes = fallbackRecipes.filter(recipe => {
        const titleLower = recipe.title.toLowerCase();
        const tagsLower = recipe.tags.map(tag => tag.toLowerCase());
        
        // Check if this recipe belongs to the same category as the searched dish
        const isSameCategory = 
          // Direct title match
          titleLower.includes(dishLower) ||
          // Tag match
          tagsLower.some(tag => tag.includes(dishLower)) ||
          // Category-specific matching
          (dishLower.includes('burger') && (titleLower.includes('burger') || tagsLower.some(tag => tag.includes('burger')))) ||
          (dishLower.includes('pizza') && (titleLower.includes('pizza') || tagsLower.some(tag => tag.includes('pizza')))) ||
          (dishLower.includes('salad') && (titleLower.includes('salad') || tagsLower.some(tag => tag.includes('salad')))) ||
          (dishLower.includes('pasta') && (titleLower.includes('pasta') || titleLower.includes('spaghetti') || titleLower.includes('carbonara'))) ||
          (dishLower.includes('chicken') && (titleLower.includes('chicken') || tagsLower.some(tag => tag.includes('chicken')))) ||
          (dishLower.includes('beef') && (titleLower.includes('beef') || titleLower.includes('steak') || tagsLower.some(tag => tag.includes('beef')))) ||
          (dishLower.includes('fish') && (titleLower.includes('fish') || titleLower.includes('salmon') || tagsLower.some(tag => tag.includes('fish'))));
        
        return isSameCategory && !recipes.some(existing => existing.id === recipe.id);
      });
      
      // Add up to 6 more recipes to reach a minimum of 8, prioritizing category matches
      const needed = Math.min(8 - recipes.length, 6);
      if (categoryRecipes.length > 0) {
        recipes = [...recipes, ...categoryRecipes.slice(0, needed)];
      } else {
        // Fallback to any popular recipes if no category matches found
        const popularRecipes = fallbackRecipes.filter(recipe => 
          !recipes.some(existing => existing.id === recipe.id)
        );
        recipes = [...recipes, ...popularRecipes.slice(0, needed)];
      }
    }

    // Save recipes to database
    await connectDB();
    for (const recipe of recipes) {
      try {
        await RecipeModel.findOneAndUpdate(
          { id: recipe.id },
          recipe,
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Failed to save recipe ${recipe.id}:`, error);
      }
    }

    // Limit results for better performance but ensure we have enough
    const limitedRecipes = recipes.slice(0, 12);

    console.log(`Found ${recipes.length} recipes, returning ${limitedRecipes.length}`);
    console.log("Recipe titles:", limitedRecipes.map(r => r.title));

    return NextResponse.json({
      recipes: limitedRecipes,
      total: recipes.length,
    });
  } catch (error) {
    console.error("Recipe fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

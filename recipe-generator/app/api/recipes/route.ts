import { NextRequest, NextResponse } from "next/server";
import { Recipe, FilterOptions } from "@/types";

// Mock recipe database
const mockRecipes: Recipe[] = [
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
  },
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
    tags: ["grilled", "comfort food"],
  },
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
    tags: ["creamy", "comfort food"],
  },
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
    tags: ["healthy", "vegetarian", "fresh"],
  },
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
    tags: ["spicy", "comfort food", "aromatic"],
  },
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
    tags: ["fresh", "healthy", "artisanal"],
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

    let filteredRecipes = [...mockRecipes];

    // Filter by dish type
    if (dish) {
      filteredRecipes = filteredRecipes.filter((recipe) =>
        recipe.title.toLowerCase().includes(dish.toLowerCase()) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(dish.toLowerCase()))
      );
    }

    // Filter by cuisine
    if (cuisine) {
      filteredRecipes = filteredRecipes.filter((recipe) =>
        recipe.cuisine.toLowerCase() === cuisine.toLowerCase()
      );
    }

    // Filter by available ingredients
    if (availableIngredients.length > 0) {
      filteredRecipes = filteredRecipes.filter((recipe) =>
        availableIngredients.some((ingredient) =>
          recipe.ingredients.some((recipeIngredient) =>
            recipeIngredient.toLowerCase().includes(ingredient.toLowerCase())
          )
        )
      );
    }

    // Filter by prep time
    if (maxPrepTime) {
      const maxPrep = parseInt(maxPrepTime);
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.prepTime <= maxPrep);
    }

    // Filter by cook time
    if (maxCookTime) {
      const maxCook = parseInt(maxCookTime);
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.cookTime <= maxCook);
    }

    // Filter by difficulty
    if (difficulty) {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.difficulty === difficulty);
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return limited results for demo
    const limitedRecipes = filteredRecipes.slice(0, 6);

    return NextResponse.json({
      recipes: limitedRecipes,
      total: filteredRecipes.length,
    });
  } catch (error) {
    console.error("Recipe fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

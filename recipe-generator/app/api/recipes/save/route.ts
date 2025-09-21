import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recipe from '@/models/Recipe';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const recipeData = await request.json();

    if (!recipeData.id || !recipeData.title) {
      return NextResponse.json(
        { error: 'Recipe ID and title are required' },
        { status: 400 }
      );
    }

    // Check if recipe already exists
    const existingRecipe = await Recipe.findOne({ id: recipeData.id });
    if (existingRecipe) {
      return NextResponse.json({
        success: true,
        recipe: existingRecipe,
        message: 'Recipe already exists'
      });
    }

    // Create new recipe
    const recipe = new Recipe({
      id: recipeData.id,
      title: recipeData.title,
      image: recipeData.image,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      prepTime: recipeData.prepTime || 0,
      cookTime: recipeData.cookTime || 0,
      servings: recipeData.servings || 1,
      difficulty: recipeData.difficulty || 'medium',
      cuisine: recipeData.cuisine || 'Various',
      tags: recipeData.tags || [],
      sourceUrl: recipeData.sourceUrl
    });

    await recipe.save();

    return NextResponse.json({
      success: true,
      recipe: recipe,
      message: 'Recipe saved successfully'
    });
  } catch (error) {
    console.error('Save recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

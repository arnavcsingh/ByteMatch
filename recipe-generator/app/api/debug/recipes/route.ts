import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RecipeModel from '@/models/Recipe';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const recipes = await RecipeModel.find({}).sort({ createdAt: -1 }).limit(20);
    
    return NextResponse.json({
      success: true,
      count: recipes.length,
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        createdAt: recipe.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug recipes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Recipe from '@/models/Recipe';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await User.findById(userPayload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const favoriteRecipes = await Recipe.find({ id: { $in: user.favorites } });

    return NextResponse.json({
      success: true,
      recipes: favoriteRecipes
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userPayload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isCurrentlyFavorite = user.favorites.includes(recipeId);
    let isNowFavorite: boolean;

    if (isCurrentlyFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id !== recipeId);
      isNowFavorite = false;
    } else {
      // Add to favorites
      user.favorites.push(recipeId);
      isNowFavorite = true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      isFavorite: isNowFavorite
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

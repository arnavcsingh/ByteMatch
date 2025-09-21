import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import RecipeModel from '@/models/Recipe';

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

    // Get favorite recipes
    const favoriteRecipes = await RecipeModel.find({ id: { $in: user.favorites } });
    
    // Get history recipes
    const historyRecipes = await RecipeModel.find({ id: { $in: user.history } });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        favoritesCount: user.favorites.length,
        historyCount: user.history.length
      },
      favorites: {
        ids: user.favorites,
        recipes: favoriteRecipes.map(r => ({ id: r.id, title: r.title }))
      },
      history: {
        ids: user.history,
        recipes: historyRecipes.map(r => ({ id: r.id, title: r.title }))
      }
    });
  } catch (error) {
    console.error('Debug user data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



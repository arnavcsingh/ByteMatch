import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Recipe from '@/models/Recipe';

export async function POST() {
  try {
    await connectDB();
    
    // Clear all users
    const deletedUsers = await User.deleteMany({});
    console.log(`Deleted ${deletedUsers.deletedCount} users`);
    
    // Clear all recipes
    const deletedRecipes = await Recipe.deleteMany({});
    console.log(`Deleted ${deletedRecipes.deletedCount} recipes`);
    
    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      deletedUsers: deletedUsers.deletedCount,
      deletedRecipes: deletedRecipes.deletedCount
    });
  } catch (error) {
    console.error('Database clear error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    // Get counts before clearing
    const userCount = await User.countDocuments();
    const recipeCount = await Recipe.countDocuments();
    
    return NextResponse.json({
      success: true,
      currentUsers: userCount,
      currentRecipes: recipeCount,
      message: 'Send POST request to clear database'
    });
  } catch (error) {
    console.error('Database count error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get database counts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

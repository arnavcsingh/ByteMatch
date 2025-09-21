import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Recipe from '@/models/Recipe';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Drop all collections
    await User.collection.drop().catch(() => {
      // Collection might not exist, ignore error
    });
    
    await Recipe.collection.drop().catch(() => {
      // Collection might not exist, ignore error
    });

    return NextResponse.json({
      success: true,
      message: 'MongoDB database has been reset successfully. All users and recipes have been cleared.'
    });
  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
}

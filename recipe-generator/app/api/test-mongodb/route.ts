import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    console.log('MongoDB connected successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful!'
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

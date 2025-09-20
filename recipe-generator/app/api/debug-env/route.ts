import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    MONGODB_URI: process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    HF_API_KEY: process.env.HF_API_KEY ? 'Set' : 'Not set',
    SPOONACULAR_API_KEY: process.env.SPOONACULAR_API_KEY ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
    // Show first few characters of MongoDB URI for debugging
    MONGODB_URI_PREFIX: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set'
  });
}

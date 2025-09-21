import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Environment variables check",
    variables: {
      USDA_API_KEY: process.env.USDA_API_KEY ? `Set (${process.env.USDA_API_KEY.substring(0, 10)}...)` : 'Not set',
      SPOONACULAR_API_KEY: process.env.SPOONACULAR_API_KEY ? `Set (${process.env.SPOONACULAR_API_KEY.substring(0, 10)}...)` : 'Not set',
      CLARIFAI_PAT: process.env.CLARIFAI_PAT ? `Set (${process.env.CLARIFAI_PAT.substring(0, 10)}...)` : 'Not set',
      PEXELS_API_KEY: process.env.PEXELS_API_KEY ? `Set (${process.env.PEXELS_API_KEY.substring(0, 10)}...)` : 'Not set',
      HF_API_KEY: process.env.HF_API_KEY ? `Set (${process.env.HF_API_KEY.substring(0, 10)}...)` : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('API') || key.includes('PAT') || key.includes('SECRET') || key.includes('URI')
    ).sort()
  });
}

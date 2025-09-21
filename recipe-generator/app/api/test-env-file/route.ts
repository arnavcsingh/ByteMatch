import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envExists = fs.existsSync(envPath);
    
    let envContent = '';
    if (envExists) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    return NextResponse.json({
      envFileExists: envExists,
      envFilePath: envPath,
      envFileContent: envContent,
      processCwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      envFileExists: false
    });
  }
}

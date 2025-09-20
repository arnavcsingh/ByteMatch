import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test if the Hugging Face API key is available
    const apiKey = process.env.HF_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "HF_API_KEY not found in environment variables",
        fallback: "Will use mock data"
      });
    }

    // Test a simple API call to Hugging Face
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/resnet-50",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/octet-stream",
        },
        body: Buffer.from("test"), // Simple test
      }
    );

    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "Not set"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.HF_API_KEY
    }, { status: 500 });
  }
}

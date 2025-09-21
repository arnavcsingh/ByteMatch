import { NextRequest, NextResponse } from "next/server";
import { pexelsService } from "@/lib/pexels";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'random';
    const query = searchParams.get('query') || 'food';
    const count = parseInt(searchParams.get('count') || '10');

    let result;

    switch (type) {
      case 'search':
        result = await pexelsService.searchFoodPhotos(query, count);
        break;
      case 'curated':
        result = await pexelsService.getCuratedFoodPhotos(count);
        break;
      case 'cuisine':
        result = await pexelsService.getCuisinePhotos(query, count);
        break;
      case 'videos':
        result = await pexelsService.searchFoodVideos(query, count);
        break;
      default:
        result = await pexelsService.getRandomFoodPhotos(count);
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Pexels API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch images from Pexels',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



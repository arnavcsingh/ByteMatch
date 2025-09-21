import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const results: any = {
    clarifai: { status: 'not_tested', error: null, details: null },
    spoonacular: { status: 'not_tested', error: null, details: null },
    usda: { status: 'not_tested', error: null, details: null },
    pexels: { status: 'not_tested', error: null, details: null }
  };

  // Test Clarifai API
  try {
    const clarifaiKey = process.env.CLARIFAI_PAT;
    if (!clarifaiKey) {
      results.clarifai = { status: 'error', error: 'CLARIFAI_PAT not found' };
    } else {
      // Test with a simple image (base64 encoded 1x1 pixel)
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await fetch("https://api.clarifai.com/v2/models/food-item-recognition/versions/1d5fd481e0cf4826aa72ec3ff049e044/outputs", {
        method: "POST",
        headers: {
          "Authorization": `Key ${clarifaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_app_id: {
            user_id: "clarifai",
            app_id: "main"
          },
          inputs: [{
            data: {
              image: {
                base64: testImage
              }
            }
          }]
        })
      });

      if (response.ok) {
        results.clarifai = { status: 'success', details: 'API key valid and working' };
      } else {
        const errorText = await response.text();
        results.clarifai = { status: 'error', error: `${response.status} ${response.statusText}`, details: errorText };
      }
    }
  } catch (error) {
    results.clarifai = { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }

  // Test Spoonacular API
  try {
    const spoonacularKey = process.env.SPOONACULAR_API_KEY;
    if (!spoonacularKey) {
      results.spoonacular = { status: 'error', error: 'SPOONACULAR_API_KEY not found' };
    } else {
      const response = await fetch("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?query=pasta&number=1", {
        headers: {
          'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
          'x-rapidapi-key': spoonacularKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        results.spoonacular = { 
          status: 'success', 
          details: `Found ${data.results?.length || 0} recipes`,
          sampleRecipe: data.results?.[0]?.title || 'No recipes'
        };
      } else {
        const errorText = await response.text();
        results.spoonacular = { status: 'error', error: `${response.status} ${response.statusText}`, details: errorText };
      }
    }
  } catch (error) {
    results.spoonacular = { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }

  // Test USDA API
  try {
    const usdaKey = process.env.USDA_API_KEY;
    if (!usdaKey) {
      results.usda = { status: 'error', error: 'USDA_API_KEY not found' };
    } else {
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=apple&pageSize=1&api_key=${usdaKey}`);
      
      if (response.ok) {
        const data = await response.json();
        results.usda = { 
          status: 'success', 
          details: `Found ${data.foods?.length || 0} foods`,
          sampleFood: data.foods?.[0]?.description || 'No foods'
        };
      } else {
        const errorText = await response.text();
        results.usda = { status: 'error', error: `${response.status} ${response.statusText}`, details: errorText };
      }
    }
  } catch (error) {
    results.usda = { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }

  // Test Pexels API
  try {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (!pexelsKey) {
      results.pexels = { status: 'error', error: 'PEXELS_API_KEY not found' };
    } else {
      const response = await fetch("https://api.pexels.com/v1/search?query=food&per_page=1", {
        headers: {
          'Authorization': pexelsKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        results.pexels = { 
          status: 'success', 
          details: `Found ${data.photos?.length || 0} photos`,
          samplePhoto: data.photos?.[0]?.alt || 'No photos'
        };
      } else {
        const errorText = await response.text();
        results.pexels = { status: 'error', error: `${response.status} ${response.statusText}`, details: errorText };
      }
    }
  } catch (error) {
    results.pexels = { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }

  // Summary
  const workingApis = Object.values(results).filter((r: any) => r.status === 'success').length;
  const totalApis = Object.keys(results).length;

  return NextResponse.json({
    summary: {
      working: workingApis,
      total: totalApis,
      status: workingApis === totalApis ? 'all_working' : workingApis > 0 ? 'partial' : 'none_working'
    },
    apis: results,
    environment: {
      clarifai: process.env.CLARIFAI_PAT ? 'Set' : 'Not set',
      spoonacular: process.env.SPOONACULAR_API_KEY ? 'Set' : 'Not set',
      usda: process.env.USDA_API_KEY ? 'Set' : 'Not set',
      pexels: process.env.PEXELS_API_KEY ? 'Set' : 'Not set',
    }
  });
}

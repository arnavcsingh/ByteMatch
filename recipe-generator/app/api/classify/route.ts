import { NextRequest, NextResponse } from "next/server";
import { ClassificationResult } from "@/types";

// Mock classification data for different food types
const mockClassifications = {
  pizza: {
    dish: "Pizza",
    confidence: 0.95,
    cuisine: "Italian",
    tags: ["cheese", "tomato", "dough", "baked"],
  },
  burger: {
    dish: "Burger",
    confidence: 0.92,
    cuisine: "American",
    tags: ["beef", "bun", "lettuce", "tomato", "cheese"],
  },
  pasta: {
    dish: "Pasta",
    confidence: 0.88,
    cuisine: "Italian",
    tags: ["noodles", "sauce", "cheese", "herbs"],
  },
  salad: {
    dish: "Salad",
    confidence: 0.85,
    cuisine: "Mediterranean",
    tags: ["lettuce", "vegetables", "dressing", "fresh"],
  },
  sushi: {
    dish: "Sushi",
    confidence: 0.93,
    cuisine: "Japanese",
    tags: ["rice", "fish", "seaweed", "wasabi"],
  },
  curry: {
    dish: "Curry",
    confidence: 0.90,
    cuisine: "Indian",
    tags: ["spices", "rice", "vegetables", "coconut"],
  },
  tacos: {
    dish: "Tacos",
    confidence: 0.87,
    cuisine: "Mexican",
    tags: ["tortilla", "meat", "vegetables", "salsa"],
  },
  ramen: {
    dish: "Ramen",
    confidence: 0.91,
    cuisine: "Japanese",
    tags: ["noodles", "broth", "egg", "vegetables"],
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock classification - in a real app, this would use an ML model
    // For demo purposes, we'll randomly select a classification
    const classifications = Object.values(mockClassifications);
    const randomClassification = classifications[
      Math.floor(Math.random() * classifications.length)
    ] as ClassificationResult;

    // Add some randomness to confidence for realism
    const confidence = Math.max(0.7, randomClassification.confidence - Math.random() * 0.2);

    const result: ClassificationResult = {
      ...randomClassification,
      confidence: Math.round(confidence * 100) / 100,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Failed to classify image" },
      { status: 500 }
    );
  }
}

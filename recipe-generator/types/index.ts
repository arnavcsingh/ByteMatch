export interface Recipe {
  id: string;
  title: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisine: string;
  tags: string[];
  sourceUrl?: string;
}

export interface ClassificationResult {
  dish: string;
  confidence: number;
  cuisine: string;
  tags: string[];
}

export interface UploadedImage {
  file: File;
  preview: string;
}

export interface FilterOptions {
  availableIngredients: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  difficulty?: string[];
  cuisine?: string[];
}

export interface UserPreferences {
  favorites: string[];
  history: string[];
  dietaryRestrictions: string[];
}

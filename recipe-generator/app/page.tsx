"use client";

import { useState, useEffect } from "react";
import { Upload, Search, Filter, Heart, History, ChefHat, Loader2 } from "lucide-react";
import ImageUpload from "./components/image-upload/ImageUpload";
import RecipeCard from "./components/recipe-card/RecipeCard";
import IngredientFilter from "./components/ingredient-filter/IngredientFilter";
import { UploadedImage, ClassificationResult, Recipe, FilterOptions } from "@/types";
import { StorageManager } from "@/helpers/storage";

export default function HomePage() {
  // State management
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ availableIngredients: [] });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "favorites" | "history">("upload");
  const [showFilters, setShowFilters] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setFavorites(StorageManager.getFavorites());
    setHistory(StorageManager.getHistory());
  }, []);

  // Handle image upload
  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
    setClassification(null);
    setRecipes([]);
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    setClassification(null);
    setRecipes([]);
  };

  // Classify uploaded image
  const classifyImage = async () => {
    if (!uploadedImage) return;

    setIsClassifying(true);
    try {
      const formData = new FormData();
      formData.append("image", uploadedImage.file);

      const response = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result: ClassificationResult = await response.json();
        setClassification(result);
        await fetchRecipes(result);
      } else {
        console.error("Classification failed");
      }
    } catch (error) {
      console.error("Error classifying image:", error);
    } finally {
      setIsClassifying(false);
    }
  };

  // Fetch recipes based on classification and filters
  const fetchRecipes = async (classificationResult?: ClassificationResult) => {
    setIsLoadingRecipes(true);
    try {
      const params = new URLSearchParams();
      
      if (classificationResult) {
        params.append("dish", classificationResult.dish);
        params.append("cuisine", classificationResult.cuisine);
      }
      
      if (filters.availableIngredients.length > 0) {
        params.append("ingredients", filters.availableIngredients.join(","));
      }
      
      if (filters.maxPrepTime) {
        params.append("maxPrepTime", filters.maxPrepTime.toString());
      }
      
      if (filters.maxCookTime) {
        params.append("maxCookTime", filters.maxCookTime.toString());
      }
      
      if (filters.difficulty && filters.difficulty.length > 0) {
        params.append("difficulty", filters.difficulty.join(","));
      }

      const response = await fetch(`/api/recipes?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      } else {
        console.error("Failed to fetch recipes");
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    if (classification || recipes.length > 0) {
      fetchRecipes(classification);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = (recipeId: string) => {
    const isNowFavorite = StorageManager.toggleFavorite(recipeId);
    setFavorites(StorageManager.getFavorites());
    
    // Add to history when favorited
    if (isNowFavorite) {
      StorageManager.addToHistory(recipeId);
      setHistory(StorageManager.getHistory());
    }
  };

  // Handle recipe view
  const handleViewRecipe = (recipe: Recipe) => {
    StorageManager.addToHistory(recipe.id);
    setHistory(StorageManager.getHistory());
    // In a real app, this would open a detailed recipe view
    alert(`Viewing recipe: ${recipe.title}`);
  };

  // Get favorite recipes (mock data for demo)
  const getFavoriteRecipes = (): Recipe[] => {
    // In a real app, you'd fetch these from your API
    return recipes.filter(recipe => favorites.includes(recipe.id));
  };

  // Get history recipes (mock data for demo)
  const getHistoryRecipes = (): Recipe[] => {
    // In a real app, you'd fetch these from your API
    return recipes.filter(recipe => history.includes(recipe.id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Recipe Generator</h1>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Upload className="w-4 h-4 mr-2 inline" />
                Upload
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "favorites"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Heart className="w-4 h-4 mr-2 inline" />
                Favorites ({favorites.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "history"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <History className="w-4 h-4 mr-2 inline" />
                History ({history.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "upload" && (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upload a Food Image
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Get personalized recipes based on your dish
              </p>
              
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                uploadedImage={uploadedImage}
                isProcessing={isClassifying}
              />
              
              {uploadedImage && !classification && (
                <button
                  onClick={classifyImage}
                  disabled={isClassifying}
                  className="mt-6 bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {isClassifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Find Recipes
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Classification Results */}
            {classification && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Image Analysis Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Dish Type</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {classification.dish}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Cuisine</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {classification.cuisine}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Math.round(classification.confidence * 100)}%
                    </p>
                  </div>
                </div>
                {classification.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Detected Elements:</p>
                    <div className="flex flex-wrap gap-2">
                      {classification.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Recipe Filters
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </button>
            </div>

            {showFilters && (
              <IngredientFilter
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            )}

            {/* Recipes Grid */}
            {recipes.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Recommended Recipes
                </h3>
                {isLoadingRecipes ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading recipes...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={favorites.includes(recipe.id)}
                        onViewDetails={handleViewRecipe}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Favorite Recipes
            </h2>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No favorite recipes yet</p>
                <p className="text-sm text-gray-500">
                  Upload an image and add recipes to your favorites
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFavoriteRecipes().map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={true}
                    onViewDetails={handleViewRecipe}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recently Viewed Recipes
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No recent activity</p>
                <p className="text-sm text-gray-500">
                  Start exploring recipes to build your history
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getHistoryRecipes().map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.includes(recipe.id)}
                    onViewDetails={handleViewRecipe}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

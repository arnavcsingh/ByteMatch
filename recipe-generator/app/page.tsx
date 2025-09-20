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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative">
                <ChefHat className="w-8 h-8 text-orange-500 mr-3 drop-shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Recipe Generator
              </h1>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-white/50 backdrop-blur-sm rounded-xl p-1 shadow-lg">
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "upload"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <Upload className="w-4 h-4 mr-2 inline" />
                Upload
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "favorites"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <Heart className="w-4 h-4 mr-2 inline" />
                Favorites ({favorites.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
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
              <div className="mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
                  Upload a Food Image
                </h2>
                <p className="text-xl text-gray-600 mb-2">
                  Get personalized recipes based on your dish
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mx-auto"></div>
              </div>
              
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
                  className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 text-center">
                  🎯 Image Analysis Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">🍽️</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Dish Type</p>
                    <p className="text-xl font-bold text-gray-900">
                      {classification.dish}
                    </p>
                  </div>
                  <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">🌍</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Cuisine</p>
                    <p className="text-xl font-bold text-gray-900">
                      {classification.cuisine}
                    </p>
                  </div>
                  <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">📊</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(classification.confidence * 100)}%
                    </p>
                  </div>
                </div>
                {classification.tags.length > 0 && (
                  <div className="mt-8">
                    <p className="text-lg font-semibold text-gray-700 mb-4 text-center">Detected Elements:</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {classification.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-sm rounded-full border border-orange-200 font-medium shadow-sm hover:shadow-md transition-shadow"
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
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                🔍 Recipe Filters
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
                <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-8 text-center">
                  🍳 Recommended Recipes
                </h3>
                {isLoadingRecipes ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                      <span className="text-xl text-gray-600 font-medium">Loading delicious recipes...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-8 text-center">
              ❤️ Your Favorite Recipes
            </h2>
            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20 max-w-md mx-auto">
                  <Heart className="w-20 h-20 text-orange-300 mx-auto mb-6" />
                  <p className="text-xl text-gray-700 font-semibold mb-2">No favorite recipes yet</p>
                  <p className="text-gray-500">
                    Upload an image and add recipes to your favorites
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-8 text-center">
              📚 Recently Viewed Recipes
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20 max-w-md mx-auto">
                  <History className="w-20 h-20 text-orange-300 mx-auto mb-6" />
                  <p className="text-xl text-gray-700 font-semibold mb-2">No recent activity</p>
                  <p className="text-gray-500">
                    Start exploring recipes to build your history
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

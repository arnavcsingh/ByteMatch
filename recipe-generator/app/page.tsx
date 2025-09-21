"use client";

import { useState, useEffect } from "react";
import { Upload, Search, Filter, Heart, History, ChefHat, Loader2, User, Sparkles, Zap } from "lucide-react";
import ImageUpload from "./components/image-upload/ImageUpload";
import RecipeCard from "./components/recipe-card/RecipeCard";
import RecipeModal from "./components/recipe-modal/RecipeModal";
import AuthModal from "./components/auth/AuthModal";
import UserProfile from "./components/auth/UserProfile";
import IngredientFilter from "./components/ingredient-filter/IngredientFilter";
import BackgroundImages from "./components/background/BackgroundImages";
import FoodVisuals from "./components/visuals/FoodVisuals";
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Load user data and authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load localStorage data for non-authenticated users
  useEffect(() => {
    if (!user && !isLoadingUser) {
      setFavorites(StorageManager.getFavorites());
      setHistory(StorageManager.getHistory());
    }
  }, [user, isLoadingUser]);

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Load user's favorites and history from database
  const loadUserData = async (userId: string) => {
    try {
      // Load favorites
      const favoritesResponse = await fetch('/api/user/favorites');
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        const favoriteIds = favoritesData.recipes.map((r: Recipe) => r.id);
        setFavorites(favoriteIds);
        
        // Also load the actual recipe data for display
        if (favoritesData.recipes.length > 0) {
          setRecipes(prev => {
            const existingIds = prev.map(r => r.id);
            const newRecipes = favoritesData.recipes.filter((r: Recipe) => !existingIds.includes(r.id));
            return [...prev, ...newRecipes];
          });
        }
      }

      // Load history
      const historyResponse = await fetch('/api/user/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const historyIds = historyData.recipes.map((r: Recipe) => r.id);
        setHistory(historyIds);
        
        // Also load the actual recipe data for display
        if (historyData.recipes.length > 0) {
          setRecipes(prev => {
            const existingIds = prev.map(r => r.id);
            const newRecipes = historyData.recipes.filter((r: Recipe) => !existingIds.includes(r.id));
            return [...prev, ...newRecipes];
          });
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
    setClassification(null);
    // Don't clear recipes - keep favorites and history visible
    // setRecipes([]);
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    setClassification(null);
    // Don't clear recipes - keep favorites and history visible
    // setRecipes([]);
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
        // Merge new recipes with existing ones, avoiding duplicates
        setRecipes(prev => {
          const existingIds = prev.map(r => r.id);
          const newRecipes = data.recipes.filter((r: Recipe) => !existingIds.includes(r.id));
          return [...prev, ...newRecipes];
        });
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
  const handleToggleFavorite = async (recipeId: string) => {
    if (user) {
      // Use database for authenticated users
      try {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId }),
        });

        if (response.ok) {
          const data = await response.json();
          const isNowFavorite = data.isFavorite;
          
          // Update local state
          if (isNowFavorite) {
            setFavorites(prev => [...prev, recipeId]);
          } else {
            setFavorites(prev => prev.filter(id => id !== recipeId));
          }
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    } else {
      // Use localStorage for non-authenticated users
      const isNowFavorite = StorageManager.toggleFavorite(recipeId);
      setFavorites(StorageManager.getFavorites());
      
      // Add to history when favorited
      if (isNowFavorite) {
        StorageManager.addToHistory(recipeId);
        setHistory(StorageManager.getHistory());
      }
    }
  };

  // Handle recipe view
  const handleViewRecipe = async (recipe: Recipe) => {
    if (user) {
      // Use database for authenticated users
      try {
        await fetch('/api/user/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId: recipe.id }),
        });
        
        // Update local state
        setHistory(prev => {
          const filtered = prev.filter(id => id !== recipe.id);
          return [recipe.id, ...filtered].slice(0, 50);
        });
      } catch (error) {
        console.error('Failed to add to history:', error);
      }
    } else {
      // Use localStorage for non-authenticated users
      StorageManager.addToHistory(recipe.id);
      setHistory(StorageManager.getHistory());
    }
    
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  // Handle authentication success
  const handleAuthSuccess = async (userData: any) => {
    setUser(userData);
    // Clear current data and load fresh from database
    setFavorites([]);
    setHistory([]);
    setRecipes([]);
    await loadUserData(userData.id);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setFavorites([]);
    setHistory([]);
    setRecipes([]);
    // Fallback to localStorage for non-authenticated users
    setFavorites(StorageManager.getFavorites());
    setHistory(StorageManager.getHistory());
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

  // Get recipes to display in upload tab
  const getUploadTabRecipes = (): Recipe[] => {
    // If no image uploaded, show favorites by default
    if (!uploadedImage && !classification) {
      const favoriteRecipes = getFavoriteRecipes();
      // If no favorites, show history instead
      if (favoriteRecipes.length === 0) {
        return getHistoryRecipes();
      }
      return favoriteRecipes;
    }
    
    // If image uploaded and classified, show all recipes with correlated ones first
    if (classification) {
      return recipes.sort((a, b) => {
        // Calculate correlation score for each recipe
        const scoreA = calculateCorrelationScore(a, classification);
        const scoreB = calculateCorrelationScore(b, classification);
        return scoreB - scoreA; // Sort descending (highest correlation first)
      });
    }
    
    // Default: show all recipes
    return recipes;
  };

  // Calculate correlation score between recipe and classification
  const calculateCorrelationScore = (recipe: Recipe, classification: ClassificationResult): number => {
    let score = 0;
    
    // Check title correlation
    const titleLower = recipe.title.toLowerCase();
    const dishLower = classification.dish.toLowerCase();
    
    if (titleLower.includes(dishLower)) {
      score += 10; // High score for direct title match
    }
    
    // Check cuisine correlation
    if (recipe.cuisine.toLowerCase() === classification.cuisine.toLowerCase()) {
      score += 5; // Medium score for cuisine match
    }
    
    // Check ingredient correlation
    const classificationTags = classification.tags.map(tag => tag.toLowerCase());
    const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
    
    classificationTags.forEach(tag => {
      recipeIngredients.forEach(ingredient => {
        if (ingredient.includes(tag) || tag.includes(ingredient)) {
          score += 2; // Small score for ingredient matches
        }
      });
    });
    
    // Check tag correlation
    const recipeTags = recipe.tags.map(tag => tag.toLowerCase());
    classificationTags.forEach(tag => {
      recipeTags.forEach(recipeTag => {
        if (recipeTag.includes(tag) || tag.includes(recipeTag)) {
          score += 3; // Medium score for tag matches
        }
      });
    });
    
    return score;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-100 relative overflow-hidden">
      {/* Dynamic background images from Pexels */}
      <BackgroundImages 
        query="delicious food cooking"
        count={12}
        opacity={0.15}
        className="pointer-events-none"
      />
      
      {/* Floating food visuals */}
      <FoodVisuals 
        type="floating"
        query="gourmet food"
        count={8}
        className="pointer-events-none"
      />
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-2xl border-b border-white/30 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center group">
              <div className="relative">
                <ChefHat className="w-10 h-10 text-orange-500 mr-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg" />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent font-serif">
                ByteMatch
              </h1>
            </div>

            {/* Authentication */}
            <div className="flex items-center space-x-4">
              {isLoadingUser ? (
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <UserProfile user={user} onLogout={handleLogout} />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex space-x-2 bg-white/60 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/30">
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center ${
                  activeTab === "upload"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105 hover:scale-110"
                    : "text-gray-700 hover:text-orange-600 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center ${
                  activeTab === "favorites"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105 hover:scale-110"
                    : "text-gray-700 hover:text-orange-600 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorites ({favorites.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105 hover:scale-110"
                    : "text-gray-700 hover:text-orange-600 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <History className="w-4 h-4 mr-2" />
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
            <div className="text-center relative">
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mb-6 shadow-2xl">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-6 font-serif">
                  🍳 Discover Your Perfect Recipe
                </h2>
                <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Upload a photo of your food and get personalized recipe recommendations powered by AI
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span>AI-Powered</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                    <span>Instant Results</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                    <span>Personalized</span>
                  </div>
                </div>
              </div>
              
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                uploadedImage={uploadedImage}
                isProcessing={isClassifying}
              />
              
              {uploadedImage && !classification && (
                <div className="mt-12">
                  <button
                    onClick={classifyImage}
                    disabled={isClassifying}
                    className="group relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {isClassifying ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin relative z-10" />
                        <span className="relative z-10">Analyzing Image...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6 mr-3 relative z-10" />
                        <span className="relative z-10">Find Recipes</span>
                        <Sparkles className="w-4 h-4 ml-2 relative z-10 animate-pulse" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Classification Results */}
            {classification && (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
                <div className="relative">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 shadow-xl">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2 font-serif">
                      🎯 Image Analysis Complete
                    </h3>
                    <p className="text-gray-600">Here's what we detected in your image</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-orange-200/50 hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-2xl">🍽️</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">Dish Type</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {classification.dish}
                      </p>
                    </div>
                    <div className="group text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-orange-200/50 hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-2xl">🌍</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">Cuisine</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {classification.cuisine}
                      </p>
                    </div>
                    <div className="group text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-orange-200/50 hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-2xl">📊</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">Confidence</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(classification.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  {classification.tags.length > 0 && (
                    <div className="mt-10">
                      <p className="text-xl font-semibold text-gray-800 mb-6 text-center">✨ Detected Elements:</p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {classification.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="group px-6 py-3 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-sm rounded-full border border-orange-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default"
                          >
                            <span className="group-hover:text-orange-900 transition-colors">{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent font-serif">
                  🔍 Recipe Filters
                </h3>
                <p className="text-gray-600 mt-1">Customize your recipe search</p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="group flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl text-sm font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
              >
                <Filter className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                {showFilters ? "Hide" : "Show"} Filters
                <Sparkles className="w-4 h-4 ml-2 group-hover:animate-pulse" />
              </button>
            </div>

            {showFilters && (
              <IngredientFilter
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            )}

            {/* Food Inspiration Carousel */}
            {!uploadedImage && !classification && (
              <div className="relative mb-16">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mb-4 shadow-2xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2 font-serif">
                    🎨 Food Inspiration
                  </h3>
                  <p className="text-gray-600">Discover beautiful dishes from around the world</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30">
                  <FoodVisuals 
                    type="carousel"
                    query="gourmet food fine dining"
                    count={10}
                    className="h-40"
                  />
                </div>
              </div>
            )}

            {/* Recipes Grid */}
            {getUploadTabRecipes().length > 0 && (
              <div className="relative">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mb-6 shadow-2xl">
                    <ChefHat className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4 font-serif">
                    {!uploadedImage && !classification 
                      ? (getFavoriteRecipes().length > 0 ? "❤️ Your Favorite Recipes" : "📚 Your Recent Recipes")
                      : "🍳 Recommended Recipes"
                    }
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {!uploadedImage && !classification 
                      ? "Your personalized collection"
                      : "Handpicked just for you"
                    }
                  </p>
                </div>
                {isLoadingRecipes ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/30">
                      <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Loader2 className="w-10 h-10 animate-spin text-white" />
                      </div>
                      <span className="text-2xl text-gray-700 font-semibold">Loading delicious recipes...</span>
                      <p className="text-gray-500 mt-2">This might take a moment</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {getUploadTabRecipes().map((recipe, index) => (
                      <div 
                        key={recipe.id}
                        className="transform transition-all duration-500 hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <RecipeCard
                          recipe={recipe}
                          onToggleFavorite={handleToggleFavorite}
                          isFavorite={favorites.includes(recipe.id)}
                          onViewDetails={handleViewRecipe}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mb-6 shadow-2xl">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 bg-clip-text text-transparent mb-4 font-serif">
                ❤️ Your Favorite Recipes
              </h2>
              <p className="text-gray-600 text-lg">Recipes you love and want to cook again</p>
            </div>
            {favorites.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 border border-white/30 max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-r from-pink-200 to-red-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Heart className="w-12 h-12 text-pink-400" />
                  </div>
                  <h3 className="text-2xl text-gray-800 font-bold mb-4">No favorite recipes yet</h3>
                  <p className="text-gray-600 mb-6">
                    Upload an image and add recipes to your favorites to see them here
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Start Exploring
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getFavoriteRecipes().map((recipe, index) => (
                  <div 
                    key={recipe.id}
                    className="transform transition-all duration-500 hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={true}
                      onViewDetails={handleViewRecipe}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mb-6 shadow-2xl">
                <History className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4 font-serif">
                📚 Recently Viewed Recipes
              </h2>
              <p className="text-gray-600 text-lg">Your cooking journey and discoveries</p>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 border border-white/30 max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <History className="w-12 h-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl text-gray-800 font-bold mb-4">No recent activity</h3>
                  <p className="text-gray-600 mb-6">
                    Start exploring recipes to build your cooking history
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Start Exploring
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getHistoryRecipes().map((recipe, index) => (
                  <div 
                    key={recipe.id}
                    className="transform transition-all duration-500 hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.includes(recipe.id)}
                      onViewDetails={handleViewRecipe}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedRecipe ? favorites.includes(selectedRecipe.id) : false}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

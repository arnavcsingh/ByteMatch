"use client";

import { useState, useEffect } from "react";
import { Upload, Search, Filter, Heart, History, ChefHat, Loader2, User } from "lucide-react";
import ImageUpload from "./components/image-upload/ImageUpload";
import RecipeCard from "./components/recipe-card/RecipeCard";
import RecipeModal from "./components/recipe-modal/RecipeModal";
import AuthModal from "./components/auth/AuthModal";
import UserProfile from "./components/auth/UserProfile";
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
            {getUploadTabRecipes().length > 0 && (
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-8 text-center">
                  {!uploadedImage && !classification 
                    ? (getFavoriteRecipes().length > 0 ? "❤️ Your Favorite Recipes" : "📚 Your Recent Recipes")
                    : "🍳 Recommended Recipes"
                  }
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
                    {getUploadTabRecipes().map((recipe) => (
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

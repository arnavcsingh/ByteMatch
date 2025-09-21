"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Search, Filter, Heart, History, ChefHat, Loader2, User, Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [recipeCache, setRecipeCache] = useState<Recipe[]>([]); // Cache for all fetched recipes
  const [filters, setFilters] = useState<FilterOptions>({ availableIngredients: [] });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyRecipes, setHistoryRecipes] = useState<Recipe[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "favorites" | "history">("upload");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isRefreshingCounters, setIsRefreshingCounters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 6;
  const filterRef = useRef<HTMLDivElement>(null);

  // Load user data and authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load localStorage data for non-authenticated users
  useEffect(() => {
    if (!user && !isLoadingUser) {
      // For non-authenticated users, start fresh each session (reset on page refresh)
      // Only clear on initial load, not on every user state change
      const hasInitialized = sessionStorage.getItem('session-initialized');
      if (!hasInitialized) {
        StorageManager.clearAll();
        setFavorites([]);
        setHistory([]);
        setFavoriteRecipes([]);
        setHistoryRecipes([]);
        sessionStorage.setItem('session-initialized', 'true');
        console.log('Session initialized - cleared all data for non-authenticated user');
      }
    }
  }, [user, isLoadingUser]);

  // Periodically refresh counters to ensure accuracy
  useEffect(() => {
    const interval = setInterval(() => {
      if (user || (!user && !isLoadingUser)) {
        refreshCounters();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
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
        setFavoriteRecipes(favoritesData.recipes);
        console.log('Loaded favorites:', { count: favoritesData.recipes.length, ids: favoriteIds });
      } else {
        console.log('Failed to load favorites:', favoritesResponse.status);
      }

      // Load history
      const historyResponse = await fetch('/api/user/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const historyIds = historyData.recipes.map((r: Recipe) => r.id);
        setHistory(historyIds);
        setHistoryRecipes(historyData.recipes);
        console.log('Loaded history:', { count: historyData.recipes.length, ids: historyIds });
      } else {
        console.log('Failed to load history:', historyResponse.status);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
    setClassification(null);
    // Don't clear cache - keep previous recipes visible until new image is classified
    // setRecipeCache([]);
    // setRecipes([]);
    setCurrentPage(1); // Reset to first page
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    setClassification(null);
    // Clear cache and recipes when image is removed
    setRecipeCache([]);
    setRecipes([]);
    setCurrentPage(1); // Reset to first page
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
        
        // Clear cache when new image is classified to get relevant recipes
        setRecipeCache([]);
        setRecipes([]);
        setCurrentPage(1);
        
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

      // Fetch a larger set of recipes for cache (30 recipes)
      params.append("targetCount", "30");

      const response = await fetch(`/api/recipes?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.recipes && data.recipes.length > 0) {
          // Store all recipes in cache
          setRecipeCache(data.recipes);
          console.log(`Cached ${data.recipes.length} recipes for filtering`);
          
          // Display the first 6 recipes
          setRecipes(data.recipes.slice(0, 6));
          console.log(`Displaying first 6 of ${data.recipes.length} recipes`);
        }
      } else {
        console.error("Failed to fetch recipes");
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };


  // Apply filters to recipes
  const applyFiltersToRecipes = useCallback((recipeList: Recipe[]): Recipe[] => {
    return recipeList.filter(recipe => {
      // Filter by available ingredients
      if (filters.availableIngredients && filters.availableIngredients.length > 0) {
        const hasRequiredIngredients = filters.availableIngredients.every(ingredient =>
          recipe.ingredients.some(recipeIngredient =>
            recipeIngredient.toLowerCase().includes(ingredient.toLowerCase())
          )
        );
        if (!hasRequiredIngredients) return false;
      }

      // Filter by prep time
      if (filters.maxPrepTime && recipe.prepTime > filters.maxPrepTime) {
        return false;
      }

      // Filter by cook time
      if (filters.maxCookTime && recipe.cookTime > filters.maxCookTime) {
        return false;
      }

      // Filter by difficulty
      if (filters.difficulty && filters.difficulty.length > 0) {
        if (!filters.difficulty.includes(recipe.difficulty)) {
          return false;
        }
      }

      // Filter by cuisine
      if (filters.cuisine && filters.cuisine.length > 0) {
        if (!filters.cuisine.includes(recipe.cuisine)) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = useCallback(async (newFilters: FilterOptions) => {
    setFilters(newFilters);
    
    // Check if we need to fetch more recipes after filtering
    if (classification || recipeCache.length > 0) {
      // First, apply filters to current cache to see how many remain
      const currentFilteredRecipes = applyFiltersToRecipes(recipeCache);
      
      // If we have fewer than 6 recipes after filtering, fetch more
      if (currentFilteredRecipes.length < 6) {
        console.log(`Only ${currentFilteredRecipes.length} recipes remain after filtering, fetching more...`);
        await fetchMoreFilteredRecipes(classification || undefined, newFilters, recipeCache.length);
      }
    }
  }, [classification, recipeCache, applyFiltersToRecipes]);

  // Helper function to save recipe to database
  const saveRecipeToDatabase = async (recipe: Recipe) => {
    try {
      await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
      });
    } catch (error) {
      console.error('Failed to save recipe to database:', error);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (recipeId: string) => {
    console.log('handleToggleFavorite called with recipeId:', recipeId, 'user:', user ? 'authenticated' : 'not authenticated');
    if (user) {
      // Use database for authenticated users
      try {
        // First, save the recipe to database if it doesn't exist
        const recipe = recipes.find(r => r.id === recipeId) || recipeCache.find(r => r.id === recipeId);
        if (recipe) {
          await saveRecipeToDatabase(recipe);
        }

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

          // Update favoriteRecipes state
          const recipeObj = recipes.find(r => r.id === recipeId) || recipeCache.find(r => r.id === recipeId);
          if (recipeObj) {
            if (isNowFavorite) {
              setFavoriteRecipes(prev => {
                const existingIds = prev.map(r => r.id);
                if (!existingIds.includes(recipeObj.id)) {
                  return [...prev, recipeObj];
                }
                return prev;
              });
            } else {
              setFavoriteRecipes(prev => prev.filter(r => r.id !== recipeId));
            }
          }

          // Refresh counters to ensure accuracy
          refreshCounters();
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    } else {
      // Use session-based storage for non-authenticated users
      console.log('Using session-based storage for non-authenticated user');
      const isCurrentlyFavorite = favorites.includes(recipeId);
      const isNowFavorite = !isCurrentlyFavorite;
      
      if (isNowFavorite) {
        setFavorites(prev => [...prev, recipeId]);
        // Add to history when favorited
        setHistory(prev => {
          const existingIds = prev.map(id => id);
          if (!existingIds.includes(recipeId)) {
            return [recipeId, ...prev].slice(0, 50);
          }
          return prev;
        });
      } else {
        setFavorites(prev => prev.filter(id => id !== recipeId));
      }
      
      // Update favoriteRecipes and historyRecipes state
      const recipe = recipes.find(r => r.id === recipeId) || recipeCache.find(r => r.id === recipeId);
      console.log('Looking for recipe:', { recipeId, found: !!recipe, recipesCount: recipes.length, cacheCount: recipeCache.length });
      
      if (recipe) {
        if (isNowFavorite) {
          setFavoriteRecipes(prev => {
            const existingIds = prev.map(r => r.id);
            if (!existingIds.includes(recipe.id)) {
              console.log('Adding to favoriteRecipes:', recipe.title);
              return [...prev, recipe];
            }
            return prev;
          });
          setHistoryRecipes(prev => {
            const existingIds = prev.map(r => r.id);
            if (!existingIds.includes(recipe.id)) {
              console.log('Adding to historyRecipes:', recipe.title);
              return [recipe, ...prev].slice(0, 50);
            }
            return prev;
          });
        } else {
          setFavoriteRecipes(prev => prev.filter(r => r.id !== recipeId));
        }
      } else {
        console.error('Recipe not found for ID:', recipeId);
      }
      console.log('Updated favorites:', isNowFavorite ? 'added' : 'removed', recipeId);
    }
  };

  // Handle recipe view
  const handleViewRecipe = async (recipe: Recipe) => {
    console.log('handleViewRecipe called with recipe:', recipe.title, 'user:', user ? 'authenticated' : 'not authenticated');
    if (user) {
      // Use database for authenticated users
      try {
        // First, save the recipe to database if it doesn't exist
        await saveRecipeToDatabase(recipe);

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
          return [recipe.id, ...filtered].slice(0, 30);
        });

        // Update historyRecipes state
        setHistoryRecipes(prev => {
          const existingIds = prev.map(r => r.id);
          if (!existingIds.includes(recipe.id)) {
            return [recipe, ...prev].slice(0, 50);
          }
          return prev;
        });

        // Refresh counters to ensure accuracy
        refreshCounters();
      } catch (error) {
        console.error('Failed to add to history:', error);
      }
    } else {
      // Use session-based storage for non-authenticated users
      console.log('Using session-based storage for non-authenticated user history');
      setHistory(prev => {
        const existingIds = prev.map(id => id);
        if (!existingIds.includes(recipe.id)) {
          return [recipe.id, ...prev].slice(0, 50);
        }
        return prev;
      });
      
      // Add recipe to historyRecipes if not already there
      setHistoryRecipes(prev => {
        const existingIds = prev.map(r => r.id);
        if (!existingIds.includes(recipe.id)) {
          return [recipe, ...prev].slice(0, 50); // Limit to 50 items
        }
        return prev;
      });
      console.log('Updated history:', 'added', recipe.title);
    }
    
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  // Handle removing recipe from history
  const handleRemoveFromHistory = async (recipeId: string) => {
    if (user) {
      // Use database for authenticated users
      try {
        const response = await fetch('/api/user/remove-from-history', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId }),
        });

        if (response.ok) {
          // Update local state
          setHistory(prev => prev.filter(id => id !== recipeId));
          
          // Remove from historyRecipes state
          setHistoryRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
          
          // Also remove from recipes if it's there
          setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
          // Refresh counters to ensure accuracy
          refreshCounters();
        }
      } catch (error) {
        console.error('Failed to remove from history:', error);
      }
    } else {
      // Use session-based storage for non-authenticated users
      setHistory(prev => prev.filter(id => id !== recipeId));
      
      // Remove from historyRecipes state
      setHistoryRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    }
  };

  // Handle removing recipe from favorites
  const handleRemoveFromFavorites = async (recipeId: string) => {
    if (user) {
      // Use database for authenticated users
      try {
        const response = await fetch('/api/user/remove-from-favorites', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId }),
        });

        if (response.ok) {
          // Update local state
          setFavorites(prev => prev.filter(id => id !== recipeId));
          
          // Remove from favoriteRecipes state
          setFavoriteRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
          
          // Also remove from recipes if it's there
          setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
          // Refresh counters to ensure accuracy
          refreshCounters();
        }
      } catch (error) {
        console.error('Failed to remove from favorites:', error);
      }
    } else {
      // Use session-based storage for non-authenticated users
      setFavorites(prev => prev.filter(id => id !== recipeId));
      
      // Remove from favoriteRecipes state
      setFavoriteRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    }
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
    setFavoriteRecipes([]);
    setHistory([]);
    setRecipes([]);
    setHistoryRecipes([]);
    // Clear localStorage and session storage when logging out
    StorageManager.clearAll();
    sessionStorage.removeItem('session-initialized');
  };


  // Refresh counters to ensure they're always accurate
  const refreshCounters = async () => {
    if (isRefreshingCounters) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshingCounters(true);
    try {
      if (user) {
        // For authenticated users, reload from database to ensure accuracy
        await loadUserData(user.id);
      } else {
        // For non-authenticated users, don't clear state during refresh
        // State is managed by user interactions, not by refreshCounters
        console.log('Non-authenticated user - skipping counter refresh');
      }
    } catch (error) {
      console.error('Error refreshing counters:', error);
    } finally {
      setIsRefreshingCounters(false);
    }
  };


  // Get recipes to display in upload tab
  const getUploadTabRecipes = (): Recipe[] => {
    let baseRecipes: Recipe[] = [];

    // If no image uploaded, show favorites by default, but only if we have no fetched recipes
    if (!uploadedImage && !classification) {
      if (recipeCache.length === 0) {
        const favoriteRecipes = getFavoriteRecipes();
        // If no favorites, show history instead
        if (favoriteRecipes.length === 0) {
          const historyRecipes = getHistoryRecipes();
          // If no history either, show the main recipes state
          if (historyRecipes.length === 0) {
            baseRecipes = recipes;
          } else {
            baseRecipes = historyRecipes;
          }
        } else {
          baseRecipes = favoriteRecipes;
        }
      } else {
        // Show cached recipes even without image upload
        baseRecipes = recipeCache;
      }
    } else if (classification) {
      // If image uploaded and classified, always use the full cache for pagination
      baseRecipes = recipeCache.sort((a, b) => {
        const scoreA = calculateCorrelationScore(a, classification);
        const scoreB = calculateCorrelationScore(b, classification);
        return scoreB - scoreA;
      });
    } else {
      // Default: use cache if available, otherwise use limited recipes
      baseRecipes = recipeCache.length > 0 ? recipeCache : recipes;
    }

    // Apply filters to the base recipes
    return applyFiltersToRecipes(baseRecipes);
  };

  // Get favorite recipes with filters applied
  const getFavoriteRecipes = (): Recipe[] => {
    // For both authenticated and non-authenticated users, use the favoriteRecipes state
    console.log('getFavoriteRecipes called:', { 
      user: user ? 'authenticated' : 'not authenticated', 
      favoriteRecipes: favoriteRecipes.length,
      favorites: favorites.length,
      favoriteRecipesTitles: favoriteRecipes.map(r => r.title)
    });
    return applyFiltersToRecipes(favoriteRecipes);
  };

  // Get history recipes with filters applied
  const getHistoryRecipes = (): Recipe[] => {
    // For both authenticated and non-authenticated users, use the historyRecipes state
    console.log('getHistoryRecipes called:', { 
      user: user ? 'authenticated' : 'not authenticated', 
      historyRecipes: historyRecipes.length,
      history: history.length,
      historyRecipesTitles: historyRecipes.map(r => r.title)
    });
    return applyFiltersToRecipes(historyRecipes);
  };

  // Check if any filters are active
  const hasActiveFilters = (): boolean => {
    return Boolean(
      (filters.availableIngredients && filters.availableIngredients.length > 0) ||
      (filters.maxPrepTime !== undefined && filters.maxPrepTime < 60) ||
      (filters.maxCookTime !== undefined && filters.maxCookTime < 60) ||
      (filters.difficulty && filters.difficulty.length > 0) ||
      (filters.cuisine && filters.cuisine.length > 0)
    );
  };

  // Get count of active filters
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.availableIngredients && filters.availableIngredients.length > 0) count++;
    if (filters.maxPrepTime !== undefined && filters.maxPrepTime < 60) count++;
    if (filters.maxCookTime !== undefined && filters.maxCookTime < 60) count++;
    if (filters.difficulty && filters.difficulty.length > 0) count++;
    if (filters.cuisine && filters.cuisine.length > 0) count++;
    return count;
  };

  // Get paginated recipes for current page
  const getPaginatedRecipes = (): Recipe[] => {
    const allRecipes = getUploadTabRecipes();
    const startIndex = (currentPage - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    return allRecipes.slice(startIndex, endIndex);
  };

  // Get total number of pages
  const getTotalPages = (): number => {
    const allRecipes = getUploadTabRecipes();
    return Math.ceil(allRecipes.length / recipesPerPage);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch additional recipes that meet filter criteria
  const fetchMoreFilteredRecipes = async (classification: ClassificationResult | undefined, appliedFilters: FilterOptions, currentRecipeCount: number) => {
    try {
      setIsLoadingRecipes(true);
      
      // Calculate how many more recipes we need, but prioritize relevance over quantity
      const currentFiltered = applyFiltersToRecipes(recipeCache);
      const neededRecipes = Math.min(6 - currentFiltered.length, 4); // Don't fetch more than 4 additional
      
      if (neededRecipes <= 0) return;

      console.log(`Fetching ${neededRecipes} more recipes to meet filter criteria...`);
      console.log("Current recipes count:", recipes.length);
      console.log("Current cache count:", recipeCache.length);
      console.log("Current filtered recipes count:", currentFiltered.length);
      console.log("Applied filters:", appliedFilters);

      // Build query parameters for additional recipes - be less restrictive
      const queryParams = new URLSearchParams();
      
      if (classification) {
        queryParams.append("dish", classification.dish);
        queryParams.append("cuisine", classification.cuisine);
      }
      
      // Only add the most important filters to avoid being too restrictive
      if (appliedFilters.maxPrepTime && appliedFilters.maxPrepTime < 60) {
        queryParams.append("maxPrepTime", appliedFilters.maxPrepTime.toString());
      }
      if (appliedFilters.maxCookTime && appliedFilters.maxCookTime < 60) {
        queryParams.append("maxCookTime", appliedFilters.maxCookTime.toString());
      }
      
      // Add parameters to fetch more recipes
      queryParams.append("additionalRecipes", "true");
      queryParams.append("neededCount", neededRecipes.toString());
      queryParams.append("targetCount", "6"); // Configurable display max
      queryParams.append("prioritizeRelevance", "true"); // New parameter to prioritize relevance

      const response = await fetch(`/api/recipes?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch additional recipes: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      
      if (data.success && data.recipes) {
        // Get existing recipe IDs to avoid duplicates
        const existingIds = new Set(recipes.map(r => r.id));
        console.log("Existing recipe IDs:", Array.from(existingIds));
        
        // Filter out duplicates and add new recipes
        const newRecipes = data.recipes.filter((recipe: Recipe) => !existingIds.has(recipe.id));
        console.log("New recipes found:", newRecipes.length);
        
        if (newRecipes.length > 0) {
          console.log(`Added ${newRecipes.length} new recipes that meet filter criteria`);
          
          // Update cache with new recipes
          setRecipeCache(prevCache => {
            const cacheExistingIds = new Set(prevCache.map(r => r.id));
            const cacheNewRecipes = newRecipes.filter((recipe: Recipe) => !cacheExistingIds.has(recipe.id));
            const updatedCache = [...prevCache, ...cacheNewRecipes];
            console.log(`Updated cache: ${prevCache.length} -> ${updatedCache.length} recipes`);
            return updatedCache;
          });
          
          // Update displayed recipes
          setRecipes(prevRecipes => [...prevRecipes, ...newRecipes]);
        } else {
          console.log("No new recipes found that meet the criteria");
        }
      } else {
        console.log("API call failed or returned no recipes:", data);
      }
    } catch (error) {
      console.error("Error fetching additional filtered recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
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
    if (recipe.cuisine && classification.cuisine && 
        recipe.cuisine.toLowerCase() === classification.cuisine.toLowerCase()) {
      score += 5; // Medium score for cuisine match
    }
    
    // Check ingredient correlation
    const classificationTags = classification.tags?.map(tag => tag?.toLowerCase()).filter(Boolean) || [];
    const recipeIngredients = recipe.ingredients?.map(ing => ing?.toLowerCase()).filter(Boolean) || [];
    
    classificationTags.forEach(tag => {
      recipeIngredients.forEach(ingredient => {
        if (ingredient && tag && (ingredient.includes(tag) || tag.includes(ingredient))) {
          score += 2; // Small score for ingredient matches
        }
      });
    });
    
    // Check tag correlation
    const recipeTags = recipe.tags?.map(tag => tag?.toLowerCase()).filter(Boolean) || [];
    classificationTags.forEach(tag => {
      recipeTags.forEach(recipeTag => {
        if (recipeTag && tag && (recipeTag.includes(tag) || tag.includes(recipeTag))) {
          score += 3; // Medium score for tag matches
        }
      });
    });
    
    return score;
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 relative overflow-x-hidden prevent-zoom">
      {/* Coherent background with diverse food imagery - completely static */}
      <BackgroundImages 
        query="warm kitchen cooking"
        count={20}
        opacity={0.3}
        className="pointer-events-none z-0 stable-background"
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
                onClick={async () => {
                  setActiveTab("favorites");
                  setCurrentPage(1);
                  if (user) {
                    await refreshCounters();
                  }
                }}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center ${
                  activeTab === "favorites"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105 hover:scale-110"
                    : "text-gray-700 hover:text-orange-600 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorites ({isRefreshingCounters ? "..." : getFavoriteRecipes().length})
              </button>
              <button
                onClick={async () => {
                  setActiveTab("history");
                  setCurrentPage(1);
                  if (user) {
                    await refreshCounters();
                  }
                }}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105 hover:scale-110"
                    : "text-gray-700 hover:text-orange-600 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <History className="w-4 h-4 mr-2" />
                History ({isRefreshingCounters ? "..." : getHistoryRecipes().length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === "upload" && (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="text-center relative">
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mb-6 shadow-2xl">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-6 font-serif" style={{ textShadow: '2px 2px 8px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)' }}>
                  🍳 Discover Your Perfect Recipe
                </h2>
                <p className="text-xl text-gray-800 mb-6 max-w-2xl mx-auto leading-relaxed font-semibold" style={{ textShadow: '1px 1px 4px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.4)' }}>
                  Upload a photo of your food and get personalized recipe recommendations powered by AI
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-700 font-medium">
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
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/30 relative overflow-hidden">
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

            <div className="relative">
              {/* Filter container - use relative positioning to maintain document flow */}
              <div 
                ref={filterRef}
                className={`transition-all duration-700 ease-out ${
                  showFilters 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 max-h-0 transform -translate-y-2 overflow-hidden'
                }`}
                style={{
                  transitionProperty: 'opacity, max-height, transform',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <IngredientFilter
                  onFilterChange={handleFilterChange}
                  initialFilters={filters}
                />
              </div>
            </div>

            {/* Food Inspiration Carousel */}
            {!uploadedImage && !classification && (
              <div className="relative mb-16">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mb-4 shadow-2xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2 font-serif">
                    🍽️ Food Inspiration
                  </h3>
                  <p className="text-gray-600">Discover beautiful dishes from around the world</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30">
                  <FoodVisuals 
                    type="carousel"
                    query="delicious food recipes"
                    count={15}
                    className="h-40"
                  />
                </div>
              </div>
            )}

            {/* Recipes Grid */}
            {(uploadedImage || classification || getUploadTabRecipes().length > 0 || isLoadingRecipes) && (
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
                  
                  {/* Filter Status Indicator */}
                  {hasActiveFilters() && (
                    <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-semibold border border-green-200">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters Applied ({getActiveFilterCount()} active)
                    </div>
                  )}
                </div>
                {isLoadingRecipes ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center bg-white/40 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/30">
                      <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Loader2 className="w-10 h-10 animate-spin text-white" />
                      </div>
                      <span className="text-2xl text-gray-800 font-semibold" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>Loading delicious recipes...</span>
                      <p className="text-gray-700 mt-2" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.6)' }}>This might take a moment</p>
                    </div>
                  </div>
                ) : getUploadTabRecipes().length === 0 ? (
                  <div className="text-center py-20">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 border border-white/30 max-w-lg mx-auto">
                      <div className="w-24 h-24 bg-gradient-to-r from-orange-200 to-red-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <ChefHat className="w-12 h-12 text-orange-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">No Recipes Found</h3>
                      <p className="text-gray-600 mb-6">
                        {hasActiveFilters() 
                          ? "We couldn't find any recipes matching your current filters. Try adjusting your search criteria or clearing some filters."
                          : "No recipes are available at the moment. Try uploading an image to get personalized recipe recommendations!"
                        }
                      </p>
                      {hasActiveFilters() && (
                        <button
                          onClick={() => setFilters({ availableIngredients: [] })}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {getPaginatedRecipes().map((recipe, index) => (
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
                    
                    {/* Pagination Controls */}
                    {getTotalPages() > 1 && (
                      <div className="flex justify-center items-center mt-12 space-x-4">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                                  : "bg-white/90 hover:bg-white text-gray-700 shadow-lg hover:shadow-xl"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                          disabled={currentPage === getTotalPages()}
                          className="flex items-center px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    )}
                    
                    {/* Recipe Count Info */}
                    <div className="text-center mt-8">
                      <p className="text-gray-600">
                        Showing {getPaginatedRecipes().length} of {getUploadTabRecipes().length} recipes
                        {getTotalPages() > 1 && ` (Page ${currentPage} of ${getTotalPages()})`}
                      </p>
                    </div>
                  </>
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
            {getFavoriteRecipes().length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 border border-white/30 max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-r from-pink-200 to-red-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Heart className="w-12 h-12 text-pink-400" />
                  </div>
                  <h3 className="text-2xl text-gray-800 font-bold mb-4">
                    {favorites.length > 0 ? "Favorite recipes not found" : "No favorite recipes yet"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {favorites.length > 0 
                      ? "Your favorite recipes may have been removed or are no longer available. Try exploring new recipes!"
                      : "Upload an image and add recipes to your favorites to see them here"
                    }
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {favorites.length > 0 ? "Explore New Recipes" : "Start Exploring"}
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
                      onRemove={handleRemoveFromFavorites}
                      showRemoveButton={false}
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
            {getHistoryRecipes().length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-16 border border-white/30 max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <History className="w-12 h-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl text-gray-800 font-bold mb-4">
                    {history.length > 0 ? "History recipes not found" : "No recent activity"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {history.length > 0 
                      ? "Your recently viewed recipes may have been removed or are no longer available. Try exploring new recipes!"
                      : "Start exploring recipes to build your cooking history"
                    }
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {history.length > 0 ? "Explore New Recipes" : "Start Exploring"}
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
                      onRemove={handleRemoveFromHistory}
                      showRemoveButton={true}
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

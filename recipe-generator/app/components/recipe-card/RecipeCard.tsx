"use client";

import { useState, useEffect } from "react";
import { Clock, Users, ChefHat, Heart, ExternalLink, Sparkles, Star } from "lucide-react";
import { Recipe } from "@/types";
import { usePexelsImage } from "@/app/hooks/usePexelsImage";

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite?: (recipeId: string) => void;
  isFavorite?: boolean;
  onViewDetails?: (recipe: Recipe) => void;
}

export default function RecipeCard({
  recipe,
  onToggleFavorite,
  isFavorite = false,
  onViewDetails,
}: RecipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showPexelsFallback, setShowPexelsFallback] = useState(false);
  const { image: pexelsImage, getImageForRecipe } = usePexelsImage({
    fallbackQuery: 'delicious food'
  });

  // Fetch Pexels image when original image fails
  useEffect(() => {
    if (imageError && !showPexelsFallback) {
      getImageForRecipe(recipe.title, recipe.cuisine);
      setShowPexelsFallback(true);
    }
  }, [imageError, showPexelsFallback, recipe.title, recipe.cuisine, getImageForRecipe]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "🟢";
      case "medium":
        return "🟡";
      case "hard":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div className="group bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border border-white/30 relative">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
      {/* Recipe Image */}
      <div className="relative h-64 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
        {!imageError ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImageError(true)}
          />
        ) : pexelsImage ? (
          <img
            src={pexelsImage.src.large}
            alt={pexelsImage.alt || recipe.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
            <div className="text-center">
              <ChefHat className="w-20 h-20 text-orange-400 mx-auto mb-2" />
              <p className="text-orange-600 font-semibold">Recipe Image</p>
            </div>
          </div>
        )}
        
        {/* Image overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className={`absolute top-4 right-4 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-125 backdrop-blur-sm ${
              isFavorite
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-red-500/50"
                : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 hover:shadow-lg"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorite ? "fill-current scale-110" : "group-hover:scale-110"
              }`}
            />
            {isFavorite && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />}
          </button>
        )}

        {/* Difficulty Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-sm border border-white/30 ${getDifficultyColor(
              recipe.difficulty
            )}`}
          >
            {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="p-8 relative">
        {/* Title and Cuisine */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2 font-serif group-hover:text-orange-700 transition-colors duration-300">
            {recipe.title}
          </h3>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-2" />
            <p className="text-sm text-orange-600 font-bold capitalize bg-orange-50 px-3 py-1 rounded-full">
              {recipe.cuisine}
            </p>
          </div>
        </div>

        {/* Recipe Stats */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center bg-gradient-to-r from-orange-100 to-red-100 px-4 py-3 rounded-2xl shadow-lg border border-orange-200/50">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            <span className="font-bold text-gray-800">{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-3 rounded-2xl shadow-lg border border-blue-200/50">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-bold text-gray-800">{recipe.servings} servings</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-800 mb-4 flex items-center">
            <ChefHat className="w-4 h-4 mr-2 text-orange-500" />
            Key ingredients:
          </p>
          <div className="flex flex-wrap gap-3">
            {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-xs rounded-2xl font-semibold border border-orange-200/50 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {ingredient}
              </span>
            ))}
            {recipe.ingredients.length > 4 && (
              <span className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs rounded-2xl font-semibold border border-gray-200/50 shadow-sm">
                +{recipe.ingredients.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs rounded-2xl font-semibold border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => onViewDetails?.(recipe)}
            className="group w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <ExternalLink className="w-5 h-5 mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">View Recipe</span>
            <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:animate-pulse" />
          </button>
        </div>

        {/* Source Link */}
        {recipe.sourceUrl && (
          <div className="mt-6 pt-6 border-t border-orange-200/50">
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:text-orange-800 flex items-center justify-center font-semibold transition-all duration-300 hover:scale-105"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original Recipe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

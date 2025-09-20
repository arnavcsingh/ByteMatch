"use client";

import { useState } from "react";
import { Clock, Users, ChefHat, Heart, ExternalLink } from "lucide-react";
import { Recipe } from "@/types";

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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20">
      {/* Recipe Image */}
      <div className="relative h-56 bg-gradient-to-br from-orange-100 to-red-100">
        {!imageError ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
            <ChefHat className="w-16 h-16 text-orange-400" />
          </div>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
              isFavorite
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
                : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "fill-current" : ""
              }`}
            />
          </button>
        )}

        {/* Difficulty Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${getDifficultyColor(
              recipe.difficulty
            )}`}
          >
            {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="p-6">
        {/* Title and Cuisine */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {recipe.title}
          </h3>
          <p className="text-sm text-orange-600 font-semibold capitalize">{recipe.cuisine}</p>
        </div>

        {/* Recipe Stats */}
        <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
          <div className="flex items-center bg-orange-50 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 mr-2 text-orange-500" />
            <span className="font-medium">{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center bg-orange-50 px-3 py-2 rounded-lg">
            <Users className="w-4 h-4 mr-2 text-orange-500" />
            <span className="font-medium">{recipe.servings} servings</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Key ingredients:</p>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-xs rounded-full font-medium border border-orange-200"
              >
                {ingredient}
              </span>
            ))}
            {recipe.ingredients.length > 4 && (
              <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs rounded-full font-medium">
                +{recipe.ingredients.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs rounded-full font-medium border border-blue-200"
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
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Recipe
          </button>
        </div>

        {/* Source Link */}
        {recipe.sourceUrl && (
          <div className="mt-4 pt-4 border-t border-orange-100">
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:text-orange-800 flex items-center justify-center font-medium transition-colors"
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

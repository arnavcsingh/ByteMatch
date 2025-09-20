"use client";

import { useState } from "react";
import { Clock, Users, ChefHat, Heart, Bookmark, ExternalLink } from "lucide-react";
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Recipe Image */}
      <div className="relative h-48 bg-gray-200">
        {!imageError ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? "text-red-500 fill-current" : "text-gray-600"
              }`}
            />
          </button>
        )}

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
              recipe.difficulty
            )}`}
          >
            {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="p-4">
        {/* Title and Cuisine */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {recipe.title}
          </h3>
          <p className="text-sm text-gray-600 capitalize">{recipe.cuisine}</p>
        </div>

        {/* Recipe Stats */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Key ingredients:</p>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {ingredient}
              </span>
            ))}
            {recipe.ingredients.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{recipe.ingredients.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails?.(recipe)}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Recipe
          </button>
          <button
            onClick={() => onToggleFavorite?.(recipe.id)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

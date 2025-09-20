"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, ChefHat, ExternalLink, Heart, Bookmark, Share2 } from "lucide-react";
import { Recipe } from "@/types";

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (recipeId: string) => void;
  isFavorite?: boolean;
}

export default function RecipeModal({
  recipe,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite = false,
}: RecipeModalProps) {
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!recipe || !isOpen) return null;

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${recipe.title} - ${window.location.href}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="relative h-80 bg-gradient-to-br from-orange-100 to-red-100">
          {!imageError ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
              <ChefHat className="w-24 h-24 text-orange-400" />
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(recipe.id)}
              className={`absolute top-6 right-20 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                isFavorite
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
                  : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-6 h-6 ${
                  isFavorite ? "fill-current" : ""
                }`}
              />
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="absolute top-6 right-32 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
          >
            <Share2 className="w-6 h-6 text-gray-600" />
          </button>

          {/* Difficulty Badge */}
          <div className="absolute bottom-6 left-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${getDifficultyColor(
                recipe.difficulty
              )}`}
            >
              {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[calc(90vh-20rem)] overflow-y-auto">
          {/* Title and Cuisine */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{recipe.title}</h1>
            <p className="text-lg text-orange-600 font-semibold capitalize">{recipe.cuisine}</p>
          </div>

          {/* Recipe Stats */}
          <div className="flex items-center space-x-8 mb-8">
            <div className="flex items-center bg-orange-50 px-4 py-3 rounded-xl">
              <Clock className="w-5 h-5 mr-3 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="font-bold text-gray-900">{recipe.prepTime + recipe.cookTime} min</p>
              </div>
            </div>
            <div className="flex items-center bg-orange-50 px-4 py-3 rounded-xl">
              <Users className="w-5 h-5 mr-3 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Servings</p>
                <p className="font-bold text-gray-900">{recipe.servings}</p>
              </div>
            </div>
            <div className="flex items-center bg-orange-50 px-4 py-3 rounded-xl">
              <ChefHat className="w-5 h-5 mr-3 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Prep Time</p>
                <p className="font-bold text-gray-900">{recipe.prepTime} min</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm rounded-full font-medium border border-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'ingredients'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ingredients ({recipe.ingredients.length})
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'instructions'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Instructions ({recipe.instructions.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'ingredients' ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h3>
                <div className="grid gap-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100"
                    >
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">
                        {index + 1}
                      </div>
                      <span className="text-gray-800 font-medium">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Instructions</h3>
                <div className="space-y-6">
                  {recipe.instructions.map((instruction, index) => (
                    <div
                      key={index}
                      className="flex items-start p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 leading-relaxed">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Source Link */}
          {recipe.sourceUrl && (
            <div className="pt-6 border-t border-gray-200">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View Original Recipe
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

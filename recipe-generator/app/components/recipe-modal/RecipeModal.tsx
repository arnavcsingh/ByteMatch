"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, ChefHat, ExternalLink, Heart, Bookmark, Share2, Sparkles, Star, Zap } from "lucide-react";
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
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-3xl overflow-hidden transform transition-all duration-500 border border-white/30">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-200/10 to-red-200/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-200/10 to-orange-200/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        {/* Enhanced Header */}
        <div className="relative h-96 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
          {!imageError ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
              <div className="text-center">
                <ChefHat className="w-32 h-32 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-600 font-bold text-xl">Recipe Image</p>
              </div>
            </div>
          )}
          
          {/* Image overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          {/* Enhanced Action Buttons */}
          <div className="absolute top-6 right-6 flex space-x-3">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="group p-4 bg-white/95 hover:bg-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/30"
            >
              <Share2 className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-colors duration-300" />
            </button>

            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(recipe.id)}
                className={`group p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/30 ${
                  isFavorite
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-red-500/50"
                    : "bg-white/95 text-gray-600 hover:bg-white hover:text-red-500"
                }`}
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-300 ${
                    isFavorite ? "fill-current scale-110" : "group-hover:scale-110"
                  }`}
                />
                {isFavorite && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="group p-4 bg-white/95 hover:bg-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/30"
            >
              <X className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors duration-300" />
            </button>
          </div>

          {/* Enhanced Difficulty Badge */}
          <div className="absolute bottom-6 left-6">
            <span
              className={`px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-sm border border-white/30 ${getDifficultyColor(
                recipe.difficulty
              )}`}
            >
              {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="relative p-10 max-h-[calc(95vh-24rem)] overflow-y-auto">
          {/* Title and Cuisine */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">{recipe.title}</h1>
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-2" />
              <p className="text-xl text-orange-600 font-bold capitalize bg-orange-50 px-4 py-2 rounded-2xl">
                {recipe.cuisine}
              </p>
            </div>
          </div>

          {/* Enhanced Recipe Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="group flex items-center bg-gradient-to-r from-orange-100 to-red-100 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-200/50">
              <Clock className="w-6 h-6 mr-4 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Time</p>
                <p className="font-bold text-gray-900 text-lg">{recipe.prepTime + recipe.cookTime} min</p>
              </div>
            </div>
            <div className="group flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-200/50">
              <Users className="w-6 h-6 mr-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Servings</p>
                <p className="font-bold text-gray-900 text-lg">{recipe.servings}</p>
              </div>
            </div>
            <div className="group flex items-center bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-200/50">
              <ChefHat className="w-6 h-6 mr-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Prep Time</p>
                <p className="font-bold text-gray-900 text-lg">{recipe.prepTime} min</p>
              </div>
            </div>
          </div>

          {/* Enhanced Tags */}
          {recipe.tags.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">✨ Recipe Tags</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm rounded-2xl font-semibold border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Tab Navigation */}
          <div className="flex space-x-2 mb-10 bg-white/60 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/30">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`group flex-1 py-4 px-8 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
                activeTab === 'ingredients'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-white/70'
              }`}
            >
              <ChefHat className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              Ingredients ({recipe.ingredients.length})
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`group flex-1 py-4 px-8 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
                activeTab === 'instructions'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl transform scale-105'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-white/70'
              }`}
            >
              <Zap className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              Instructions ({recipe.instructions.length})
            </button>
          </div>

          {/* Enhanced Tab Content */}
          <div className="mb-10">
            {activeTab === 'ingredients' ? (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <ChefHat className="w-6 h-6 text-orange-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900 font-serif">🥘 Ingredients</h3>
                </div>
                <div className="grid gap-4">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="group flex items-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </div>
                      <span className="text-gray-800 font-semibold text-lg">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <Zap className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900 font-serif">👨‍🍳 Instructions</h3>
                </div>
                <div className="space-y-6">
                  {recipe.instructions.map((instruction, index) => (
                    <div
                      key={index}
                      className="group flex items-start p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-6 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 leading-relaxed text-lg font-medium">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Source Link */}
          {recipe.sourceUrl && (
            <div className="pt-8 border-t border-gray-200/50">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ExternalLink className="w-6 h-6 mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">View Original Recipe</span>
                <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:animate-pulse" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

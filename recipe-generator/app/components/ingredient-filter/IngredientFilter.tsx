"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, Plus, Filter, Sparkles, ChefHat, Clock, Globe } from "lucide-react";
import { FilterOptions } from "@/types";

interface IngredientFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const commonIngredients = [
  // Proteins
  "Chicken", "Beef", "Pork", "Lamb", "Turkey", "Duck",
  "Fish", "Salmon", "Tuna", "Cod", "Shrimp", "Crab", "Lobster", "Scallops",
  "Eggs", "Bacon", "Sausage", "Ham", "Ground beef", "Ground turkey",
  
  // Grains & Starches
  "Rice", "Brown rice", "Pasta", "Spaghetti", "Penne", "Fettuccine", "Rigatoni",
  "Bread", "White bread", "Whole wheat bread", "Tortillas", "Naan",
  "Potatoes", "Sweet potatoes", "Quinoa", "Couscous", "Barley", "Oats",
  
  // Vegetables
  "Onions", "Garlic", "Tomatoes", "Cherry tomatoes", "Bell peppers", "Red bell pepper", "Green bell pepper",
  "Carrots", "Celery", "Mushrooms", "Button mushrooms", "Portobello mushrooms",
  "Broccoli", "Cauliflower", "Spinach", "Kale", "Lettuce", "Romaine lettuce",
  "Cucumber", "Zucchini", "Eggplant", "Asparagus", "Green beans", "Peas",
  "Corn", "Avocado", "Artichokes", "Brussels sprouts", "Cabbage", "Radishes",
  
  // Dairy & Eggs
  "Cheese", "Cheddar cheese", "Mozzarella", "Parmesan", "Feta", "Goat cheese",
  "Milk", "Butter", "Heavy cream", "Sour cream", "Greek yogurt", "Cream cheese",
  
  // Oils & Condiments
  "Olive oil", "Vegetable oil", "Coconut oil", "Sesame oil",
  "Salt", "Black pepper", "Sea salt", "Kosher salt",
  "Soy sauce", "Worcestershire sauce", "Hot sauce", "Ketchup", "Mustard",
  "Mayonnaise", "Balsamic vinegar", "Apple cider vinegar", "Rice vinegar",
  
  // Herbs & Spices
  "Herbs", "Spices", "Basil", "Oregano", "Thyme", "Rosemary", "Parsley",
  "Cilantro", "Dill", "Mint", "Sage", "Bay leaves", "Chives",
  "Ginger", "Garlic powder", "Onion powder", "Paprika", "Cumin", "Coriander",
  "Cinnamon", "Nutmeg", "Allspice", "Red pepper flakes", "Cayenne pepper",
  "Turmeric", "Curry powder", "Italian seasoning", "Herbs de Provence",
  
  // Fruits
  "Lemon", "Lime", "Orange", "Apple", "Banana", "Strawberries", "Blueberries",
  "Raspberries", "Blackberries", "Pineapple", "Mango", "Peach", "Pear",
  "Grapes", "Cherries", "Cranberries", "Raisins", "Dates", "Figs",
  
  // Nuts & Seeds
  "Almonds", "Walnuts", "Pecans", "Pistachios", "Cashews", "Hazelnuts",
  "Peanuts", "Pine nuts", "Sesame seeds", "Chia seeds", "Flax seeds",
  "Sunflower seeds", "Pumpkin seeds",
  
  // Legumes & Beans
  "Black beans", "Kidney beans", "Chickpeas", "Lentils", "Green lentils", "Red lentils",
  "Cannellini beans", "Pinto beans", "Navy beans", "Split peas",
  
  // Pantry Staples
  "Flour", "All-purpose flour", "Whole wheat flour", "Baking powder", "Baking soda",
  "Sugar", "Brown sugar", "Honey", "Maple syrup", "Vanilla extract",
  "Chocolate", "Dark chocolate", "Milk chocolate", "Cocoa powder",
  "Coconut", "Coconut milk", "Almond milk", "Soy milk", "Oat milk",
  
  // Specialty Items
  "Tahini", "Hummus", "Pesto", "Salsa", "Guacamole", "Sriracha",
  "Fish sauce", "Oyster sauce", "Hoisin sauce", "Teriyaki sauce",
  "Wine", "Red wine", "White wine", "Beer", "Stock", "Chicken stock", "Beef stock", "Vegetable stock"
];

export default function IngredientFilter({
  onFilterChange,
  initialFilters = { availableIngredients: [] },
}: IngredientFilterProps) {
  const [availableIngredients, setAvailableIngredients] = useState<string[]>(
    initialFilters.availableIngredients || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrepTime, setMaxPrepTime] = useState(initialFilters.maxPrepTime || null);
  const [maxCookTime, setMaxCookTime] = useState(initialFilters.maxCookTime || null);
  const [difficulty, setDifficulty] = useState<string[]>(initialFilters.difficulty || []);
  const [cuisine, setCuisine] = useState<string[]>(initialFilters.cuisine || []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const cuisines = ["Italian", "American", "Mexican", "Indian", "Japanese", "Chinese", "Mediterranean", "French", "Various"];
  const difficulties = ["easy", "medium", "hard"];

  // Track when filters change to show pending changes
  useEffect(() => {
    setHasPendingChanges(true);
  }, [availableIngredients, maxPrepTime, maxCookTime, difficulty, cuisine]);

  // Function to apply filters
  const applyFilters = () => {
    onFilterChange({
      availableIngredients,
      maxPrepTime,
      maxCookTime,
      difficulty: difficulty.length > 0 ? difficulty : undefined,
      cuisine: cuisine.length > 0 ? cuisine : undefined,
    });
    setHasPendingChanges(false);
  };

  const addIngredient = (ingredient: string) => {
    if (!availableIngredients.includes(ingredient)) {
      setAvailableIngredients([...availableIngredients, ingredient]);
    }
  };

  const removeIngredient = (ingredient: string) => {
    setAvailableIngredients(availableIngredients.filter((item) => item !== ingredient));
  };

  const addCustomIngredient = () => {
    if (searchTerm.trim() && !availableIngredients.includes(searchTerm.trim())) {
      setAvailableIngredients([...availableIngredients, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  const toggleDifficulty = (diff: string) => {
    setDifficulty(
      difficulty.includes(diff)
        ? difficulty.filter((d) => d !== diff)
        : [...difficulty, diff]
    );
  };

  const toggleCuisine = (cuisineType: string) => {
    setCuisine(
      cuisine.includes(cuisineType)
        ? cuisine.filter((c) => c !== cuisineType)
        : [...cuisine, cuisineType]
    );
  };

  const clearAllFilters = () => {
    setAvailableIngredients([]);
    setMaxPrepTime(null);
    setMaxCookTime(null);
    setDifficulty([]);
    setCuisine([]);
    setHasPendingChanges(true);
  };

  const filteredIngredients = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return commonIngredients
      .filter((ingredient) => 
        ingredient.toLowerCase().includes(searchLower) &&
        !availableIngredients.includes(ingredient)
      )
      .slice(0, 10); // Limit to 10 results for performance
  }, [searchTerm, availableIngredients]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30 relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-orange-200/10 to-red-200/10 rounded-full blur-xl"></div>
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mr-4 shadow-xl">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-serif">
                🎯 Filter Recipes
              </h3>
              <p className="text-gray-600 text-sm">Customize your search preferences</p>
            </div>
          </div>
          <button
            onClick={() => {
              console.log('Expand button clicked, current isExpanded:', isExpanded);
              setIsExpanded(!isExpanded);
            }}
            className="group flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {/* Available Ingredients */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <ChefHat className="w-5 h-5 text-orange-500 mr-2" />
            <label className="text-lg font-bold text-gray-800">
              Available Ingredients
            </label>
          </div>
          
          {/* Selected Ingredients */}
          {availableIngredients.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {availableIngredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="group inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    className="ml-2 hover:text-gray-300 transition-colors duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Ingredients */}
          <div className="flex space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <button
              onClick={addCustomIngredient}
              disabled={!searchTerm.trim()}
              className="group px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Common Ingredients */}
          {searchTerm && filteredIngredients.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-lg">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => addIngredient(ingredient)}
                  className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 text-sm font-medium transition-all duration-300 border-b border-gray-100 last:border-b-0"
                >
                  {ingredient}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 duration-500">
          <div className="space-y-8 pb-8">
            {/* Time Filters */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <h4 className="text-lg font-bold text-gray-800">⏱️ Time Filters</h4>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={maxPrepTime || ""}
                    placeholder="No limit"
                    onChange={(e) => setMaxPrepTime(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Cook Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={maxCookTime || ""}
                    placeholder="No limit"
                    onChange={(e) => setMaxCookTime(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="flex items-center mb-4">
                <ChefHat className="w-5 h-5 text-green-500 mr-2" />
                <h4 className="text-lg font-bold text-gray-800">🎯 Difficulty Level</h4>
              </div>
              <div className="flex space-x-3">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => toggleDifficulty(diff)}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                      difficulty.includes(diff)
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        : "bg-white/80 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-2 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {diff.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Filter */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="flex items-center mb-4">
                <Globe className="w-5 h-5 text-purple-500 mr-2" />
                <h4 className="text-lg font-bold text-gray-800">🌍 Cuisine Types</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {cuisines.map((cuisineType) => (
                  <button
                    key={cuisineType}
                    onClick={() => toggleCuisine(cuisineType)}
                    className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                      cuisine.includes(cuisineType)
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        : "bg-white/80 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {cuisineType}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200/50">
          <div className="flex gap-4">
            {/* Apply Filters Button */}
            <button
              onClick={applyFilters}
              disabled={!hasPendingChanges}
              className={`group flex-1 px-6 py-4 text-sm font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                hasPendingChanges
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4 mr-2" />
                {hasPendingChanges ? "✨ Apply Filters" : "✅ Filters Applied"}
              </span>
            </button>

            {/* Clear Filters Button */}
            <button
              onClick={clearAllFilters}
              className="group px-6 py-4 text-sm font-bold text-gray-700 hover:text-white border-2 border-gray-300 rounded-2xl hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:border-transparent transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="group-hover:scale-110 transition-transform duration-300">
                🗑️ Clear
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

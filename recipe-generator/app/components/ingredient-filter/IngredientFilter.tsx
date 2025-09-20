"use client";

import { useState, useEffect } from "react";
import { Search, X, Plus, Filter } from "lucide-react";
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
  const [maxPrepTime, setMaxPrepTime] = useState(initialFilters.maxPrepTime || 60);
  const [maxCookTime, setMaxCookTime] = useState(initialFilters.maxCookTime || 60);
  const [difficulty, setDifficulty] = useState<string[]>(initialFilters.difficulty || []);
  const [cuisine, setCuisine] = useState<string[]>(initialFilters.cuisine || []);
  const [isExpanded, setIsExpanded] = useState(false);

  const cuisines = ["Italian", "American", "Mexican", "Indian", "Japanese", "Chinese", "Mediterranean", "French"];
  const difficulties = ["easy", "medium", "hard"];

  useEffect(() => {
    onFilterChange({
      availableIngredients,
      maxPrepTime,
      maxCookTime,
      difficulty: difficulty.length > 0 ? difficulty : undefined,
      cuisine: cuisine.length > 0 ? cuisine : undefined,
    });
  }, [availableIngredients, maxPrepTime, maxCookTime, difficulty, cuisine, onFilterChange]);

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
    setMaxPrepTime(60);
    setMaxCookTime(60);
    setDifficulty([]);
    setCuisine([]);
  };

  const filteredIngredients = commonIngredients.filter((ingredient) =>
    ingredient.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !availableIngredients.includes(ingredient)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filter Recipes
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Available Ingredients */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Ingredients
        </label>
        
        {/* Selected Ingredients */}
        {availableIngredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {availableIngredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-white"
              >
                {ingredient}
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="ml-2 hover:text-gray-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Ingredients */}
        <div className="flex space-x-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={addCustomIngredient}
            disabled={!searchTerm.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Common Ingredients */}
        {searchTerm && filteredIngredients.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
            {filteredIngredients.slice(0, 10).map((ingredient) => (
              <button
                key={ingredient}
                onClick={() => addIngredient(ingredient)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {ingredient}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Time Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Prep Time (min)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={maxPrepTime}
                onChange={(e) => setMaxPrepTime(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Cook Time (min)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={maxCookTime}
                onChange={(e) => setMaxCookTime(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <div className="flex space-x-2">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => toggleDifficulty(diff)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    difficulty.includes(diff)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine
            </label>
            <div className="flex flex-wrap gap-2">
              {cuisines.map((cuisineType) => (
                <button
                  key={cuisineType}
                  onClick={() => toggleCuisine(cuisineType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    cuisine.includes(cuisineType)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cuisineType}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={clearAllFilters}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

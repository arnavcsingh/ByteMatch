"use client";

import { useState } from 'react';
import { useOllamaNutrition } from '@/app/hooks/useOllamaNutrition';

export default function OllamaTest() {
  const [testIngredients, setTestIngredients] = useState([
    '2 cups flour',
    '1 tbsp olive oil',
    '1 lb ground beef',
    '3 cloves garlic',
    'salt and pepper'
  ].join('\n'));
  const [servings, setServings] = useState(4);
  const [result, setResult] = useState<any>(null);

  const { calculateNutrition, isLoading, error } = useOllamaNutrition();

  const handleTest = async () => {
    const ingredients = testIngredients.split('\n').filter(ing => ing.trim());
    const nutritionResult = await calculateNutrition(ingredients, servings);
    setResult(nutritionResult);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🧪 Ollama Nutrition Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingredients (one per line):
          </label>
          <textarea
            value={testIngredients}
            onChange={(e) => setTestIngredients(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-md"
            placeholder="Enter ingredients..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Servings:
          </label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value) || 4)}
            className="w-20 p-2 border border-gray-300 rounded-md"
            min="1"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Calculating...' : 'Test Ollama Nutrition'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-bold text-green-800 mb-2">📊 Nutrition Results (per serving):</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Calories:</span> {result.nutrition.calories}
                </div>
                <div>
                  <span className="font-semibold">Protein:</span> {result.nutrition.protein}g
                </div>
                <div>
                  <span className="font-semibold">Carbs:</span> {result.nutrition.carbs}g
                </div>
                <div>
                  <span className="font-semibold">Fat:</span> {result.nutrition.fat}g
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-bold text-blue-800 mb-2">🔍 Ingredient Analysis:</h3>
              <div className="text-sm">
                <div className="mb-2">
                  <span className="font-semibold text-green-700">{result.matchedIngredients.length}</span> ingredients matched
                  {result.unmatchedIngredients.length > 0 && (
                    <span className="text-orange-600">, {result.unmatchedIngredients.length} not found</span>
                  )}
                </div>
                
                {result.matchedIngredients.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">Matched:</span> {result.matchedIngredients.join(', ')}
                  </div>
                )}
                
                {result.unmatchedIngredients.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">Unmatched:</span> {result.unmatchedIngredients.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {result.reasoning && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h3 className="font-bold text-purple-800 mb-2">🤖 AI Reasoning:</h3>
                <p className="text-sm text-purple-700">{result.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

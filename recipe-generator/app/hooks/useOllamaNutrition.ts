import { useState, useCallback } from 'react';
import { calculateRecipeNutrition } from '@/helpers/nutrition-calculator';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface OllamaNutritionResult {
  nutrition: NutritionData;
  matchedIngredients: string[];
  unmatchedIngredients: string[];
  reasoning: string;
}

interface UseOllamaNutritionReturn {
  calculateNutrition: (ingredients: string[], servings: number) => Promise<OllamaNutritionResult | null>;
  isLoading: boolean;
  error: string | null;
}

export function useOllamaNutrition(): UseOllamaNutritionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateNutrition = useCallback(async (
    ingredients: string[], 
    servings: number
  ): Promise<OllamaNutritionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // First try Ollama
      const response = await fetch('/api/ollama-nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          servings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: OllamaNutritionResult = await response.json();
      return result;

    } catch (err) {
      console.warn('Ollama failed, falling back to local calculation:', err);
      
      // Fallback to local nutrition calculator
      try {
        const localResult = calculateRecipeNutrition(ingredients, servings);
        
        const fallbackResult: OllamaNutritionResult = {
          nutrition: localResult.nutrition,
          matchedIngredients: localResult.matchedIngredients.map(ing => ing.ingredient),
          unmatchedIngredients: localResult.unmatchedIngredients,
          reasoning: `Fallback calculation using local nutrition database. ${localResult.matchedIngredients.length} ingredients matched, ${localResult.unmatchedIngredients.length} not found.`
        };
        
        setError('Ollama unavailable - using local calculation');
        return fallbackResult;
        
      } catch (fallbackErr) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Both Ollama and local calculation failed: ${errorMessage}`);
        console.error('Error with both Ollama and local calculation:', { err, fallbackErr });
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    calculateNutrition,
    isLoading,
    error,
  };
}

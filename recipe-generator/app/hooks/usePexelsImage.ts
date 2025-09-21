"use client";

import { useState, useEffect } from "react";
import { PexelsPhoto } from "@/lib/pexels";

interface UsePexelsImageOptions {
  query?: string;
  fallbackQuery?: string;
}

export function usePexelsImage(options: UsePexelsImageOptions = {}) {
  const [image, setImage] = useState<PexelsPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImage = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pexels?type=search&query=${encodeURIComponent(searchQuery)}&count=1`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setImage(data.data[0]);
      } else {
        throw new Error('No images found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image');
      
      // Try fallback query if provided
      if (options.fallbackQuery && searchQuery !== options.fallbackQuery) {
        try {
          const fallbackResponse = await fetch(`/api/pexels?type=search&query=${encodeURIComponent(options.fallbackQuery)}&count=1`);
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.data.length > 0) {
            setImage(fallbackData.data[0]);
            setError(null);
          }
        } catch (fallbackErr) {
          console.error('Fallback image fetch failed:', fallbackErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getImageForRecipe = (recipeTitle: string, cuisine?: string) => {
    // Create a search query based on recipe title and cuisine
    const baseQuery = recipeTitle.toLowerCase();
    const cuisineQuery = cuisine ? `${cuisine} ${baseQuery}` : baseQuery;
    const fallbackQuery = 'delicious food';
    
    fetchImage(cuisineQuery);
  };

  const getImageForDish = (dishName: string) => {
    const query = `${dishName} food recipe`;
    const fallbackQuery = 'delicious food';
    
    fetchImage(query);
  };

  return {
    image,
    isLoading,
    error,
    getImageForRecipe,
    getImageForDish,
    fetchImage
  };
}

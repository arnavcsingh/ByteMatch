import { UserPreferences, Recipe } from "@/types";

const STORAGE_KEYS = {
  PREFERENCES: "recipe-generator-preferences",
  HISTORY: "recipe-generator-history",
  FAVORITES: "recipe-generator-favorites",
} as const;

export class StorageManager {
  /**
   * Get user preferences from localStorage
   */
  static getPreferences(): UserPreferences {
    if (typeof window === "undefined") {
      return {
        favorites: [],
        history: [],
        dietaryRestrictions: [],
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return stored ? JSON.parse(stored) : {
        favorites: [],
        history: [],
        dietaryRestrictions: [],
      };
    } catch (error) {
      console.error("Error loading preferences:", error);
      return {
        favorites: [],
        history: [],
        dietaryRestrictions: [],
      };
    }
  }

  /**
   * Save user preferences to localStorage
   */
  static savePreferences(preferences: UserPreferences): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  }

  /**
   * Get favorite recipe IDs
   */
  static getFavorites(): string[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading favorites:", error);
      return [];
    }
  }

  /**
   * Add recipe to favorites
   */
  static addToFavorites(recipeId: string): void {
    if (typeof window === "undefined") return;

    try {
      const favorites = this.getFavorites();
      if (!favorites.includes(recipeId)) {
        favorites.push(recipeId);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  }

  /**
   * Remove recipe from favorites
   */
  static removeFromFavorites(recipeId: string): void {
    if (typeof window === "undefined") return;

    try {
      const favorites = this.getFavorites();
      const updatedFavorites = favorites.filter((id) => id !== recipeId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  }

  /**
   * Toggle favorite status
   */
  static toggleFavorite(recipeId: string): boolean {
    if (typeof window === "undefined") return false;

    try {
      const favorites = this.getFavorites();
      const isFavorite = favorites.includes(recipeId);
      
      if (isFavorite) {
        this.removeFromFavorites(recipeId);
        return false;
      } else {
        this.addToFavorites(recipeId);
        return true;
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return false;
    }
  }

  /**
   * Get recipe history
   */
  static getHistory(): string[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading history:", error);
      return [];
    }
  }

  /**
   * Add recipe to history
   */
  static addToHistory(recipeId: string): void {
    if (typeof window === "undefined") return;

    try {
      const history = this.getHistory();
      // Remove if already exists to avoid duplicates
      const filteredHistory = history.filter((id) => id !== recipeId);
      // Add to beginning and limit to 50 items
      const updatedHistory = [recipeId, ...filteredHistory].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error adding to history:", error);
    }
  }

  /**
   * Remove recipe from history
   */
  static removeFromHistory(recipeId: string): void {
    if (typeof window === "undefined") return;

    try {
      const history = this.getHistory();
      const updatedHistory = history.filter((id) => id !== recipeId);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error removing from history:", error);
    }
  }

  /**
   * Clear all stored data
   */
  static clearAll(): void {
    if (typeof window === "undefined") return;

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo(): { used: number; total: number; percentage: number } {
    if (typeof window === "undefined") {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach((key) => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });

      // Estimate total available (5MB is typical for localStorage)
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

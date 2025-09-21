interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  full_res: string | null;
  tags: string[];
  url: string;
  image: string;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    fps: number;
    link: string;
  }>;
  video_pictures: Array<{
    id: number;
    picture: string;
    nr: number;
  }>;
}

interface PexelsResponse<T> {
  page: number;
  per_page: number;
  photos?: T[];
  videos?: T[];
  total_results: number;
  next_page: string;
}

class PexelsService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY || '2OhrkWfornDdXvu7mDAtVgx778TZ6HA8chQ9766wOUR60yTVzYQ96t0';
    if (!this.apiKey) {
      console.warn('PEXELS_API_KEY not found in environment variables');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Pexels API key not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for food-related photos
   */
  async searchFoodPhotos(query: string = 'food', perPage: number = 15): Promise<PexelsPhoto[]> {
    try {
      const response = await this.makeRequest<PexelsResponse<PexelsPhoto>>(
        `/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
      );
      return response.photos || [];
    } catch (error) {
      console.error('Error fetching Pexels photos:', error);
      return [];
    }
  }

  /**
   * Get curated food photos for backgrounds
   */
  async getCuratedFoodPhotos(perPage: number = 20): Promise<PexelsPhoto[]> {
    try {
      const response = await this.makeRequest<PexelsResponse<PexelsPhoto>>(
        `/curated?per_page=${perPage}`
      );
      return response.photos || [];
    } catch (error) {
      console.error('Error fetching curated Pexels photos:', error);
      return [];
    }
  }

  /**
   * Search for food videos
   */
  async searchFoodVideos(query: string = 'food', perPage: number = 10): Promise<PexelsVideo[]> {
    try {
      const response = await this.makeRequest<PexelsResponse<PexelsVideo>>(
        `/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
      );
      return response.videos || [];
    } catch (error) {
      console.error('Error fetching Pexels videos:', error);
      return [];
    }
  }

  /**
   * Get random food photos for backgrounds
   */
  async getRandomFoodPhotos(count: number = 5): Promise<PexelsPhoto[]> {
    const foodQueries = [
      'delicious food',
      'gourmet cooking',
      'fresh ingredients',
      'restaurant food',
      'home cooking',
      'healthy food',
      'comfort food',
      'fine dining'
    ];

    const randomQuery = foodQueries[Math.floor(Math.random() * foodQueries.length)];
    return this.searchFoodPhotos(randomQuery, count);
  }

  /**
   * Get food photos by cuisine type
   */
  async getCuisinePhotos(cuisine: string, count: number = 8): Promise<PexelsPhoto[]> {
    const cuisineQueries: Record<string, string> = {
      'Italian': 'italian food pasta pizza',
      'Mexican': 'mexican food tacos burritos',
      'Asian': 'asian food sushi ramen',
      'American': 'american food burgers bbq',
      'French': 'french food cuisine',
      'Indian': 'indian food curry',
      'Chinese': 'chinese food',
      'Japanese': 'japanese food',
      'Thai': 'thai food',
      'Mediterranean': 'mediterranean food'
    };

    const query = cuisineQueries[cuisine] || `${cuisine} food`;
    return this.searchFoodPhotos(query, count);
  }

  /**
   * Find high-quality recipe images that match specific dishes
   */
  async findRecipeImage(recipeTitle: string, cuisine?: string): Promise<string | null> {
    try {
      // Create specific search queries for the recipe
      const searchQueries = this.generateRecipeSearchQueries(recipeTitle, cuisine);
      
      for (const query of searchQueries) {
        const photos = await this.searchFoodPhotos(query, 10); // Get more options to choose from
        
        if (photos.length > 0) {
          // Score images based on title similarity and quality
          const scoredPhotos = photos.map(photo => ({
            ...photo,
            score: this.calculateImageSimilarityScore(photo, recipeTitle, cuisine)
          }));
          
          // Sort by score (highest first) and filter for high similarity
          const highSimilarityPhotos = scoredPhotos
            .filter(photo => photo.score >= 0.7) // Only use images with 70%+ similarity
            .sort((a, b) => b.score - a.score);
          
          if (highSimilarityPhotos.length > 0) {
            console.log(`Found highly similar image for "${recipeTitle}" with score: ${highSimilarityPhotos[0].score}`);
            return highSimilarityPhotos[0].src.large2x;
          }
        }
      }
      
      console.log(`No highly similar images found for "${recipeTitle}"`);
      return null;
    } catch (error) {
      console.error('Error finding recipe image:', error);
      return null;
    }
  }

  /**
   * Calculate similarity score between Pexels image and recipe
   */
  private calculateImageSimilarityScore(photo: PexelsPhoto, recipeTitle: string, cuisine?: string): number {
    let score = 0;
    
    // Base score from photo quality and popularity
    score += 0.2; // Base score for any food photo
    
    // Check if photo alt text or photographer name contains recipe keywords
    const photoText = `${photo.alt || ''} ${photo.photographer || ''}`.toLowerCase();
    const recipeWords = recipeTitle.toLowerCase().split(' ').filter(word => word.length > 3);
    
    // Score based on keyword matches
    const keywordMatches = recipeWords.filter(word => photoText.includes(word)).length;
    score += (keywordMatches / recipeWords.length) * 0.4;
    
    // Bonus for cuisine match
    if (cuisine && photoText.includes(cuisine.toLowerCase())) {
      score += 0.2;
    }
    
    // Bonus for high-quality images (large dimensions)
    if (photo.width > 2000 && photo.height > 1500) {
      score += 0.1;
    }
    
    // Bonus for popular photos (more likes/views)
    if (photo.liked) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Generate specific search queries for recipe images
   */
  private generateRecipeSearchQueries(recipeTitle: string, cuisine?: string): string[] {
    const title = recipeTitle.toLowerCase();
    const queries: string[] = [];
    
    // Direct recipe name search
    queries.push(recipeTitle);
    
    // Extract key dish name and add cuisine context
    if (cuisine) {
      queries.push(`${recipeTitle} ${cuisine.toLowerCase()}`);
    }
    
    // Specific dish mappings for better search results
    const dishMappings: Record<string, string[]> = {
      'pizza': ['pizza margherita', 'italian pizza', 'wood fired pizza', 'neapolitan pizza'],
      'burger': ['gourmet burger', 'cheeseburger', 'hamburger', 'beef burger'],
      'pasta': ['italian pasta', 'spaghetti carbonara', 'fettuccine alfredo', 'penne arrabbiata'],
      'sushi': ['japanese sushi', 'sushi roll', 'fresh sushi', 'nigiri sushi'],
      'ramen': ['japanese ramen', 'tonkotsu ramen', 'miso ramen', 'ramen bowl'],
      'tacos': ['mexican tacos', 'street tacos', 'authentic tacos', 'taco platter'],
      'burrito': ['mexican burrito', 'chicken burrito', 'beef burrito', 'burrito bowl'],
      'sandwich': ['gourmet sandwich', 'club sandwich', 'artisan sandwich', 'delicious sandwich'],
      'salad': ['fresh salad', 'garden salad', 'caesar salad', 'healthy salad'],
      'soup': ['homemade soup', 'chicken soup', 'tomato soup', 'comfort soup'],
      'cake': ['homemade cake', 'chocolate cake', 'birthday cake', 'delicious cake'],
      'pancakes': ['fluffy pancakes', 'breakfast pancakes', 'stacked pancakes', 'golden pancakes'],
      'chicken': ['roasted chicken', 'grilled chicken', 'herb chicken', 'juicy chicken'],
      'steak': ['grilled steak', 'ribeye steak', 'perfect steak', 'medium rare steak'],
      'curry': ['indian curry', 'chicken curry', 'spicy curry', 'authentic curry']
    };
    
    // Find matching dish and add specific queries
    for (const [dish, dishQueries] of Object.entries(dishMappings)) {
      if (title.includes(dish)) {
        queries.push(...dishQueries);
        break;
      }
    }
    
    // Add general food photography terms for better quality
    queries.push(`${recipeTitle} food photography`);
    queries.push(`${recipeTitle} restaurant quality`);
    
    return queries.slice(0, 5); // Limit to 5 queries to avoid rate limiting
  }
}

export const pexelsService = new PexelsService();
export type { PexelsPhoto, PexelsVideo };

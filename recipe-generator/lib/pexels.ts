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
    this.apiKey = process.env.PEXELS_API_KEY || '';
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
}

export const pexelsService = new PexelsService();
export type { PexelsPhoto, PexelsVideo };

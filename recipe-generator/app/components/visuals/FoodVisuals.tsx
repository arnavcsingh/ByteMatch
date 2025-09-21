"use client";

import { useState, useEffect } from "react";
import { PexelsPhoto } from "@/lib/pexels";

interface FoodVisualsProps {
  type?: 'floating' | 'carousel' | 'grid';
  count?: number;
  query?: string;
  className?: string;
}

export default function FoodVisuals({ 
  type = 'floating', 
  count = 6, 
  query = 'delicious food',
  className = "" 
}: FoodVisualsProps) {
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Create diverse queries based on the type
        const queries = type === 'carousel' ? [
          query,
          'fine dining',
          'restaurant food',
          'chef cooking',
          'gourmet cuisine',
          'elegant plating',
          'culinary art',
          'professional kitchen'
        ] : [
          query,
          'delicious food',
          'home cooking',
          'fresh ingredients',
          'comfort food'
        ];
        
        const allImages: PexelsPhoto[] = [];
        
        // Fetch from multiple queries for variety
        for (const searchQuery of queries.slice(0, Math.ceil(count / 4))) {
          try {
            const response = await fetch(`/api/pexels?type=search&query=${encodeURIComponent(searchQuery)}&count=${Math.ceil(count / queries.length)}`);
            const data = await response.json();
            
            if (data.success && data.data) {
              allImages.push(...data.data);
            }
          } catch (error) {
            console.error(`Failed to fetch images for query "${searchQuery}":`, error);
          }
        }
        
        // If we got some images, use them; otherwise use fallback
        if (allImages.length > 0) {
          // Shuffle and limit to requested count
          const shuffled = allImages.sort(() => 0.5 - Math.random());
          setImages(shuffled.slice(0, count));
        } else {
          // Fallback to static food images when API fails
          console.log('FoodVisuals: Using fallback images due to API issues');
          const fallbackImages: PexelsPhoto[] = [
            {
              id: 1,
              src: {
                large: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'
              },
              alt: 'Delicious food',
              photographer: 'Unsplash'
            },
            {
              id: 2,
              src: {
                large: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
              },
              alt: 'Restaurant food',
              photographer: 'Unsplash'
            },
            {
              id: 3,
              src: {
                large: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop'
              },
              alt: 'Home cooking',
              photographer: 'Unsplash'
            },
            {
              id: 4,
              src: {
                large: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop'
              },
              alt: 'Pizza',
              photographer: 'Unsplash'
            },
            {
              id: 5,
              src: {
                large: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop'
              },
              alt: 'Burger',
              photographer: 'Unsplash'
            },
            {
              id: 6,
              src: {
                large: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop'
              },
              alt: 'Pasta',
              photographer: 'Unsplash'
            },
            {
              id: 7,
              src: {
                large: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'
              },
              alt: 'Sushi',
              photographer: 'Unsplash'
            },
            {
              id: 8,
              src: {
                large: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop'
              },
              alt: 'Tacos',
              photographer: 'Unsplash'
            }
          ];
          setImages(fallbackImages.slice(0, count));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch food visuals:', error);
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [query, count, type]);

  if (isLoading && images.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading food inspiration...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  const renderFloatingImages = () => (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="absolute opacity-20 hover:opacity-40 transition-opacity duration-500"
          style={{
            left: `${(index * 15) % 80 + 10}%`,
            top: `${(index * 25) % 70 + 15}%`,
            animationDelay: `${index * 2}s`,
            animationDuration: `${8 + (index % 3) * 2}s`
          }}
        >
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-110 transition-transform duration-500">
            <img
              src={image.src.medium}
              alt={image.alt || 'Food visual'}
              className="w-full h-full object-cover"
              style={{
                animation: `float ${8 + (index % 3) * 2}s ease-in-out infinite`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderCarousel = () => (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex animate-scroll">
        {[...images, ...images, ...images].map((image, index) => (
          <div key={`${image.id}-${index}`} className="flex-shrink-0 mx-4">
            <div className="w-48 h-32 rounded-2xl overflow-hidden shadow-xl">
              <img
                src={image.src.medium}
                alt={image.alt || 'Food visual'}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        >
          <img
            src={image.src.medium}
            alt={image.alt || 'Food visual'}
            className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  );

  switch (type) {
    case 'carousel':
      return renderCarousel();
    case 'grid':
      return renderGrid();
    default:
      return renderFloatingImages();
  }
}

// Add custom CSS animations
const style = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-20px) rotate(1deg); }
    50% { transform: translateY(-10px) rotate(-1deg); }
    75% { transform: translateY(-15px) rotate(0.5deg); }
  }
  
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-33.333%); }
  }
  
  .animate-scroll {
    animation: scroll 60s linear infinite;
    will-change: transform;
  }
  
  .animate-scroll:hover {
    animation-play-state: paused;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}

"use client";

import { useState, useEffect } from "react";
import { PexelsPhoto } from "@/lib/pexels";

interface BackgroundImagesProps {
  className?: string;
  count?: number;
  query?: string;
  opacity?: number;
}

export default function BackgroundImages({ 
  className = "", 
  count = 8, 
  query = "food",
  opacity = 0.1 
}: BackgroundImagesProps) {
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetch multiple queries to get more diverse images
        const queries = [
          query,
          'delicious food',
          'home cooking',
          'restaurant kitchen',
          'fresh ingredients',
          'gourmet cooking',
          'comfort food',
          'healthy cooking'
        ];
        
        const allImages: PexelsPhoto[] = [];
        
        // Fetch images from multiple queries
        for (const searchQuery of queries.slice(0, Math.ceil(count / 3))) {
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
          const finalImages = shuffled.slice(0, count);
          console.log(`BackgroundImages: Loaded ${finalImages.length} images from Pexels`);
          setImages(finalImages);
        } else {
          // Fallback to static food images when API fails
          console.log('BackgroundImages: Using fallback images due to API issues');
          const fallbackImages: PexelsPhoto[] = [
            {
              id: 1,
              width: 1920,
              height: 1280,
              url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
              photographer: 'Unsplash',
              photographer_url: 'https://unsplash.com/@unsplash',
              photographer_id: 1,
              avg_color: '#8B4513',
              src: {
                original: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=1280&fit=crop',
                large2x: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=1280&fit=crop',
                large: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
                portrait: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=800&fit=crop',
                landscape: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop',
                tiny: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=150&fit=crop'
              },
              alt: 'Delicious food'
            },
            {
              id: 2,
              width: 1920,
              height: 1280,
              url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
              photographer: 'Unsplash',
              photographer_url: 'https://unsplash.com/@unsplash',
              photographer_id: 2,
              avg_color: '#8B4513',
              src: {
                original: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1920&h=1280&fit=crop',
                large2x: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1920&h=1280&fit=crop',
                large: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                portrait: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=800&fit=crop',
                landscape: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1200&h=600&fit=crop',
                tiny: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=150&fit=crop'
              },
              alt: 'Gourmet cooking'
            },
            {
              id: 3,
              width: 1920,
              height: 1280,
              url: 'https://images.unsplash.com/photo-1574484284002-952d92456975',
              photographer: 'Unsplash',
              photographer_url: 'https://unsplash.com/@unsplash',
              photographer_id: 3,
              avg_color: '#8B4513',
              src: {
                original: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=1920&h=1280&fit=crop',
                large2x: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=1920&h=1280&fit=crop',
                large: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=1200&h=800&fit=crop',
                medium: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&h=600&fit=crop',
                small: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
                portrait: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=800&fit=crop',
                landscape: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=1200&h=600&fit=crop',
                tiny: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&h=150&fit=crop'
              },
              alt: 'Home cooking'
            }
          ];
          setImages(fallbackImages);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch background images:', error);
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [query, count]);

  // Rotate through images every 10 seconds - with stable transitions
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % images.length;
          console.log(`BackgroundImages: Rotating to image ${next + 1}/${images.length}`);
          return next;
        });
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [images.length]);

  if (isLoading || images.length === 0) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        {/* More visible fallback gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-orange-100/40 to-red-100/50"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Background images with smooth crossfade - completely static positioning */}
      {images.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${image.src.large})`,
            opacity: index === currentIndex ? opacity : 0,
            transform: 'translateZ(0)', // Force hardware acceleration and prevent any movement
            willChange: 'auto', // Optimize for static content
            transition: 'opacity 2s ease-in-out' // Smooth crossfade only
          }}
        />
      ))}
      
      {/* Lighter overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 via-orange-50/15 to-red-50/20"></div>
      
      {/* Subtle animated elements for depth */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-orange-200/15 to-red-200/15 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200/15 to-orange-200/15 rounded-full blur-2xl animate-pulse delay-2000"></div>
    </div>
  );
}

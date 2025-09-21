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
        const response = await fetch(`/api/pexels?type=search&query=${encodeURIComponent(query)}&count=${count}`);
        const data = await response.json();
        
        if (data.success) {
          setImages(data.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch food visuals:', error);
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [query, count]);

  if (isLoading || images.length === 0) {
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
        {[...images, ...images].map((image, index) => (
          <div key={`${image.id}-${index}`} className="flex-shrink-0 mx-4">
            <div className="w-48 h-32 rounded-2xl overflow-hidden shadow-xl">
              <img
                src={image.src.medium}
                alt={image.alt || 'Food visual'}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
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
    100% { transform: translateX(-50%); }
  }
  
  .animate-scroll {
    animation: scroll 30s linear infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}

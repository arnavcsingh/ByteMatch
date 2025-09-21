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
        const response = await fetch(`/api/pexels?type=search&query=${encodeURIComponent(query)}&count=${count}`);
        const data = await response.json();
        
        if (data.success) {
          setImages(data.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch background images:', error);
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [query, count]);

  // Rotate through images every 10 seconds
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [images.length]);

  if (isLoading || images.length === 0) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        {/* Fallback gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-red-200/20 to-pink-200/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-300/30 to-red-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-300/30 to-orange-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Current background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-2000 ease-in-out"
        style={{
          backgroundImage: `url(${images[currentIndex]?.src.large})`,
          opacity: opacity
        }}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/30 via-red-200/30 to-pink-200/30"></div>
      
      {/* Animated floating elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-300/20 to-red-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-gradient-to-br from-pink-300/15 to-red-300/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      <div className="absolute top-1/4 right-1/3 w-40 h-40 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-xl animate-pulse delay-700"></div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Upload, X, Camera, Sparkles, Zap } from "lucide-react";
import { UploadedImage } from "@/types";

interface ImageUploadProps {
  onImageUpload: (image: UploadedImage) => void;
  onImageRemove: () => void;
  uploadedImage?: UploadedImage | null;
  isProcessing?: boolean;
}

export default function ImageUpload({
  onImageUpload,
  onImageRemove,
  uploadedImage,
  isProcessing = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      onImageUpload({ file, preview });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    onImageRemove();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploadedImage ? (
        <div
          className={`group relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 ${
            dragActive
              ? "border-orange-400 bg-gradient-to-br from-orange-50/80 to-red-50/80 shadow-3xl scale-105"
              : "border-orange-200 hover:border-orange-300 bg-white/60 backdrop-blur-xl hover:shadow-2xl hover:scale-102"
          } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-red-200/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="relative flex flex-col items-center space-y-8">
            <div className="relative group">
              <div className="p-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-full shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <Camera className="w-16 h-16 text-orange-600" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 mb-3 font-serif">
                📸 Upload Your Food Photo
              </p>
              <p className="text-lg text-gray-600 mb-2">
                Drag and drop your image here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, and other image formats
              </p>
            </div>
            
            <button
              onClick={handleClick}
              disabled={isProcessing}
              className="group relative inline-flex items-center px-12 py-5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-bold rounded-2xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Upload className="w-6 h-6 mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Choose File</span>
              <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:animate-pulse" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50/60 to-red-50/60 shadow-2xl border border-orange-200/50 backdrop-blur-sm">
            <img
              src={uploadedImage.preview}
              alt="Uploaded food"
              className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Remove button */}
            <button
              onClick={handleRemove}
              disabled={isProcessing}
              className="absolute top-6 right-6 p-4 bg-white/95 hover:bg-white rounded-full shadow-2xl transition-all duration-300 disabled:opacity-50 hover:scale-110 backdrop-blur-sm border border-white/30"
            >
              <X className="w-6 h-6 text-gray-700 hover:text-red-500 transition-colors duration-300" />
            </button>
            
            {/* Success indicator */}
            <div className="absolute top-6 left-6 p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            
            {/* File info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-xl mb-1">
                    {uploadedImage.file.name}
                  </p>
                  <p className="text-white/80 text-sm">
                    {(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90 text-sm font-semibold">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

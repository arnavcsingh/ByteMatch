"use client";

import { useState, useRef } from "react";
import { Upload, X, Camera } from "lucide-react";
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
    <div className="w-full max-w-lg mx-auto">
      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            dragActive
              ? "border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl scale-105"
              : "border-orange-200 hover:border-orange-300 bg-white/80 backdrop-blur-sm hover:shadow-lg"
          } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="p-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full shadow-lg">
                <Camera className="w-12 h-12 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">📸</span>
              </div>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                Upload a food image
              </p>
              <p className="text-gray-600">
                Drag and drop or click to browse
              </p>
            </div>
            
            <button
              onClick={handleClick}
              disabled={isProcessing}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Upload className="w-5 h-5 mr-2" />
              Choose File
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 shadow-xl border border-orange-100">
            <img
              src={uploadedImage.preview}
              alt="Uploaded food"
              className="w-full h-80 object-cover"
            />
            <button
              onClick={handleRemove}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-110"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <p className="text-white font-semibold text-lg">
                {uploadedImage.file.name}
              </p>
              <p className="text-white/80 text-sm">
                {(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

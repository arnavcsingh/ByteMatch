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
    <div className="w-full max-w-md mx-auto">
      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
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
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Camera className="w-8 h-8 text-gray-600" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload a food image
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop or click to browse
              </p>
            </div>
            
            <button
              onClick={handleClick}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={uploadedImage.preview}
              alt="Uploaded food"
              className="w-full h-64 object-cover"
            />
            <button
              onClick={handleRemove}
              disabled={isProcessing}
              className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              {uploadedImage.file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

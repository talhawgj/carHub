'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GalleryManagerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  primaryImageIndex?: number;
  onPrimaryImageChange?: (index: number) => void;
}

export default function GalleryManager({
  images,
  onImagesChange,
  primaryImageIndex = 0,
  onPrimaryImageChange,
}: GalleryManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Reset primary image if removed
    if (primaryImageIndex === index && onPrimaryImageChange) {
      onPrimaryImageChange(0);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleSetPrimary = (index: number) => {
    if (onPrimaryImageChange) {
      onPrimaryImageChange(index);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition ${
              primaryImageIndex === index
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Image */}
            <div className="relative h-32 bg-gray-200">
              <img
                src={image}
                alt={`Gallery item ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {primaryImageIndex !== index && (
                <button
                  onClick={() => handleSetPrimary(index)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                  title="Set as cover image"
                >
                  Set Cover
                </button>
              )}
              <button
                onClick={() => handleRemoveImage(index)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                title="Remove image"
              >
                Remove
              </button>
            </div>

            {/* Badge */}
            <div className="absolute top-2 left-2">
              {primaryImageIndex === index && (
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                  Cover
                </span>
              )}
            </div>

            {/* Drag Handle */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-70 text-white text-xs py-1 text-center opacity-0 group-hover:opacity-100 transition">
              Drag to reorder
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-600 p-3 bg-blue-50 rounded-lg">
        💡 Drag images to reorder • Click "Set Cover" to make it the primary image • Click "Remove" to delete
      </div>
    </div>
  );
}

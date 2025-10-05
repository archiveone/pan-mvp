'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File;
}

export default function ImageCropper({ isOpen, onClose, onCropComplete, imageFile }: ImageCropperProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createSquareImage = useCallback(async (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not found'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not found'));
          return;
        }

        // Set canvas to a standard square size (e.g., 1024x1024)
        const size = 1024;
        canvas.width = size;
        canvas.height = size;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Calculate scaling to fit image within square while maintaining aspect ratio
        const scale = Math.min(size / img.width, size / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;

        // Draw the image centered with white borders if needed
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], imageFile.name, { type: 'image/jpeg' });
              resolve(file);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.9
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }, [imageFile]);

  const handleCropComplete = async () => {
    setIsProcessing(true);
    try {
      const croppedFile = await createSquareImage();
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Crop to Square</h3>
              <p className="text-sm text-gray-600 mt-1">Your image will be automatically centered</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 bg-gray-50">
          <div className="flex justify-center">
            <div className="relative w-64 h-64 bg-white border-4 border-blue-500 rounded-lg shadow-lg overflow-hidden">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              ✨ Your image will fit perfectly in a square with white borders if needed
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Crop & Add
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

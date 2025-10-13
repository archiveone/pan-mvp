'use client'

import React, { useState, useRef } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import { X, Check } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  console.log('🎨 ImageCropper rendered with imageSrc:', imageSrc ? 'present' : 'missing')
  
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  // Initialize crop as square when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const size = Math.min(width, height)
    const x = (width - size) / 2
    const y = (height - size) / 2

    const initialCrop = {
      unit: 'px' as const,
      width: size,
      height: size,
      x,
      y
    }

    setCrop(initialCrop)
    setCompletedCrop(initialCrop)
  }

  const getCroppedImg = async (): Promise<Blob | null> => {
    console.log('🎨 getCroppedImg called')
    
    if (!imgRef.current) {
      console.warn('⚠️ Missing image ref')
      return null
    }

    const image = imgRef.current
    
    // Use completedCrop if available, otherwise fall back to current crop
    let pixelCrop = completedCrop
    
    // If no completedCrop, convert the current crop to pixels
    if (!pixelCrop && crop) {
      if (crop.unit === '%') {
        pixelCrop = {
          unit: 'px',
          x: (crop.x / 100) * image.width,
          y: (crop.y / 100) * image.height,
          width: (crop.width / 100) * image.width,
          height: (crop.height / 100) * image.height
        }
      } else {
        pixelCrop = crop as PixelCrop
      }
    }
    
    if (!pixelCrop || !pixelCrop.width || !pixelCrop.height) {
      console.warn('⚠️ Invalid crop dimensions:', pixelCrop)
      return null
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('❌ Could not get canvas context')
      return null
    }
    
    console.log('✅ Starting crop with dimensions:', pixelCrop)

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Calculate the cropped area in natural image coordinates
    const cropWidth = pixelCrop.width * scaleX
    const cropHeight = pixelCrop.height * scaleY
    
    // Determine the final square size based on the larger dimension
    const squareSize = Math.max(cropWidth, cropHeight)
    
    // Set canvas to square dimensions
    canvas.width = squareSize
    canvas.height = squareSize

    // Fill with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, squareSize, squareSize)
    
    ctx.imageSmoothingQuality = 'high'

    // Calculate position to center the image in the square
    const offsetX = (squareSize - cropWidth) / 2
    const offsetY = (squareSize - cropHeight) / 2

    // Draw the cropped image centered with letterboxing
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      cropWidth,
      cropHeight,
      offsetX,
      offsetY,
      cropWidth,
      cropHeight
    )

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ Blob created successfully, size:', blob.size)
          }
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }

  const handleCropComplete = async () => {
    console.log('🔘 Apply Crop clicked')
    console.log('📐 Current crop:', crop)
    console.log('📐 Completed crop:', completedCrop)
    console.log('📐 Image ref:', imgRef.current ? 'present' : 'missing')
    
    try {
      const croppedBlob = await getCroppedImg()
      console.log('✅ Cropped blob result:', croppedBlob ? `success (${croppedBlob.size} bytes)` : 'failed')
      
      if (croppedBlob) {
        onCropComplete(croppedBlob)
      } else {
        console.error('❌ No cropped blob created')
        alert('Failed to crop image. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error during crop:', error)
      alert('Error cropping image. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-lime-400 to-lime-300 p-4 flex items-center justify-between">
          <h3 className="text-black font-semibold">Adjust Image</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 bg-white/20 text-black rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop={false}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%' }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between border-t dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag to select area • White space added if needed</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              className="px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all flex items-center gap-2"
            >
              <Check size={16} />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

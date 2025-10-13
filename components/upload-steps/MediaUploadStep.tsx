'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Music, File, Plus, Video, Disc, FileText } from 'lucide-react'
import { ImageService } from '@/services/imageService'

interface MediaUploadStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function MediaUploadStep({ data, onChange }: MediaUploadStepProps) {
  const [images, setImages] = useState<File[]>(data.images || [])
  const [audioFiles, setAudioFiles] = useState<File[]>(data.audioFiles || [])
  const [videoFiles, setVideoFiles] = useState<File[]>(data.videoFiles || [])
  const [documentFiles, setDocumentFiles] = useState<File[]>(data.documentFiles || [])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const newPreviewUrls: string[] = []

    fileArray.forEach(file => {
      const validation = ImageService.validateImage(file)
      if (validation.valid) {
        validFiles.push(file)
        newPreviewUrls.push(URL.createObjectURL(file))
      } else {
        alert(validation.error)
      }
    })

    const updatedImages = [...images, ...validFiles].slice(0, 10) // Max 10 images
    setImages(updatedImages)
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
    onChange({ images: updatedImages })
  }

  const handleAudioSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac', 'audio/x-m4a', 'audio/mp4']
    
    fileArray.forEach(file => {
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
        alert(`Invalid audio file: ${file.name}. Please select MP3, WAV, OGG, M4A, AAC, or FLAC files.`)
        return
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit per file
        alert(`Audio file "${file.name}" is too large. Maximum size is 100MB.`)
        return
      }

      validFiles.push(file)
    })

    const updatedAudioFiles = [...audioFiles, ...validFiles].slice(0, 20) // Max 20 audio files for albums
    setAudioFiles(updatedAudioFiles)
    onChange({ audioFiles: updatedAudioFiles })
  }

  const handleVideoSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
    
    fileArray.forEach(file => {
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|avi|mpeg)$/i)) {
        alert(`Invalid video file: ${file.name}. Please select MP4, WebM, MOV, AVI, or MPEG files.`)
        return
      }

      if (file.size > 500 * 1024 * 1024) { // 500MB limit per video
        alert(`Video file "${file.name}" is too large. Maximum size is 500MB.`)
        return
      }

      validFiles.push(file)
    })

    const updatedVideoFiles = [...videoFiles, ...validFiles].slice(0, 10) // Max 10 videos
    setVideoFiles(updatedVideoFiles)
    onChange({ videoFiles: updatedVideoFiles })
  }

  const handleDocumentSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    
    fileArray.forEach(file => {
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|xls|xlsx)$/i)) {
        alert(`Invalid document file: ${file.name}. Please select PDF, DOC, DOCX, TXT, XLS, or XLSX files.`)
        return
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit per document
        alert(`Document file "${file.name}" is too large. Maximum size is 50MB.`)
        return
      }

      validFiles.push(file)
    })

    const updatedDocumentFiles = [...documentFiles, ...validFiles].slice(0, 10) // Max 10 documents
    setDocumentFiles(updatedDocumentFiles)
    onChange({ documentFiles: updatedDocumentFiles })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleImageSelect(files)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    
    // Revoke the object URL to free memory
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    
    setImages(newImages)
    setPreviewUrls(newPreviewUrls)
    onChange({ images: newImages })
  }

  const removeAudio = (index: number) => {
    const newAudioFiles = audioFiles.filter((_, i) => i !== index)
    setAudioFiles(newAudioFiles)
    onChange({ audioFiles: newAudioFiles })
  }

  const removeVideo = (index: number) => {
    const newVideoFiles = videoFiles.filter((_, i) => i !== index)
    setVideoFiles(newVideoFiles)
    onChange({ videoFiles: newVideoFiles })
  }

  const removeDocument = (index: number) => {
    const newDocumentFiles = documentFiles.filter((_, i) => i !== index)
    setDocumentFiles(newDocumentFiles)
    onChange({ documentFiles: newDocumentFiles })
  }

  const openFileDialog = (type: 'image' | 'audio' | 'video' | 'document') => {
    if (type === 'image') {
      fileInputRef.current?.click()
    } else if (type === 'audio') {
      audioInputRef.current?.click()
    } else if (type === 'video') {
      videoInputRef.current?.click()
    } else if (type === 'document') {
      documentInputRef.current?.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isMusicType = data.type === 'music'
  const isEventType = data.type === 'event'
  const maxImages = isEventType ? 15 : 10

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Media & Files Upload
        </h3>
        <p className="text-gray-600">
          Upload images, videos, audio files, and documents for your content
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isMusicType ? 'Cover Art' : 'Images'} {!isMusicType && '(optional)'}
        </label>
        
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={previewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Main Image
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length < maxImages && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => openFileDialog('image')}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {isDragging 
                ? 'Drop images here' 
                : 'Click to upload images or drag and drop'
              }
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, WebP (max 5MB each, up to {maxImages} images)
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {images.length}/{maxImages} images uploaded
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Audio Upload */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Music className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Audio Files {isMusicType && '(Songs/Album)'}</h4>
        </div>
        
        {audioFiles.length > 0 && (
          <div className="space-y-2 mb-4">
            {audioFiles.map((file, index) => (
              <div key={index} className="p-3 bg-white border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <Disc className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-purple-900 truncate">{file.name}</p>
                      <p className="text-sm text-purple-700">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAudio(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {audioFiles.length < 20 && (
          <div
            onClick={() => openFileDialog('audio')}
            className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 cursor-pointer transition-colors bg-white"
          >
            <Music className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <p className="text-purple-600 mb-1 font-medium">
              {audioFiles.length === 0 ? 'Upload Audio Files' : 'Add More Tracks'}
            </p>
            <p className="text-sm text-purple-500">MP3, WAV, OGG, M4A, AAC, FLAC (max 100MB each)</p>
            <p className="text-xs text-purple-400 mt-2">{audioFiles.length}/20 audio files</p>
          </div>
        )}
        
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          multiple
          onChange={(e) => handleAudioSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Video Upload */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Video className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Video Files</h4>
        </div>
        
        {videoFiles.length > 0 && (
          <div className="space-y-2 mb-4">
            {videoFiles.map((file, index) => (
              <div key={index} className="p-3 bg-white border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <Video className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-blue-900 truncate">{file.name}</p>
                      <p className="text-sm text-blue-700">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeVideo(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {videoFiles.length < 10 && (
          <div
            onClick={() => openFileDialog('video')}
            className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors bg-white"
          >
            <Video className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <p className="text-blue-600 mb-1 font-medium">
              {videoFiles.length === 0 ? 'Upload Video Files' : 'Add More Videos'}
            </p>
            <p className="text-sm text-blue-500">MP4, WebM, MOV, AVI, MPEG (max 500MB each)</p>
            <p className="text-xs text-blue-400 mt-2">{videoFiles.length}/10 video files</p>
          </div>
        )}
        
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.avi,.mpeg"
          multiple
          onChange={(e) => handleVideoSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Document Upload */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FileText className="w-6 h-6 text-amber-600 mr-2" />
          <h4 className="font-semibold text-amber-900">Documents & Files</h4>
        </div>
        
        {documentFiles.length > 0 && (
          <div className="space-y-2 mb-4">
            {documentFiles.map((file, index) => (
              <div key={index} className="p-3 bg-white border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <FileText className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-amber-900 truncate">{file.name}</p>
                      <p className="text-sm text-amber-700">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {documentFiles.length < 10 && (
          <div
            onClick={() => openFileDialog('document')}
            className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:border-amber-400 cursor-pointer transition-colors bg-white"
          >
            <FileText className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-amber-600 mb-1 font-medium">
              {documentFiles.length === 0 ? 'Upload Documents' : 'Add More Documents'}
            </p>
            <p className="text-sm text-amber-500">PDF, DOC, DOCX, TXT, XLS, XLSX (max 50MB each)</p>
            <p className="text-xs text-amber-400 mt-2">{documentFiles.length}/10 document files</p>
          </div>
        )}
        
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
          multiple
          onChange={(e) => handleDocumentSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">📊 Upload Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-800">
          <div className="text-center p-2 bg-white rounded">
            <ImageIcon className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <div className="font-semibold">{images.length}</div>
            <div className="text-xs">Images</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <Music className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <div className="font-semibold">{audioFiles.length}</div>
            <div className="text-xs">Audio</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <Video className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <div className="font-semibold">{videoFiles.length}</div>
            <div className="text-xs">Videos</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <FileText className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <div className="font-semibold">{documentFiles.length}</div>
            <div className="text-xs">Documents</div>
          </div>
        </div>
      </div>

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Upload Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Images: Use high-resolution photos (first image = thumbnail)</li>
          <li>• Videos: Keep files under 500MB for faster uploads</li>
          <li>• Audio: Supports albums with up to 20 tracks</li>
          <li>• Documents: Perfect for portfolios, guides, or additional resources</li>
          <li>• All files are securely stored and processed</li>
        </ul>
      </div>
    </div>
  )
}


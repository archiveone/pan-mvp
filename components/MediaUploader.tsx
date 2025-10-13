'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, FileText, Music, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { MediaUploadService, MediaFile, UploadProgress } from '@/services/mediaUploadService';
import { useAuth } from '@/contexts/AuthContext';

interface MediaUploaderProps {
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: UploadProgress;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  result?: MediaFile;
}

export default function MediaUploader({
  onUploadComplete,
  onUploadError,
  multiple = false,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.mp3,.wav,.m4a,.ogg,.flac',
  maxFiles = 5,
  maxFileSize = 100,
  className = '',
  disabled = false,
}: MediaUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!user) {
      onUploadError?.('You must be logged in to upload files');
      return;
    }

    const fileArray = Array.from(files);
    
    // Validate number of files
    if (fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    for (const file of fileArray) {
      if (file.size > maxFileSize * 1024 * 1024) {
        onUploadError?.(`File "${file.name}" is too large. Maximum size is ${maxFileSize}MB`);
        return;
      }
    }

    // Create uploading file objects
    const newUploadingFiles: UploadingFile[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: { loaded: 0, total: file.size, percentage: 0 },
      status: 'uploading',
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files
    for (const uploadingFile of newUploadingFiles) {
      try {
        const result = await MediaUploadService.uploadFile(
          uploadingFile.file,
          user.id,
          (progress) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.id === uploadingFile.id
                  ? { ...f, progress }
                  : f
              )
            );
          }
        );

        if (result.success && result.file) {
          setUploadingFiles(prev =>
            prev.map(f =>
              f.id === uploadingFile.id
                ? { ...f, status: 'completed' as const, result: result.file }
                : f
            )
          );
        } else {
          setUploadingFiles(prev =>
            prev.map(f =>
              f.id === uploadingFile.id
                ? { ...f, status: 'error' as const, error: result.error }
                : f
            )
          );
          onUploadError?.(result.error || 'Upload failed');
        }
      } catch (error: any) {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, status: 'error' as const, error: error.message }
              : f
          )
        );
        onUploadError?.(error.message || 'Upload failed');
      }
    }

    // Check if all uploads are complete
    setTimeout(() => {
      const completedFiles = uploadingFiles
        .filter(f => f.status === 'completed' && f.result)
        .map(f => f.result!);
      
      if (completedFiles.length > 0) {
        onUploadComplete?.(completedFiles);
      }
    }, 100);
  }, [user, maxFiles, maxFileSize, onUploadComplete, onUploadError, uploadingFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [disabled, handleFileSelect]);

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={20} />;
    if (file.type.startsWith('video/')) return <Video size={20} />;
    if (file.type.startsWith('audio/')) return <Music size={20} />;
    return <FileText size={20} />;
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader size={16} className="animate-spin" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatProgress = (progress: UploadProgress) => {
    return `${progress.percentage}%`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center">
          <Upload size={48} className={`mb-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            Upload Files
          </h3>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            Drag and drop files here, or click to select
          </p>
          <p className={`text-xs mt-2 ${disabled ? 'text-gray-400' : 'text-gray-400'}`}>
            Max {maxFiles} files, {maxFileSize}MB each. Supports images, videos, audio, and documents.
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadingFile.file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadingFile.status)}
                  <button
                    onClick={() => removeUploadingFile(uploadingFile.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {uploadingFile.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadingFile.progress.percentage}%` }}
                  />
                </div>
              )}

              {uploadingFile.status === 'uploading' && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatProgress(uploadingFile.progress)}
                </p>
              )}

              {uploadingFile.status === 'error' && uploadingFile.error && (
                <p className="text-xs text-red-500 mt-1">
                  Error: {uploadingFile.error}
                </p>
              )}

              {uploadingFile.status === 'completed' && (
                <p className="text-xs text-green-500 mt-1">
                  Upload completed successfully
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Specialized components for different file types
export function ImageUploader(props: Omit<MediaUploaderProps, 'accept'>) {
  return (
    <MediaUploader
      {...props}
      accept="image/*"
    />
  );
}

export function VideoUploader(props: Omit<MediaUploaderProps, 'accept'>) {
  return (
    <MediaUploader
      {...props}
      accept="video/*"
    />
  );
}

export function DocumentUploader(props: Omit<MediaUploaderProps, 'accept'>) {
  return (
    <MediaUploader
      {...props}
      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
    />
  );
}

export function AudioUploader(props: Omit<MediaUploaderProps, 'accept'>) {
  return (
    <MediaUploader
      {...props}
      accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
    />
  );
}

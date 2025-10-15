'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';

interface EnhancedUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export default function EnhancedUploadZone({
  onFilesSelected,
  maxFiles = 4,
  acceptedTypes = 'image/*',
  maxSizeMB = 5
}: EnhancedUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const maxSize = maxSizeMB * 1024 * 1024;

    files.forEach((file, index) => {
      // Check file type
      if (!file.type.match(acceptedTypes.replace('*', '.*'))) {
        errors.push(`File ${index + 1}: Invalid type. Expected ${acceptedTypes}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB`);
        return;
      }

      valid.push(file);
    });

    // Check total count
    if (valid.length + selectedFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid: valid.slice(0, maxFiles - selectedFiles.length), errors };
    }

    return { valid, errors };
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors: validationErrors } = validateFiles(fileArray);

    setErrors(validationErrors);

    if (valid.length > 0) {
      const newFiles = [...selectedFiles, ...valid];
      setSelectedFiles(newFiles);

      // Create previews
      const newPreviews = valid.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);

      // Notify parent
      onFilesSelected(newFiles);
    }
  }, [selectedFiles, previews, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke URL to free memory
    URL.revokeObjectURL(previews[index]);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onFilesSelected(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-green-500 bg-green-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        
        <Upload className={`mx-auto mb-4 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} size={48} />
        
        <div className="text-lg font-semibold text-gray-900 mb-2">
          {isDragging ? 'Drop files here!' : 'Drag & drop files here'}
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          or click to browse • Max {maxFiles} files • Up to {maxSizeMB}MB each
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          <Upload size={16} />
          Choose Files
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <div className="flex-1">
              <div className="font-semibold text-red-900 mb-1">Upload Issues:</div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Upload className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs truncate">
                  {file.name}
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X size={14} />
                </button>
                
                {/* Success indicator */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <Check size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


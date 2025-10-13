import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MediaUploadService, MediaFile } from '@/services/mediaUploadService';

export function useMediaFiles() {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's media files
  const loadFiles = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await MediaUploadService.getUserFiles(user.id);
      
      if (result.success && result.files) {
        setFiles(result.files);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Upload a single file
  const uploadFile = useCallback(async (
    file: File,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<{ success: boolean; file?: MediaFile; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to upload files' };
    }

    try {
      const result = await MediaUploadService.uploadFile(file, user.id, onProgress);
      
      if (result.success && result.file) {
        setFiles(prev => [result.file!, ...prev]);
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Upload failed' };
    }
  }, [user]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    files: File[],
    onProgress?: (fileIndex: number, progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<{ success: boolean; files?: MediaFile[]; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to upload files' };
    }

    try {
      const results = await MediaUploadService.uploadFiles(files, user.id, onProgress);
      
      const successfulUploads = results
        .filter(result => result.success && result.file)
        .map(result => result.file!);
      
      if (successfulUploads.length > 0) {
        setFiles(prev => [...successfulUploads, ...prev]);
      }
      
      const hasErrors = results.some(result => !result.success);
      
      return {
        success: successfulUploads.length > 0,
        files: successfulUploads,
        error: hasErrors ? 'Some files failed to upload' : undefined,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Upload failed' };
    }
  }, [user]);

  // Delete a file
  const deleteFile = useCallback(async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await MediaUploadService.deleteFile(fileId);
      
      if (result.success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Delete failed' };
    }
  }, []);

  // Get files by type
  const getFilesByType = useCallback((type: 'image' | 'video' | 'document'): MediaFile[] => {
    return files.filter(file => file.type === type);
  }, [files]);

  // Get recent files
  const getRecentFiles = useCallback((limit: number = 10): MediaFile[] => {
    return files
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, limit);
  }, [files]);

  // Search files by name
  const searchFiles = useCallback((query: string): MediaFile[] => {
    const lowercaseQuery = query.toLowerCase();
    return files.filter(file => 
      file.name.toLowerCase().includes(lowercaseQuery)
    );
  }, [files]);

  // Load files when user changes
  useEffect(() => {
    if (user) {
      loadFiles();
    } else {
      setFiles([]);
      setError(null);
    }
  }, [user, loadFiles]);

  return {
    files,
    loading,
    error,
    uploadFile,
    uploadFiles,
    deleteFile,
    loadFiles,
    getFilesByType,
    getRecentFiles,
    searchFiles,
  };
}

// Hook for managing a specific set of files (e.g., for a post or listing)
export function useMediaSelection(initialFiles: MediaFile[] = []) {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>(initialFiles);

  const addFile = useCallback((file: MediaFile) => {
    setSelectedFiles(prev => {
      if (prev.some(f => f.id === file.id)) {
        return prev; // Don't add duplicates
      }
      return [...prev, file];
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const toggleFile = useCallback((file: MediaFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  }, []);

  const setFiles = useCallback((files: MediaFile[]) => {
    setSelectedFiles(files);
  }, []);

  const isSelected = useCallback((fileId: string) => {
    return selectedFiles.some(f => f.id === fileId);
  }, [selectedFiles]);

  return {
    selectedFiles,
    addFile,
    removeFile,
    clearFiles,
    toggleFile,
    setFiles,
    isSelected,
    count: selectedFiles.length,
  };
}

// Hook for drag and drop functionality
export function useDragAndDrop(
  onFilesDropped: (files: File[]) => void,
  accept: string = '*/*'
) {
  const [dragActive, setDragActive] = useState(false);

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

    const files = Array.from(e.dataTransfer.files);
    
    // Filter files by accepted types
    const acceptedFiles = files.filter(file => {
      if (accept === '*/*') return true;
      
      const acceptedTypes = accept.split(',').map(type => type.trim());
      return acceptedTypes.some(acceptedType => {
        if (acceptedType.endsWith('/*')) {
          const category = acceptedType.slice(0, -1);
          return file.type.startsWith(category);
        }
        return file.type === acceptedType || file.name.endsWith(acceptedType);
      });
    });

    if (acceptedFiles.length > 0) {
      onFilesDropped(acceptedFiles);
    }
  }, [onFilesDropped, accept]);

  return {
    dragActive,
    dragHandlers: {
      onDragEnter: handleDrag,
      onDragLeave: handleDrag,
      onDragOver: handleDrag,
      onDrop: handleDrop,
    },
  };
}

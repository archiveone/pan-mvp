'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { getPortfolioFiles, uploadPortfolioFile, deletePortfolioFile } from '@/services/userHubService';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, Trash2, FileText, Image, Video, Music, Download } from 'lucide-react';

export default function PortfolioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadPortfolioFiles();
  }, [user, router]);

  const loadPortfolioFiles = async () => {
    if (!user) return;
    
    try {
      const result = await getPortfolioFiles(user.id);
      if (result.success) {
        setPortfolioFiles(result.data);
      }
    } catch (error) {
      console.error('Error loading portfolio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `portfolio/${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Save to database
      const result = await uploadPortfolioFile(user.id, {
        name: file.name,
        description: '',
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      });

      if (result.success) {
        setPortfolioFiles(prev => [result.data, ...prev]);
        (window as any).addNotification?.({
          type: 'success',
          title: 'File Uploaded',
          message: 'Your file has been added to your portfolio'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload file'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    
    try {
      const result = await deletePortfolioFile(user.id, fileId);
      if (result.success) {
        setPortfolioFiles(prev => prev.filter(file => file.id !== fileId));
        (window as any).addNotification?.({
          type: 'success',
          title: 'File Deleted',
          message: 'File has been removed from your portfolio'
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete file'
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.startsWith('audio/')) return Music;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your portfolio.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
              <p className="text-gray-600">Your work and files</p>
            </div>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
        />

        {/* Portfolio Files */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : portfolioFiles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Files Yet</h3>
            <p className="text-gray-500 mb-6">Upload your work and files to build your portfolio</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upload Your First File
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioFiles.map((file) => {
              const FileIcon = getFileIcon(file.file_type);
              return (
                <div key={file.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <FileIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {file.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {file.description && (
                      <p className="text-gray-600 text-sm mb-4">{file.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}

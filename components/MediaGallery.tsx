'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Eye, Trash2, Image, Video, FileText, MoreVertical } from 'lucide-react';
import { MediaFile } from '@/services/mediaUploadService';
import { MediaUploadService } from '@/services/mediaUploadService';

interface MediaGalleryProps {
  files: MediaFile[];
  onFileDelete?: (fileId: string) => void;
  onFileSelect?: (file: MediaFile) => void;
  selectable?: boolean;
  deletable?: boolean;
  downloadable?: boolean;
  className?: string;
}

interface MediaModalProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
}

function MediaModal({ file, isOpen, onClose }: MediaModalProps) {
  if (!isOpen || !file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMediaContent = () => {
    switch (file.type) {
      case 'image':
        return (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        );
      case 'video':
        return (
          <video
            src={file.url}
            controls
            className="max-w-full max-h-full"
          >
            Your browser does not support the video tag.
          </video>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
            <FileText size={64} className="text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">{file.name}</p>
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Download
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-full w-full relative">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center min-h-96">
          {renderMediaContent()}
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
            </div>
            <div>
              <span className="font-medium">Type:</span> {file.mimeType}
            </div>
            <div>
              <span className="font-medium">Uploaded:</span> {formatDate(file.uploadedAt)}
            </div>
            {file.metadata?.width && file.metadata?.height && (
              <div>
                <span className="font-medium">Dimensions:</span> {file.metadata.width} × {file.metadata.height}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaThumbnail({ file, onSelect, onDelete, onView, selectable, deletable }: {
  file: MediaFile;
  onSelect?: (file: MediaFile) => void;
  onDelete?: (fileId: string) => void;
  onView?: (file: MediaFile) => void;
  selectable?: boolean;
  deletable?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getFileIcon = () => {
    switch (file.type) {
      case 'image':
        return <Image size={20} className="text-blue-500" />;
      case 'video':
        return <Video size={20} className="text-purple-500" />;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(file);
    } else if (onView) {
      onView(file);
    }
  };

  const handleDelete = () => {
    if (deletable && onDelete) {
      onDelete(file.id);
    }
    setShowMenu(false);
  };

  return (
    <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-square relative cursor-pointer" onClick={handleClick}>
        {file.type === 'image' ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : file.type === 'video' && file.metadata?.thumbnailUrl ? (
          <img
            src={file.metadata.thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            {getFileIcon()}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(file);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 p-2 rounded-full"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 p-1 rounded"
        >
          <MoreVertical size={14} />
        </button>

        {/* Menu */}
        {showMenu && (
          <div className="absolute top-8 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(file);
                setShowMenu(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye size={14} />
              <span>View</span>
            </button>
            {deletable && (
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Selection Indicator */}
      {selectable && (
        <div className="absolute top-2 left-2">
          <div className="w-6 h-6 bg-white bg-opacity-90 rounded border-2 border-gray-300 flex items-center justify-center">
            {/* Selection indicator would go here */}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MediaGallery({
  files,
  onFileDelete,
  onFileSelect,
  selectable = false,
  deletable = true,
  downloadable = true,
  className = '',
}: MediaGalleryProps) {
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileView = (file: MediaFile) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const handleFileDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        const result = await MediaUploadService.deleteFile(fileId);
        if (result.success) {
          onFileDelete?.(fileId);
        } else {
          alert(`Failed to delete file: ${result.error}`);
        }
      } catch (error: any) {
        alert(`Failed to delete file: ${error.message}`);
      }
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    if (selectable && onFileSelect) {
      onFileSelect(file);
    }
  };

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No files uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
        {files.map((file) => (
          <MediaThumbnail
            key={file.id}
            file={file}
            onSelect={selectable ? handleFileSelect : undefined}
            onDelete={deletable ? handleFileDelete : undefined}
            onView={handleFileView}
            selectable={selectable}
            deletable={deletable}
          />
        ))}
      </div>

      <MediaModal
        file={selectedFile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// Utility functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

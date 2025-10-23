'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface AppleStyleBoxEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; color?: string; imageUrl?: string; isPublic?: boolean }) => void;
  onDelete?: () => void;
  initialData?: {
    title?: string;
    color?: string;
    imageUrl?: string;
    isPublic?: boolean;
  };
  isNew?: boolean;
}

const AppleStyleBoxEditor: React.FC<AppleStyleBoxEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isNew = false
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [color, setColor] = useState(initialData?.color || '#007AFF');
  const [isPublic, setIsPublic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setImageUrl(initialData.imageUrl || '');
      setColor(initialData.color || '#007AFF');
      setIsPublic(initialData.isPublic || false);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      color: imageUrl ? undefined : color,
      imageUrl: imageUrl || undefined,
      isPublic
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUrl(URL.createObjectURL(file));
      // TODO: Upload to storage
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Apple-style minimal modal */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[22px] shadow-2xl w-full max-w-[340px] my-auto max-h-[calc(100vh-1rem)] overflow-hidden">
        {/* Header - Ultra minimal */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
            {isNew ? 'New Collection' : 'Edit'}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content - Minimal */}
        <div className="px-5 pb-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name"
            maxLength={30}
            className="w-full px-0 py-2 text-[20px] font-medium bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
            autoFocus
          />

          {/* Cover */}
          {imageUrl ? (
            <div className="relative group rounded-[14px] overflow-hidden">
              <img src={imageUrl} alt="" className="w-full h-32 object-cover" />
              <button
                onClick={() => setImageUrl('')}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[13px] font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Color Picker */}
              <div className="relative flex-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                  id="color"
                />
                <label
                  htmlFor="color"
                  className="block h-11 rounded-[10px] cursor-pointer transition-transform active:scale-95"
                  style={{ backgroundColor: color }}
                />
              </div>

              {/* Image Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-[10px] transition-all active:scale-95 flex items-center gap-2"
              >
                <ImageIcon className="w-[15px] h-[15px] text-gray-600 dark:text-gray-400" strokeWidth={2.5} />
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-[14px]">
            <div>
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">Show on Profile</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Visible on your public profile</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPublic(!isPublic);
              }}
              className={`
                relative w-11 h-6 rounded-full transition-colors flex items-center
                ${isPublic ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
              `}
              aria-label={isPublic ? "Public" : "Private"}
            >
              <div 
                className="absolute w-5 h-5 bg-white rounded-full transition-all shadow-sm duration-200"
                style={{
                  left: isPublic ? '22px' : '2px'
                }}
              />
            </button>
          </div>

          {/* Preview */}
          <div 
            className="h-20 rounded-[14px] flex items-end p-3 shadow-sm"
            style={
              imageUrl 
                ? {
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6), transparent), url(${imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : {
                    backgroundColor: color
                  }
            }
          >
            <p className="text-white font-semibold text-[15px] drop-shadow-md">
              {title || 'Collection'}
            </p>
          </div>
        </div>

        {/* Footer - Apple style (single row) */}
        <div className="px-5 pb-5 flex gap-2">
          {!isNew && onDelete && (
            <button
              onClick={onDelete}
              className="flex-none px-5 h-11 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-[10px] text-[15px] font-medium transition-all active:scale-95"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-[10px] text-[15px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppleStyleBoxEditor;


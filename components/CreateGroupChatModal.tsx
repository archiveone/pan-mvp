'use client';

import React, { useState } from 'react';
import { X, Search, Users, Camera, Check } from 'lucide-react';
import { GroupChatService } from '@/services/groupChatService';
import { MessagingService } from '@/services/messagingService';
import { uploadImage, compressImage } from '@/lib/mediaUpload';
import { useAuth } from '@/contexts/AuthContext';

interface CreateGroupChatModalProps {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export default function CreateGroupChatModal({ onClose, onCreated }: CreateGroupChatModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'name' | 'members'>('name');
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string>('');
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const results = await MessagingService.searchUsers(query);
    setSearchResults(results.filter(u => u.id !== user?.id));
  };

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGroupImageFile(file);
    const preview = URL.createObjectURL(file);
    setGroupImage(preview);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    setCreating(true);
    try {
      let uploadedImageUrl: string | undefined;

      // Upload group image if provided
      if (groupImageFile) {
        const compressed = await compressImage(groupImageFile);
        const result = await uploadImage(compressed, user!.id);
        if (result.success && result.url) {
          uploadedImageUrl = result.url;
        }
      }

      // Create group chat
      const result = await GroupChatService.createGroupChat(
        groupName,
        Array.from(selectedMembers),
        uploadedImageUrl
      );

      if (result.success && result.conversationId) {
        onCreated(result.conversationId);
        onClose();
      } else {
        alert(result.error || 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md my-auto max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {step === 'name' ? 'Create Group Chat' : 'Add Members'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Step 1: Group Name & Image */}
        {step === 'name' && (
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Group Image */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                  {groupImage ? (
                    <img src={groupImage} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={40} className="text-white" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => document.getElementById('group-image-input')?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                >
                  <Camera size={18} />
                </button>
                <input
                  id="group-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Work Team, Friends, Family..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep('members')}
              disabled={!groupName.trim()}
              className="w-full mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
            >
              Next: Add Members
            </button>
          </div>
        )}

        {/* Step 2: Add Members */}
        {step === 'members' && (
          <>
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selected Members Count */}
              {selectedMembers.size > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {searchQuery.length < 2 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Search for users to add to the group</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold">
                          {(user.name || user.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name || user.username}
                      </div>
                      {user.username && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </div>
                      )}
                    </div>
                    {selectedMembers.has(user.id) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No users found matching "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setStep('name')}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={selectedMembers.size === 0 || creating}
                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


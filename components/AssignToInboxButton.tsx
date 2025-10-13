'use client';

import React, { useState, useEffect } from 'react';
import { FolderInput, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';

interface AssignToInboxButtonProps {
  conversationId: string;
  compact?: boolean;
}

export default function AssignToInboxButton({ conversationId, compact = false }: AssignToInboxButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [inboxes, setInboxes] = useState<HubBox[]>([]);
  const [assignedInboxes, setAssignedInboxes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showModal && user) {
      loadInboxes();
    }
  }, [showModal, user]);

  const loadInboxes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load user's inbox boxes (exclude default "Messages")
      const result = await AdvancedHubService.getUserHubBoxes(user.id);
      if (result.success && result.data) {
        const customInboxes = result.data.filter(box => 
          box.box_type === 'inbox' && 
          box.title !== 'Messages' && 
          box.title !== 'Inbox'
        );
        setInboxes(customInboxes);

        // Check which inboxes already have this conversation
        // TODO: Implement getInboxesForConversation
        const assignedIds = new Set<string>();
        setAssignedInboxes(assignedIds);
      }
    } catch (error) {
      console.error('Error loading inboxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInbox = async (inboxId: string) => {
    try {
      const isCurrentlyAssigned = assignedInboxes.has(inboxId);

      if (isCurrentlyAssigned) {
        // Remove from inbox
        console.log(`🗑️  Removing conversation from inbox ${inboxId}...`);
        const result = await AdvancedHubService.removeConversationFromInbox(inboxId, conversationId);
        if (result.success) {
          console.log('✅ Conversation removed from inbox!');
          setAssignedInboxes(prev => {
            const newSet = new Set(prev);
            newSet.delete(inboxId);
            return newSet;
          });
        } else {
          console.error('❌ Failed to remove:', result.error);
        }
      } else {
        // Add to inbox
        console.log(`➕ Assigning conversation to inbox ${inboxId}...`);
        const result = await AdvancedHubService.assignConversationToInbox(inboxId, conversationId, user!.id);
        
        if (result.success) {
          console.log('✅ Conversation assigned to inbox!');
          setAssignedInboxes(prev => new Set(prev).add(inboxId));
        } else {
          console.error('❌ Failed to assign:', result.error);
          alert(`Failed to assign: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling inbox:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('📬 Assign to inbox clicked!');
          setShowModal(true);
        }}
        className={`
          ${compact 
            ? 'p-2 bg-white/90 hover:bg-white backdrop-blur-sm' 
            : 'px-4 py-2 bg-indigo-500 hover:bg-indigo-600'
          }
          hover:shadow-lg active:scale-95 transition-all rounded-full
          flex items-center gap-2 font-medium
        `}
        title="Assign to inbox"
      >
        <FolderInput className={`${compact ? 'w-4 h-4' : 'w-4 h-4'} ${compact ? 'text-gray-700' : 'text-white'}`} />
        {!compact && <span className="text-white">Assign to Inbox</span>}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign to Inbox</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Organize your conversations</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading inboxes...</p>
                </div>
              ) : inboxes.length === 0 ? (
                <div className="text-center py-8">
                  <FolderInput className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No custom inboxes yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Create inbox boxes like "Work" or "Friends" in your hub
                  </p>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      window.location.href = '/hub';
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Go to Hub
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {inboxes.map((inbox) => {
                    const isAssigned = assignedInboxes.has(inbox.id);
                    const inboxColor = inbox.custom_color || inbox.color || '#6366F1';

                    return (
                      <button
                        key={inbox.id}
                        onClick={() => toggleInbox(inbox.id)}
                        className={`
                          w-full p-4 rounded-2xl border-2 transition-all text-left
                          ${isAssigned 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {/* Inbox Preview */}
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: inboxColor }}
                          >
                            <FolderInput className="w-6 h-6 text-white" />
                          </div>

                          {/* Inbox Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{inbox.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {inbox.is_public ? '🌍 Public' : '🔒 Private'}
                            </p>
                          </div>

                          {/* Checkmark */}
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                            ${isAssigned ? 'bg-indigo-500' : 'border-2 border-gray-300 dark:border-gray-600'}
                          `}>
                            {isAssigned && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


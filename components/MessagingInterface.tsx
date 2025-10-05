'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MessagingService, Message, Conversation } from '@/services/messagingService';

interface MessagingInterfaceProps {
  conversationId?: string;
  onConversationSelect?: (conversation: Conversation) => void;
}

export default function MessagingInterface({ conversationId, onConversationSelect }: MessagingInterfaceProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await MessagingService.getConversations(user.id);
    if (result.success && result.conversations) {
      setConversations(result.conversations);
      if (conversationId) {
        const conv = result.conversations.find(c => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    }
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    const result = await MessagingService.getMessages(convId, user?.id || '');
    if (result.success && result.messages) {
      setMessages(result.messages.reverse()); // Reverse to show oldest first
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const result = await MessagingService.sendMessage(
      selectedConversation.id,
      user.id,
      newMessage.trim()
    );

    if (result.success) {
      setNewMessage('');
      // Reload messages to show the new one
      loadMessages(selectedConversation.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <Search size={20} />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => {
                setSelectedConversation(conversation);
                onConversationSelect?.(conversation);
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {conversation.type === 'direct' ? (
                    <span className="text-gray-600 font-medium">
                      {conversation.participants
                        .find(p => p.user_id !== user?.id)
                        ?.user.full_name.charAt(0) || 'U'}
                    </span>
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {conversation.name?.charAt(0) || 'G'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.type === 'direct' 
                        ? conversation.participants.find(p => p.user_id !== user?.id)?.user.full_name
                        : conversation.name
                      }
                    </h3>
                    {conversation.last_message && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.last_message?.content || 'No messages yet'}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {conversation.unread_count}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {selectedConversation.type === 'direct' 
                        ? selectedConversation.participants
                            .find(p => p.user_id !== user?.id)
                            ?.user.full_name.charAt(0) || 'U'
                        : selectedConversation.name?.charAt(0) || 'G'
                      }
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.type === 'direct' 
                        ? selectedConversation.participants.find(p => p.user_id !== user?.id)?.user.full_name
                        : selectedConversation.name
                      }
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.type === 'direct' 
                        ? 'Direct message'
                        : `${selectedConversation.participants.length} members`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <Video size={20} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && showAvatar && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 text-sm font-medium">
                            {message.sender?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      {!isOwn && !showAvatar && <div className="w-8" />}
                      
                      <div className={`px-4 py-2 rounded-2xl ${
                        isOwn 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <Smile size={20} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-500 text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

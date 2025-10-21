'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Send, Plus, X, User, Image as ImageIcon, Mic, Camera, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';
import { MessagingService, Conversation, Message } from '@/services/messagingService';
import { GroupChatService } from '@/services/groupChatService';
import { uploadImage, compressImage } from '@/lib/mediaUpload';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import * as Icons from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CustomInboxPage() {
  const params = useParams();
  const boxId = params?.boxId as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const [box, setBox] = useState<HubBox | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Add people modal
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addingPerson, setAddingPerson] = useState(false);
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  
  // Group chat creation
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string>('');
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (boxId && user) {
      loadInbox();
    }
  }, [boxId, user, router]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      MessagingService.markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInbox = async () => {
    setLoading(true);
    try {
      // Get inbox box details
      const boxResult = await AdvancedHubService.getUserHubBoxes(user!.id);
      if (boxResult.success && boxResult.data) {
        const foundBox = boxResult.data.find(b => b.id === boxId);
        if (foundBox) {
          setBox(foundBox);
        }
      }

      // Load conversations assigned to this inbox
      const assignedResult = await AdvancedHubService.getInboxConversations(boxId as string);
      if (assignedResult.success && assignedResult.data) {
        // Load full conversation data
        const allConversations = await MessagingService.getUserConversations();
        if (Array.isArray(allConversations) && assignedResult.data) {
          // Filter to only show conversations assigned to this inbox
          const filteredConvs = allConversations.filter(conv => 
            assignedResult.data!.includes(conv.id)
          );
          setConversations(filteredConvs);
        }
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const msgs = await MessagingService.getMessages(conversationId);
    setMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageToSend = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation,
      sender_id: user!.id,
      encrypted_content: messageToSend,
      decrypted_content: messageToSend,
      preview: messageToSend.substring(0, 50),
      content_type: 'text',
      is_deleted: false,
      is_edited: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user!.id,
        name: user?.user_metadata?.full_name,
        username: user?.email?.split('@')[0],
        avatar_url: user?.user_metadata?.avatar_url
      }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);
    
    const result = await MessagingService.sendMessage(selectedConversation, messageToSend);

    if (result.success && result.message) {
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? result.message! : msg)
      );
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation
            ? { ...conv, last_message: result.message, last_message_at: result.message!.created_at }
            : conv
        ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageToSend);
      alert('Failed to send message. Please try again.');
    }
    
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search all users (can message anyone by username)
      const results = await MessagingService.searchUsers(query);
      setSearchResults(results.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddPersonToInbox = async (otherUserId: string) => {
    setAddingPerson(true);
    try {
      // Get or create conversation
      console.log('Creating/getting conversation with:', otherUserId);
      const result = await MessagingService.getOrCreateConversation(otherUserId);
      
      console.log('Conversation result:', result);
      
      if (result.success && result.conversationId) {
        // Assign to this inbox
        console.log('Assigning conversation to inbox:', boxId);
        await AdvancedHubService.assignConversationToInbox(boxId as string, result.conversationId, user!.id);
        
        // Close modal
        setShowAddPeople(false);
        setUserSearch('');
        setSearchResults([]);
        
        // Reload inbox to show new conversation
        console.log('Reloading inbox...');
        await loadInbox();
        
        // Auto-select the new conversation to open chat
        console.log('Opening conversation:', result.conversationId);
        setSelectedConversation(result.conversationId);
      } else {
        console.error('Failed to create conversation:', result);
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error adding person to inbox:', error);
      alert('Failed to add person. Please try again.');
    } finally {
      setAddingPerson(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants?.find(p => p.user_id !== user?.id);
  };

  const toggleGroupMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleGroupImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGroupImageFile(file);
    const preview = URL.createObjectURL(file);
    setGroupImage(preview);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    setCreatingGroup(true);
    try {
      let uploadedImageUrl: string | undefined;

      if (groupImageFile) {
        const compressed = await compressImage(groupImageFile);
        const result = await uploadImage(compressed, user!.id);
        if (result.success && result.url) {
          uploadedImageUrl = result.url;
        }
      }

      const result = await GroupChatService.createGroupChat(
        groupName,
        Array.from(selectedMembers),
        uploadedImageUrl
      );

      if (result.success && result.conversationId) {
        // Assign group to this inbox
        await AdvancedHubService.assignConversationToInbox(boxId as string, result.conversationId, user!.id);
        
        // Close modal and reset
        setShowAddPeople(false);
        setChatType('direct');
        setGroupName('');
        setGroupImage('');
        setGroupImageFile(null);
        setSelectedMembers(new Set());
        setUserSearch('');
        setSearchResults([]);
        
        // Reload inbox
        await loadInbox();
        
        // Open the new group chat
        setSelectedConversation(result.conversationId);
      } else {
        alert(result.error || 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group chat');
    } finally {
      setCreatingGroup(false);
    }
  };

  if (!user || !box) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 py-20 pb-32">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
        <AppFooter />
        <BottomNav />
      </div>
    );
  }

  const IconComponent = (Icons as any)[box.icon] || Icons.Inbox;
  const bgColor = box.color || '#3b82f6';
  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherUser = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-4 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="grid grid-cols-12 h-full">
          
            {/* Left Sidebar - Conversations List */}
            <div className="col-span-12 md:col-span-4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => router.push('/hub')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: bgColor }}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {box.title}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {conversations.length} conversations
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPeople(true)}
                    className="p-2 bg-lime-400 hover:bg-lime-300 text-black rounded-lg transition-colors"
                    title="Add people"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                {/* Search Conversations */}
                {conversations.length > 0 && (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
                    />
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 mb-2 rounded"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No conversations yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Add people to this inbox to organize your chats
                    </p>
                    <button
                      onClick={() => setShowAddPeople(true)}
                      className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black rounded-lg font-bold"
                    >
                      Add People
                    </button>
                  </div>
                ) : (
                  conversations
                    .filter(conv => {
                      if (!searchFilter) return true;
                      const other = getOtherParticipant(conv);
                      const name = (other?.profile?.name || '').toLowerCase();
                      const username = (other?.profile?.username || '').toLowerCase();
                      const search = searchFilter.toLowerCase();
                      return name.includes(search) || username.includes(search);
                    })
                    .map(conv => {
                      const other = getOtherParticipant(conv);
                      const isSelected = selectedConversation === conv.id;
                      const isGroup = (conv as any).is_group_chat;
                      const groupName = (conv as any).group_name;
                      const groupImage = (conv as any).group_image_url;
                      const memberCount = conv.participants?.length || 0;
                    
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`w-full p-3 flex gap-3 transition-all border-l-2 ${
                            isSelected
                              ? 'bg-gray-100 dark:bg-gray-700 border-gray-900 dark:border-gray-100'
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative w-11 h-11 rounded-full flex-shrink-0">
                            {isGroup ? (
                              /* Group Chat Avatar */
                              <div className={`w-full h-full rounded-full overflow-hidden ${
                                groupImage ? 'bg-transparent' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                              }`}>
                                {groupImage ? (
                                  <img
                                    src={groupImage}
                                    alt={groupName || 'Group'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Direct Message Avatar */
                              <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                {other?.profile?.avatar_url ? (
                                  <img
                                    src={other.profile.avatar_url}
                                    alt={other.profile.name || other.profile.username || 'User'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-sm">
                                    {(other?.profile?.name || other?.profile?.username || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Group Badge */}
                            {isGroup && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                  {isGroup ? groupName || 'Group Chat' : (other?.profile?.name || other?.profile?.username || 'User')}
                                </h3>
                              </div>
                              {conv.last_message && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                                  {new Date(conv.last_message.created_at).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isGroup && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {memberCount} members •
                                  </span>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {conv.last_message?.preview || 'Start a conversation'}
                                </p>
                              </div>
                              {(conv.unread_count ?? 0) > 0 && (
                                <span className="ml-2 min-w-[20px] h-5 px-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right Side - Messages */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
              {selectedConversation && otherUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      
                      <Link
                        href={`/profile/${otherUser.user_id}`}
                        className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 -ml-2 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          {otherUser.profile?.avatar_url ? (
                            <img
                              src={otherUser.profile.avatar_url}
                              alt={otherUser.profile.name || otherUser.profile.username || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm">
                              {(otherUser.profile?.name || otherUser.profile?.username || 'U')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {otherUser.profile?.name || otherUser.profile?.username || 'User'}
                          </h2>
                          {otherUser.profile?.username && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{otherUser.profile.username}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Encrypted</span>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.id;
                      const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {showAvatar && !isOwn ? (
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                              {message.sender?.avatar_url ? (
                                <img
                                  src={message.sender.avatar_url}
                                  alt={message.sender.name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-xs">
                                  {(message.sender?.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          ) : !isOwn ? (
                            <div className="w-7"></div>
                          ) : null}

                          <div
                            className={`max-w-[70%] ${
                              isOwn
                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } rounded-2xl px-4 py-2.5`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.decrypted_content || message.preview || '[Encrypted]'}
                            </p>

                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${
                                isOwn ? 'text-white/70 dark:text-gray-900/70' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                              {isOwn && (
                                <span className={`text-xs ${isOwn ? 'text-white/60 dark:text-gray-900/60' : ''}`}>
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Message..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent text-sm"
                      />

                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
                      >
                        {sending ? (
                          <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send size={16} />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Encrypted
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: bgColor }}
                    >
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {box.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Select a conversation or add people to this inbox
                    </p>
                    <button
                      onClick={() => setShowAddPeople(true)}
                      className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black rounded-lg font-bold"
                    >
                      Add People
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add People Modal */}
      {showAddPeople && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add to {box.title}</h2>
              <button
                onClick={() => {
                  setShowAddPeople(false);
                  setUserSearch('');
                  setSearchResults([]);
                  setChatType('direct');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setChatType('direct')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  chatType === 'direct'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Direct Message
              </button>
              <button
                onClick={() => setChatType('group')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  chatType === 'group'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Group Chat
              </button>
            </div>

            {/* Search */}
            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder={chatType === 'group' ? 'Search to add members...' : 'Search by username...'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Content */}
            {chatType === 'direct' ? (
              /* Direct Message - User List */
              <div className="flex-1 overflow-y-auto">
                {userSearch.length < 2 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm mb-2">Search for people by username</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Type at least 2 characters</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddPersonToInbox(user.id)}
                      disabled={addingPerson}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || user.username}
                            className="w-full h-full object-cover"
                          />
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
                      {addingPerson && (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      No users found matching "{userSearch}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Group Chat - Inline Create UI */
              <>
                {/* Group Name & Image */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    {/* Group Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                        {groupImage ? (
                          <img src={groupImage} alt="Group" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => document.getElementById('group-img-upload')?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                      >
                        <Camera size={14} />
                      </button>
                      <input
                        id="group-img-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleGroupImageSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Group Name Input */}
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {selectedMembers.size > 0 && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Member List */}
                <div className="flex-1 overflow-y-auto">
                  {userSearch.length < 2 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Search for people to add to the group</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => toggleGroupMember(user.id)}
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
                      <p className="text-sm">No users found matching "{userSearch}"</p>
                    </div>
                  )}
                </div>

                {/* Create Button */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <button
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim() || selectedMembers.size === 0 || creatingGroup}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingGroup ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Group Chat'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AppFooter />
      <BottomNav />
    </div>
  );
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { MessagingService, Conversation, Message } from '@/services/messagingService'
import { supabase } from '@/lib/supabase'
import { Search, Send, ArrowLeft, User, X, Plus, Image as ImageIcon, Paperclip, Mail, Mic, Video, Phone, PhoneOff, MicOff, VideoOff as VideoOffIcon } from 'lucide-react'
import Link from 'next/link'
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder'
import { uploadImage, uploadVideo, uploadVoiceNote, compressImage } from '@/lib/mediaUpload'
import { GroupChatService } from '@/services/groupChatService'
import { Camera, Check } from 'lucide-react'

export default function InboxPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [systemReady, setSystemReady] = useState(true)
  
  // New conversation
  const [showNewChat, setShowNewChat] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  
  // Group chat creation
  const [groupName, setGroupName] = useState('')
  const [groupImage, setGroupImage] = useState<string>('')
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [creatingGroup, setCreatingGroup] = useState(false)
  
  // Additional features
  const [searchFilter, setSearchFilter] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Media features
  const [showMediaOptions, setShowMediaOptions] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  
  // Video call
  const [inCall, setInCall] = useState(false)
  const [callType, setCallType] = useState<'video' | 'audio' | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadConversations()
  }, [user, router])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      MessagingService.markAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    setLoading(true)
    
    // Check if messaging system is ready
    try {
      const statusResponse = await fetch('/api/test-messaging')
      const statusData = await statusResponse.json()
      
      if (statusData.status !== 'ready') {
        console.warn('⚠️ Messaging system not ready')
        setSystemReady(false)
        setLoading(false)
        return
      }
      
      setSystemReady(true)
    } catch (e) {
      console.warn('⚠️ Could not check messaging status')
    }
    
    const convs = await MessagingService.getUserConversations()
    setConversations(convs)
    setLoading(false)
    
    console.log('📬 Loaded conversations:', convs.length)
  }

  const loadMessages = async (conversationId: string) => {
    const msgs = await MessagingService.getMessages(conversationId)
    setMessages(msgs)
    console.log('💬 Loaded messages:', msgs.length)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const messageToSend = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // Optimistic update - add message immediately
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
    }
    
    // Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setIsTyping(false)
    setSending(true)
    
    // Send to server
    const result = await MessagingService.sendMessage(
      selectedConversation,
      messageToSend
    )

    if (result.success && result.message) {
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? result.message! : msg)
      )
      
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation
            ? { ...conv, last_message: result.message, last_message_at: result.message!.created_at }
            : conv
        ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      )
      
      console.log('✅ Message sent successfully')
    } else {
      // Remove temp message if failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(messageToSend)
      alert('Failed to send message. Please try again.')
    }
    
    setSending(false)
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation) return

    setUploadingMedia(true)
    
    try {
      // Compress image
      const compressed = await compressImage(file)
      
      // Upload to Supabase Storage
      const result = await uploadImage(compressed, user!.id)
      
      if (result.success && result.url) {
        // Send as image message
        await MessagingService.sendMessage(
          selectedConversation,
          'Sent an image',
          'image',
          result.url
        )
        
        // Reload messages
        loadMessages(selectedConversation)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingMedia(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleVoiceNote = async (blob: Blob) => {
    if (!selectedConversation) return

    setShowVoiceRecorder(false)
    setUploadingMedia(true)

    try {
      const result = await uploadVoiceNote(blob, user!.id)
      
      if (result.success && result.url) {
        await MessagingService.sendMessage(
          selectedConversation,
          'Sent a voice note',
          'voice',
          result.url
        )
        
        loadMessages(selectedConversation)
      }
    } catch (error) {
      console.error('Error uploading voice note:', error)
      alert('Failed to send voice note')
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleVideoCall = async () => {
    if (!selectedConversation) return
    
    const hasPermissions = await checkMediaPermissions()
    
    if (!hasPermissions.camera || !hasPermissions.microphone) {
      alert('Please grant camera and microphone permissions to make video calls')
      return
    }
    
    setInCall(true)
    setCallType('video')
    
    // Initialize video call
    // Implementation in next update
    alert('📹 Video call feature coming in next update!\n\nInfrastructure is ready in lib/videoChat.ts')
  }

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach(track => track.stop())
      return { camera: true, microphone: true }
    } catch {
      return { camera: false, microphone: false }
    }
  }

  const handleStartConversation = async (otherUserId: string) => {
    const result = await MessagingService.getOrCreateConversation(otherUserId)
    
    if (result.success && result.conversationId) {
      setSelectedConversation(result.conversationId)
      setShowNewChat(false)
      setUserSearch('')
      setSearchResults([])
      
      // Reload conversations to show new one
      loadConversations()
    }
  }

  const handleUserSearch = async (query: string) => {
    setUserSearch(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    // Only search users you're following
    try {
      const { data: following, error: followError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user?.id)

      console.log('👥 Following IDs:', following?.length, 'Error:', followError)

      if (followError) {
        console.error('Error fetching following:', followError)
        // Fallback to all users if error
        const results = await MessagingService.searchUsers(query)
        setSearchResults(results.filter(u => u.id !== user?.id))
        return
      }

      if (!following || following.length === 0) {
        setSearchResults([])
        return
      }

      // Get profiles for following users
      const followingIds = following.map(f => f.following_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', followingIds)

      console.log('👤 Loaded following profiles:', profiles?.length)

      // Filter by search query
      const filtered = (profiles || []).filter(u => 
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.username?.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults(filtered.filter(u => u.id !== user?.id))
      console.log('🔍 Search results:', filtered.length)
    } catch (error) {
      console.error('Error searching following:', error)
      // Fallback to all users if followers table doesn't exist
      const results = await MessagingService.searchUsers(query)
      setSearchResults(results.filter(u => u.id !== user?.id))
    }
  }

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants?.find(p => p.user_id !== user?.id)
  }

  const toggleGroupMember = (userId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedMembers(newSelected)
  }

  const handleGroupImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setGroupImageFile(file)
    const preview = URL.createObjectURL(file)
    setGroupImage(preview)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) {
      alert('Please enter a group name and select at least one member')
      return
    }

    setCreatingGroup(true)
    try {
      let uploadedImageUrl: string | undefined

      if (groupImageFile) {
        const compressed = await compressImage(groupImageFile)
        const result = await uploadImage(compressed, user!.id)
        if (result.success && result.url) {
          uploadedImageUrl = result.url
        }
      }

      const result = await GroupChatService.createGroupChat(
        groupName,
        Array.from(selectedMembers),
        uploadedImageUrl
      )

      if (result.success && result.conversationId) {
        setShowNewChat(false)
        setSelectedConversation(result.conversationId)
        setChatType('direct')
        setGroupName('')
        setGroupImage('')
        setGroupImageFile(null)
        setSelectedMembers(new Set())
        loadConversations()
      } else {
        alert(result.error || 'Failed to create group chat')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group chat')
    } finally {
      setCreatingGroup(false)
    }
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)
  const otherUser = selectedConv ? getOtherParticipant(selectedConv) : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-4 pb-20">
        {!systemReady ? (
          /* System Not Ready Notice */
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={40} className="text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Messaging Not Set Up Yet
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The messaging system needs to be configured before you can send messages.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">To enable messaging:</h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Open Supabase Dashboard</li>
                  <li>2. Go to SQL Editor</li>
                  <li>3. Copy contents of: <code className="px-1 bg-blue-100 dark:bg-blue-900/40 rounded">add_messaging_system.sql</code></li>
                  <li>4. Paste and click "Run"</li>
                  <li>5. Refresh this page</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/hub')}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Back to Hub
                </button>
                <a
                  href="/messaging-status"
                  className="flex-1 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-center font-medium"
                >
                  Check Status
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 'calc(100vh - 180px)' }}>
            <div className="grid grid-cols-12 h-full">
            
            {/* Left Sidebar - Conversations List */}
            <div className="col-span-12 md:col-span-4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Mail size={18} className="text-gray-700 dark:text-gray-300" />
                      Messages
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {conversations.filter(c => 
                        !searchFilter || 
                        getOtherParticipant(c)?.profile?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        getOtherParticipant(c)?.profile?.username?.toLowerCase().includes(searchFilter.toLowerCase())
                      ).length} conversations
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="New Message"
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
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No messages yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Start a conversation by clicking the + button</p>
                  </div>
                ) : (
                  conversations
                    .filter(conv => {
                      if (!searchFilter) return true
                      const other = getOtherParticipant(conv)
                      const name = (other?.profile?.name || '').toLowerCase()
                      const username = (other?.profile?.username || '').toLowerCase()
                      const search = searchFilter.toLowerCase()
                      return name.includes(search) || username.includes(search)
                    })
                    .map(conv => {
                      const other = getOtherParticipant(conv)
                      const isSelected = selectedConversation === conv.id
                      const isGroup = (conv as any).is_group_chat
                      const groupName = (conv as any).group_name
                      const groupImage = (conv as any).group_image_url
                      const memberCount = conv.participants?.length || 0
                    
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

                        {/* Info */}
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
                    )
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleVideoCall}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Video Call"
                      >
                        <Video size={18} />
                      </button>
                      <button
                        onClick={() => alert('Audio call coming soon!')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Audio Call"
                      >
                        <Phone size={18} />
                      </button>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Encrypted</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.id
                      const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
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

                          {/* Message Bubble */}
                          <div
                            className={`max-w-[70%] ${
                              isOwn
                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } rounded-2xl px-4 py-2.5`}
                          >
                            {/* Image Message */}
                            {message.content_type === 'image' && message.media_url && (
                              <div className="mb-2">
                                <img
                                  src={message.media_url}
                                  alt="Shared image"
                                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.media_url, '_blank')}
                                  style={{ maxHeight: '300px' }}
                                />
                              </div>
                            )}

                            {/* Video Message */}
                            {message.content_type === 'video' && message.media_url && (
                              <div className="mb-2">
                                <video
                                  src={message.media_url}
                                  controls
                                  className="rounded-lg max-w-full h-auto"
                                  style={{ maxHeight: '300px' }}
                                />
                              </div>
                            )}

                            {/* Voice Note */}
                            {message.content_type === 'voice' && message.media_url && (
                              <div className="mb-2 flex items-center gap-2">
                                <div className="p-2 bg-white/10 rounded-full">
                                  <Mic size={16} />
                                </div>
                                <audio
                                  src={message.media_url}
                                  controls
                                  className="flex-1"
                                  style={{ height: '32px' }}
                                />
                              </div>
                            )}

                            {/* Text Content */}
                            {(message.content_type === 'text' || !message.content_type) && (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.decrypted_content || message.preview || '[Encrypted]'}
                              </p>
                            )}

                            {/* Timestamp and Read Receipt */}
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
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Voice Recorder */}
                  {showVoiceRecorder && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                      <VoiceNoteRecorder
                        onRecordComplete={handleVoiceNote}
                        onCancel={() => setShowVoiceRecorder(false)}
                      />
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {/* Media Uploading Indicator */}
                    {uploadingMedia && (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-blue-700 dark:text-blue-300">Uploading media...</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {/* Media Buttons */}
                      <div className="flex gap-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingMedia}
                          className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                          title="Send image or video"
                        >
                          <ImageIcon size={18} />
                        </button>
                        <button
                          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                          disabled={uploadingMedia}
                          className={`p-2.5 ${showVoiceRecorder ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50`}
                          title="Voice note"
                        >
                          <Mic size={18} />
                        </button>
                      </div>

                      {/* Text Input */}
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value)
                          setIsTyping(e.target.value.length > 0)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="Message..."
                        disabled={uploadingMedia}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent text-sm disabled:opacity-50"
                      />

                      {/* Send Button */}
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending || uploadingMedia}
                        className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
                        title={newMessage.trim() ? 'Send message' : 'Type a message first'}
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
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        📷 Image • 🎤 Voice • Enter to send
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Encrypted
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Select a conversation
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Choose a conversation from the left or start a new one
                    </p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all font-medium"
                    >
                      Start New Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </main>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">New Message</h2>
              <button
                onClick={() => {
                  setShowNewChat(false)
                  setUserSearch('')
                  setSearchResults([])
                  setChatType('direct')
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
                  placeholder={chatType === 'group' ? 'Search to add members...' : 'Search people you follow...'}
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
                    <p className="text-sm mb-2">Search for people you follow</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Type at least 2 characters</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user.id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-lime-400 to-lime-300 overflow-hidden">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black font-bold">
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
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      No followers found matching "{userSearch}"
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      You can only message people you follow
                    </p>
                    <button
                      onClick={() => {
                        setShowNewChat(false)
                        router.push('/')
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      Find People to Follow
                    </button>
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
                        onClick={() => document.getElementById('group-image-upload')?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                      >
                        <Camera size={14} />
                      </button>
                      <input
                        id="group-image-upload"
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

      <BottomNav />
    </div>
  )
}


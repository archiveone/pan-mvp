// hooks/useWebSocketChat.ts

import { useState, useEffect, useCallback } from 'react';
import { MOCK_MESSAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import type { Message } from '../types';
import { connect } from '../services/mockWebSocket';
import { encryptMessage, decryptMessage } from '../pages/ChatPage';

interface EncryptedMessage extends Message {
  isEncrypted: boolean;
}

/**
 * Custom hook to manage a real-time, encrypted chat session for a specific group.
 *
 * @param groupId The ID of the chat group.
 * @param encryptionKey The AES-GCM key for encrypting and decrypting messages.
 * @returns An object containing the array of messages and a function to send a new message.
 */
export function useWebSocketChat(groupId: string, encryptionKey: CryptoKey | null) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);

  // Load initial (historical) messages once
  useEffect(() => {
    const initialMessages = MOCK_MESSAGES.filter(m => m.groupId === groupId);
    // In a real app, you might fetch historical messages from an API here.
    // We mark mock messages as not encrypted for demonstration.
    setMessages(initialMessages.map(m => ({ ...m, isEncrypted: false })));
  }, [groupId]);

  // Manage WebSocket connection
  useEffect(() => {
    if (!groupId) return;

    // The function that handles incoming broadcasted messages
    const handleIncomingMessage = (message: EncryptedMessage) => {
      console.log('[WebSocket Hook] Received broadcasted message.');
      setMessages(prevMessages => [...prevMessages, message]);
    };
    
    // Establish connection
    const socket = connect(groupId, handleIncomingMessage);

    // Cleanup on component unmount or when groupId changes
    return () => {
      socket.close();
    };
  }, [groupId]);

  /**
   * Encrypts and sends a message, and adds it optimistically to the local state.
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentUser || !encryptionKey) return;

    const encryptedText = await encryptMessage(text, encryptionKey);

    const message: EncryptedMessage = {
      id: `m${Date.now()}`,
      groupId,
      text: encryptedText,
      user: currentUser,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
    };

    // 1. Optimistically update our own UI
    setMessages(prevMessages => [...prevMessages, message]);
    
    // 2. Send the message to the "server" to be broadcasted to others
    const socket = connect(groupId, () => {}); // A temporary connection to send
    socket.send(message);
    socket.close(); // Close after sending, as the main connection is for listening

  }, [currentUser, encryptionKey, groupId]);

  return { messages, sendMessage };
}
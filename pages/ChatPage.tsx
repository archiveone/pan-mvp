import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Message } from '../types';
import { useWebSocketChat } from '../hooks/useWebSocketChat';

// --- START OF CRYPTO HELPERS ---

// Helper to convert ArrayBuffer to Base64
function ab_to_b64(ab: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ab))));
}

// Helper to convert Base64 to ArrayBuffer
function b64_to_ab(b64: string): ArrayBuffer {
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function saveKey(key: CryptoKey, keyName: string): Promise<void> {
  try {
    const jwk = await window.crypto.subtle.exportKey("jwk", key);
    localStorage.setItem(keyName, JSON.stringify(jwk));
  } catch (error) { console.error("Error saving key:", error); }
}

async function loadKey(keyName: string): Promise<CryptoKey | null> {
  try {
    const jwkString = localStorage.getItem(keyName);
    if (!jwkString) return null;
    const jwk = JSON.parse(jwkString);
    return await window.crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  } catch (error) {
    console.error("Error loading key:", error);
    return null;
  }
}

async function getOrCreateGroupKey(groupId: string): Promise<CryptoKey> {
  const keyName = `chat_key_${groupId}`;
  let key = await loadKey(keyName);
  if (!key) {
    key = await generateKey();
    await saveKey(key, keyName);
  }
  return key;
}

export async function encryptMessage(text: string, key: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encodedText);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return ab_to_b64(combined.buffer);
}

export async function decryptMessage(encryptedDataB64: string, key: CryptoKey): Promise<string> {
  try {
    const encryptedData = b64_to_ab(encryptedDataB64);
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "Failed to decrypt message.";
  }
}
// --- END OF CRYPTO HELPERS ---

interface EncryptedMessage extends Message {
  isEncrypted: boolean;
}

const MessageBubble: React.FC<{ message: EncryptedMessage, decryptionKey: CryptoKey | null, isOwn: boolean }> = ({ message, decryptionKey, isOwn }) => {
    const [decryptedText, setDecryptedText] = useState('...');
    const [decryptionError, setDecryptionError] = useState(false);

    useEffect(() => {
        const decrypt = async () => {
            if (message.isEncrypted && decryptionKey && message.text) {
                try {
                    const text = await decryptMessage(message.text, decryptionKey);
                    setDecryptedText(text);
                    setDecryptionError(false);
                } catch (e) {
                    setDecryptedText('Could not decrypt message.');
                    setDecryptionError(true);
                }
            } else {
                setDecryptedText(message.text);
                setDecryptionError(false);
            }
        };
        decrypt();
    }, [message, decryptionKey]);

    const bubbleClasses = isOwn
      ? 'bg-pan-gray-dark text-pan-white rounded-br-none'
      : 'bg-pan-gray-dark/50 text-pan-white rounded-bl-none';
      
    const errorClasses = decryptionError ? 'bg-red-500/50' : '';

    return (
        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && <img src={message.user.avatarUrl} className="w-8 h-8 rounded-full self-start" alt={message.user.name} />}
            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${bubbleClasses} ${errorClasses}`}>
                <p className="text-sm break-words">{decryptedText}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-pan-gray' : 'text-pan-gray-light'}`}>{message.timestamp}</p>
            </div>
        </div>
    );
}

const CommunityChat: React.FC<{ groupId: string }> = ({ groupId }) => {
    const { currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Use the custom hook to manage WebSocket chat
    const { messages, sendMessage } = useWebSocketChat(groupId, encryptionKey);

    useEffect(() => {
        getOrCreateGroupKey(groupId).then(setEncryptionKey);
    }, [groupId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !encryptionKey) return;
        
        // The hook handles encryption and broadcasting
        sendMessage(newMessage);
        setNewMessage('');
    };

    if (!currentUser) return null;

    return (
        <div className="flex flex-col h-[calc(100vh_-_28rem)] bg-pan-black">
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center text-xs text-pan-gray p-2 my-2 border border-pan-gray-dark rounded-lg">
                    <p className="font-bold">End-to-End Encrypted</p>
                    <p>Messages in this group are secured. Only members can read them.</p>
                </div>
                {messages.map(msg => (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg}
                        decryptionKey={encryptionKey}
                        isOwn={msg.user.id === currentUser.id}
                    />
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-3 border-t border-pan-gray-dark bg-pan-black sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button type="button" className="p-2 text-pan-gray-light hover:text-pan-white">
                        <Paperclip size={24}/>
                    </button>
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Send an encrypted message..." 
                        className="flex-1 bg-pan-gray-dark border border-pan-gray rounded-full px-4 py-2 focus:ring-1 focus:ring-pan-white focus:outline-none placeholder-pan-gray"
                        disabled={!encryptionKey}
                    />
                    <button type="submit" className="p-2 bg-pan-white text-pan-black rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50" disabled={!encryptionKey || !newMessage.trim()}>
                        <Send size={24}/>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default CommunityChat;
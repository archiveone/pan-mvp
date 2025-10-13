/**
 * End-to-End Encryption Utilities
 * Uses Web Crypto API for secure encryption
 */

// Generate encryption key pair for user
export async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    )

    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    return {
      publicKey: arrayBufferToBase64(publicKey),
      privateKey: arrayBufferToBase64(privateKey),
    }
  } catch (error) {
    console.error('Error generating key pair:', error)
    throw error
  }
}

// Encrypt message with recipient's public key
export async function encryptMessage(message: string, recipientPublicKey: string): Promise<string> {
  try {
    // Import recipient's public key
    const publicKeyBuffer = base64ToArrayBuffer(recipientPublicKey)
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    )

    // Encrypt the message
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      data
    )

    return arrayBufferToBase64(encrypted)
  } catch (error) {
    console.error('Error encrypting message:', error)
    throw error
  }
}

// Decrypt message with user's private key
export async function decryptMessage(encryptedMessage: string, userPrivateKey: string): Promise<string> {
  try {
    // Import user's private key
    const privateKeyBuffer = base64ToArrayBuffer(userPrivateKey)
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    )

    // Decrypt the message
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage)
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Error decrypting message:', error)
    return '[Unable to decrypt message]'
  }
}

// Simple encryption for group messages (AES-GCM)
export async function encryptGroupMessage(message: string): Promise<{ encrypted: string; key: string; iv: string }> {
  try {
    // Generate a random encryption key
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    // Encrypt the message
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    )

    // Export key
    const exportedKey = await window.crypto.subtle.exportKey('raw', key)

    return {
      encrypted: arrayBufferToBase64(encrypted),
      key: arrayBufferToBase64(exportedKey),
      iv: arrayBufferToBase64(iv),
    }
  } catch (error) {
    console.error('Error encrypting group message:', error)
    throw error
  }
}

// Decrypt group message (AES-GCM)
export async function decryptGroupMessage(
  encryptedMessage: string,
  keyBase64: string,
  ivBase64: string
): Promise<string> {
  try {
    // Import key
    const keyBuffer = base64ToArrayBuffer(keyBase64)
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['decrypt']
    )

    // Import IV
    const iv = base64ToArrayBuffer(ivBase64)

    // Decrypt
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage)
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Error decrypting group message:', error)
    return '[Unable to decrypt message]'
  }
}

// Utility: ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Utility: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Store user's private key securely in localStorage (in production, use better storage)
export function storePrivateKey(userId: string, privateKey: string) {
  localStorage.setItem(`privateKey_${userId}`, privateKey)
}

export function getPrivateKey(userId: string): string | null {
  return localStorage.getItem(`privateKey_${userId}`)
}

// Simple fallback encryption for browsers that don't support crypto API
export function simpleEncrypt(message: string): string {
  // This is NOT secure - just a fallback for development
  return btoa(encodeURIComponent(message))
}

export function simpleDecrypt(encrypted: string): string {
  try {
    return decodeURIComponent(atob(encrypted))
  } catch {
    return '[Unable to decrypt]'
  }
}


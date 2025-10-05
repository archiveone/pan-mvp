import CryptoJS from 'crypto-js';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
}

export interface DecryptionResult {
  decrypted: string;
  success: boolean;
  error?: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-256-GCM';
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 128;

  /**
   * Generate a new encryption key pair
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = CryptoJS.lib.WordArray.random(32);
    const publicKey = keyPair.toString(CryptoJS.enc.Hex);
    const privateKey = keyPair.toString(CryptoJS.enc.Hex);
    
    return { publicKey, privateKey };
  }

  /**
   * Encrypt a message with a shared key
   */
  static encryptMessage(message: string, sharedKey: string): EncryptionResult {
    try {
      const iv = CryptoJS.lib.WordArray.random(16);
      const key = CryptoJS.enc.Hex.parse(sharedKey);
      
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        encrypted: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Hex)
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a message with a shared key
   */
  static decryptMessage(encryptedData: EncryptionResult, sharedKey: string): DecryptionResult {
    try {
      const key = CryptoJS.enc.Hex.parse(sharedKey);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        return { decrypted: '', success: false, error: 'Decryption failed' };
      }

      return { decrypted: decryptedString, success: true };
    } catch (error) {
      return { decrypted: '', success: false, error: error.message };
    }
  }

  /**
   * Generate a shared key for a conversation
   */
  static generateSharedKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  }

  /**
   * Encrypt a shared key with a user's public key
   */
  static encryptSharedKey(sharedKey: string, publicKey: string): string {
    const key = CryptoJS.enc.Hex.parse(publicKey);
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(sharedKey, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return JSON.stringify({
      encrypted: encrypted.toString(),
      iv: iv.toString(CryptoJS.enc.Hex)
    });
  }

  /**
   * Decrypt a shared key with a user's private key
   */
  static decryptSharedKey(encryptedSharedKey: string, privateKey: string): string {
    const key = CryptoJS.enc.Hex.parse(privateKey);
    const { encrypted, iv } = JSON.parse(encryptedSharedKey);
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate a hash for message integrity
   */
  static generateMessageHash(message: string): string {
    return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify message integrity
   */
  static verifyMessageHash(message: string, hash: string): boolean {
    const computedHash = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
    return computedHash === hash;
  }

  /**
   * Encrypt file data
   */
  static encryptFile(fileData: ArrayBuffer, sharedKey: string): EncryptionResult {
    const fileString = CryptoJS.lib.WordArray.create(fileData);
    const key = CryptoJS.enc.Hex.parse(sharedKey);
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(fileString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(CryptoJS.enc.Hex)
    };
  }

  /**
   * Decrypt file data
   */
  static decryptFile(encryptedData: EncryptionResult, sharedKey: string): ArrayBuffer {
    const key = CryptoJS.enc.Hex.parse(sharedKey);
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Latin1);
  }

  /**
   * Generate a secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
  }

  /**
   * Encrypt search terms for encrypted search
   */
  static encryptSearchTerms(terms: string[], sharedKey: string): string[] {
    return terms.map(term => {
      const encrypted = this.encryptMessage(term, sharedKey);
      return encrypted.encrypted;
    });
  }

  /**
   * Decrypt search terms
   */
  static decryptSearchTerms(encryptedTerms: string[], sharedKey: string): string[] {
    return encryptedTerms.map(encrypted => {
      const result = this.decryptMessage({ encrypted, iv: '' }, sharedKey);
      return result.success ? result.decrypted : '';
    }).filter(term => term.length > 0);
  }
}

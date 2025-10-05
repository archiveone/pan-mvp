import type { Post } from '../types';

const MODERATION_KEY = 'pan_banned_words';

const DEFAULT_BANNED_WORDS = ['darn', 'heck', 'gosh', 'inappropriate', 'explicit'];

// --- Banned Words Management ---

/**
 * Retrieves the current set of banned words from localStorage.
 * Falls back to a default list if none is found.
 * @returns A Set of banned words.
 */
export function getBannedWords(): Set<string> {
    try {
        const storedWords = localStorage.getItem(MODERATION_KEY);
        if (storedWords) {
            return new Set(JSON.parse(storedWords));
        }
    } catch (error) {
        console.error("Failed to parse banned words from localStorage:", error);
    }
    // Return default set if nothing is stored or if parsing fails
    const defaultSet = new Set(DEFAULT_BANNED_WORDS);
    saveBannedWords(defaultSet);
    return defaultSet;
}

/**
 * Saves a new set of banned words to localStorage.
 * @param words - The Set of words to save.
 */
function saveBannedWords(words: Set<string>): void {
    try {
        localStorage.setItem(MODERATION_KEY, JSON.stringify(Array.from(words)));
    } catch (error) {
        console.error("Failed to save banned words to localStorage:", error);
    }
}

/**
 * Adds a new word to the banned words list.
 * The word is converted to lowercase and trimmed.
 * @param word - The word to add.
 */
export function addBannedWord(word: string): void {
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return;

    const currentWords = getBannedWords();
    currentWords.add(cleanWord);
    saveBannedWords(currentWords);
}

/**
 * Removes a word from the banned words list.
 * @param word - The word to remove.
 */
export function removeBannedWord(word: string): void {
    const currentWords = getBannedWords();
    currentWords.delete(word.toLowerCase());
    saveBannedWords(currentWords);
}


// --- Content Checking ---

/**
 * Checks a post's title and content for inappropriate language.
 * @param post - The post object to check.
 * @returns `true` if flagged, `false` otherwise.
 */
export function checkPostForInappropriateContent(post: Pick<Post, 'title' | 'content'>): boolean {
    const bannedWords = getBannedWords();
    if (bannedWords.size === 0) return false;

    const textToCheck = `${post.title || ''} ${post.content}`.toLowerCase();
    
    // Split the text into words to check against the banned list.
    const words = textToCheck.split(/\s+/);

    for (const word of words) {
        // Remove punctuation for better matching
        const cleanWord = word.replace(/[.,!?;:"]/g, '');
        if (bannedWords.has(cleanWord)) {
            console.warn(`Moderation: Flagged post for word "${cleanWord}"`);
            return true;
        }
    }

    return false;
}
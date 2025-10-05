import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import Button from '../components/Button';
import { getBannedWords, addBannedWord, removeBannedWord } from '../services/moderationService';

const AdminModerationPage: React.FC = () => {
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    // Load the initial list of words on component mount
    setBannedWords(Array.from(getBannedWords()));
  }, []);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim() === '' || bannedWords.includes(newWord.trim().toLowerCase())) {
        setNewWord('');
        return;
    }
    addBannedWord(newWord);
    // Refresh the list from the service to ensure consistency
    setBannedWords(Array.from(getBannedWords()));
    setNewWord('');
  };

  const handleRemoveWord = (wordToRemove: string) => {
    removeBannedWord(wordToRemove);
    // Refresh the list
    setBannedWords(Array.from(getBannedWords()));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-8">
        <Link to="/profile" className="p-2 rounded-full hover:bg-pan-gray-dark mr-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
      </div>

      <div className="bg-pan-gray-dark p-6 rounded-xl">
        <h2 className="text-xl font-bold text-pan-white mb-4">Manage Banned Words</h2>
        <p className="text-pan-gray mb-6 text-sm">
            Add or remove words that will cause a post to be automatically flagged. Words are not case-sensitive.
        </p>

        <form onSubmit={handleAddWord} className="flex gap-4 mb-6">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Enter a new word to ban"
            className="flex-1 px-4 py-3 bg-black/30 border border-pan-gray rounded-xl focus:outline-none focus:ring-1 focus:ring-pan-white placeholder-pan-gray"
          />
          <Button type="submit" className="!w-auto !py-3 px-5 flex items-center gap-2">
              <Plus size={18}/> Add
          </Button>
        </form>

        <div>
          {bannedWords.length > 0 ? (
            <ul className="space-y-2">
              {bannedWords.sort().map((word) => (
                <li
                  key={word}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                >
                  <span className="font-mono text-pan-gray-light">{word}</span>
                  <button
                    onClick={() => handleRemoveWord(word)}
                    className="text-pan-gray hover:text-pan-red transition-colors p-1"
                    aria-label={`Remove ${word}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-pan-gray">
              <p>No banned words have been added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminModerationPage;
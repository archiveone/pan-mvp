import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  buttonText?: string;
  autoFocus?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, placeholder = "Add a comment...", buttonText = "Post", autoFocus = false }) => {
  const [content, setContent] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  if (!currentUser) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 mt-4">
      <img src={currentUser.avatarUrl} alt="Your avatar" className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-pan-gray-dark border border-pan-gray rounded-xl px-4 py-2 focus:ring-1 focus:ring-pan-white focus:outline-none placeholder-pan-gray transition-all min-h-[44px]"
          rows={1}
          autoFocus={autoFocus}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
        <div className="flex justify-end mt-2">
            <Button type="submit" disabled={!content.trim()} className="!w-auto !py-1.5 !px-4">
                {buttonText}
            </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;

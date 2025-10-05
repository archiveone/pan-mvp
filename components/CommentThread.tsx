import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { Heart } from 'lucide-react';
import CommentForm from './CommentForm';

interface CommentThreadProps {
  comment: Post;
  allComments: Post[];
  onAddReply: (content: string, parentId: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment, allComments, onAddReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleReplySubmit = (content: string) => {
    onAddReply(content, comment.id);
    setIsReplying(false);
  };
  
  // Find replies to the current comment from the complete list of all posts
  const replies = allComments.filter(c => c.parentId === comment.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="flex items-start gap-3">
      <Link to={`/profile/${comment.user.id}`} className="flex-shrink-0">
        <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-10 h-10 rounded-full" />
      </Link>
      <div className="flex-1">
        <div className="bg-pan-gray-dark p-3 rounded-xl">
          <Link to={`/profile/${comment.user.id}`} className="hover:underline">
            <p className="font-bold text-sm text-pan-white">{comment.user.name}</p>
          </Link>
          <p className="text-pan-gray-light whitespace-pre-wrap mt-1">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-pan-gray mt-1 px-2">
          <span>{new Date(comment.timestamp).toLocaleString([], {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
          <button onClick={handleLike} className={`font-semibold flex items-center gap-1 transition-colors ${isLiked ? 'text-pan-red' : 'hover:text-pan-white'}`}>
             <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} /> {likeCount}
          </button>
          <button onClick={() => setIsReplying(!isReplying)} className="font-semibold hover:text-pan-white">
            Reply
          </button>
        </div>

        {isReplying && (
          <CommentForm 
            onSubmit={handleReplySubmit} 
            placeholder={`Replying to ${comment.user.name}...`}
            buttonText="Reply"
            autoFocus
          />
        )}
        
        {replies.length > 0 && (
          <div className="space-y-4 mt-4 pl-4 sm:pl-6 border-l-2 border-pan-gray-dark">
            {replies.map(reply => (
              <CommentThread key={reply.id} comment={reply} allComments={allComments} onAddReply={onAddReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentThread;
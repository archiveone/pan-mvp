import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Heart, MessageSquare, Share2, Bookmark, Edit, Trash2, ShieldAlert, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useSavedPosts } from '../hooks/useSavedListings';
import type { Post } from '../types';
import CommentForm from '../components/CommentForm';
import CommentThread from '../components/CommentThread';
import Button from '../components/Button';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, addPost, deletePost } = usePosts();
  const { currentUser } = useAuth();
  const { isSaved, toggleSave } = useSavedPosts();

  const post = useMemo(() => posts.find(p => p.id === id), [posts, id]);
  const comments = useMemo(() => posts.filter(p => p.parentId === id && p.postType === 'TEXT'), [posts, id]);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const commentSectionRef = useRef<HTMLDivElement>(null);
  
  const postIsSaved = post ? isSaved(post.id) : false;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };
  
  const handleCommentClick = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSaveClick = () => {
      if(post) toggleSave(post.id);
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied');
    } catch {}
  };

  const handleAddComment = (content: string, parentId: string) => {
    if (!currentUser) return;
    const newComment: Post = {
      id: `c${Date.now()}`,
      user: currentUser,
      postType: 'TEXT',
      content,
      likes: 0,
      timestamp: new Date().toISOString(),
      parentId: parentId,
    };
    addPost(newComment);
  };

  const handleDeletePost = () => {
      if (post) {
          if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
              deletePost(post.id);
              navigate('/');
          }
      }
      setShowOptionsMenu(false);
  };

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-pan-white">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <Link to="/" className="text-pan-gray hover:underline">Go back home</Link>
      </div>
    );
  }
  
  const isOwnPost = currentUser?.id === post.user.id;

  if (post.isFlagged && !isOwnPost) {
    return (
        <div className="container mx-auto px-4 py-6 text-center">
            <div className="bg-pan-gray-dark p-8 rounded-xl max-w-md mx-auto">
                <ShieldAlert size={48} className="mx-auto text-yellow-400 mb-4"/>
                <h2 className="text-xl font-bold text-pan-white">Content Warning</h2>
                <p className="text-pan-gray mt-2 mb-6">
                    This post has been flagged for potentially sensitive content and is currently under review.
                </p>
                <Button variant="secondary" onClick={() => navigate(-1)} className="!w-auto !py-2 !px-5">
                    Go Back
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div>
      <div className="sticky top-16 z-30 bg-pan-black/80 backdrop-blur-sm -mt-6">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-pan-gray-dark" aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <div className="relative">
            <button onClick={() => setShowOptionsMenu(prev => !prev)} className="p-2 rounded-full hover:bg-pan-gray-dark" aria-label="More options">
              <MoreHorizontal size={24} />
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-pan-gray-dark rounded-xl shadow-lg z-10 text-sm font-medium">
                {isOwnPost ? (
                    <>
                        <Link to={`/post/${post.id}/edit`} className="flex items-center gap-3 px-4 py-2.5 text-pan-white hover:bg-black/20 rounded-t-xl">
                            <Edit size={16} /> Edit Post
                        </Link>
                        <button onClick={handleDeletePost} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-black/20 rounded-b-xl">
                            <Trash2 size={16} /> Delete Post
                        </button>
                    </>
                ) : (
                    <button className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-yellow-400 hover:bg-black/20 rounded-xl">
                        <ShieldAlert size={16} /> Report Post
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* User Info */}
        <Link to={`/profile/${post.user.id}`} className="flex items-center gap-3 mb-4">
          <img src={post.user.avatarUrl} alt={post.user.name} className="w-12 h-12 rounded-full" />
          <div>
            <p className="font-bold text-pan-white">{post.user.name}</p>
            <p className="text-sm text-pan-gray">{post.timestamp}</p>
          </div>
        </Link>

        {/* Post Content */}
        <div className="space-y-4 mb-6">
          {post.title && <h1 className="text-2xl font-bold">{post.title}</h1>}
          <p className="text-pan-gray-light whitespace-pre-wrap">{post.content}</p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="bg-pan-gray-dark text-pan-gray-light text-xs font-semibold px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {post.videoUrl ? (
          <video src={post.videoUrl} className="w-full rounded-xl bg-pan-gray-dark" controls playsInline />
        ) : post.imageUrl ? (
          <img src={post.imageUrl} alt={post.title || 'Post image'} className="w-full rounded-xl" />
        ) : null}
        
        {post.documentUrl && (
            <a href={post.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-pan-gray-dark p-4 rounded-xl hover:bg-opacity-70 transition-colors my-4">
                <FileText size={32} className="text-pan-gray-light flex-shrink-0"/>
                <div>
                    <p className="font-semibold text-pan-white">{post.documentName || 'Attached Document'}</p>
                    <p className="text-sm text-pan-gray">Click to view</p>
                </div>
            </a>
        )}

        {/* Action Bar */}
        <div className="flex justify-around items-center py-4 border-y border-pan-gray-dark my-4">
          <button onClick={handleLike} className={`flex items-center gap-2 font-medium transition-colors ${isLiked ? 'text-pan-red' : 'text-pan-gray-light hover:text-pan-white'}`} aria-label={isLiked ? "Unlike post" : "Like post"}>
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <button onClick={handleCommentClick} className="flex items-center gap-2 font-medium text-pan-gray-light hover:text-pan-white transition-colors" aria-label="Comment on post">
            <MessageSquare size={24} />
            <span>{comments.length}</span>
          </button>
          <button onClick={handleSaveClick} className={`flex items-center gap-2 font-medium transition-colors ${postIsSaved ? 'text-pan-white' : 'text-pan-gray-light hover:text-pan-white'}`} aria-label={postIsSaved ? "Unsave post" : "Save post"}>
            <Bookmark size={24} fill={postIsSaved ? 'currentColor' : 'none'}/>
          </button>
          <button onClick={handleCopyLink} className="flex items-center gap-2 font-medium text-pan-gray-light hover:text-pan-white transition-colors" aria-label="Copy link">
            <Share2 size={24} />
          </button>
        </div>

        {/* Comments Section */}
        <div ref={commentSectionRef} className="space-y-6">
          <h2 className="text-xl font-bold">Comments ({comments.length})</h2>
          <CommentForm onSubmit={(content) => handleAddComment(content, post.id)} />
          {comments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(comment => (
            <CommentThread key={comment.id} comment={comment} allComments={posts} onAddReply={handleAddComment} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
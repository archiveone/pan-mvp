import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import type { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';

const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { posts } = usePosts();
  
  const postToEdit = posts.find(p => p.id === id);

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      if (currentUser?.id !== postToEdit.user.id) {
        alert("You don't have permission to edit this post.");
        navigate(`/post/${id}`);
        return;
      }
      
      setIsAuthorized(true);
      setPost(postToEdit);
      setTitle(postToEdit.title || '');
      setContent(postToEdit.content || '');
      setTags(postToEdit.tags?.join(', ') || '');
      setMediaPreview(postToEdit.videoUrl || postToEdit.imageUrl || null);
      setMediaType(postToEdit.videoUrl ? 'video' : (postToEdit.imageUrl ? 'image' : null));
    }
    setIsLoading(false);
  }, [postToEdit, id, currentUser, navigate]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else if (file.type.startsWith('audio/')) {
        setMediaType('audio' as any);
      } else {
        setMediaType('image');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated Post Data:", {
      ...post,
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    alert('Post updated successfully! (Mock)');
    navigate(`/post/${id}`);
  };
  
  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-pan-white">
          <h2 className="text-2xl font-bold">Loading editor...</h2>
        </div>
      )
  }

  if (!postToEdit || !isAuthorized) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen text-pan-white">
          <h2 className="text-2xl font-bold mb-4">Post not found or unauthorized</h2>
          <Link to="/" className="text-pan-gray hover:underline">Go back home</Link>
        </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-6">
       <div className="flex items-center mb-6">
         <Link to={`/post/${id}`} className="p-2 rounded-full hover:bg-pan-gray-dark mr-2">
            <ArrowLeft size={24}/>
         </Link>
         <h1 className="text-2xl font-bold">Edit Post</h1>
       </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        { (post.postType === 'MEDIA' || post.postType === 'ITEM' || post.postType === 'EVENT' || post.postType === 'PLACE' || post.postType === 'COMMUNITY' || post.postType === 'SERVICE') && (
        <div>
            {mediaPreview ? (
              <div className="relative group w-full h-48 rounded-xl overflow-hidden bg-pan-gray-dark flex justify-center items-center">
                {mediaType === 'video' ? (
                  <video 
                    src={mediaPreview} 
                    className="w-full h-full object-contain bg-black" 
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : mediaType === 'audio' ? (
                  <div className="w-full h-full flex flex-col justify-center items-center p-4">
                    <div className="text-pan-white mb-4">🎵 Audio File</div>
                    <audio 
                      src={mediaPreview} 
                      controls 
                      className="w-full max-w-md"
                    />
                  </div>
                ) : (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                )}
                <label htmlFor="media-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col justify-center items-center text-white">
                  <UploadCloud size={40} />
                  <span className="mt-2 font-semibold">Change Media</span>
                </label>
              </div>
            ) : (
              <label htmlFor="media-upload" className="cursor-pointer block w-full h-48 border-2 border-dashed border-pan-gray rounded-xl flex flex-col justify-center items-center text-pan-gray hover:border-pan-white hover:text-pan-white transition-colors">
                <UploadCloud size={40} />
                <span className="mt-2 font-semibold">Upload Image, Video, or Audio</span>
              </label>
            )}
            <input id="media-upload" type="file" className="hidden" onChange={handleMediaChange} accept="image/*,video/*,audio/*,.mp3,.wav,.m4a,.ogg,.flac"/>
        </div>
        )}

        { (post.postType !== 'TEXT') &&
        <div>
            <label htmlFor="title" className="block text-sm font-medium text-pan-gray-light mb-1">Title</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white" />
        </div>
        }
        <div>
            <label htmlFor="content" className="block text-sm font-medium text-pan-gray-light mb-1">Description</label>
            <textarea id="content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white" required />
        </div>
        
        <div>
            <label htmlFor="tags" className="block text-sm font-medium text-pan-gray-light mb-1">Tags (comma-separated)</label>
            <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white" placeholder="e.g. vintage, camera, photography" />
        </div>

        <div className="pt-4">
            <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;
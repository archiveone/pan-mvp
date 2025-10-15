import React, { useState } from 'react';
import Button from '../components/Button';
import { ArrowLeft, Image, Package, Calendar, MapPin, Users, Briefcase, UploadCloud, DollarSign, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Post, PostType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { supabase } from '../services/supabaseClient';

const postTypeOptions: { type: PostType, label: string, icon: React.ElementType, description: string }[] = [
    { type: 'ITEM', label: 'Item', icon: Package, description: 'Sell clothes, furniture, art, etc.' },
    { type: 'EVENT', label: 'Event', icon: Calendar, description: 'A gig, festival, or workshop.' },
    { type: 'PLACE', label: 'Place', icon: MapPin, description: 'A hostel, restaurant, or business.' },
    { type: 'SERVICE', label: 'Service', icon: Briefcase, description: 'Offer your skills for hire.' },
    { type: 'COMMUNITY', label: 'Community', icon: Users, description: 'Start a forum or group.' },
    { type: 'MEDIA', label: 'Media', icon: Image, description: 'Share a photo, video, or thought.' },
    { type: 'DOCUMENT', label: 'Document', icon: FileText, description: 'Post an article, paper, or file.' },
];

const CreatePostPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [postType, setPostType] = useState<PostType | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document' | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState('');

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addPost } = usePosts();

  const handleSelectPostType = (type: PostType) => {
    setPostType(type);
    setStep(2);
  }
  
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (postType === 'DOCUMENT') {
        setMediaType('document');
        setDocumentName(file.name);
        setMediaPreview(null); // No visual preview for generic documents
      } else {
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview(previewUrl);
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else if (file.type.startsWith('audio/')) {
          setMediaType('audio' as any);
        } else {
          setMediaType('image');
        }
        setDocumentName(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postType || !currentUser) {
      alert("Could not create post. User not found.");
      return;
    }

    const getPriceUnit = () => {
        switch (postType) {
            case 'SERVICE': return 'per_hour';
            case 'EVENT': return 'per_ticket';
            case 'ITEM': return 'per_item';
            default: return 'fixed';
        }
    };

    const newPost: Post = {
        id: `p${Date.now()}`,
        user: {
            ...currentUser,
            name: '',
            avatarUrl: '',
            bio: ''
        },
        postType,
        title: title || undefined,
        content,
        imageUrl: mediaType === 'image' ? (mediaPreview ?? undefined) : undefined,
        videoUrl: mediaType === 'video' ? (mediaPreview ?? undefined) : undefined,
        priceInfo: price ? { amount: parseFloat(price), unit: getPriceUnit() } : undefined,
        likes: 0,
        timestamp: new Date().toISOString(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        location: location || undefined,
        dateTime: dateTime || undefined,
        bannerUrl: postType === 'COMMUNITY' ? (mediaPreview ?? undefined) : undefined,
        memberCount: postType === 'COMMUNITY' ? 1 : undefined,
        isLocked: postType === 'COMMUNITY' ? false : undefined,
        duration: duration || undefined,
        documentUrl: postType === 'DOCUMENT' ? '#' : undefined,
        documentName: documentName || undefined,
    };
    
    try {
      // If Supabase configured, upload and insert
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        let mediaUrl: string | undefined = undefined;
        if (mediaPreview && mediaType !== 'document') {
          const blob = await fetch(mediaPreview).then(r => r.blob());
          const fileExt = mediaType === 'video' ? 'mp4' : 'jpg';
          const path = `${currentUser.id}/${Date.now()}.${fileExt}`;
          const { error: upErr } = await supabase.storage.from('post-media').upload(path, blob, { upsert: true, contentType: blob.type });
          if (upErr) throw upErr;
          const { data } = supabase.storage.from('post-media').getPublicUrl(path);
          mediaUrl = data.publicUrl;
          if (mediaType === 'video') newPost.videoUrl = mediaUrl; else newPost.imageUrl = mediaUrl;
        }
        // TODO: insert into posts table (keeping local context for now)
      }
    } catch (err) {
      console.error('Supabase upload failed, using local preview', err);
    }

    addPost(newPost);
    navigate('/');
  };

  const renderStep1 = () => (
     <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
            <Link to="/" className="p-2 rounded-full hover:bg-pan-gray-dark mr-2"><ArrowLeft size={24}/></Link>
            <h1 className="text-2xl font-bold">What are you posting?</h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
            {postTypeOptions.map(({ type, label, icon: Icon, description }) => (
                <button
                    key={type}
                    onClick={() => handleSelectPostType(type)}
                    className="text-left p-4 bg-pan-gray-dark rounded-xl hover:bg-opacity-70 border-2 border-transparent transition-all flex flex-col items-start gap-4 aspect-square justify-between"
                >
                    <Icon size={32} className="text-pan-white"/>
                    <div>
                        <h2 className="font-bold text-lg text-pan-white">{label}</h2>
                        <p className="text-sm text-pan-gray">{description}</p>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="container mx-auto px-4 py-6">
       <div className="flex items-center mb-6">
         <button onClick={() => { setStep(1); setMediaType(null); setMediaPreview(null); setDocumentName(null); }} className="p-2 rounded-full hover:bg-pan-gray-dark mr-2">
            <ArrowLeft size={24}/>
         </button>
         <h1 className="text-2xl font-bold">New {postTypeOptions.find(p=>p.type === postType)?.label}</h1>
       </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        { postType !== 'TEXT' && postType !== 'COMMUNITY' && (
        <div>
            {mediaType === 'document' ? (
              <div className="relative group w-full h-48 rounded-xl bg-pan-gray-dark flex flex-col justify-center items-center">
                <FileText size={40} className="text-pan-gray-light" />
                <p className="mt-2 font-semibold text-pan-white truncate max-w-full px-4">{documentName}</p>
                 <label htmlFor="media-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col justify-center items-center text-white">
                  <UploadCloud size={40} />
                  <span className="mt-2 font-semibold">Change Document</span>
                </label>
              </div>
            ) : mediaPreview ? (
              <div className="relative group w-full h-48 rounded-xl overflow-hidden bg-pan-gray-dark flex justify-center items-center">
                {mediaType === 'video' ? (
                  <video 
                    src={mediaPreview} 
                    className="w-full h-full object-contain bg-black" 
                    autoPlay loop muted playsInline
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
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <label htmlFor="media-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col justify-center items-center text-white">
                  <UploadCloud size={40} />
                  <span className="mt-2 font-semibold">Change Media</span>
                </label>
              </div>
            ) : (
              <label htmlFor="media-upload" className="cursor-pointer block w-full h-48 border-2 border-dashed border-pan-gray rounded-xl flex flex-col justify-center items-center text-pan-gray hover:border-pan-white hover:text-pan-white transition-colors">
                <UploadCloud size={40} />
                <span className="mt-2 font-semibold">{postType === 'DOCUMENT' ? 'Upload Document' : 'Upload Image, Video, or Audio'}</span>
              </label>
            )}
            <input id="media-upload" type="file" className="hidden" onChange={handleMediaChange} accept={postType === 'DOCUMENT' ? '.pdf,.doc,.docx,.txt' : 'image/*,video/*,audio/*,.mp3,.wav,.m4a,.ogg,.flac'}/>
        </div>
        )}

        <div>
            <label htmlFor="title" className="block text-sm font-medium text-pan-gray-light mb-1">Title</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white" required />
        </div>
        <div>
            <label htmlFor="content" className="block text-sm font-medium text-pan-gray-light mb-1">{postType === 'DOCUMENT' ? 'Abstract / Summary' : 'Description'}</label>
            <textarea id="content" rows={4} value={content} onChange={e => setContent(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            {(postType === 'PLACE' || postType === 'EVENT') && <div>
                <label htmlFor="location" className="block text-sm font-medium text-pan-gray-light mb-1">Location</label>
                <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg" />
            </div>}
            {postType === 'EVENT' && <div>
                <label htmlFor="datetime" className="block text-sm font-medium text-pan-gray-light mb-1">Date & Time</label>
                <input type="text" id="datetime" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg" />
            </div>}
        </div>
        
        {postType === 'SERVICE' && (
            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-pan-gray-light mb-1">Duration</label>
                <input type="text" id="duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 2 hours per session" className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg" />
            </div>
        )}
        
        { (postType === 'ITEM' || postType === 'SERVICE' || postType === 'EVENT' ) && (
             <div>
                <label htmlFor="price" className="block text-sm font-medium text-pan-gray-light mb-1">Price ($)</label>
                <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg" placeholder="0.00" />
            </div>
        )}

        <div>
            <label htmlFor="tags" className="block text-sm font-medium text-pan-gray-light mb-1">Tags (comma-separated)</label>
            <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-3 py-2 bg-pan-gray-dark border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white" placeholder="e.g. vintage, camera, photography" />
        </div>

        <div className="pt-4">
            <Button type="submit">Post</Button>
        </div>
      </form>
    </div>
  );

  return step === 1 ? renderStep1() : renderStep2();
};

export default CreatePostPage;
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

const EditProfilePage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state with current user data, or fallbacks if not available
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || '');

  if (!currentUser) {
    return <p>Loading...</p>;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = name.toLowerCase().trim().replace(/\s+/g, '');
    updateUser({ name, bio, avatarUrl: avatarPreview, handle });
    navigate('/profile');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-8">
        <Link to="/profile" className="p-2 rounded-full hover:bg-pan-gray-dark mr-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img 
              src={avatarPreview} 
              alt="Profile Avatar" 
              className="w-28 h-28 rounded-full border-4 border-pan-gray-dark shadow-lg object-cover" 
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Change profile picture"
            >
              <Camera size={32} className="text-white" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>

        <div className="bg-pan-gray-dark p-4 rounded-xl space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-pan-gray-light mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white"
              required
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-pan-gray-light mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white"
              placeholder="Tell everyone a little about yourself"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
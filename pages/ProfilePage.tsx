import React from 'react';
import { MOCK_USERS } from '../constants';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import BentoCard from '../components/BentoCard';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { posts } = usePosts();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Determine which user to display. If a userId is in the URL, find that user. Otherwise, show the logged-in user.
  const user = userId ? MOCK_USERS.find(u => u.id === userId) : currentUser;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle case where user is not found
  if (!user) {
    return (
        <div className="container mx-auto px-4 py-6 text-center">
            <h1 className="text-2xl font-bold">User not found</h1>
            <Link to="/" className="text-pan-gray hover:underline mt-4 inline-block">Go to Home</Link>
        </div>
    );
  }

  const userPosts = posts.filter(p => p.user.id === user.id && !p.parentId);
  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src={user.avatarUrl || '/avatar-fallback.svg'} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-500 dark:text-pan-gray">@{(user as any).handle || user.name.toLowerCase().replace(/\s+/g, '')}</p>
          </div>
        </div>
        {isOwnProfile && (
          <div className="flex items-center gap-3">
            <Link to="/profile/edit" className="text-sm text-gray-600 dark:text-pan-gray-light hover:underline">Edit</Link>
            <button onClick={handleLogout} className="text-sm text-gray-600 dark:text-pan-gray-light hover:underline">Logout</button>
          </div>
        )}
      </div>

      {user.bio && <p className="text-gray-600 dark:text-pan-gray-light mb-6">{user.bio}</p>}

      {/* Verification Status */}
      {isOwnProfile && (
        <div className="mb-6">
          {(user as any).verification_status === 'verified' ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <ShieldCheck size={16} />
              <span className="text-sm font-medium">Identity Verified</span>
            </div>
          ) : (user as any).verification_status === 'pending' ? (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <ShieldAlert size={16} />
              <span className="text-sm font-medium">Verification Pending</span>
            </div>
          ) : (
            <Link to="/verification" className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:underline">
              <ShieldAlert size={16} />
              <span className="text-sm font-medium">Verify Identity</span>
            </Link>
          )}
        </div>
      )}

      <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
        {userPosts.map(post => (
          <div key={post.id} className="mb-4 break-inside-avoid">
            <BentoCard post={post} />
          </div>
        ))}
      </div>

      {userPosts.length === 0 && (
        <div className="text-center py-16 text-pan-gray">{isOwnProfile ? 'Your posts will appear here.' : 'No posts yet.'}</div>
      )}
    </div>
  );
};

export default ProfilePage;
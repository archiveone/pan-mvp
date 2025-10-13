import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import { ArrowLeft, MessageSquare, Rss, Users, Plus, Hash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import CommunityChat from './ChatPage';

// Modal for creating a new group
const CreateGroupModal: React.FC<{
  communityId: string;
  onClose: () => void;
}> = ({ communityId, onClose }) => {
  const { addChatGroup } = usePosts();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Group name is required.');
      return;
    }
    addChatGroup({ communityId, name, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-pan-gray-dark rounded-2xl shadow-xl p-6 w-full max-w-sm text-left" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-pan-white mb-4">Create New Chat Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-pan-gray-light mb-1">Group Name</label>
            <input
              type="text"
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white"
              required
              placeholder="e.g., Album Discussion"
            />
          </div>
          <div>
            <label htmlFor="group-desc" className="block text-sm font-medium text-pan-gray-light mb-1">Description (Optional)</label>
            <textarea
              id="group-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-pan-gray rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-white"
              placeholder="What is this group for?"
            />
          </div>
          <div className="flex gap-4 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="!bg-pan-gray !text-pan-black">Cancel</Button>
            <Button type="submit">Create Group</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CommunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { posts, communities, chatGroups } = usePosts();
  const community = communities.find((c) => c.id === id);
  const communityPosts = posts.filter(p => p.parentId === id).sort((a,b) => b.id.localeCompare(a.id));
  const communityGroups = chatGroups.filter(g => g.communityId === id);

  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'chat'>('posts');
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string } | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-pan-white">
        <h2 className="text-2xl font-bold mb-4">Community not found</h2>
        <button onClick={() => navigate(-1)} className="text-pan-gray hover:underline">Go back</button>
      </div>
    );
  }
  
  const ChatHub = () => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Chat Groups</h2>
            <Button onClick={() => setCreateModalOpen(true)} className="!w-auto !py-2 !px-4 flex items-center gap-2">
                <Plus size={16}/> Create Group
            </Button>
        </div>
        <div className="space-y-3">
            {/* General Chat */}
            <div onClick={() => setSelectedGroup({ id: community.id, name: 'General Chat' })} className="bg-pan-gray-dark p-4 rounded-xl hover:bg-opacity-70 cursor-pointer transition-colors flex items-center gap-4">
                <div className="w-12 h-12 bg-black/30 rounded-lg flex items-center justify-center"><Hash size={24} className="text-pan-gray-light"/></div>
                <div>
                    <h3 className="font-bold text-pan-white">General Chat</h3>
                    <p className="text-sm text-pan-gray">Open discussion for all community members.</p>
                </div>
            </div>
            {/* Custom Groups */}
            {communityGroups.map(group => (
                 <div key={group.id} onClick={() => setSelectedGroup({ id: group.id, name: group.name })} className="bg-pan-gray-dark p-4 rounded-xl hover:bg-opacity-70 cursor-pointer transition-colors flex items-center gap-4">
                    <div className="w-12 h-12 bg-black/30 rounded-lg flex items-center justify-center"><Hash size={24} className="text-pan-gray-light"/></div>
                    <div>
                        <h3 className="font-bold text-pan-white">{group.name}</h3>
                        <p className="text-sm text-pan-gray line-clamp-1">{group.description}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div>
      <div className="relative h-48 bg-pan-gray-dark -mx-4 -mt-6">
        <img src={community.bannerUrl} alt={`${community.title} banner`} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-pan-black via-pan-black/70 to-transparent"></div>
        <button onClick={() => navigate(-1)} className="absolute top-20 left-4 bg-pan-gray-dark/50 backdrop-blur-sm p-2 rounded-full text-pan-white hover:bg-pan-gray-dark transition z-10">
          <ArrowLeft size={24}/>
        </button>
      </div>

      <div className="container mx-auto px-4 -mt-20">
        <div className="relative mb-6">
            <div className="flex items-end gap-4">
                <img src={community.imageUrl} alt={community.title} className="w-24 h-24 rounded-lg border-4 border-pan-black object-cover" />
                <div className="flex-grow pb-2">
                    <h1 className="text-2xl font-bold">{community.title}</h1>
                    <div className="flex items-center text-sm text-pan-gray-light mt-1">
                        <Users size={14} className="mr-1.5"/>
                        <span>{community.memberCount + (isJoined ? 1 : 0)} members</span>
                    </div>
                </div>
                <div className="pb-2">
                <Button 
                    onClick={() => setIsJoined(!isJoined)}
                    variant={isJoined ? 'secondary' : 'primary'}
                    className="!py-2 !px-5 !w-auto"
                >
                    {isJoined ? 'Joined' : 'Join'}
                </Button>
                </div>
            </div>
        </div>
        
        <div className="border-b border-pan-gray-dark mb-6 flex space-x-8">
            <button 
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'posts' ? 'border-pan-white text-pan-white' : 'border-transparent text-pan-gray hover:text-pan-white'}`}
            >
                <Rss size={16}/> Posts
            </button>
            <button 
                onClick={() => { setActiveTab('chat'); setSelectedGroup(null); }}
                className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'chat' ? 'border-pan-white text-pan-white' : 'border-transparent text-pan-gray hover:text-pan-white'}`}
            >
                <MessageSquare size={16}/> Chat
            </button>
        </div>

        {activeTab === 'posts' && (
          <div>
            <div className="bg-pan-gray-dark p-3 rounded-xl mb-6 flex items-center gap-3">
                <img src={currentUser?.avatarUrl} alt="Your avatar" className="w-10 h-10 rounded-full" />
                <input 
                    type="text"
                    placeholder={`What's on your mind, ${currentUser?.name}?`}
                    className="w-full bg-black/30 border-none rounded-full px-4 py-2 focus:ring-1 focus:ring-pan-white focus:outline-none text-pan-white placeholder-pan-gray"
                />
            </div>
            <div className="space-y-4">
              {communityPosts.length > 0 ? (
                communityPosts.map(post => <PostCard key={post.id} post={post} hideCommunityLink />)
              ) : (
                <div className="text-center py-10 text-pan-gray">
                  <h2 className="text-xl font-semibold mb-2">No posts yet!</h2>
                  <p>Be the first to share something in the {community.title} community.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'chat' && (
            <div>
                {!selectedGroup ? (
                    <ChatHub />
                ) : (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <button onClick={() => setSelectedGroup(null)} className="p-2 rounded-full hover:bg-pan-gray-dark">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
                        </div>
                        <CommunityChat groupId={selectedGroup.id} />
                    </div>
                )}
            </div>
        )}
      </div>
       {isCreateModalOpen && (
        <CreateGroupModal
            communityId={community.id}
            onClose={() => setCreateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CommunityDetailPage;
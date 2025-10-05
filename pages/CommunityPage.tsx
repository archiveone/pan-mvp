

import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Plus, Users } from 'lucide-react';
import { usePosts } from '../contexts/PostsContext';

const CommunityPage: React.FC = () => {
    const { communities } = usePosts();

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Communities</h1>
                <button className="flex items-center gap-2 bg-pan-red text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                    <Plus size={20}/>
                    <span>Create</span>
                </button>
            </div>
            
            <div className="space-y-4">
                {communities.map(community => (
                    <Link to={`/community/${community.id}`} key={community.id} className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        {/* FIX: Use `title` property which exists on Post type. */}
                        <img src={community.imageUrl} alt={community.title} className="w-16 h-16 rounded-lg object-cover mr-4" />
                        <div className="flex-grow">
                            {/* FIX: Use `title` property which exists on Post type. */}
                            <h2 className="font-bold text-lg">{community.title}</h2>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Users size={14} className="mr-1.5"/>
                                <span>{community.memberCount} members</span>
                            </div>
                        </div>
                        {community.isLocked && <Lock size={20} className="text-gray-400" />}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CommunityPage;

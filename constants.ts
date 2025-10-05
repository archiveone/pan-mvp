// FIX: Imported the Message type to be used with MOCK_MESSAGES.
import type { User, Post, Message } from './types';

export type VerificationStatus = 'unverified' | 'verified' | 'pending';

export const MOCK_USER_1: User = {
  id: 'u1',
  name: 'Alex Doe',
  avatarUrl: 'https://i.pravatar.cc/150?u=u1',
  bio: 'Photographer, designer, and music lover. Exploring the world one frame at a time. Join me on my adventures!',
  verificationStatus: 'unverified',
  isAdmin: true,
};

export const MOCK_USER_2: User = {
  id: 'u2',
  name: 'Jane Smith',
  avatarUrl: 'https://i.pravatar.cc/150?u=u2',
  bio: 'Musician and coffee enthusiast.',
  verificationStatus: 'verified',
};

export const MOCK_USER_3: User = {
    id: 'u3',
    name: 'Sam Wilson',
    avatarUrl: 'https://i.pravatar.cc/150?u=u3',
    bio: 'Chef and world traveler.',
    verificationStatus: 'unverified',
};

export const MOCK_USERS: User[] = [MOCK_USER_1, MOCK_USER_2, MOCK_USER_3];


export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    user: MOCK_USER_1,
    postType: 'ITEM',
    title: 'Vintage Polaroid Camera',
    content: 'A fully functional Polaroid 600 camera. Perfect for capturing memories with a nostalgic feel. In great condition, though it is a darn shame I have to sell it.',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=2070&auto=format&fit=crop',
    priceInfo: { amount: 85, unit: 'per_item' },
    likes: 124,
    timestamp: '2h ago',
    tags: ['vintage', 'camera', 'photography'],
  },
  {
    id: 'p2',
    user: MOCK_USER_2,
    postType: 'EVENT',
    title: 'Acoustic Night by Jane',
    content: 'Join me for a cozy evening of acoustic music at The Local Brew. I\'ll be playing some originals and covers. See you there!',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop',
    priceInfo: { amount: 15, unit: 'per_ticket' },
    location: 'The Local Brew, 123 Cafe St.',
    dateTime: 'Fri, Nov 8 @ 8:00 PM',
    likes: 88,
    timestamp: '1d ago',
    tags: ['music', 'live', 'acoustic'],
  },
  {
    id: 'p3',
    user: MOCK_USER_1,
    postType: 'MEDIA',
    title: 'City Sunset',
    content: 'Caught this beautiful sunset during my evening walk today.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    likes: 256,
    timestamp: '4h ago',
    tags: ['sunset', 'cityscape', 'video'],
  },
  {
    id: 'p4',
    user: MOCK_USER_3,
    postType: 'PLACE',
    title: 'The Hidden Garden Bistro',
    content: 'Our new seasonal menu is out! Come taste the freshest ingredients, crafted with love. We focus on farm-to-table cuisine.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
    location: '456 Secret Ln, Foodie Town',
    likes: 312,
    timestamp: '3d ago',
    tags: ['restaurant', 'dining', 'food'],
  },
  {
    id: 'p5',
    user: MOCK_USER_2,
    postType: 'COMMUNITY',
    title: 'Indie Music Lovers',
    content: 'A place to discover and share new indie artists, discuss upcoming albums, and connect with fellow music fans.',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
    memberCount: 452,
    isLocked: false,
    likes: 150,
    timestamp: '1w ago',
  },
  {
    id: 'p6',
    user: MOCK_USER_1,
    postType: 'TEXT',
    content: 'Just finished a great book! "The Midnight Library" by Matt Haig. Highly recommend if you\'re looking for a thought-provoking read.',
    likes: 42,
    timestamp: '5h ago',
    parentId: 'p5', // Post inside Indie Music Lovers community
  },
   {
    id: 'p7',
    user: MOCK_USER_3,
    postType: 'SERVICE',
    title: 'Private Cooking Classes',
    content: 'Learn to cook authentic Italian pasta from scratch! I offer private and group classes. All skill levels welcome.',
    imageUrl: 'https://images.unsplash.com/photo-1556910106-n50044598a41?q=80&w=2070&auto=format&fit=crop',
    priceInfo: { amount: 75, unit: 'per_hour' },
    duration: '2 hours per session',
    likes: 95,
    timestamp: '2d ago',
    tags: ['cooking', 'class', 'italian'],
  },
  {
    id: 'p8',
    user: MOCK_USER_2,
    postType: 'MEDIA',
    title: 'Autumn Walk',
    content: 'The colors this time of year are just magical.',
    imageUrl: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=2070&auto=format&fit=crop',
    likes: 180,
    timestamp: '6h ago',
    tags: ['autumn', 'nature', 'photography'],
  },
  {
    id: 'p9',
    user: MOCK_USER_3,
    postType: 'DOCUMENT',
    title: 'The Impact of Latent Diffusion Models on Computational Creativity',
    content: 'This paper explores the rapid advancements in latent diffusion models and their profound impact on the field of computational creativity. We analyze the architectural innovations that enable high-fidelity image synthesis and discuss the implications for creative workflows, artistic expression, and the definition of authorship in the age of AI-generated media.',
    documentUrl: '#', // Placeholder link
    documentName: 'diffusion_models_creativity_paper.pdf',
    likes: 78,
    timestamp: '8h ago',
    tags: ['research', 'ai', 'computer science', 'academic paper'],
  },
  {
    id: 'c1',
    user: MOCK_USER_2,
    postType: 'TEXT',
    content: 'This is such a cool find! Does it come with any film?',
    likes: 15,
    timestamp: '2024-08-15T10:00:00Z',
    parentId: 'p1', // Comment on Vintage Polaroid Camera
  },
  {
    id: 'c2',
    user: MOCK_USER_1,
    postType: 'TEXT',
    content: 'Thanks! I have one pack of 600 film I can include with it.',
    likes: 8,
    timestamp: '2024-08-15T10:15:00Z',
    parentId: 'c1', // Reply to comment c1
  },
  {
    id: 'c3',
    user: MOCK_USER_3,
    postType: 'TEXT',
    content: 'I had one of these back in the day. So many great memories. Good luck with the sale!',
    likes: 5,
    timestamp: '2024-08-15T11:00:00Z',
    parentId: 'p1', // Another comment on Vintage Polaroid Camera
  },
];

// FIX: Added mock messages for chat functionality.
export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg1',
    groupId: 'p5', // Indie Music Lovers community
    user: MOCK_USER_2,
    text: 'Hey everyone! Any new indie bands you\'ve discovered this week?',
    timestamp: '10:45 AM',
  },
  {
    id: 'msg2',
    groupId: 'p5',
    user: MOCK_USER_1,
    text: 'Just checked out "The Wandering Echoes". Their latest single is amazing!',
    timestamp: '10:47 AM',
  },
  {
    id: 'msg3',
    groupId: 'p5',
    user: MOCK_USER_2,
    text: 'Oh nice, I\'ll give them a listen. Thanks for the recommendation!',
    timestamp: '10:48 AM',
  },
  {
    id: 'msg4',
    groupId: 'p5',
    user: MOCK_USER_3,
    text: 'Has anyone seen the lineup for the Green Valley music festival?',
    timestamp: '11:15 AM',
  }
];
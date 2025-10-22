import { UnifiedFeedItem } from './unifiedFeedService';

/**
 * Demo/Mock Data Service
 * Provides realistic sample data when database is not configured
 * Perfect for demos, previews, and development without backend
 */

export class DemoDataService {
  private static demoItems: UnifiedFeedItem[] = [
    // Events
    {
      id: 'demo-event-1',
      type: 'event',
      title: 'Summer Music Festival 2025',
      description: 'Join us for an amazing weekend of live music featuring top artists from around the world. Food trucks, camping, and great vibes!',
      mediaUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
      price: 150,
      currency: 'USD',
      location: 'Austin, TX',
      category: 'Music',
      tags: ['festival', 'music', 'outdoor'],
      userId: 'demo-user-1',
      userProfile: {
        name: 'Event Organizers Co',
        username: 'eventorg',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=EO'
      },
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      viewCount: 1524,
      likeCount: 342,
      extraData: {
        startDate: '2025-07-15',
        endDate: '2025-07-17',
        venueName: 'Zilker Park',
        capacity: 5000,
        attendeeCount: 2341
      }
    },
    {
      id: 'demo-event-2',
      type: 'event',
      title: 'Tech Conference 2025',
      description: 'The biggest tech conference of the year. Learn from industry leaders, network with peers, and discover the latest innovations.',
      mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      price: 299,
      currency: 'USD',
      location: 'San Francisco, CA',
      category: 'Technology',
      tags: ['tech', 'conference', 'networking'],
      userId: 'demo-user-2',
      userProfile: {
        name: 'TechEvents',
        username: 'techevents',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=TE'
      },
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      viewCount: 3421,
      likeCount: 567
    },
    // Listings (Products)
    {
      id: 'demo-listing-1',
      type: 'listing',
      title: 'Vintage Leather Jacket',
      description: 'Authentic vintage leather jacket in excellent condition. Size M. Perfect for fall and winter. Minor wear adds character.',
      mediaUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      price: 180,
      currency: 'USD',
      location: 'New York, NY',
      category: 'Fashion',
      tags: ['vintage', 'jacket', 'leather'],
      userId: 'demo-user-3',
      userProfile: {
        name: 'Vintage Finds',
        username: 'vintagefinds',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=VF'
      },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      viewCount: 892,
      likeCount: 124,
      extraData: {
        condition: 'Good',
        brand: 'Schott NYC'
      }
    },
    {
      id: 'demo-listing-2',
      type: 'listing',
      title: 'Wireless Noise-Canceling Headphones',
      description: 'Premium wireless headphones with active noise cancellation. 30-hour battery life. Includes carrying case.',
      mediaUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      price: 299,
      currency: 'USD',
      location: 'Los Angeles, CA',
      category: 'Electronics',
      tags: ['headphones', 'audio', 'wireless'],
      userId: 'demo-user-4',
      userProfile: {
        name: 'Tech Gear Pro',
        username: 'techgear',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=TG'
      },
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      viewCount: 2341,
      likeCount: 456
    },
    // Rentals
    {
      id: 'demo-rental-1',
      type: 'booking',
      title: 'Cozy Mountain Cabin',
      description: 'Beautiful cabin nestled in the mountains. 2 bedrooms, fireplace, hot tub, and stunning views. Perfect getaway!',
      mediaUrl: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400',
      price: 250,
      currency: 'USD',
      location: 'Aspen, CO',
      category: 'Vacation Rental',
      tags: ['cabin', 'mountain', 'vacation'],
      userId: 'demo-user-5',
      userProfile: {
        name: 'Mountain Retreats',
        username: 'mountainretreats',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MR'
      },
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      viewCount: 1823,
      likeCount: 234,
      extraData: {
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 6,
        averageRating: 4.8,
        reviewCount: 47
      }
    },
    {
      id: 'demo-rental-2',
      type: 'booking',
      title: 'Beach House Paradise',
      description: 'Modern beach house with direct ocean access. 3 bedrooms, pool, outdoor kitchen. Wake up to ocean views every morning!',
      mediaUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400',
      price: 450,
      currency: 'USD',
      location: 'Malibu, CA',
      category: 'Vacation Rental',
      tags: ['beach', 'ocean', 'luxury'],
      userId: 'demo-user-6',
      userProfile: {
        name: 'Coastal Properties',
        username: 'coastal',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=CP'
      },
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      viewCount: 3241,
      likeCount: 612
    },
    // Auctions
    {
      id: 'demo-auction-1',
      type: 'auction',
      title: 'Vintage Rolex Watch',
      description: 'Rare vintage Rolex Submariner from 1965. Fully serviced and authenticated. A true collectors piece.',
      mediaUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
      price: 15000,
      currency: 'USD',
      location: 'Online',
      category: 'Collectibles',
      tags: ['watch', 'vintage', 'luxury'],
      userId: 'demo-user-7',
      userProfile: {
        name: 'Luxury Auctions',
        username: 'luxauctions',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=LA'
      },
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      viewCount: 5421,
      likeCount: 892,
      extraData: {
        bidCount: 23,
        endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        status: 'live'
      }
    },
    // Music
    {
      id: 'demo-music-1',
      type: 'music',
      title: 'Summer Nights',
      description: 'An upbeat summer anthem perfect for road trips and beach days.',
      mediaUrl: 'https://example.com/audio/summer-nights.mp3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      category: 'Pop',
      tags: ['summer', 'pop', 'upbeat'],
      userId: 'demo-user-8',
      userProfile: {
        name: 'Indie Artist',
        username: 'indieartist',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=IA'
      },
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      viewCount: 12341,
      extraData: {
        artist: 'Indie Artist',
        duration: 234
      }
    },
    // Video
    {
      id: 'demo-video-1',
      type: 'video',
      title: 'How to Build a Startup',
      description: 'Complete guide to launching your startup from idea to product-market fit.',
      mediaUrl: 'https://example.com/video/startup-guide.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400',
      category: 'Education',
      tags: ['startup', 'business', 'education'],
      userId: 'demo-user-9',
      userProfile: {
        name: 'Startup Academy',
        username: 'startupacademy',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA'
      },
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      viewCount: 8765,
      likeCount: 1234
    },
    // Fundraisers
    {
      id: 'demo-fundraiser-1',
      type: 'fundraiser',
      title: 'Community Garden Project',
      description: 'Help us build a community garden to provide fresh produce to local families and teach sustainable farming.',
      mediaUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
      price: 10,
      currency: 'USD',
      location: 'Portland, OR',
      category: 'Community',
      tags: ['community', 'garden', 'sustainability'],
      userId: 'demo-user-10',
      userProfile: {
        name: 'Green Community',
        username: 'greencommunity',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=GC'
      },
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      viewCount: 2341,
      likeCount: 456,
      extraData: {
        goalAmount: 50000,
        currentAmount: 32450,
        backerCount: 234,
        progressPercentage: 64.9
      }
    },
    // Restaurants
    {
      id: 'demo-restaurant-1',
      type: 'reservation_business',
      title: 'The Golden Fork',
      description: 'Fine dining experience featuring locally-sourced ingredients and innovative cuisine. Reservations recommended.',
      mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      location: 'Chicago, IL',
      category: 'Restaurant',
      tags: ['fine dining', 'restaurant', 'local'],
      userId: 'demo-user-11',
      userProfile: {
        name: 'Golden Fork Restaurant',
        username: 'goldenfork',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=GF'
      },
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      viewCount: 4532,
      extraData: {
        businessType: 'restaurant',
        averageRating: 4.7,
        reviewCount: 234,
        cuisineTypes: ['American', 'Contemporary'],
        acceptsReservations: true
      }
    },
    // Posts
    {
      id: 'demo-post-1',
      type: 'post',
      title: 'Beautiful Sunset',
      description: 'Caught this amazing sunset yesterday evening. Nature never fails to amaze!',
      mediaUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400',
      category: 'Photography',
      tags: ['sunset', 'nature', 'photography'],
      userId: 'demo-user-12',
      userProfile: {
        name: 'Nature Photographer',
        username: 'naturephoto',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NP'
      },
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      viewCount: 1234,
      likeCount: 234
    },
    {
      id: 'demo-post-2',
      type: 'post',
      title: 'Coffee Shop Vibes',
      description: 'Found this hidden gem coffee shop downtown. Amazing atmosphere and the best latte in town! ☕',
      mediaUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      location: 'Seattle, WA',
      category: 'Lifestyle',
      tags: ['coffee', 'lifestyle', 'local'],
      userId: 'demo-user-13',
      userProfile: {
        name: 'Coffee Lover',
        username: 'coffeelover',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=CL'
      },
      createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
      viewCount: 567,
      likeCount: 89
    },
  ];

  /**
   * Get all demo items with optional filtering
   */
  static getDemoFeed(filters?: {
    query?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
    type?: string[];
    limit?: number;
  }): UnifiedFeedItem[] {
    let filtered = [...this.demoItems];

    // Apply filters
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    if (filters?.location) {
      filtered = filtered.filter(item =>
        item.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.priceMin !== undefined) {
      filtered = filtered.filter(item =>
        item.price !== undefined && item.price >= filters.priceMin!
      );
    }

    if (filters?.priceMax !== undefined) {
      filtered = filtered.filter(item =>
        item.price !== undefined && item.price <= filters.priceMax!
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    if (filters?.type && filters.type.length > 0) {
      filtered = filtered.filter(item =>
        filters.type!.includes(item.type)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply limit
    const limit = filters?.limit || 50;
    return filtered.slice(0, limit);
  }

  /**
   * Check if we're in demo mode
   */
  static isDemoMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !supabaseUrl || !supabaseUrl.includes('supabase.co');
  }
}


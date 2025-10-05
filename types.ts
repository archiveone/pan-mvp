import type { VerificationStatus } from './constants';

export type PostType = 'ITEM' | 'EVENT' | 'MEDIA' | 'PLACE' | 'COMMUNITY' | 'TEXT' | 'SERVICE' | 'DOCUMENT';

// A subset of PostType for a specific creation flow.
export type ListingType = 'ITEM' | 'SERVICE' | 'EVENT' | 'PLACE';

export type BentoSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface User {
  id: string;
  name: string;
  handle?: string;
  avatarUrl: string;
  bio: string;
  verificationStatus?: VerificationStatus;
  isAdmin?: boolean;
  username?: string;
  website?: string;
  userLocation?: string;
  isVerified?: boolean;
  isBusiness?: boolean;
  businessType?: string;
  bioSafetyScore?: number;
  bioSafetyChecked?: boolean;
  bioSafetyViolations?: string[];
  bioIsSafetyApproved?: boolean;
  profileType?: string;
  hubTheme?: string;
  hubLayout?: string;
  showStats?: boolean;
  showFollowers?: boolean;
  showPosts?: boolean;
  customCss?: string;
  hubBannerUrl?: string;
  hubDescription?: string;
  verificationLevel?: string;
  verificationData?: any;
  stripeCustomerId?: string;
}

export interface PriceInfo {
  amount: number;
  unit: 'per_item' | 'per_ticket' | 'per_hour' | 'fixed';
}

export interface Post {
  id: string;
  user: User;
  postType: PostType;
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  priceInfo?: PriceInfo;
  likes: number;
  timestamp: string;
  tags?: string[];
  location?: string;
  dateTime?: string;
  bannerUrl?: string;
  memberCount?: number;
  isLocked?: boolean;
  parentId?: string;
  duration?: string;
  documentUrl?: string;
  documentName?: string;
  isFlagged?: boolean;
}

// FIX: Added Message type for chat functionality.
export interface Message {
  id: string;
  groupId: string;
  user: User;
  text: string;
  timestamp: string;
}

// FIX: Added ChatGroup type for community chat functionality.
export interface ChatGroup {
  id: string;
  communityId: string;
  name: string;
  description: string;
}
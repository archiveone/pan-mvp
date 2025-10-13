// Upload wizard types and interfaces

export type UploadType = 'post' | 'listing' | 'event' | 'music' | 'rental' | 'service' | 'experience' | 'group';

export type ListingCategory = 
  | 'electronics' 
  | 'clothing' 
  | 'home' 
  | 'vehicles' 
  | 'books' 
  | 'sports' 
  | 'toys' 
  | 'art' 
  | 'collectibles'
  | 'other';

export type EventCategory = 
  | 'meetup' 
  | 'workshop' 
  | 'conference' 
  | 'social' 
  | 'sports' 
  | 'music' 
  | 'art' 
  | 'food' 
  | 'business' 
  | 'other';

export type ServiceCategory = 
  | 'restaurant' 
  | 'boat_trips' 
  | 'accommodation' 
  | 'transportation' 
  | 'entertainment' 
  | 'beauty' 
  | 'fitness' 
  | 'education' 
  | 'consulting' 
  | 'other';

export type RentalCategory = 
  | 'vehicle' 
  | 'equipment' 
  | 'property' 
  | 'clothing' 
  | 'electronics' 
  | 'furniture' 
  | 'tools' 
  | 'sports' 
  | 'other';

export type MusicCategory = 
  | 'song' 
  | 'album' 
  | 'podcast' 
  | 'audiobook' 
  | 'instrumental' 
  | 'remix' 
  | 'other';

export interface UploadWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => { valid: boolean; errors: string[] };
  required: boolean;
}

export interface BaseUploadData {
  type: UploadType;
  title: string;
  description: string;
  images: File[];
  audioFiles?: File[];
  videoFiles?: File[];
  documentFiles?: File[];
  tags: string[];
  location?: string;
  category: string;
}

export interface PostUploadData extends BaseUploadData {
  type: 'post';
  allowsComments: boolean;
  isPublic: boolean;
}

export interface ListingUploadData extends BaseUploadData {
  type: 'listing';
  category: ListingCategory;
  price: number;
  currency: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  quantity: number;
  isNegotiable: boolean;
  shippingOptions: {
    localPickup: boolean;
    shipping: boolean;
    shippingCost?: number;
  };
}

export interface EventUploadData extends BaseUploadData {
  type: 'event';
  category: EventCategory;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  venue: string;
  address: string;
  capacity?: number;
  ticketPrice?: number;
  currency: string;
  ticketTypes: {
    name: string;
    price: number;
    description: string;
    quantity?: number;
  }[];
  requiresApproval: boolean;
  ageRestriction?: number;
}

export interface MusicUploadData extends BaseUploadData {
  type: 'music';
  category: MusicCategory;
  audioFile: File;
  genre: string;
  duration?: number;
  releaseDate?: string;
  price: number;
  currency: string;
  licenseType: 'exclusive' | 'non_exclusive' | 'royalty_free';
  downloadEnabled: boolean;
  streamingEnabled: boolean;
  previewEnabled: boolean;
  lyrics?: string;
  credits?: string;
}

export interface RentalUploadData extends BaseUploadData {
  type: 'rental';
  category: RentalCategory;
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  currency: string;
  depositRequired: number;
  minimumRentalPeriod: string;
  maximumRentalPeriod?: string;
  availability: {
    monday: { start: string; end: string; available: boolean }[];
    tuesday: { start: string; end: string; available: boolean }[];
    wednesday: { start: string; end: string; available: boolean }[];
    thursday: { start: string; end: string; available: boolean }[];
    friday: { start: string; end: string; available: boolean }[];
    saturday: { start: string; end: string; available: boolean }[];
    sunday: { start: string; end: string; available: boolean }[];
  };
  bookingRequirements: {
    advanceBooking: number; // hours
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    requiresApproval: boolean;
  };
  features: string[];
  restrictions: string[];
}

export interface ServiceUploadData extends BaseUploadData {
  type: 'service';
  category: ServiceCategory;
  pricing: {
    type: 'fixed' | 'hourly' | 'per_person' | 'per_item';
    basePrice: number;
    currency: string;
    additionalFees?: {
      name: string;
      amount: number;
      description: string;
    }[];
  };
  duration?: string; // for services with fixed duration
  capacity?: number; // for services that can handle multiple people
  availability: {
    monday: { start: string; end: string; available: boolean }[];
    tuesday: { start: string; end: string; available: boolean }[];
    wednesday: { start: string; end: string; available: boolean }[];
    thursday: { start: string; end: string; available: boolean }[];
    friday: { start: string; end: string; available: boolean }[];
    saturday: { start: string; end: string; available: boolean }[];
    sunday: { start: string; end: string; available: boolean }[];
  };
  bookingRequirements: {
    advanceBooking: number; // hours
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    requiresApproval: boolean;
    minimumNotice: number; // hours
  };
  requirements: string[]; // what customer needs to bring/prepare
  includes: string[]; // what's included in the service
  excludes: string[]; // what's not included
}

export interface ExperienceUploadData extends BaseUploadData {
  type: 'experience';
  category: ServiceCategory;
  duration: string;
  groupSize: {
    minimum: number;
    maximum: number;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  pricePerPerson: number;
  currency: string;
  includes: string[];
  excludes: string[];
  requirements: string[];
  whatToBring: string[];
  meetingPoint: string;
  availability: {
    monday: { start: string; end: string; available: boolean }[];
    tuesday: { start: string; end: string; available: boolean }[];
    wednesday: { start: string; end: string; available: boolean }[];
    thursday: { start: string; end: string; available: boolean }[];
    friday: { start: string; end: string; available: boolean }[];
    saturday: { start: string; end: string; available: boolean }[];
    sunday: { start: string; end: string; available: boolean }[];
  };
  bookingRequirements: {
    advanceBooking: number; // hours
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    requiresApproval: boolean;
  };
}

export interface GroupUploadData extends BaseUploadData {
  type: 'group';
  groupType: 'free' | 'paid';
  privacy: 'public' | 'private';
  membershipFee?: number;
  currency?: string;
  billingPeriod?: 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  requiresApproval: boolean;
  maxMembers?: number;
  allowDiscussions: boolean;
}

export type UploadData = 
  | PostUploadData 
  | ListingUploadData 
  | EventUploadData 
  | MusicUploadData 
  | RentalUploadData 
  | ServiceUploadData 
  | ExperienceUploadData
  | GroupUploadData;

export interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  available: boolean;
  price?: number;
  capacity?: number;
  bookedCount?: number;
}

export interface BookingRequest {
  id: string;
  serviceId: string;
  customerId: string;
  date: string;
  startTime: string;
  endTime: string;
  guests?: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityRule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  available: boolean;
  price?: number;
  capacity?: number;
}

export interface PricingRule {
  type: 'base' | 'peak' | 'discount';
  name: string;
  multiplier: number; // 1.0 = normal price, 1.5 = 50% markup, 0.8 = 20% discount
  conditions: {
    dayOfWeek?: number[];
    dateRange?: { start: string; end: string };
    timeRange?: { start: string; end: string };
    minimumDuration?: number;
    maximumDuration?: number;
  };
}


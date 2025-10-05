import { supabase } from '@/lib/supabase';

export interface CreateListingData {
  type: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  category: string;
  businessType: string;
  
  // Event specific
  eventType?: string;
  ageRestriction?: string;
  date?: string;
  time?: string;
  endTime?: string;
  capacity?: number;
  location?: string;
  
  // Hosting specific
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  guestCapacity?: number;
  minStay?: string;
  amenities: string[];
  houseRules: string[];
  safetyFeatures?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  
  // Media specific
  streamingPrice?: number;
  downloadPrice?: number;
  isStreamable: boolean;
  isDownloadable: boolean;
  
  // Ticket types
  ticketTypes: Array<{
    name: string;
    price: number;
    description: string;
    quantity: number;
    salesStart?: string;
    salesEnd?: string;
    minPerOrder?: number;
    maxPerOrder?: number;
    transferable?: boolean;
    refundable?: boolean;
  }>;
  
  // Add-ons
  addOns: Array<{
    name: string;
    price: number;
    description: string;
    isRequired: boolean;
  }>;
}

export async function createListing(data: CreateListingData, userId: string) {
  try {
    // Create the main listing
    const { data: listing, error: listingError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title: data.title,
        content: data.description,
        price: data.price,
        currency: data.currency,
        tags: data.tags,
        category: data.category,
        type: data.type,
        business_type: data.businessType,
        
        // Event fields
        event_type: data.eventType,
        age_restriction: data.ageRestriction,
        event_date: data.date,
        event_time: data.time,
        event_end_time: data.endTime,
        capacity: data.capacity,
        location: data.location,
        
        // Hosting fields
        property_type: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        beds: data.beds,
        guest_capacity: data.guestCapacity,
        min_stay: data.minStay,
        amenities: data.amenities,
        house_rules: data.houseRules,
        safety_features: data.safetyFeatures,
        check_in_time: data.checkInTime,
        check_out_time: data.checkOutTime,
        
        // Media fields
        streaming_price: data.streamingPrice,
        download_price: data.downloadPrice,
        is_streamable: data.isStreamable,
        is_downloadable: data.isDownloadable,
        
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (listingError) {
      throw new Error(`Failed to create listing: ${listingError.message}`);
    }

    // Create ticket types if any
    if (data.ticketTypes.length > 0) {
      const ticketData = data.ticketTypes.map(ticket => ({
        post_id: listing.id,
        name: ticket.name,
        price: ticket.price,
        description: ticket.description,
        quantity: ticket.quantity,
        sold: 0,
        sales_start: ticket.salesStart,
        sales_end: ticket.salesEnd,
        min_per_order: ticket.minPerOrder || 1,
        max_per_order: ticket.maxPerOrder || 10,
        transferable: ticket.transferable || true,
        refundable: ticket.refundable || true,
        created_at: new Date().toISOString()
      }));

      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticketData);

      if (ticketError) {
        console.warn('Failed to create ticket types:', ticketError.message);
      }
    }

    // Create add-ons if any
    if (data.addOns.length > 0) {
      const addOnData = data.addOns.map(addOn => ({
        post_id: listing.id,
        name: addOn.name,
        price: addOn.price,
        description: addOn.description,
        is_required: addOn.isRequired,
        created_at: new Date().toISOString()
      }));

      const { error: addOnError } = await supabase
        .from('add_ons')
        .insert(addOnData);

      if (addOnError) {
        console.warn('Failed to create add-ons:', addOnError.message);
      }
    }

    return { success: true, listing };
  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function uploadMediaFiles(files: File[], listingId: string) {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${listingId}_${Date.now()}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return {
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        post_id: listingId,
        created_at: new Date().toISOString()
      };
    });

    const mediaData = await Promise.all(uploadPromises);

    // Save media metadata to database
    const { error: mediaError } = await supabase
      .from('post_media')
      .insert(mediaData);

    if (mediaError) {
      throw new Error(`Failed to save media metadata: ${mediaError.message}`);
    }

    return { success: true, media: mediaData };
  } catch (error) {
    console.error('Error uploading media:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

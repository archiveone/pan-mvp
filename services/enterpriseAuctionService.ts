import { supabase } from './supabaseClient';
import type {
  AuctionHouse,
  AuctionEvent,
  AuctionLot,
  AuctionBidderRegistration,
  AuctionLotBid,
  AuctionAbsenteeBid,
  AuctionPhoneBid,
  AuctionInvoice,
  AuctionSettlement,
  AuctionConditionReport,
  CreateAuctionHouseRequest,
  CreateAuctionEventRequest,
  CreateAuctionLotRequest,
  RegisterBidderRequest,
  PlaceLotBidRequest,
  SubmitAbsenteeBidRequest,
  RequestPhoneBidRequest,
  AuctionEventFilters,
  AuctionLotFilters
} from '../types/enterprise-auctions';

export class EnterpriseAuctionService {
  // ============= AUCTION HOUSES =============
  
  /**
   * Create a new auction house
   */
  static async createAuctionHouse(
    ownerId: string,
    data: CreateAuctionHouseRequest
  ): Promise<AuctionHouse> {
    const { data: house, error } = await supabase
      .from('auction_houses')
      .insert({
        owner_id: ownerId,
        ...data
      })
      .select()
      .single();
    
    if (error) throw error;
    return house;
  }
  
  /**
   * Get auction houses
   */
  static async getAuctionHouses(status?: string): Promise<AuctionHouse[]> {
    let query = supabase
      .from('auction_houses')
      .select(`
        *,
        owner:profiles!owner_id(id, username, avatar_url)
      `);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get single auction house
   */
  static async getAuctionHouse(id: string): Promise<AuctionHouse | null> {
    const { data, error } = await supabase
      .from('auction_houses')
      .select(`
        *,
        owner:profiles!owner_id(id, username, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update auction house
   */
  static async updateAuctionHouse(
    id: string,
    updates: Partial<AuctionHouse>
  ): Promise<AuctionHouse> {
    const { data, error } = await supabase
      .from('auction_houses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============= AUCTION EVENTS =============
  
  /**
   * Create auction event
   */
  static async createAuctionEvent(
    data: CreateAuctionEventRequest
  ): Promise<AuctionEvent> {
    const { data: event, error } = await supabase
      .from('auction_events')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return event;
  }
  
  /**
   * Get auction events with filters
   */
  static async getAuctionEvents(filters?: AuctionEventFilters): Promise<AuctionEvent[]> {
    let query = supabase
      .from('auction_events')
      .select(`
        *,
        auction_house:auction_houses(*)
      `);
    
    if (filters?.auction_house_id) {
      query = query.eq('auction_house_id', filters.auction_house_id);
    }
    
    if (filters?.event_type && filters.event_type.length > 0) {
      query = query.in('event_type', filters.event_type);
    }
    
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.upcoming) {
      query = query
        .gte('bidding_start_date', new Date().toISOString())
        .in('status', ['scheduled', 'preview']);
    }
    
    if (filters?.live_now) {
      query = query.eq('status', 'live');
    }
    
    if (filters?.search_query) {
      query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
    }
    
    // Sorting
    switch (filters?.sort_by) {
      case 'date':
        query = query.order('bidding_start_date', { ascending: true });
        break;
      case 'lots':
        query = query.order('lot_count', { ascending: false });
        break;
      case 'featured':
        query = query.order('is_featured', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get single auction event
   */
  static async getAuctionEvent(id: string): Promise<AuctionEvent | null> {
    const { data, error } = await supabase
      .from('auction_events')
      .select(`
        *,
        auction_house:auction_houses(*),
        auctioneer:profiles!auctioneer_id(id, username, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update auction event
   */
  static async updateAuctionEvent(
    id: string,
    updates: Partial<AuctionEvent>
  ): Promise<AuctionEvent> {
    const { data, error } = await supabase
      .from('auction_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get live auction dashboard
   */
  static async getLiveAuctionDashboard() {
    const { data, error } = await supabase
      .from('live_auction_dashboard')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= AUCTION LOTS =============
  
  /**
   * Create auction lot
   */
  static async createAuctionLot(
    consignorId: string,
    data: CreateAuctionLotRequest
  ): Promise<AuctionLot> {
    const { data: lot, error } = await supabase
      .from('auction_lots')
      .insert({
        consignor_id: consignorId,
        ...data,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment lot count on event
    await supabase
      .from('auction_events')
      .update({ lot_count: supabase.sql`lot_count + 1` })
      .eq('id', data.auction_event_id);
    
    return lot;
  }
  
  /**
   * Get auction lots with filters
   */
  static async getAuctionLots(filters?: AuctionLotFilters): Promise<AuctionLot[]> {
    let query = supabase
      .from('auction_lots')
      .select(`
        *,
        auction_event:auction_events(*),
        consignor:profiles!consignor_id(id, username, email)
      `);
    
    if (filters?.auction_event_id) {
      query = query.eq('auction_event_id', filters.auction_event_id);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.artist_maker) {
      query = query.ilike('artist_maker', `%${filters.artist_maker}%`);
    }
    
    if (filters?.estimate_min) {
      query = query.gte('estimate_low', filters.estimate_min);
    }
    
    if (filters?.estimate_max) {
      query = query.lte('estimate_high', filters.estimate_max);
    }
    
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters?.has_reserve !== undefined) {
      if (filters.has_reserve) {
        query = query.not('reserve_price', 'is', null);
      } else {
        query = query.is('reserve_price', null);
      }
    }
    
    if (filters?.search_query) {
      query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%,artist_maker.ilike.%${filters.search_query}%`);
    }
    
    // Sorting
    switch (filters?.sort_by) {
      case 'lot_number':
        query = query.order('lot_number', { ascending: true });
        break;
      case 'estimate':
        query = query.order('estimate_high', { ascending: false });
        break;
      default:
        query = query.order('lot_number', { ascending: true });
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get single auction lot
   */
  static async getAuctionLot(id: string): Promise<AuctionLot | null> {
    const { data, error } = await supabase
      .from('auction_lots')
      .select(`
        *,
        auction_event:auction_events(*),
        consignor:profiles!consignor_id(id, username, email),
        winning_bidder:profiles!winning_bidder_id(id, username)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update auction lot
   */
  static async updateAuctionLot(
    id: string,
    updates: Partial<AuctionLot>
  ): Promise<AuctionLot> {
    const { data, error } = await supabase
      .from('auction_lots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Approve lot for auction
   */
  static async approveLot(lotId: string): Promise<AuctionLot> {
    return this.updateAuctionLot(lotId, { status: 'approved' });
  }
  
  /**
   * Catalog lot (make it active)
   */
  static async catalogLot(lotId: string): Promise<AuctionLot> {
    return this.updateAuctionLot(lotId, { status: 'cataloged' });
  }
  
  /**
   * Withdraw lot from auction
   */
  static async withdrawLot(lotId: string, reason?: string): Promise<AuctionLot> {
    return this.updateAuctionLot(lotId, { 
      status: 'withdrawn',
      catalog_note: reason 
    });
  }
  
  // ============= BIDDER REGISTRATION =============
  
  /**
   * Register bidder for auction event
   */
  static async registerBidder(
    bidderId: string,
    data: RegisterBidderRequest
  ): Promise<AuctionBidderRegistration> {
    // Get auction house ID from event
    const { data: event } = await supabase
      .from('auction_events')
      .select('auction_house_id')
      .eq('id', data.auction_event_id)
      .single();
    
    if (!event) throw new Error('Auction event not found');
    
    const { data: registration, error } = await supabase
      .from('auction_bidder_registrations')
      .insert({
        bidder_id: bidderId,
        auction_house_id: event.auction_house_id,
        ...data,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return registration;
  }
  
  /**
   * Get bidder registration
   */
  static async getBidderRegistration(
    eventId: string,
    bidderId: string
  ): Promise<AuctionBidderRegistration | null> {
    const { data, error } = await supabase
      .from('auction_bidder_registrations')
      .select(`
        *,
        bidder:profiles!bidder_id(id, username, email, phone),
        auction_event:auction_events(*)
      `)
      .eq('auction_event_id', eventId)
      .eq('bidder_id', bidderId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  /**
   * Approve bidder registration
   */
  static async approveBidderRegistration(
    registrationId: string,
    approvedBy: string,
    paddleNumber?: string
  ): Promise<AuctionBidderRegistration> {
    const { data, error } = await supabase
      .from('auction_bidder_registrations')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_date: new Date().toISOString(),
        paddle_number: paddleNumber || `P${Math.floor(Math.random() * 9000) + 1000}`
      })
      .eq('id', registrationId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment registered bidders count
    const registration = data as AuctionBidderRegistration;
    await supabase
      .from('auction_events')
      .update({ registered_bidders: supabase.sql`registered_bidders + 1` })
      .eq('id', registration.auction_event_id);
    
    return data;
  }
  
  /**
   * Reject bidder registration
   */
  static async rejectBidderRegistration(
    registrationId: string,
    reason: string
  ): Promise<AuctionBidderRegistration> {
    const { data, error } = await supabase
      .from('auction_bidder_registrations')
      .update({
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', registrationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get all registrations for an event
   */
  static async getEventRegistrations(eventId: string): Promise<AuctionBidderRegistration[]> {
    const { data, error } = await supabase
      .from('auction_bidder_registrations')
      .select(`
        *,
        bidder:profiles!bidder_id(id, username, email, phone)
      `)
      .eq('auction_event_id', eventId)
      .order('registration_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= BIDDING =============
  
  /**
   * Place a bid on a lot
   */
  static async placeBid(
    bidderId: string,
    data: PlaceLotBidRequest
  ): Promise<AuctionLotBid> {
    // Get lot and validate
    const lot = await this.getAuctionLot(data.lot_id);
    if (!lot) throw new Error('Lot not found');
    if (lot.status !== 'active') throw new Error('Lot is not active for bidding');
    
    // Get bidder registration
    const { data: registration } = await supabase
      .from('auction_bidder_registrations')
      .select('*')
      .eq('auction_event_id', lot.auction_event_id)
      .eq('bidder_id', bidderId)
      .eq('status', 'approved')
      .single();
    
    if (!registration) {
      throw new Error('Bidder not registered or approved for this auction');
    }
    
    // Validate bid amount
    const minBid = (lot.current_bid || lot.starting_bid || 0) + lot.bid_increment;
    if (data.bid_amount < minBid) {
      throw new Error(`Bid must be at least ${minBid}`);
    }
    
    // Check credit limit
    if (registration.credit_limit && data.bid_amount > registration.credit_limit) {
      throw new Error('Bid exceeds your approved credit limit');
    }
    
    // Place the bid (trigger will handle lot updates)
    const { data: bid, error } = await supabase
      .from('auction_lot_bids')
      .insert({
        lot_id: data.lot_id,
        bidder_id: bidderId,
        bidder_registration_id: registration.id,
        bid_amount: data.bid_amount,
        bid_type: data.bid_type || 'online',
        is_proxy_bid: data.is_proxy_bid || false,
        max_proxy_amount: data.max_proxy_amount
      })
      .select()
      .single();
    
    if (error) throw error;
    return bid;
  }
  
  /**
   * Get bids for a lot
   */
  static async getLotBids(lotId: string): Promise<AuctionLotBid[]> {
    const { data, error } = await supabase
      .from('auction_lot_bids')
      .select(`
        *,
        bidder:profiles!bidder_id(id, username),
        bidder_registration:auction_bidder_registrations(paddle_number)
      `)
      .eq('lot_id', lotId)
      .order('placed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Submit absentee/commission bid
   */
  static async submitAbsenteeBid(
    bidderId: string,
    data: SubmitAbsenteeBidRequest
  ): Promise<AuctionAbsenteeBid> {
    // Validate registration
    const { data: registration } = await supabase
      .from('auction_bidder_registrations')
      .select('*, auction_event:auction_events(id)')
      .eq('id', data.bidder_registration_id)
      .eq('bidder_id', bidderId)
      .single();
    
    if (!registration) throw new Error('Invalid registration');
    
    const { data: absenteeBid, error } = await supabase
      .from('auction_absentee_bids')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return absenteeBid;
  }
  
  /**
   * Request phone bidding
   */
  static async requestPhoneBid(
    bidderId: string,
    data: RequestPhoneBidRequest
  ): Promise<AuctionPhoneBid> {
    // Get lot to find auction event
    const lot = await this.getAuctionLot(data.lot_id);
    if (!lot) throw new Error('Lot not found');
    
    // Get registration
    const registration = await this.getBidderRegistration(lot.auction_event_id, bidderId);
    if (!registration) throw new Error('Not registered for this auction');
    
    const { data: phoneBid, error } = await supabase
      .from('auction_phone_bids')
      .insert({
        lot_id: data.lot_id,
        bidder_registration_id: registration.id,
        phone_number: data.phone_number,
        alternate_phone: data.alternate_phone
      })
      .select()
      .single();
    
    if (error) throw error;
    return phoneBid;
  }
  
  // ============= POST-AUCTION =============
  
  /**
   * Generate invoice for winning bidder
   */
  static async generateInvoice(
    eventId: string,
    buyerId: string
  ): Promise<AuctionInvoice> {
    // Get all lots won by buyer
    const { data: lots } = await supabase
      .from('auction_lots')
      .select('*')
      .eq('auction_event_id', eventId)
      .eq('winning_bidder_id', buyerId)
      .eq('status', 'sold');
    
    if (!lots || lots.length === 0) {
      throw new Error('No lots won by this buyer');
    }
    
    // Calculate totals
    const subtotal = lots.reduce((sum, lot) => sum + (lot.hammer_price || 0), 0);
    const buyersPremium = lots.reduce((sum, lot) => sum + (lot.buyers_premium_amount || 0), 0);
    const totalAmount = subtotal + buyersPremium;
    
    // Create invoice
    const { data: invoice, error } = await supabase
      .from('auction_invoices')
      .insert({
        auction_event_id: eventId,
        buyer_id: buyerId,
        subtotal,
        buyers_premium: buyersPremium,
        total_amount: totalAmount,
        amount_outstanding: totalAmount,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        currency: lots[0].currency || 'USD'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create invoice items
    for (const lot of lots) {
      await supabase
        .from('auction_invoice_items')
        .insert({
          invoice_id: invoice.id,
          lot_id: lot.id,
          lot_number: lot.lot_number,
          description: lot.title,
          hammer_price: lot.hammer_price || 0,
          buyers_premium: lot.buyers_premium_amount || 0,
          line_total: (lot.hammer_price || 0) + (lot.buyers_premium_amount || 0),
          currency: lot.currency || 'USD'
        });
    }
    
    return invoice;
  }
  
  /**
   * Generate settlement for consignor
   */
  static async generateSettlement(
    eventId: string,
    sellerId: string
  ): Promise<AuctionSettlement> {
    // Get all lots sold by seller
    const { data: lots } = await supabase
      .from('auction_lots')
      .select('*')
      .eq('auction_event_id', eventId)
      .eq('consignor_id', sellerId)
      .eq('status', 'sold');
    
    if (!lots || lots.length === 0) {
      throw new Error('No lots sold by this seller');
    }
    
    // Calculate totals
    const grossProceeds = lots.reduce((sum, lot) => sum + (lot.hammer_price || 0), 0);
    const sellersCommission = lots.reduce((sum, lot) => sum + (lot.sellers_commission_amount || 0), 0);
    const netProceeds = grossProceeds - sellersCommission;
    
    // Create settlement
    const { data: settlement, error } = await supabase
      .from('auction_settlements')
      .insert({
        auction_event_id: eventId,
        seller_id: sellerId,
        gross_proceeds: grossProceeds,
        sellers_commission: sellersCommission,
        net_proceeds: netProceeds,
        currency: lots[0].currency || 'USD'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create settlement items
    for (const lot of lots) {
      await supabase
        .from('auction_settlement_items')
        .insert({
          settlement_id: settlement.id,
          lot_id: lot.id,
          lot_number: lot.lot_number,
          description: lot.title,
          hammer_price: lot.hammer_price || 0,
          commission_amount: lot.sellers_commission_amount || 0,
          net_amount: (lot.hammer_price || 0) - (lot.sellers_commission_amount || 0),
          currency: lot.currency || 'USD'
        });
    }
    
    return settlement;
  }
  
  /**
   * Mark lot as sold (hammer falls)
   */
  static async markLotSold(lotId: string): Promise<AuctionLot> {
    const lot = await this.getAuctionLot(lotId);
    if (!lot) throw new Error('Lot not found');
    
    // Calculate fees
    const hammerPrice = lot.current_bid || 0;
    const event = await this.getAuctionEvent(lot.auction_event_id);
    if (!event) throw new Error('Event not found');
    
    const buyersPremiumPct = event.buyers_premium || event.auction_house?.default_buyers_premium || 15;
    const sellerCommissionPct = event.sellers_commission || event.auction_house?.default_sellers_commission || 10;
    
    const buyersPremiumAmount = hammerPrice * (buyersPremiumPct / 100);
    const sellerCommissionAmount = hammerPrice * (sellerCommissionPct / 100);
    const totalBuyerPrice = hammerPrice + buyersPremiumAmount;
    const totalSellerPayout = hammerPrice - sellerCommissionAmount;
    
    return this.updateAuctionLot(lotId, {
      status: 'sold',
      hammer_price: hammerPrice,
      buyers_premium_amount: buyersPremiumAmount,
      buyers_premium_percentage: buyersPremiumPct,
      sellers_commission_amount: sellerCommissionAmount,
      sellers_commission_percentage: sellerCommissionPct,
      total_buyer_price: totalBuyerPrice,
      total_seller_payout: totalSellerPayout,
      sold_date: new Date().toISOString()
    });
  }
  
  // ============= CONDITION REPORTS =============
  
  /**
   * Request condition report
   */
  static async requestConditionReport(
    lotId: string,
    requestedBy?: string,
    requestType: 'standard' | 'detailed' | 'third_party' = 'standard'
  ): Promise<AuctionConditionReport> {
    const { data, error } = await supabase
      .from('auction_condition_reports')
      .insert({
        lot_id: lotId,
        requested_by: requestedBy,
        request_type: requestType
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment request count on lot
    await supabase
      .from('auction_lots')
      .update({ condition_report_requests: supabase.sql`condition_report_requests + 1` })
      .eq('id', lotId);
    
    return data;
  }
  
  /**
   * Complete condition report
   */
  static async completeConditionReport(
    reportId: string,
    completedBy: string,
    report: {
      condition_summary?: string;
      detailed_report?: string;
      images?: string[];
      pdf_url?: string;
    }
  ): Promise<AuctionConditionReport> {
    const { data, error } = await supabase
      .from('auction_condition_reports')
      .update({
        ...report,
        status: 'completed',
        completed_by: completedBy,
        completed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}


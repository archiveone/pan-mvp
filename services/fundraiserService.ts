import { supabase } from './supabaseClient';
import type {
  Fundraiser,
  FundraiserReward,
  FundraiserContribution,
  FundraiserUpdate,
  FundraiserMilestone,
  CreateFundraiserRequest,
  UpdateFundraiserRequest,
  CreateRewardRequest,
  CreateContributionRequest,
  CreateUpdateRequest,
  CreateMilestoneRequest,
  FundraiserFilters,
  ActiveFundraiserView
} from '../types/fundraisers';

export class FundraiserService {
  // ============= FUNDRAISER CAMPAIGNS =============
  
  /**
   * Get all fundraisers with optional filters
   */
  static async getFundraisers(filters?: FundraiserFilters): Promise<Fundraiser[]> {
    let query = supabase
      .from('fundraisers')
      .select(`
        *,
        creator:profiles!user_id(id, username, avatar_url)
      `);
    
    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.campaign_type && filters.campaign_type.length > 0) {
      query = query.in('campaign_type', filters.campaign_type);
    }
    
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters?.goal_min) {
      query = query.gte('goal_amount', filters.goal_min);
    }
    
    if (filters?.goal_max) {
      query = query.lte('goal_amount', filters.goal_max);
    }
    
    if (filters?.is_charity !== undefined) {
      query = query.eq('is_charity', filters.is_charity);
    }
    
    if (filters?.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }
    
    if (filters?.is_featured) {
      query = query.eq('is_featured', true);
    }
    
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    if (filters?.search_query) {
      query = query.or(`title.ilike.%${filters.search_query}%,story.ilike.%${filters.search_query}%`);
    }
    
    if (filters?.ending_soon) {
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .eq('status', 'active')
        .lte('end_date', in7Days);
    }
    
    if (filters?.nearly_funded) {
      // This is a bit tricky - we need to calculate on the fly
      query = query.eq('status', 'active');
      // Note: Filtering by percentage would require custom SQL or post-processing
    }
    
    // Sorting
    switch (filters?.sort_by) {
      case 'trending':
        query = query.order('backer_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'ending_soon':
        query = query.order('end_date', { ascending: true });
        break;
      case 'most_funded':
        query = query.order('current_amount', { ascending: false });
        break;
      case 'most_backers':
        query = query.order('backer_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }
    
    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Calculate progress percentage for each
    return (data || []).map(f => ({
      ...f,
      progress_percentage: (f.current_amount / f.goal_amount) * 100,
      days_left: Math.ceil((new Date(f.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }));
  }
  
  /**
   * Get a single fundraiser by ID
   */
  static async getFundraiser(id: string): Promise<Fundraiser | null> {
    const { data, error } = await supabase
      .from('fundraisers')
      .select(`
        *,
        creator:profiles!user_id(id, username, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (data) {
      return {
        ...data,
        progress_percentage: (data.current_amount / data.goal_amount) * 100,
        days_left: Math.ceil((new Date(data.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      };
    }
    
    return null;
  }
  
  /**
   * Get active fundraisers (using database view)
   */
  static async getActiveFundraisers(): Promise<ActiveFundraiserView[]> {
    const { data, error } = await supabase
      .from('active_fundraisers')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create a new fundraiser
   */
  static async createFundraiser(userId: string, fundraiser: CreateFundraiserRequest): Promise<Fundraiser> {
    const { data, error } = await supabase
      .from('fundraisers')
      .insert({
        user_id: userId,
        ...fundraiser,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update a fundraiser
   */
  static async updateFundraiser(id: string, updates: UpdateFundraiserRequest): Promise<Fundraiser> {
    const { data, error } = await supabase
      .from('fundraisers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete a fundraiser
   */
  static async deleteFundraiser(id: string): Promise<void> {
    const { error } = await supabase
      .from('fundraisers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  /**
   * Publish a fundraiser (change status from draft to active)
   */
  static async publishFundraiser(id: string): Promise<Fundraiser> {
    return this.updateFundraiser(id, { status: 'active' });
  }
  
  /**
   * Get user's fundraisers
   */
  static async getUserFundraisers(userId: string): Promise<Fundraiser[]> {
    const { data, error } = await supabase
      .from('fundraisers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= REWARDS =============
  
  /**
   * Get rewards for a fundraiser
   */
  static async getRewards(fundraiserId: string): Promise<FundraiserReward[]> {
    const { data, error } = await supabase
      .from('fundraiser_rewards')
      .select('*')
      .eq('fundraiser_id', fundraiserId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    // Add computed fields
    return (data || []).map(r => ({
      ...r,
      is_sold_out: r.is_limited && r.quantity_available !== null && r.quantity_claimed >= r.quantity_available,
      backers_count: r.quantity_claimed
    }));
  }
  
  /**
   * Create a reward tier
   */
  static async createReward(reward: CreateRewardRequest): Promise<FundraiserReward> {
    const { data, error } = await supabase
      .from('fundraiser_rewards')
      .insert(reward)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update a reward
   */
  static async updateReward(id: string, updates: Partial<FundraiserReward>): Promise<FundraiserReward> {
    const { data, error } = await supabase
      .from('fundraiser_rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete a reward
   */
  static async deleteReward(id: string): Promise<void> {
    const { error } = await supabase
      .from('fundraiser_rewards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // ============= CONTRIBUTIONS =============
  
  /**
   * Get contributions for a fundraiser
   */
  static async getContributions(fundraiserId: string): Promise<FundraiserContribution[]> {
    const { data, error } = await supabase
      .from('fundraiser_contributions')
      .select(`
        *,
        contributor:profiles!contributor_id(id, username, avatar_url),
        reward:fundraiser_rewards(*)
      `)
      .eq('fundraiser_id', fundraiserId)
      .order('pledged_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create a contribution
   */
  static async createContribution(
    userId: string | null, 
    contribution: CreateContributionRequest
  ): Promise<FundraiserContribution> {
    const { data, error } = await supabase
      .from('fundraiser_contributions')
      .insert({
        contributor_id: userId,
        ...contribution,
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update contribution status (e.g., after payment)
   */
  static async updateContribution(
    id: string, 
    updates: Partial<FundraiserContribution>
  ): Promise<FundraiserContribution> {
    const { data, error } = await supabase
      .from('fundraiser_contributions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get user's contributions
   */
  static async getUserContributions(userId: string): Promise<FundraiserContribution[]> {
    const { data, error } = await supabase
      .from('fundraiser_contributions')
      .select(`
        *,
        fundraiser:fundraisers(*),
        reward:fundraiser_rewards(*)
      `)
      .eq('contributor_id', userId)
      .order('pledged_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get recent contributions (for displaying on campaign page)
   */
  static async getRecentContributions(fundraiserId: string, limit: number = 10): Promise<FundraiserContribution[]> {
    const { data, error } = await supabase
      .from('fundraiser_contributions')
      .select(`
        *,
        contributor:profiles!contributor_id(id, username, avatar_url)
      `)
      .eq('fundraiser_id', fundraiserId)
      .eq('payment_status', 'completed')
      .order('pledged_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= UPDATES =============
  
  /**
   * Get updates for a fundraiser
   */
  static async getUpdates(fundraiserId: string, userId?: string): Promise<FundraiserUpdate[]> {
    let query = supabase
      .from('fundraiser_updates')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `)
      .eq('fundraiser_id', fundraiserId);
    
    // If user is not authenticated or not a backer, filter out backers-only updates
    if (!userId) {
      query = query.eq('is_backers_only', false);
    } else {
      // Check if user is a backer
      const { data: contributions } = await supabase
        .from('fundraiser_contributions')
        .select('id')
        .eq('fundraiser_id', fundraiserId)
        .eq('contributor_id', userId)
        .eq('payment_status', 'completed');
      
      if (!contributions || contributions.length === 0) {
        query = query.eq('is_backers_only', false);
      }
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create a fundraiser update
   */
  static async createUpdate(userId: string, update: CreateUpdateRequest): Promise<FundraiserUpdate> {
    const { data, error } = await supabase
      .from('fundraiser_updates')
      .insert({
        author_id: userId,
        ...update
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment update count
    await supabase
      .from('fundraisers')
      .update({ update_count: supabase.sql`update_count + 1` })
      .eq('id', update.fundraiser_id);
    
    return data;
  }
  
  /**
   * Update a fundraiser update
   */
  static async updateUpdate(id: string, updates: Partial<FundraiserUpdate>): Promise<FundraiserUpdate> {
    const { data, error } = await supabase
      .from('fundraiser_updates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete an update
   */
  static async deleteUpdate(id: string, fundraiserId: string): Promise<void> {
    const { error } = await supabase
      .from('fundraiser_updates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Decrement update count
    await supabase
      .from('fundraisers')
      .update({ update_count: supabase.sql`GREATEST(0, update_count - 1)` })
      .eq('id', fundraiserId);
  }
  
  // ============= MILESTONES =============
  
  /**
   * Get milestones for a fundraiser
   */
  static async getMilestones(fundraiserId: string): Promise<FundraiserMilestone[]> {
    const { data, error } = await supabase
      .from('fundraiser_milestones')
      .select('*')
      .eq('fundraiser_id', fundraiserId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create a milestone
   */
  static async createMilestone(milestone: CreateMilestoneRequest): Promise<FundraiserMilestone> {
    const { data, error } = await supabase
      .from('fundraiser_milestones')
      .insert(milestone)
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment milestone count
    await supabase
      .from('fundraisers')
      .update({ milestone_count: supabase.sql`milestone_count + 1` })
      .eq('id', milestone.fundraiser_id);
    
    return data;
  }
  
  /**
   * Update a milestone
   */
  static async updateMilestone(id: string, updates: Partial<FundraiserMilestone>): Promise<FundraiserMilestone> {
    const { data, error } = await supabase
      .from('fundraiser_milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete a milestone
   */
  static async deleteMilestone(id: string, fundraiserId: string): Promise<void> {
    const { error } = await supabase
      .from('fundraiser_milestones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Decrement milestone count
    await supabase
      .from('fundraisers')
      .update({ milestone_count: supabase.sql`GREATEST(0, milestone_count - 1)` })
      .eq('id', fundraiserId);
  }
  
  /**
   * Check and mark achieved milestones
   */
  static async checkMilestones(fundraiserId: string): Promise<void> {
    const fundraiser = await this.getFundraiser(fundraiserId);
    if (!fundraiser) return;
    
    const milestones = await this.getMilestones(fundraiserId);
    
    for (const milestone of milestones) {
      if (!milestone.is_achieved && fundraiser.current_amount >= milestone.target_amount) {
        await this.updateMilestone(milestone.id, {
          is_achieved: true,
          achieved_at: new Date().toISOString()
        });
      }
    }
  }
  
  // ============= ADMIN FUNCTIONS =============
  
  /**
   * Close ended fundraisers (should be run periodically)
   */
  static async closeEndedFundraisers(): Promise<void> {
    const { error } = await supabase.rpc('close_ended_fundraisers');
    if (error) throw error;
  }
  
  /**
   * Increment view count
   */
  static async incrementViewCount(fundraiserId: string): Promise<void> {
    const { error } = await supabase
      .from('fundraisers')
      .update({ view_count: supabase.sql`view_count + 1` })
      .eq('id', fundraiserId);
    
    if (error) throw error;
  }
  
  /**
   * Increment share count
   */
  static async incrementShareCount(fundraiserId: string): Promise<void> {
    const { error } = await supabase
      .from('fundraisers')
      .update({ share_count: supabase.sql`share_count + 1` })
      .eq('id', fundraiserId);
    
    if (error) throw error;
  }
}


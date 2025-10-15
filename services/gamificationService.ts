import { supabase } from '@/lib/supabase';

export interface UserStats {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsToNextLevel: number;
  dailyStreak: number;
  longestStreak: number;
  globalRank?: number;
  localRank?: number;
  totalPosts: number;
  totalSales: number;
  totalBookings: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  totalRevenue: number;
  responseRate: number;
  averageResponseTime?: number;
  completionRate: number;
}

export interface Achievement {
  id: string;
  achievementType: string;
  achievementName: string;
  achievementDescription: string;
  achievementIcon: string;
  achievementColor: string;
  pointsEarned: number;
  progressCurrent: number;
  progressTarget?: number;
  progressPercentage: number;
  earnedAt: Date;
}

export interface PointTransaction {
  id: string;
  pointsChange: number;
  reason: string;
  description?: string;
  balanceAfter: number;
  createdAt: Date;
}

class GamificationService {
  // Get user's stats and level
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Initialize stats for new user
        await this.initializeUserStats(userId);
        return this.getUserStats(userId);
      }

      return {
        totalPoints: data.total_points,
        currentLevel: data.current_level,
        levelName: data.level_name,
        pointsToNextLevel: data.points_to_next_level,
        dailyStreak: data.daily_streak,
        longestStreak: data.longest_streak,
        globalRank: data.global_rank,
        localRank: data.local_rank,
        totalPosts: data.total_posts,
        totalSales: data.total_sales,
        totalBookings: data.total_bookings,
        totalReviews: data.total_reviews_received,
        averageRating: data.average_rating,
        totalViews: data.total_views,
        totalRevenue: data.total_revenue,
        responseRate: data.response_rate,
        averageResponseTime: data.average_response_time_minutes,
        completionRate: data.completion_rate
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Initialize stats for new user
  private async initializeUserStats(userId: string) {
    try {
      await supabase
        .from('user_gamification')
        .insert({
          user_id: userId,
          total_points: 0,
          current_level: 1,
          level_name: 'Beginner',
          points_to_next_level: 500
        });
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }

  // Award points to user
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    description?: string
  ) {
    try {
      await supabase.rpc('award_points', {
        p_user_id: userId,
        p_points: points,
        p_reason: reason,
        p_description: description
      });

      return { success: true };
    } catch (error) {
      console.error('Error awarding points:', error);
      return { success: false, error };
    }
  }

  // Get user's achievements
  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  // Get point transactions history
  async getPointsHistory(userId: string, limit: number = 50): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  // Update activity streak
  async updateStreak(userId: string) {
    try {
      await supabase.rpc('update_activity_streak', {
        p_user_id: userId
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { success: false, error };
    }
  }

  // Get leaderboard
  async getLeaderboard(type: 'global' | 'local' = 'global', limit: number = 10) {
    try {
      let query = supabase
        .from('user_gamification')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            username
          )
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Calculate level info
  getLevelInfo(points: number) {
    const level = Math.floor(points / 500) + 1;
    const pointsInCurrentLevel = points % 500;
    const pointsToNextLevel = 500 - pointsInCurrentLevel;
    const progressPercentage = (pointsInCurrentLevel / 500) * 100;

    const levelNames = [
      { min: 1, max: 2, name: 'Beginner', color: 'gray' },
      { min: 3, max: 4, name: 'Intermediate', color: 'blue' },
      { min: 5, max: 6, name: 'Advanced', color: 'green' },
      { min: 7, max: 9, name: 'Pro', color: 'purple' },
      { min: 10, max: 14, name: 'Expert', color: 'orange' },
      { min: 15, max: 19, name: 'Master', color: 'red' },
      { min: 20, max: 999, name: 'Legend', color: 'gold' }
    ];

    const levelInfo = levelNames.find(l => level >= l.min && level <= l.max) || levelNames[0];

    return {
      level,
      levelName: levelInfo.name,
      levelColor: levelInfo.color,
      pointsInCurrentLevel,
      pointsToNextLevel,
      progressPercentage
    };
  }

  // Check and unlock achievements
  async checkAchievements(userId: string, stats: UserStats) {
    const achievements = [];

    // First post
    if (stats.totalPosts === 1) {
      achievements.push({
        type: 'first_post',
        name: 'First Post',
        description: 'Created your first post!',
        icon: '📝',
        points: 50
      });
    }

    // First sale
    if (stats.totalSales === 1) {
      achievements.push({
        type: 'first_sale',
        name: 'First Sale',
        description: 'Made your first sale!',
        icon: '💰',
        points: 100
      });
    }

    // 10 sales milestone
    if (stats.totalSales === 10) {
      achievements.push({
        type: '10_sales',
        name: '10 Sales',
        description: 'Reached 10 successful sales',
        icon: '🎯',
        points: 200
      });
    }

    // 50 sales milestone
    if (stats.totalSales === 50) {
      achievements.push({
        type: '50_sales',
        name: '50 Sales',
        description: 'Reached 50 successful sales',
        icon: '🏆',
        points: 500
      });
    }

    // 100 sales milestone
    if (stats.totalSales === 100) {
      achievements.push({
        type: '100_sales',
        name: 'Sales Master',
        description: 'Reached 100 successful sales!',
        icon: '👑',
        points: 1000
      });
    }

    // Top rated (4.5+ stars with 10+ reviews)
    if (stats.averageRating >= 4.5 && stats.totalReviews >= 10) {
      achievements.push({
        type: 'top_rated',
        name: 'Top Rated',
        description: 'Maintained 4.5+ star rating',
        icon: '⭐',
        points: 300
      });
    }

    // Fast responder (90%+ response rate)
    if (stats.responseRate >= 90) {
      achievements.push({
        type: 'fast_responder',
        name: 'Fast Responder',
        description: '90%+ response rate',
        icon: '⚡',
        points: 150
      });
    }

    // 7-day streak
    if (stats.dailyStreak === 7) {
      achievements.push({
        type: 'weekly_streak',
        name: 'Week Warrior',
        description: '7-day activity streak',
        icon: '🔥',
        points: 100
      });
    }

    // 30-day streak
    if (stats.dailyStreak === 30) {
      achievements.push({
        type: 'monthly_streak',
        name: 'Monthly Master',
        description: '30-day activity streak',
        icon: '🌟',
        points: 500
      });
    }

    // Award achievements
    for (const achievement of achievements) {
      await this.unlockAchievement(
        userId,
        achievement.type,
        achievement.name,
        achievement.description,
        achievement.icon,
        achievement.points
      );
    }

    return achievements;
  }

  // Unlock achievement
  private async unlockAchievement(
    userId: string,
    type: string,
    name: string,
    description: string,
    icon: string,
    points: number
  ) {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_type: type,
          achievement_name: name,
          achievement_description: description,
          achievement_icon: icon,
          points_earned: points
        });

      if (error && error.code !== '23505') throw error;

      // Award points
      if (!error) {
        await this.awardPoints(userId, points, 'achievement', `Unlocked: ${name}`);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  // Update user stats (called when user performs actions)
  async updateStats(userId: string, updates: Partial<UserStats>) {
    try {
      const { error } = await supabase
        .from('user_gamification')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Check for new achievements
      const stats = await this.getUserStats(userId);
      if (stats) {
        await this.checkAchievements(userId, stats);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating stats:', error);
      return { success: false, error };
    }
  }
}

export const gamificationService = new GamificationService();


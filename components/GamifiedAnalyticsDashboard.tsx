'use client';

import { useState, useEffect } from 'react';
import { gamificationService, type UserStats, type Achievement, type PointTransaction } from '@/services/gamificationService';

export default function GamifiedAnalyticsDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const [statsData, achievementsData, pointsData] = await Promise.all([
      gamificationService.getUserStats(userId),
      gamificationService.getAchievements(userId),
      gamificationService.getPointsHistory(userId, 10)
    ]);

    setStats(statsData);
    setAchievements(achievementsData);
    setRecentPoints(pointsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!stats) return null;

  const levelInfo = gamificationService.getLevelInfo(stats.totalPoints);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Level & Points */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Level {stats.currentLevel}</h2>
            <p className="text-xl opacity-90">{stats.levelName}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-sm opacity-90">Total Points</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to Level {stats.currentLevel + 1}</span>
            <span>{stats.pointsToNextLevel} points to go</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Streak Card */}
      {stats.dailyStreak > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🔥</div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-orange-600">{stats.dailyStreak} Day Streak!</div>
              <p className="text-sm text-gray-600">Keep it going! Longest: {stats.longestStreak} days</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Bonus Points</div>
              <div className="text-xl font-bold text-green-600">+{stats.dailyStreak * 10}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Achievements ({achievements.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stats Cards */}
          <StatCard
            icon="📝"
            label="Total Posts"
            value={stats.totalPosts}
            color="blue"
          />
          <StatCard
            icon="💰"
            label="Total Sales"
            value={stats.totalSales}
            color="green"
          />
          <StatCard
            icon="📅"
            label="Bookings"
            value={stats.totalBookings}
            color="purple"
          />
          <StatCard
            icon="⭐"
            label="Avg Rating"
            value={stats.averageRating.toFixed(1)}
            color="yellow"
          />
          <StatCard
            icon="👁️"
            label="Total Views"
            value={stats.totalViews.toLocaleString()}
            color="indigo"
          />
          <StatCard
            icon="💵"
            label="Revenue"
            value={`$${stats.totalRevenue.toFixed(0)}`}
            color="green"
          />
          <StatCard
            icon="⚡"
            label="Response Rate"
            value={`${stats.responseRate.toFixed(0)}%`}
            color="orange"
          />
          <StatCard
            icon="✓"
            label="Completion Rate"
            value={`${stats.completionRate.toFixed(0)}%`}
            color="teal"
          />

          {/* Recent Points Activity */}
          <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Points Activity</h3>
            <div className="space-y-3">
              {recentPoints.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{transaction.reason}</p>
                    {transaction.description && (
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`text-lg font-bold ${transaction.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.pointsChange > 0 ? '+' : ''}{transaction.pointsChange}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="text-5xl">{achievement.achievementIcon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{achievement.achievementName}</h4>
                  <p className="text-sm text-gray-600 mb-2">{achievement.achievementDescription}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">+{achievement.pointsEarned} points</span>
                    <span className="text-xs text-gray-400">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {achievement.progressTarget && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{achievement.progressCurrent}/{achievement.progressTarget}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 rounded-full h-2"
                      style={{ width: `${achievement.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          {achievements.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-5xl mb-4">🏆</p>
              <p>No achievements yet. Start earning them!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab userId={userId} />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    orange: 'bg-orange-50 border-orange-200',
    teal: 'bg-teal-50 border-teal-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

// Leaderboard Tab
function LeaderboardTab({ userId }: { userId: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const data = await gamificationService.getLeaderboard('global', 50);
    setLeaderboard(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading leaderboard...</div>;
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold">Global Leaderboard</h3>
        <p className="text-sm text-gray-600">Top performers on the platform</p>
      </div>
      <div className="divide-y">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === userId;
          const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

          return (
            <div
              key={entry.id}
              className={`p-4 flex items-center gap-4 ${isCurrentUser ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            >
              <div className="w-12 text-center">
                {rankEmoji || <span className="text-lg font-bold text-gray-600">#{index + 1}</span>}
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                {entry.profiles?.avatar_url ? (
                  <img src={entry.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{entry.profiles?.full_name || 'User'}</p>
                <p className="text-sm text-gray-600">
                  Level {entry.current_level} • {entry.level_name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {entry.total_points.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


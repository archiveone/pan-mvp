'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface UnifiedStatsProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  change?: number; // Percentage change
  color?: 'blue' | 'purple' | 'green' | 'emerald' | 'pink' | 'indigo' | 'cyan' | 'orange' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export default function UnifiedStats({
  icon,
  label,
  value,
  subtitle,
  change,
  color = 'blue',
  size = 'md',
}: UnifiedStatsProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  const sizeClasses = {
    sm: { card: 'p-4', icon: 'p-2', iconSize: 'w-5 h-5', value: 'text-xl', label: 'text-xs' },
    md: { card: 'p-6', icon: 'p-3', iconSize: 'w-6 h-6', value: 'text-2xl', label: 'text-sm' },
    lg: { card: 'p-8', icon: 'p-4', iconSize: 'w-8 h-8', value: 'text-3xl', label: 'text-base' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl ${sizes.card} shadow-lg hover:shadow-xl transition-all`}>
      {/* Icon & Change */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex ${sizes.icon} rounded-xl ${colorClasses[color]}`}>
          <div className={sizes.iconSize}>
            {icon}
          </div>
        </div>

        {change !== undefined && (
          <span className={`flex items-center gap-1 text-sm font-semibold ${
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <h3 className={`${sizes.value} font-bold text-gray-900 dark:text-white mb-1`}>
        {value}
      </h3>

      {/* Label */}
      <p className={`${sizes.label} text-gray-600 dark:text-gray-400`}>
        {label}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}


'use client'

import { useState, useEffect } from 'react'
import { Tag, TrendingUp, X } from 'lucide-react'
import { useSmartFilters } from '../hooks/useSmartFilters'
import type { Post } from '../types'

interface SmartTagFiltersProps {
  posts: Post[]
  onTagSelect?: (tag: string) => void
  selectedTags?: string[]
  onTagsChange?: (tags: string[]) => void
  maxTags?: number
}

export default function SmartTagFilters({ 
  posts, 
  onTagSelect,
  selectedTags = [],
  onTagsChange,
  maxTags = 15 
}: SmartTagFiltersProps) {
  const { getPopularTags, getRelatedTags } = useSmartFilters(posts)
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(selectedTags)
  const [showMore, setShowMore] = useState(false)

  // Sync with parent component
  useEffect(() => {
    setLocalSelectedTags(selectedTags)
  }, [selectedTags])

  const popularTags = getPopularTags(maxTags)
  
  // Get related tags based on selected tags
  const relatedTags = localSelectedTags.length > 0
    ? getRelatedTags(localSelectedTags[0], 5)
    : []

  const handleTagClick = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim()
    const isSelected = localSelectedTags.includes(normalizedTag)

    let newTags: string[]
    if (isSelected) {
      // Remove tag
      newTags = localSelectedTags.filter(t => t !== normalizedTag)
    } else {
      // Add tag
      newTags = [...localSelectedTags, normalizedTag]
    }

    setLocalSelectedTags(newTags)
    onTagsChange?.(newTags)
    onTagSelect?.(normalizedTag)
  }

  const clearAllTags = () => {
    setLocalSelectedTags([])
    onTagsChange?.([])
  }

  const displayTags = showMore ? popularTags : popularTags.slice(0, 8)

  if (popularTags.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Trending
            </h3>
            {localSelectedTags.length > 0 && (
              <span className="text-[10px] bg-gradient-to-r from-lime-400 to-lime-300 text-black px-1.5 py-0.5 rounded-full">
                {localSelectedTags.length}
              </span>
            )}
          </div>
          
          {localSelectedTags.length > 0 && (
            <button
              onClick={clearAllTags}
              className="text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-0.5"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map(({ tag, count }) => {
            const isSelected = localSelectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`
                  px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                  flex items-center gap-1
                  ${isSelected
                    ? 'bg-gradient-to-r from-lime-400 to-lime-300 text-black shadow-sm scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Tag size={10} />
                <span>#{tag}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            )
          })}

          {/* Show More/Less Button */}
          {popularTags.length > 8 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="px-2 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {showMore ? 'Less' : `+${popularTags.length - 8}`}
            </button>
          )}
        </div>

        {/* Related Tags (when tags are selected) */}
        {localSelectedTags.length > 0 && relatedTags.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
              Similar:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {relatedTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


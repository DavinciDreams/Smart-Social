import { FeedCardProps } from '@types/index'
import { motion } from 'framer-motion'
import {
    Bookmark,
    Brain,
    Clock,
    ExternalLink,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    Star,
    Tag,
    TrendingUp,
    User
} from 'lucide-react'
import React, { useState } from 'react'

export const FeedCard: React.FC<FeedCardProps> = ({ 
  item, 
  onSave, 
  onView, 
  compact = false 
}) => {
  const [isSaved, setIsSaved] = useState(item.saved)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSave = async () => {
    try {
      await onSave(item)
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  const handleView = () => {
    onView(item)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'twitter': return 'bg-blue-100 text-blue-800'
      case 'reddit': return 'bg-orange-100 text-orange-800'
      case 'hackernews': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`
        card card-hover border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden
        ${compact ? 'p-4' : 'p-6'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Author Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            {item.author.avatar ? (
              <img 
                src={item.author.avatar} 
                alt={item.author.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          
          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">
                {item.author.name}
              </h3>
              {item.author.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(item.source.type)}`}>
                {item.source.name}
              </span>
              <Clock className="w-3 h-3" />
              <span>{formatDate(item.publishedAt)}</span>
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Brain className={`w-4 h-4 ${getQualityColor(item.relevanceScore)}`} />
            <span className={`text-sm font-medium ${getQualityColor(item.relevanceScore)}`}>
              {item.relevanceScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
          {item.title}
        </h2>
        
        {item.summary && (
          <p className="text-gray-600 leading-relaxed">
            {isExpanded 
              ? item.summary 
              : truncateText(item.summary, compact ? 150 : 300)
            }
            {item.summary.length > (compact ? 150 : 300) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary-600 hover:text-primary-700 ml-1 font-medium"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {item.tags.length > 5 && (
            <span className="text-xs text-gray-500">
              +{item.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* AI Analysis */}
      {item.aiAnalysis && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">AI Analysis</h4>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>Quality: {item.aiAnalysis.qualityScore}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3" />
                <span>Brain Rot: {item.aiAnalysis.brainRotScore}%</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {truncateText(item.aiAnalysis.reasoning, 120)}
          </p>
        </div>
      )}

      {/* Metrics */}
      {item.metrics && (
        <div className="flex items-center space-x-6 mb-4 text-sm text-gray-500">
          {item.metrics.likes && (
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{item.metrics.likes.toLocaleString()}</span>
            </div>
          )}
          {item.metrics.comments && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{item.metrics.comments.toLocaleString()}</span>
            </div>
          )}
          {item.metrics.shares && (
            <div className="flex items-center space-x-1">
              <Share2 className="w-4 h-4" />
              <span>{item.metrics.shares.toLocaleString()}</span>
            </div>
          )}
          {item.metrics.views && (
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{item.metrics.views.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${isSaved 
                ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          
          <button
            onClick={handleView}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Read</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {item.metrics?.engagementRate && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>{(item.metrics.engagementRate * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

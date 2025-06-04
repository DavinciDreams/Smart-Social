import { FeedCard } from '@components/Feed/FeedCard'
import { FeedFilters } from '@components/Feed/FeedFilters'
import { FeedPager } from '@components/Feed/FeedPager'
import { ErrorMessage } from '@components/UI/ErrorBoundary'
import { FeedCardSkeleton } from '@components/UI/LoadingSpinner'
import { useFeed } from '@hooks/useFeed'
import { ContentItem, FeedFilters as FeedFiltersType } from '@types/index'
import { motion } from 'framer-motion'
import React, { useState } from 'react'

const HomePage: React.FC = () => {
  const [filters, setFilters] = useState<Partial<FeedFiltersType>>({
    relevanceThreshold: 80,
    sources: [],
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      end: new Date().toISOString(),
    },
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'engagement' | 'quality' | 'virality'>('relevance')

  const {
    data: feedData,
    isLoading,
    error,
    refetch,
  } = useFeed({
    filters,
    sortBy,
    page: currentPage,
    limit: 20,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  })

  const handleSaveItem = async (item: ContentItem) => {
    try {
      // Implement save functionality
      console.log('Saving item:', item.id)
      // await saveItem(item.id)
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  const handleViewItem = (item: ContentItem) => {
    // Track view and open item
    console.log('Viewing item:', item.id)
    window.open(item.url, '_blank')
  }

  const handleFiltersChange = (newFilters: Partial<FeedFiltersType>) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          title="Failed to load content"
          message="We couldn't fetch your curated content. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with filters and sort options */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Curated Feed</h1>
            <p className="text-gray-600 mt-1">
              High-quality content filtered by AI to prevent brain rot
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="date">Sort by Date</option>
              <option value="engagement">Sort by Engagement</option>
              <option value="quality">Sort by Quality</option>
              <option value="virality">Sort by Virality</option>
            </select>
            
            {feedData && (
              <div className="text-sm text-gray-500">
                {feedData.totalItems} items found
              </div>
            )}
          </div>
        </div>
        
        <FeedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-6 px-6">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <FeedCardSkeleton key={i} />
              ))}
            </div>
          ) : feedData?.items.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or check back later for new content.
              </p>
              <button
                onClick={() => refetch()}
                className="btn-primary"
              >
                Refresh Feed
              </button>
            </motion.div>
          ) : (
            // Feed items
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {feedData?.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FeedCard
                      item={item}
                      onSave={handleSaveItem}
                      onView={handleViewItem}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {feedData && feedData.totalPages > 1 && (
                <div className="mt-8">
                  <FeedPager
                    currentPage={currentPage}
                    totalPages={feedData.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage

import React, { useEffect, useState } from 'react';
import { FeedCard } from '../components/Feed/FeedCard';
import { ErrorMessage } from '../components/UI/ErrorBoundary';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Recommendation } from '../types';

interface RecommendationsPageProps {}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'trending' | 'similar' | 'collaborative'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load recommendations on component mount
  useEffect(() => {
    loadRecommendations();
  }, [selectedCategory]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call to /api/recommendations
      const response = await fetch(`/api/recommendations?category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    try {
      setRefreshing(true);
      
      // TODO: Replace with actual API call to refresh recommendations
      const response = await fetch('/api/recommendations/refresh', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh recommendations');
      }
      
      await loadRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const handleItemAction = async (itemId: string, action: 'save' | 'hide' | 'like') => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/content/${itemId}/${action}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} item`);
      }
      
      // Update local state
      setRecommendations(prev => 
        prev.map(rec => ({
          ...rec,
          content: rec.content.id === itemId 
            ? { ...rec.content, saved: action === 'save' ? true : rec.content.saved }
            : rec.content
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} item`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
        <button
          onClick={loadRecommendations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
            <p className="text-gray-600 mt-1">
              Personalized content suggestions based on your interests and behavior
            </p>
          </div>
          <button
            onClick={handleRefreshRecommendations}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {refreshing ? (
              <>
                <LoadingSpinner size="small" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {(['all', 'trending', 'similar', 'collaborative'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' :
               category === 'trending' ? 'Trending' :
               category === 'similar' ? 'Similar Content' :
               'Collaborative'}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recommendations available
          </h3>
          <p className="text-gray-600 mb-4">
            We're still learning your preferences. Check back later for personalized suggestions!
          </p>
          <button
            onClick={handleRefreshRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Recommendations
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Recommendation Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      recommendation.type === 'trending' ? 'bg-red-100 text-red-800' :
                      recommendation.type === 'similar' ? 'bg-blue-100 text-blue-800' :
                      recommendation.type === 'collaborative' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {recommendation.type === 'trending' ? '🔥 Trending' :
                       recommendation.type === 'similar' ? '🔗 Similar to your interests' :
                       recommendation.type === 'collaborative' ? '👥 Others like you enjoyed' :
                       '🤖 AI Suggested'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Confidence:</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < Math.floor(recommendation.confidence * 5)
                                ? 'bg-green-400'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">
                          {Math.round(recommendation.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {recommendation.reasoning && (
                    <div className="text-xs text-gray-500 max-w-md truncate">
                      {recommendation.reasoning}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Card */}
              <div className="p-4">
                <FeedCard
                  item={recommendation.content}
                  onSave={() => handleItemAction(recommendation.content.id, 'save')}
                  onHide={() => handleItemAction(recommendation.content.id, 'hide')}
                  onLike={() => handleItemAction(recommendation.content.id, 'like')}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

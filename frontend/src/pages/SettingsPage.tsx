import React, { useEffect, useState } from 'react';
import { ErrorMessage } from '../components/UI/ErrorBoundary';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { ContentSource, User, UserPreferences } from '../types';

interface SettingsPageProps {}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API calls
      const [userResponse, sourcesResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/sources')
      ]);
      
      if (!userResponse.ok || !sourcesResponse.ok) {
        throw new Error('Failed to load user settings');
      }
      
      const userData = await userResponse.json();
      const sourcesData = await sourcesResponse.json();
      
      setUser(userData.user);
      setPreferences(userData.user.preferences);
      setSources(sourcesData.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!preferences || !user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSourceToggle = async (sourceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/user/sources/${sourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update source');
      }
      
      setSources(prev => prev.map(source => 
        source.id === sourceId ? { ...source, enabled } : source
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source');
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
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
          onClick={loadUserSettings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user || !preferences) {
    return (
      <div className="p-6">
        <ErrorMessage message="User data not available" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Customize your content filtering and preferences
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="space-y-8">
        {/* Content Filtering */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Filtering</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relevance Score Threshold: {preferences.filterThreshold}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.filterThreshold}
                onChange={(e) => handlePreferenceChange('filterThreshold', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Show all content</span>
                <span>Only high-quality content</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items per page
              </label>
              <select
                value={preferences.maxItemsPerPage}
                onChange={(e) => handlePreferenceChange('maxItemsPerPage', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your interests (comma-separated)
              </label>
              <textarea
                value={preferences.interests.join(', ')}
                onChange={(e) => handlePreferenceChange('interests', e.target.value.split(', ').map(s => s.trim()).filter(Boolean))}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., technology, artificial intelligence, programming, startups"
              />
              <p className="text-xs text-gray-500 mt-1">
                These topics will be prioritized in your content feed
              </p>
            </div>
          </div>
        </div>

        {/* Content Sources */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Sources</h2>
          
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    source.type === 'twitter' ? 'bg-blue-400' :
                    source.type === 'reddit' ? 'bg-orange-500' :
                    source.type === 'hackernews' ? 'bg-orange-600' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">{source.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{source.type}</div>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={(e) => handleSourceToggle(source.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (system)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto-save preferences</div>
                <div className="text-sm text-gray-500">Automatically save changes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoSave}
                  onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable notifications</div>
                <div className="text-sm text-gray-500">Get notified about new high-quality content</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enableNotifications}
                  onChange={(e) => handlePreferenceChange('enableNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { GraphFilters, GraphPanel } from '../components/Graph/GraphPanel';
import KnowledgeGraph from '../components/Graph/KnowledgeGraph';
import { ErrorBoundary } from '../components/UI/ErrorBoundary';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { GraphData, GraphNode } from '../types';

interface GraphPageProps {}

export const GraphPage: React.FC<GraphPageProps> = () => {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
    metadata: {
      totalNodes: 0,
      totalLinks: 0,
      lastUpdated: new Date().toISOString()
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GraphFilters>({
    nodeTypes: ['content', 'author', 'topic', 'entity'],
    linkTypes: ['authored', 'mentions', 'related', 'referenced'],
    minStrength: 0.1,
    showLabels: true,
    showClusters: true
  });

  // Initialize graph data
  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/graph/knowledge');
      if (!response.ok) {
        throw new Error('Failed to load graph data');
      }
      
      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load graph data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load graph');
      
      // Set mock data for development
      setGraphData({
        nodes: [
          {
            id: '1',
            label: 'AI Ethics',
            type: 'topic',
            size: 20,
            color: '#3B82F6',
            data: { id: '1', name: 'AI Ethics', type: 'topic', confidence: 0.9, mentions: 15, relevanceScore: 0.85 }
          },
          {
            id: '2',
            label: 'Machine Learning',
            type: 'topic',
            size: 25,
            color: '#10B981',
            data: { id: '2', name: 'Machine Learning', type: 'topic', confidence: 0.95, mentions: 25, relevanceScore: 0.92 }
          },
          {
            id: '3',
            label: 'John Doe',
            type: 'author',
            size: 15,
            color: '#F59E0B',
            data: { id: '3', name: 'John Doe', username: 'johndoe', avatar: '', verified: true, followerCount: 5000, bio: 'AI Researcher' }
          }
        ],
        links: [
          {
            id: 'link1',
            source: '1',
            target: '2',
            type: 'related',
            strength: 0.8,
            label: 'related topics'
          },
          {
            id: 'link2',
            source: '3',
            target: '1',
            type: 'authored',
            strength: 0.9,
            label: 'writes about'
          }
        ],
        metadata: {
          totalNodes: 3,
          totalLinks: 2,
          lastUpdated: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleNodeSelect = (nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  };

  const handleClusterSelect = (clusterId: string) => {
    console.log('Cluster selected:', clusterId);
    // TODO: Implement cluster selection logic
  };

  const handleFilterChange = (newFilters: GraphFilters) => {
    setFilters(newFilters);
    // TODO: Apply filters to graph data
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement graph search/filtering
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Failed to load graph data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={loadGraphData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
              <p className="text-gray-600 mt-1">
                Explore connections between content, authors, and topics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={loadGraphData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">          {/* Graph Visualization */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gray-50">
              <KnowledgeGraph
                nodes={graphData.nodes}
                links={graphData.links}
                onNodeClick={handleNodeClick}
                className="w-full h-full"
              />
            </div>

            {/* Node Details Overlay */}
            {selectedNode && (
              <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Node Details</h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID</label>
                    <p className="text-sm text-gray-900">{selectedNode.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 ${
                      selectedNode.type === 'content' ? 'bg-blue-100 text-blue-800' :
                      selectedNode.type === 'author' ? 'bg-green-100 text-green-800' :
                      selectedNode.type === 'topic' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedNode.type}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Label</label>
                    <p className="text-sm text-gray-900">{selectedNode.label}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Size</label>
                    <p className="text-sm text-gray-900">{selectedNode.size}</p>
                  </div>

                  {selectedNode.data && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Additional Data</label>
                      <div className="mt-1 text-xs text-gray-600">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(selectedNode.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-80 border-l border-gray-200 bg-white">
            <GraphPanel
              selectedNode={selectedNode}
              clusters={graphData.metadata.clusters || []}
              onNodeSelect={handleNodeSelect}
              onClusterSelect={handleClusterSelect}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Nodes: {graphData.nodes.length}</span>
              <span>Links: {graphData.links.length}</span>
              <span>Last Updated: {new Date(graphData.metadata.lastUpdated).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs">Content</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs">Authors</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs">Topics</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-xs">Entities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

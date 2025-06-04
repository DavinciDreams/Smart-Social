import React, { useState } from 'react';
import { GraphCluster, GraphNode } from '../../types';

interface GraphPanelProps {
  selectedNode: GraphNode | null;
  clusters: GraphCluster[];
  onNodeSelect: (nodeId: string) => void;
  onClusterSelect: (clusterId: string) => void;
  onFilterChange: (filters: GraphFilters) => void;
  className?: string;
}

export interface GraphFilters {
  nodeTypes: string[];
  linkTypes: string[];
  minStrength: number;
  showLabels: boolean;
  showClusters: boolean;
}

export const GraphPanel: React.FC<GraphPanelProps> = ({
  selectedNode,
  clusters,
  onNodeSelect,
  onClusterSelect,
  onFilterChange,
  className = ''
}) => {
  const [filters, setFilters] = useState<GraphFilters>({
    nodeTypes: ['content', 'author', 'topic', 'entity'],
    linkTypes: ['authored', 'mentions', 'related', 'referenced'],
    minStrength: 0.1,
    showLabels: true,
    showClusters: true
  });

  const handleFilterUpdate = (newFilters: Partial<GraphFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleNodeTypeToggle = (nodeType: string) => {
    const updated = filters.nodeTypes.includes(nodeType)
      ? filters.nodeTypes.filter(t => t !== nodeType)
      : [...filters.nodeTypes, nodeType];
    handleFilterUpdate({ nodeTypes: updated });
  };

  const handleLinkTypeToggle = (linkType: string) => {
    const updated = filters.linkTypes.includes(linkType)
      ? filters.linkTypes.filter(t => t !== linkType)
      : [...filters.linkTypes, linkType];
    handleFilterUpdate({ linkTypes: updated });
  };

  return (
    <div className={`graph-panel bg-white shadow-lg p-4 ${className}`}>
      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Selected Node</h3>
          <div className="text-sm">
            <p><span className="font-medium">Label:</span> {selectedNode.label}</p>
            <p><span className="font-medium">Type:</span> {selectedNode.type}</p>
            <p><span className="font-medium">Size:</span> {selectedNode.size}</p>
          </div>
          <button 
            onClick={() => onNodeSelect('')}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Clusters */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Clusters</h3>
        <div className="space-y-2">
          {clusters.map(cluster => (
            <div
              key={cluster.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
              onClick={() => onClusterSelect(cluster.id)}
            >
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: cluster.color }}
                />
                <span className="text-sm font-medium">{cluster.name}</span>
              </div>
              <span className="text-xs text-gray-500">{cluster.nodes.length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node Type Filters */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Node Types</h3>
        <div className="space-y-2">
          {['content', 'author', 'topic', 'entity'].map(nodeType => (
            <label key={nodeType} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.nodeTypes.includes(nodeType)}
                onChange={() => handleNodeTypeToggle(nodeType)}
                className="mr-2 rounded"
              />
              <span className="text-sm capitalize">{nodeType}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Link Type Filters */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Link Types</h3>
        <div className="space-y-2">
          {['authored', 'mentions', 'related', 'referenced'].map(linkType => (
            <label key={linkType} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.linkTypes.includes(linkType)}
                onChange={() => handleLinkTypeToggle(linkType)}
                className="mr-2 rounded"
              />
              <span className="text-sm capitalize">{linkType}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Strength Filter */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Min Link Strength</h3>
        <input 
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minStrength}
          onChange={(e) => handleFilterUpdate({ minStrength: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>{filters.minStrength.toFixed(1)}</span>
          <span>1</span>
        </div>
      </div>

      {/* Display Options */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Display Options</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.showLabels}
              onChange={(e) => handleFilterUpdate({ showLabels: e.target.checked })}
              className="mr-2 rounded"
            />
            <span className="text-sm">Show Labels</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.showClusters}
              onChange={(e) => handleFilterUpdate({ showClusters: e.target.checked })}
              className="mr-2 rounded"
            />
            <span className="text-sm">Show Clusters</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default GraphPanel;

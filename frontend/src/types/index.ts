// Core data types for the Social AI Content Curation App

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  interests: string[];
  sources: ContentSource[];
  filterThreshold: number; // 0-100, minimum relevance score
  maxItemsPerPage: number;
  autoSave: boolean;
  enableNotifications: boolean;
  theme: "light" | "dark" | "auto";
}

export interface ContentSource {
  id: string;
  type: "twitter" | "reddit" | "hackernews" | "rss";
  name: string;
  url?: string;
  enabled: boolean;
  lastFetched?: string;
  config?: Record<string, any>;
}

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  source: ContentSource;
  author: Author;
  publishedAt: string;
  fetchedAt: string;
  relevanceScore: number;
  entities: Entity[];
  tags: string[];
  metrics: ContentMetrics;
  saved: boolean;
  aiAnalysis?: AIAnalysis;
}

export interface Author {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  followerCount?: number;
  bio?: string;
}

export interface Entity {
  id: string;
  name: string;
  type:
    | "person"
    | "organization"
    | "topic"
    | "location"
    | "technology"
    | "other";
  confidence: number;
  mentions: number;
  relevanceScore: number;
}

export interface ContentMetrics {
  likes?: number;
  shares?: number;
  comments?: number;
  views?: number;
  engagementRate?: number;
  viralityScore?: number;
}

export interface AIAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  topics: string[];
  keyPhrases: string[];
  complexity: "low" | "medium" | "high";
  qualityScore: number;
  brainRotScore: number; // 0-100, higher means more brain rot
  reasoning: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "content" | "author" | "topic" | "entity";
  size: number;
  color: string;
  data: ContentItem | Author | Entity;
  x?: number;
  y?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: "authored" | "mentions" | "related" | "referenced";
  strength: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  totalNodes: number;
  totalLinks: number;
  lastUpdated: string;
  centerNode?: string;
  clusters?: GraphCluster[];
}

export interface GraphCluster {
  id: string;
  name: string;
  nodes: string[];
  color: string;
  size: number;
}

export interface Recommendation {
  id: string;
  item: ContentItem;
  score: number;
  reasoning: string[];
  type: "collaborative" | "content_based" | "hybrid";
  freshness: number;
  diversity: number;
  serendipity: number;
}

export interface Feed {
  id: string;
  name: string;
  items: ContentItem[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  filters: FeedFilters;
  sortBy: SortOption;
  lastUpdated: string;
}

export interface FeedFilters {
  sources: string[];
  dateRange: DateRange;
  relevanceThreshold: number;
  tags: string[];
  authors: string[];
  hasMedia: boolean;
  saved: boolean | null;
}

export interface DateRange {
  start: string;
  end: string;
}

export type SortOption =
  | "relevance"
  | "date"
  | "engagement"
  | "quality"
  | "virality";

export interface SearchQuery {
  query: string;
  filters: FeedFilters;
  sortBy: SortOption;
  page: number;
  limit: number;
}

export interface SearchResults {
  items: ContentItem[];
  totalItems: number;
  query: SearchQuery;
  suggestions: string[];
  facets: SearchFacets;
}

export interface SearchFacets {
  sources: FacetValue[];
  authors: FacetValue[];
  tags: FacetValue[];
  entities: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// UI Component Props Types
export interface FeedCardProps {
  item: ContentItem;
  onSave: (item: ContentItem) => void;
  onView: (item: ContentItem) => void;
  compact?: boolean;
}

export interface GraphViewProps {
  data: GraphData;
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  onLinkClick: (link: GraphLink) => void;
  selectedNode?: string;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export interface RecommendationListProps {
  recommendations: Recommendation[];
  onItemClick: (item: ContentItem) => void;
  onRefresh: () => void;
  loading: boolean;
}

// Hook Types
export interface UseFeedOptions {
  filters?: Partial<FeedFilters>;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseGraphOptions {
  centerNode?: string;
  maxNodes?: number;
  maxDepth?: number;
  includeTypes?: GraphNode["type"][];
}

export interface UseRecommendationsOptions {
  type?: Recommendation["type"];
  limit?: number;
  includeReasons?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Configuration Types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  ai: {
    filterThreshold: number;
    maxTokens: number;
    temperature: number;
  };
  graph: {
    maxNodes: number;
    layoutAlgorithm: "force" | "circular" | "hierarchical";
    animationDuration: number;
  };
  feed: {
    itemsPerPage: number;
    autoRefreshInterval: number;
    cacheTimeout: number;
  };
}

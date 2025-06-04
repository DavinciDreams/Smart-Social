import axios from "axios";
import { Request, Response, Router } from "express";
import { param, query, validationResult } from "express-validator";
import { config } from "../config/config";
import { authenticateToken } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

// Knowledge graph node and edge interfaces
interface GraphNode {
  id: string;
  type: "person" | "organization" | "topic" | "content" | "concept";
  label: string;
  properties: {
    name: string;
    description?: string;
    url?: string;
    category?: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
  };
  position?: { x: number; y: number };
  size?: number;
  color?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type:
    | "mentions"
    | "related_to"
    | "part_of"
    | "created_by"
    | "references"
    | "similar_to";
  weight: number;
  properties: {
    confidence: number;
    createdAt: Date;
    source_content?: string;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    lastUpdated: Date;
    version: string;
  };
}

// In-memory graph store (replace with Neo4j in production)
const graphStore: GraphData = {
  nodes: [
    {
      id: "ai-1",
      type: "topic",
      label: "Artificial Intelligence",
      properties: {
        name: "Artificial Intelligence",
        description:
          "Field of computer science focused on creating intelligent machines",
        category: "technology",
        importance: 0.95,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      },
      size: 20,
      color: "#ff6b6b",
    },
    {
      id: "ml-1",
      type: "topic",
      label: "Machine Learning",
      properties: {
        name: "Machine Learning",
        description:
          "Subset of AI that enables computers to learn without explicit programming",
        category: "technology",
        importance: 0.9,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      },
      size: 18,
      color: "#4ecdc4",
    },
    {
      id: "openai-1",
      type: "organization",
      label: "OpenAI",
      properties: {
        name: "OpenAI",
        description: "AI research and deployment company",
        url: "https://openai.com",
        category: "company",
        importance: 0.85,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      },
      size: 16,
      color: "#45b7d1",
    },
  ],
  edges: [
    {
      id: "edge-1",
      source: "ml-1",
      target: "ai-1",
      type: "part_of",
      weight: 0.9,
      properties: {
        confidence: 0.95,
        createdAt: new Date("2024-01-01"),
      },
    },
    {
      id: "edge-2",
      source: "openai-1",
      target: "ai-1",
      type: "related_to",
      weight: 0.8,
      properties: {
        confidence: 0.9,
        createdAt: new Date("2024-01-01"),
      },
    },
  ],
  metadata: {
    totalNodes: 3,
    totalEdges: 2,
    lastUpdated: new Date(),
    version: "1.0.0",
  },
};

// GET /api/graph/knowledge - Get complete knowledge graph
router.get(
  "/knowledge",
  query("limit").optional().isInt({ min: 1, max: 1000 }).toInt(),
  query("types").optional().isString(),
  query("search").optional().isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { limit = 100, types, search } = req.query;
      let { nodes, edges } = graphStore;

      // Filter by node types
      if (types) {
        const typeList = (types as string).split(",").map((t) => t.trim());
        nodes = nodes.filter((node) => typeList.includes(node.type));

        // Filter edges to only include connections between filtered nodes
        const nodeIds = new Set(nodes.map((n) => n.id));
        edges = edges.filter(
          (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );
      }

      // Search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        nodes = nodes.filter(
          (node) =>
            node.label.toLowerCase().includes(searchTerm) ||
            node.properties.name.toLowerCase().includes(searchTerm) ||
            (node.properties.description &&
              node.properties.description.toLowerCase().includes(searchTerm))
        );

        const nodeIds = new Set(nodes.map((n) => n.id));
        edges = edges.filter(
          (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );
      }

      // Apply limit
      if (nodes.length > limit) {
        // Sort by importance and take top nodes
        nodes = nodes
          .sort((a, b) => b.properties.importance - a.properties.importance)
          .slice(0, limit);

        const nodeIds = new Set(nodes.map((n) => n.id));
        edges = edges.filter(
          (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );
      }

      res.json({
        graph: {
          nodes,
          edges,
          metadata: {
            ...graphStore.metadata,
            filteredNodes: nodes.length,
            filteredEdges: edges.length,
          },
        },
      });
    } catch (error) {
      logger.error("Error getting knowledge graph:", error);
      res.status(500).json({ error: "Failed to get knowledge graph" });
    }
  }
);

// GET /api/graph/node/:id - Get specific node and its connections
router.get(
  "/node/:id",
  param("id").isString().notEmpty(),
  query("depth").optional().isInt({ min: 1, max: 3 }).toInt(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const depth = parseInt(req.query.depth as string) || 1;

      const node = graphStore.nodes.find((n) => n.id === id);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }

      // Get connected nodes up to specified depth
      const connectedNodes = new Set<string>([id]);
      const relevantEdges: GraphEdge[] = [];

      for (let currentDepth = 0; currentDepth < depth; currentDepth++) {
        const newConnections = new Set<string>();

        for (const edge of graphStore.edges) {
          if (
            connectedNodes.has(edge.source) &&
            !connectedNodes.has(edge.target)
          ) {
            newConnections.add(edge.target);
            relevantEdges.push(edge);
          } else if (
            connectedNodes.has(edge.target) &&
            !connectedNodes.has(edge.source)
          ) {
            newConnections.add(edge.source);
            relevantEdges.push(edge);
          } else if (
            connectedNodes.has(edge.source) &&
            connectedNodes.has(edge.target)
          ) {
            relevantEdges.push(edge);
          }
        }

        newConnections.forEach((nodeId) => connectedNodes.add(nodeId));
      }

      const subgraphNodes = graphStore.nodes.filter((n) =>
        connectedNodes.has(n.id)
      );

      res.json({
        node,
        subgraph: {
          nodes: subgraphNodes,
          edges: relevantEdges,
          depth,
          centerNode: id,
        },
      });
    } catch (error) {
      logger.error("Error getting node subgraph:", error);
      res.status(500).json({ error: "Failed to get node subgraph" });
    }
  }
);

// POST /api/graph/extract - Extract entities from content and update graph
router.post(
  "/extract",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { contentId, text, url } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text content is required" });
      }

      try {
        // Call AI service for entity extraction
        const aiResponse = await axios.post(
          `${config.ai.baseUrl}/extract/entities`,
          {
            text,
            extract_types: ["people", "organizations", "topics"],
          },
          {
            timeout: 10000,
          }
        );

        const { entities } = aiResponse.data;
        const newNodes: GraphNode[] = [];
        const newEdges: GraphEdge[] = [];

        // Process extracted entities
        for (const [type, entityList] of Object.entries(entities)) {
          for (const entityName of entityList as string[]) {
            const nodeId = `${type}-${entityName.toLowerCase().replace(/\s+/g, "-")}`;

            // Check if node already exists
            if (!graphStore.nodes.find((n) => n.id === nodeId)) {
              const newNode: GraphNode = {
                id: nodeId,
                type: type as GraphNode["type"],
                label: entityName,
                properties: {
                  name: entityName,
                  importance: 0.5, // Default importance
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                size: 10,
                color: getNodeColor(type as GraphNode["type"]),
              };

              newNodes.push(newNode);
              graphStore.nodes.push(newNode);
            }

            // Create edge from content to entity
            if (contentId) {
              const edgeId = `edge-${contentId}-${nodeId}`;
              if (!graphStore.edges.find((e) => e.id === edgeId)) {
                const newEdge: GraphEdge = {
                  id: edgeId,
                  source: contentId,
                  target: nodeId,
                  type: "mentions",
                  weight: 0.7,
                  properties: {
                    confidence: 0.8,
                    createdAt: new Date(),
                    source_content: url,
                  },
                };

                newEdges.push(newEdge);
                graphStore.edges.push(newEdge);
              }
            }
          }
        }

        // Update graph metadata
        graphStore.metadata.totalNodes = graphStore.nodes.length;
        graphStore.metadata.totalEdges = graphStore.edges.length;
        graphStore.metadata.lastUpdated = new Date();

        logger.info(
          `Extracted ${newNodes.length} new entities and ${newEdges.length} new relationships`
        );

        res.json({
          message: "Entities extracted successfully",
          extracted: {
            nodes: newNodes.length,
            edges: newEdges.length,
            entities,
          },
        });
      } catch (aiError) {
        logger.warn("AI service unavailable for entity extraction");
        res.status(503).json({ error: "AI service temporarily unavailable" });
      }
    } catch (error) {
      logger.error("Error extracting entities:", error);
      res.status(500).json({ error: "Failed to extract entities" });
    }
  }
);

// GET /api/graph/search - Search graph nodes
router.get(
  "/search",
  query("q").isString().notEmpty(),
  query("types").optional().isString(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q, types, limit = 20 } = req.query;
      const searchTerm = (q as string).toLowerCase();

      let nodes = graphStore.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchTerm) ||
          node.properties.name.toLowerCase().includes(searchTerm) ||
          (node.properties.description &&
            node.properties.description.toLowerCase().includes(searchTerm))
      );

      // Filter by types
      if (types) {
        const typeList = (types as string).split(",").map((t) => t.trim());
        nodes = nodes.filter((node) => typeList.includes(node.type));
      }

      // Sort by importance and relevance
      nodes = nodes
        .sort((a, b) => {
          const aRelevance = calculateSearchRelevance(a, searchTerm);
          const bRelevance = calculateSearchRelevance(b, searchTerm);
          if (aRelevance !== bRelevance) return bRelevance - aRelevance;
          return b.properties.importance - a.properties.importance;
        })
        .slice(0, limit);

      res.json({ nodes });
    } catch (error) {
      logger.error("Error searching graph:", error);
      res.status(500).json({ error: "Failed to search graph" });
    }
  }
);

// GET /api/graph/stats - Get graph statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const nodeTypeCounts = graphStore.nodes.reduce(
      (counts, node) => {
        counts[node.type] = (counts[node.type] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    const edgeTypeCounts = graphStore.edges.reduce(
      (counts, edge) => {
        counts[edge.type] = (counts[edge.type] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    const stats = {
      totalNodes: graphStore.nodes.length,
      totalEdges: graphStore.edges.length,
      nodeTypes: nodeTypeCounts,
      edgeTypes: edgeTypeCounts,
      lastUpdated: graphStore.metadata.lastUpdated,
      version: graphStore.metadata.version,
      averageConnections:
        graphStore.nodes.length > 0
          ? (graphStore.edges.length * 2) / graphStore.nodes.length
          : 0,
    };

    res.json({ stats });
  } catch (error) {
    logger.error("Error getting graph stats:", error);
    res.status(500).json({ error: "Failed to get graph stats" });
  }
});

// Helper functions
function getNodeColor(type: GraphNode["type"]): string {
  const colors = {
    person: "#ff6b6b",
    organization: "#45b7d1",
    topic: "#4ecdc4",
    content: "#feca57",
    concept: "#a55eea",
  };
  return colors[type] || "#gray";
}

function calculateSearchRelevance(node: GraphNode, searchTerm: string): number {
  let relevance = 0;

  if (node.label.toLowerCase() === searchTerm) relevance += 100;
  else if (node.label.toLowerCase().startsWith(searchTerm)) relevance += 50;
  else if (node.label.toLowerCase().includes(searchTerm)) relevance += 25;

  if (node.properties.description?.toLowerCase().includes(searchTerm))
    relevance += 10;

  return relevance;
}

export default router;

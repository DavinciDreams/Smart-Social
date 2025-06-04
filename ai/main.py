"""
FastAPI main application for Smart Social AI Service.

This service provides AI-powered content filtering, entity extraction,
and recommendation capabilities for the Social AI Content Curation App.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import httpx
import asyncio
import json

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

from core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ML Model globals (replace with proper model management)
ml_models = {}


# Pydantic models for API requests/responses
class ContentItem(BaseModel):
    id: str
    title: str
    content: str
    source: str = Field(
        ..., description="Source platform (hackernews, twitter, reddit)"
    )
    author: Optional[str] = None
    url: Optional[str] = None


class FilterRequest(BaseModel):
    items: List[ContentItem]
    filter_strength: float = Field(
        default=80.0, ge=0, le=100, description="Filter strength percentage"
    )
    criteria: List[str] = Field(
        default=["relevance", "quality", "anti_brain_rot"],
        description="Filter criteria",
    )


class FilterResponse(BaseModel):
    filteredItems: List[ContentItem]
    scores: Dict[str, float]
    totalProcessed: int
    totalFiltered: int
    processingTime: float


class EntityExtractionRequest(BaseModel):
    text: str
    extract_types: List[str] = Field(
        default=["people", "organizations", "topics"],
        description="Entity types to extract",
    )


class EntityExtractionResponse(BaseModel):
    entities: Dict[str, List[str]]
    confidence: Dict[str, float]


class SimilarityRequest(BaseModel):
    query: str
    documents: List[str]
    top_k: int = Field(default=5, ge=1, le=50)


class SimilarityResponse(BaseModel):
    results: List[Dict[str, Any]]
    query_embedding: Optional[List[float]] = None


class RecommendationRequest(BaseModel):
    user_id: str
    content_history: List[ContentItem]
    candidate_items: List[ContentItem]
    max_recommendations: int = Field(default=10, ge=1, le=50)


class RecommendationResponse(BaseModel):
    recommendations: List[ContentItem]
    scores: Dict[str, float]
    algorithm: str


# Mock AI functions (replace with actual AI implementations)
async def filter_content_with_llama(
    items: List[ContentItem], filter_strength: float
) -> FilterResponse:
    """
    Filter content using Llama model for anti-brain rot detection.
    """
    start_time = time.time()

    try:
        # Simulate AI processing delay
        await asyncio.sleep(0.1)

        filtered_items = []
        scores = {}

        for item in items:
            # Simple heuristic-based filtering (replace with actual Llama calls)
            score = 75.0  # Default score

            # Boost score for certain keywords (tech, science, learning)
            boost_keywords = [
                "technology",
                "science",
                "research",
                "ai",
                "programming",
                "innovation",
                "education",
            ]
            penalty_keywords = [
                "celebrity",
                "gossip",
                "clickbait",
                "trending",
                "viral",
                "drama",
            ]

            content_lower = (item.title + " " + item.content).lower()

            for keyword in boost_keywords:
                if keyword in content_lower:
                    score += 10

            for keyword in penalty_keywords:
                if keyword in content_lower:
                    score -= 15

            # Apply source-based scoring
            if item.source == "hackernews":
                score += 5  # HN generally has higher quality content
            elif item.source == "reddit":
                score -= 2  # Reddit can be more variable

            # Normalize score
            score = max(0, min(100, score))
            scores[item.id] = score

            # Filter based on strength threshold
            if score >= filter_strength:
                filtered_items.append(item)

        processing_time = time.time() - start_time

        logger.info(
            f"Filtered {len(items)} items, kept {len(filtered_items)} (threshold: {filter_strength})"
        )

        return FilterResponse(
            filteredItems=filtered_items,
            scores=scores,
            totalProcessed=len(items),
            totalFiltered=len(filtered_items),
            processingTime=processing_time,
        )

    except Exception as e:
        logger.error(f"Error in content filtering: {e}")
        # Return all items with default scores on error
        return FilterResponse(
            filteredItems=items,
            scores={item.id: 75.0 for item in items},
            totalProcessed=len(items),
            totalFiltered=len(items),
            processingTime=time.time() - start_time,
        )


async def extract_entities_with_ai(
    text: str, extract_types: List[str]
) -> EntityExtractionResponse:
    """
    Extract entities from text using AI models.
    """
    try:
        # Simulate AI processing
        await asyncio.sleep(0.05)

        # Simple keyword-based entity extraction (replace with actual NER)
        entities = {"people": [], "organizations": [], "topics": []}

        # Simple heuristics for demo
        if "people" in extract_types:
            people_keywords = ["CEO", "founder", "researcher", "developer", "scientist"]
            for keyword in people_keywords:
                if keyword.lower() in text.lower():
                    entities["people"].append(keyword)

        if "organizations" in extract_types:
            org_keywords = [
                "OpenAI",
                "Google",
                "Microsoft",
                "Apple",
                "Meta",
                "Tesla",
                "NASA",
            ]
            for keyword in org_keywords:
                if keyword in text:
                    entities["organizations"].append(keyword)

        if "topics" in extract_types:
            topic_keywords = [
                "AI",
                "machine learning",
                "blockchain",
                "cryptocurrency",
                "startups",
                "technology",
            ]
            for keyword in topic_keywords:
                if keyword.lower() in text.lower():
                    entities["topics"].append(keyword)

        # Filter to requested types only
        filtered_entities = {k: v for k, v in entities.items() if k in extract_types}

        return EntityExtractionResponse(
            entities=filtered_entities,
            confidence={k: 0.8 for k in filtered_entities.keys()},
        )

    except Exception as e:
        logger.error(f"Error in entity extraction: {e}")
        return EntityExtractionResponse(
            entities={t: [] for t in extract_types},
            confidence={t: 0.0 for t in extract_types},
        )


async def calculate_similarity(
    query: str, documents: List[str], top_k: int
) -> SimilarityResponse:
    """
    Calculate semantic similarity using sentence embeddings.
    """
    try:
        # Simulate embedding calculation
        await asyncio.sleep(0.1)

        # Simple text similarity based on word overlap (replace with actual embeddings)
        query_words = set(query.lower().split())
        results = []

        for i, doc in enumerate(documents):
            doc_words = set(doc.lower().split())
            similarity = len(query_words.intersection(doc_words)) / len(
                query_words.union(doc_words)
            )

            results.append(
                {
                    "document_index": i,
                    "document": doc[:200] + "..." if len(doc) > 200 else doc,
                    "similarity_score": similarity,
                    "rank": i + 1,
                }
            )

        # Sort by similarity and take top_k
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        results = results[:top_k]

        # Update ranks
        for i, result in enumerate(results):
            result["rank"] = i + 1

        return SimilarityResponse(
            results=results,
            query_embedding=None,  # Would include actual embeddings in production
        )

    except Exception as e:
        logger.error(f"Error in similarity calculation: {e}")
        return SimilarityResponse(results=[], query_embedding=None)


async def generate_recommendations(
    user_id: str,
    content_history: List[ContentItem],
    candidate_items: List[ContentItem],
    max_recommendations: int,
) -> RecommendationResponse:
    """
    Generate personalized content recommendations.
    """
    try:
        # Simulate recommendation processing
        await asyncio.sleep(0.2)

        # Simple collaborative filtering simulation
        user_topics = set()
        for item in content_history:
            # Extract topics from user's reading history
            if (
                "ai" in item.content.lower()
                or "artificial intelligence" in item.content.lower()
            ):
                user_topics.add("ai")
            if "tech" in item.content.lower() or "technology" in item.content.lower():
                user_topics.add("technology")
            if "startup" in item.content.lower():
                user_topics.add("startups")

        # Score candidate items based on user interests
        scored_items = []
        for item in candidate_items:
            score = 0.5  # Base score

            # Boost items that match user's interests
            content_lower = (item.title + " " + item.content).lower()
            for topic in user_topics:
                if topic in content_lower:
                    score += 0.3

            # Source preference (can be personalized)
            if item.source == "hackernews" and "technology" in user_topics:
                score += 0.2

            scored_items.append((item, score))

        # Sort by score and take top recommendations
        scored_items.sort(key=lambda x: x[1], reverse=True)
        recommendations = [item for item, score in scored_items[:max_recommendations]]
        scores = {item.id: score for item, score in scored_items[:max_recommendations]}

        logger.info(
            f"Generated {len(recommendations)} recommendations for user {user_id}"
        )

        return RecommendationResponse(
            recommendations=recommendations,
            scores=scores,
            algorithm="hybrid_collaborative_content",
        )

    except Exception as e:
        logger.error(f"Error in recommendation generation: {e}")
        return RecommendationResponse(
            recommendations=[], scores={}, algorithm="fallback"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    """
    # Startup
    logger.info("🤖 Starting AI service...")
    logger.info(f"📊 Environment: {settings.environment}")
    logger.info(f"🔗 Ollama URL: {settings.ollama_url}")

    # Initialize ML models (placeholder)
    ml_models["llama"] = "initialized"
    ml_models["sentence_transformer"] = "initialized"
    logger.info("✅ ML models loaded successfully")

    yield

    # Shutdown
    logger.info("🛑 Shutting down AI service...")
    ml_models.clear()
    logger.info("✅ AI service shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Smart Social AI Service",
    description="AI-powered content filtering and recommendation service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": "smart-social-ai",
        "version": "1.0.0",
        "environment": settings.environment,
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "message": "Smart Social AI Service",
        "description": "AI-powered content filtering and recommendation service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Include routers
# TODO: Create separate router modules when needed
# app.include_router(
#     filter_router.router,
#     prefix="/api/filter",
#     tags=["content-filtering"]
# )

# TODO: Add router modules when implemented
# app.include_router(
#     entity_router.router,
#     prefix="/api/entities",
#     tags=["entity-extraction"]
# )

# app.include_router(
#     recommend_router.router,
#     prefix="/api/recommendations",
#     tags=["recommendations"]
# )

# app.include_router(
#     similarity_router.router,
#     prefix="/api/similarity",
#     tags=["similarity"]
# )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return HTTPException(status_code=500, detail="Internal server error occurred")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8080,
        reload=False,  # Disabled to avoid Windows permission issues
        log_level="info",
    )

# Copilot Instructions for Social AI Content Curation App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a self-hosted, AI-powered social media filtering application that helps prevent doomscrolling and brain rot by curating high-quality content from Twitter/X, Reddit, and Hacker News.

## Architecture Guidelines

- **Microservices**: Backend services are modular (feed, filter, auth, graph, recommendations)
- **AI-First**: Llama for content filtering, Sentence-BERT for embeddings, TensorFlow for recommendations
- **Privacy-Focused**: Self-hosted with end-to-end encryption
- **Performance**: Target <2s page load, <500ms graph rendering

## Code Style & Patterns

- Use TypeScript for all frontend and backend code
- Follow functional programming patterns where possible
- Implement comprehensive error handling for API rate limits
- Add extensive comments explaining AI model integration
- Use async/await for all asynchronous operations

## AI Integration Patterns

- All AI operations should be handled by the FastAPI service in `/ai`
- Use proper error handling for Ollama/Llama model calls
- Implement retry logic for AI service calls
- Cache AI results when appropriate to reduce computation

## Component Architecture

- **Frontend**: React with hooks, TypeScript, and Tailwind CSS
- **Backend**: Express with TypeScript, modular service architecture
- **AI Service**: FastAPI with Python, separate endpoints for each AI function

## Database Patterns

- PostgreSQL for structured metadata
- Elasticsearch for full-text search
- Neo4j for knowledge graph relationships
- FAISS for vector similarity search

## Security Requirements

- Always use OAuth 2.0 for social media authentication
- Implement HTTPS everywhere
- Use JWT tokens for session management
- Encrypt sensitive data at rest

## Performance Considerations

- Implement pagination for large datasets
- Use caching for frequently accessed data
- Optimize database queries
- Implement proper indexing strategies

## Testing Guidelines

- Write unit tests for all services
- Include integration tests for API endpoints
- Add performance tests for critical paths
- Mock external API calls in tests

## Error Handling

- Implement graceful degradation for AI service failures
- Handle API rate limits from social media platforms
- Provide meaningful error messages to users
- Log errors appropriately for debugging

## Knowledge Graph Specific

- Use D3.js for interactive graph visualization
- Implement efficient graph traversal algorithms
- Cache graph data for better performance
- Support zoom, pan, and click interactions

## Content Filtering Rules

- Prioritize high-value content (in-depth articles, technical discussions)
- Filter out low-value content (clickbait, memes, repetitive posts)
- Use relevance scoring >80% threshold
- Extract entities (authors, topics, dates) for graph connections

## Recommendation System

- Implement hybrid approach: collaborative + content-based filtering
- Use Sentence-BERT for content similarity
- Apply anti-brain rot criteria in recommendations
- Update recommendations based on user interactions

## RSS Feed Handling

- Parse Hacker News RSS feed efficiently
- Extract metadata (title, link, date, comments)
- Handle feed parsing errors gracefully
- Implement feed update scheduling

## Social Media API Integration

- Respect API rate limits
- Implement proper OAuth flows
- Handle API changes gracefully
- Cache API responses appropriately

## Deployment Considerations

- Use Docker for containerization
- Support both Docker Compose and Kubernetes
- Implement health checks for all services
- Use environment variables for configuration

## Code Comments

- Explain AI model parameters and thresholds
- Document API endpoint specifications
- Comment complex graph algorithms
- Explain content filtering logic

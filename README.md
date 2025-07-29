# Social AI Content Curation App

A self-hosted, AI-powered social media filtering application that helps prevent doomscrolling and brain rot by curating high-quality, intellectually stimulating content from Twitter/X, Reddit, and Hacker News.

## Features

- **AI-Powered Content Filtering**: Uses Llama to filter content with >80% relevance to user interests
- **Flipboard-like Interface**: Beautiful card-based UI for browsing curated content
- **Interactive Knowledge Graph**: Navigate content relationships using D3.js visualization
- **Hybrid Recommendation System**: Combines collaborative filtering and content-based recommendations
- **RSS Feed Integration**: Aggregates Hacker News articles and social media posts
- **Privacy-First**: Self-hosted with end-to-end encryption
- **Cross-Platform**: Web and mobile-friendly interface

## Tech Stack

### Frontend

- React 18 with TypeScript
- Tailwind CSS for styling
- D3.js for graph visualization
- Webpack for bundling

### Backend

- Node.js with Express
- FastAPI for AI services
- PostgreSQL for metadata
- Elasticsearch for search
- Neo4j for knowledge graph
- FAISS for vector search

### AI/ML

- Llama (via Ollama) for content filtering
- Sentence-BERT for embeddings
- TensorFlow for collaborative filtering
- Hugging Face for NER

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.9+
- Docker & Docker Compose
- GPU with 12GB+ VRAM (recommended)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/davincidreams/smart-social
cd social-ai-content-curation
```

2. Install dependencies:

```bash
npm install
```

3. Set up AI models:

```bash
npm run setup:models
```

4. Set up databases:

```bash
npm run setup:db
```

5. Start development environment:

```bash
npm run docker:dev
npm run dev
```

The application will be available at `http://localhost:3000`

## Architecture

The application follows a microservices architecture:

- **Frontend**: React SPA with Flipboard-like interface
- **Backend**: Node.js API server handling feed aggregation and filtering
- **AI Service**: FastAPI service for content filtering and recommendations
- **Databases**: PostgreSQL, Elasticsearch, Neo4j, and FAISS for different data needs

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database URLs
POSTGRES_URL=postgresql://user:password@localhost:5432/social_ai
ELASTICSEARCH_URL=http://localhost:9200
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# AI Configuration
OLLAMA_URL=http://localhost:11434
HUGGINGFACE_API_KEY=your_key_here

# Social Media APIs
TWITTER_API_KEY=your_key_here
TWITTER_API_SECRET=your_secret_here
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_secret_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

## Development

### Running Tests

```bash
npm test
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

### Docker Development

```bash
npm run docker:dev
```

### Production Deployment

```bash
npm run docker:prod
# or for Kubernetes
npm run k8s:deploy
```

## API Documentation

API documentation is available at:

- Backend API: `http://localhost:8000/docs`
- AI Service API: `http://localhost:8001/docs`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

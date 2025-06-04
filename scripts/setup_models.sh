#!/bin/bash

# Script to set up AI models for the Social AI Content Curation app

echo "🤖 Setting up AI models..."

# Create models directory
mkdir -p models

# Download sentence transformers model
echo "📥 Downloading sentence-transformers model..."
python -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
model.save('./models/sentence-transformer')
print('✅ Sentence transformer model downloaded')
"

# Set up Ollama and download Llama model
echo "🦙 Setting up Ollama and Llama model..."
if command -v ollama &> /dev/null; then
    echo "Ollama is already installed"
else
    echo "Please install Ollama from https://ollama.ai/"
    echo "After installation, run: ollama pull llama3.2"
fi

# Download spaCy language model
echo "🔤 Downloading spaCy language model..."
python -m spacy download en_core_web_sm

echo "✅ AI models setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Ollama if not already installed"
echo "2. Run: ollama pull llama3.2"
echo "3. Start the development environment: npm run dev"

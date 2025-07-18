#!/bin/bash

# AINO Aviation Intelligence Platform - Environment Setup Script

echo "🚀 AINO Aviation Intelligence Platform Setup"
echo "==========================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy the example file
if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "❌ .env.example file not found!"
    exit 1
fi

echo ""
echo "📝 Next Steps:"
echo "1. Edit the .env file with your actual API keys and configuration"
echo "2. Install dependencies: npm install"
echo "3. Start the development server: npm run dev"
echo ""
echo "🔑 API Keys you'll need:"
echo "   - FlightAware API key (for real-time flight tracking)"
echo "   - RapidAPI key (for various aviation data sources)"
echo "   - OpenAI API key (for AI-powered analysis)"
echo "   - AviationStack API key (for flight data)"
echo "   - News API key (for aviation news intelligence)"
echo "   - AVWX API key (for weather data)"
echo "   - FAA NOTAM API key (for NOTAMs)"
echo ""
echo "📚 Documentation: Check the README.md for detailed setup instructions"
echo ""
echo "🎉 Setup complete! Happy coding with AINO!"

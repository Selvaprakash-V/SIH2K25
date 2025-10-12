#!/bin/bash
# Quick start script for RuralIQ

echo "🚀 Setting up RuralIQ Development Environment..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Backend setup
echo "📦 Setting up Backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python -m venv .venv

# Activate virtual environment (Windows)
echo "Activating virtual environment..."
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your MongoDB URI and other credentials"
fi

echo "✅ Backend setup complete"

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../frontend

# Install frontend dependencies
echo "Installing Node.js dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
fi

echo "✅ Frontend setup complete"

cd ..

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MongoDB URI and credentials"
echo "2. Start the backend: cd backend && .\.venv\Scripts\Activate.ps1 && python seed_mock_data.py && uvicorn main:app --reload"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Visit http://localhost:3000 and login with demo credentials:"
echo "   - Admin: admin@example.com / password"
echo "   - Officer: officer@example.com / password"
echo "   - Citizen: citizen@example.com / password"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: docs/SETUP.md"
echo "   - API Docs: docs/API.md"
echo "   - Deployment: docs/DEPLOYMENT.md"
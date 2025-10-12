@echo off
REM Quick start script for RuralIQ (Windows)

echo 🚀 Setting up RuralIQ Development Environment...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Backend setup
echo 📦 Setting up Backend...
cd backend

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv .venv

REM Install backend dependencies
echo Installing Python dependencies...
.\.venv\Scripts\activate && pip install -r requirements.txt

REM Create environment file if it doesn't exist
if not exist .env (
    echo Creating backend .env file...
    copy .env.example .env
    echo ⚠️  Please update .env with your MongoDB URI and other credentials
)

echo ✅ Backend setup complete

REM Frontend setup
echo 📦 Setting up Frontend...
cd ..\frontend

REM Install frontend dependencies
echo Installing Node.js dependencies...
npm install

REM Create environment file if it doesn't exist
if not exist .env (
    echo Creating frontend .env file...
    copy .env.example .env
)

echo ✅ Frontend setup complete

cd ..

echo.
echo 🎉 Setup Complete!
echo.
echo Next steps:
echo 1. Update backend/.env with your MongoDB URI and credentials
echo 2. Start the backend: cd backend ^&^& .\.venv\Scripts\Activate.ps1 ^&^& python seed_mock_data.py ^&^& uvicorn main:app --reload
echo 3. Start the frontend: cd frontend ^&^& npm run dev
echo 4. Visit http://localhost:3000 and login with demo credentials:
echo    - Admin: admin@example.com / password
echo    - Officer: officer@example.com / password
echo    - Citizen: citizen@example.com / password
echo.
echo 📚 Documentation:
echo    - Setup Guide: docs/SETUP.md
echo    - API Docs: docs/API.md
echo    - Deployment: docs/DEPLOYMENT.md

pause
@echo off
REM TradeCraft Startup Script for Windows

echo 🚀 Starting TradeCraft Platform...

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo ⚡ Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo ⚙️  Creating .env file...
    (
        echo SECRET_KEY=your-secret-key-here-change-in-production
        echo JWT_SECRET_KEY=jwt-secret-string-change-in-production
        echo DATABASE_URL=mysql+pymysql://username:password@localhost/tradecraft
        echo FLASK_ENV=development
        echo FLASK_DEBUG=True
    ) > .env
    echo ⚠️  Please update the .env file with your database credentials
)

REM Start backend server
echo 🔧 Starting backend server on port 5000...
start "Backend Server" python app.py

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server
echo 🌐 Starting frontend server on port 8080...
start "Frontend Server" python frontend.py

echo ✅ TradeCraft is now running!
echo 📱 Frontend: http://localhost:8080
echo 🔌 Backend API: http://localhost:5000
echo 📊 API Health: http://localhost:5000/api/health
echo.
echo Close this window to stop both servers
pause
#!/bin/bash

# TradeCraft Startup Script

echo "🚀 Starting TradeCraft Platform..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOL
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=jwt-secret-string-change-in-production
DATABASE_URL=mysql+pymysql://username:password@localhost/tradecraft
FLASK_ENV=development
FLASK_DEBUG=True
EOL
    echo "⚠️  Please update the .env file with your database credentials"
fi

# Start backend server
echo "🔧 Starting backend server on port 5000..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 8080..."
python frontend.py &
FRONTEND_PID=$!

echo "✅ TradeCraft is now running!"
echo "📱 Frontend: http://localhost:8080"
echo "🔌 Backend API: http://localhost:5000"
echo "📊 API Health: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for both processes
wait
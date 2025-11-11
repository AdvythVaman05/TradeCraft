# TradeCraft - Community Skill Share Platform

A hyperlocal skill exchange platform where users can offer and request skills or services in exchange for time credits or monetary payments.

## Features

- **User Authentication**: Secure registration and login system with JWT tokens
- **Skill Management**: Post, edit, delete, and search skill listings
- **Time Credit System**: Barter system using time credits as currency
- **Real-time Chat**: Negotiate and communicate with skill providers
- **Wallet & Transactions**: Manage credits and payments
- **Reviews & Ratings**: Build trust through community feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Backend
- **Flask**: Python web framework
- **MySQL**: Database for storing user data, skills, transactions
- **JWT**: JSON Web Tokens for authentication
- **SQLAlchemy**: ORM for database operations
- **Marshmallow**: Data serialization and validation

### Frontend
- **HTML5, CSS3, JavaScript**: Modern web technologies
- **Bootstrap 5**: Responsive UI framework
- **Font Awesome**: Icon library

## Installation

### Prerequisites
- Python 3.8+
- MySQL server
- Node.js (optional, for development tools)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradecraft
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure database**
   - Create a MySQL database named `tradecraft`
   - Update the database connection in `.env` file
   - Run the database schema:
     ```bash
     mysql -u username -p tradecraft < database_schema.sql
     ```

5. **Environment configuration**
   - Copy `.env` file and update the following variables:
     ```
     SECRET_KEY=your-secret-key-here
     JWT_SECRET_KEY=jwt-secret-string
     DATABASE_URL=mysql+pymysql://username:password@localhost/tradecraft
     ```

6. **Run the application**
   
   **Backend (API Server):**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`
   
   **Frontend (Web Interface):**
   ```bash
   python frontend.py
   ```
   The web interface will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Skills
- `GET /api/skills` - Get all skills (with search and filters)
- `POST /api/skills` - Create new skill listing
- `GET /api/skills/<id>` - Get specific skill
- `PUT /api/skills/<id>` - Update skill
- `DELETE /api/skills/<id>` - Delete skill

### Wallet & Transactions
- `GET /api/wallet` - Get user wallet
- `GET /api/transactions` - Get transaction history
- `POST /api/transactions` - Create new transaction

### Chat & Messaging
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/<id>/messages` - Get chat messages
- `POST /api/chats/<id>/messages` - Send message

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/users/<id>/reviews` - Get user reviews

## Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `skill_listings` - Skill/service listings
- `wallets` - User wallet balances
- `transactions` - Transaction records
- `reviews` - User ratings and reviews
- `chats` - Chat sessions
- `messages` - Chat messages

## Project Structure

```
tradecraft/
├── app.py                 # Main Flask application
├── frontend.py           # Frontend server
├── requirements.txt      # Python dependencies
├── database_schema.sql  # MySQL database schema
├── .env                 # Environment variables
├── static/              # Static assets
│   ├── css/
│   │   └── style.css    # Custom styles
│   └── js/
│       └── app.js       # Frontend JavaScript
└── templates/
    └── index.html       # Main HTML template
```

## Usage

1. **Registration**: Create an account with email, username, and password
2. **Post Skills**: Share your skills and services with the community
3. **Browse Skills**: Search for skills by category, location, or keywords
4. **Connect**: Chat with skill providers to negotiate terms
5. **Transact**: Use time credits or monetary payments for services
6. **Review**: Rate and review experiences to build community trust

## Features Implemented

### Core Features
- ✅ User registration and authentication
- ✅ Skill posting and management
- ✅ Search and filtering
- ✅ Real-time chat system
- ✅ Wallet and transaction management
- ✅ Review and rating system
- ✅ Responsive web interface

### Security Features
- ✅ JWT-based authentication
- ✅ Password hashing
- ✅ Input validation
- ✅ CORS protection
- ✅ SQL injection prevention

### UI/UX Features
- ✅ Responsive design for all devices
- ✅ Modern, clean interface
- ✅ Real-time notifications
- ✅ Smooth animations and transitions
- ✅ Accessible design patterns

## Future Enhancements

- **Mobile App**: Native iOS and Android applications
- **Advanced Search**: ML-powered skill matching
- **Payment Integration**: UPI and other payment gateways
- **Location Services**: GPS-based skill discovery
- **Push Notifications**: Real-time alerts
- **Admin Dashboard**: Content moderation and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**TradeCraft** - Building communities through skill sharing and collaboration.
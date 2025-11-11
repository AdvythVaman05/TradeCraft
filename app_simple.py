from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from marshmallow import Schema, fields, validate
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import re
from collections import Counter
import hashlib
from sqlalchemy import or_, and_

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://user:password@localhost/tradecraft')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
jwt = JWTManager(app)
ma = Marshmallow(app)
CORS(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), unique=True)
    role = db.Column(db.String(20), default='user')  # user, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    skills = db.relationship('SkillListing', backref='provider', lazy=True)
    wallet = db.relationship('Wallet', backref='user', uselist=False, lazy=True)
    reviews_given = db.relationship('Review', foreign_keys='Review.reviewer_id', backref='reviewer', lazy=True)
    reviews_received = db.relationship('Review', foreign_keys='Review.reviewed_id', backref='reviewed', lazy=True)
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy=True)
    received_messages = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy=True)
    transactions_sent = db.relationship('Transaction', foreign_keys='Transaction.from_user_id', backref='sender', lazy=True)
    transactions_received = db.relationship('Transaction', foreign_keys='Transaction.to_user_id', backref='receiver', lazy=True)

    def set_password(self, password):
        # Simple SHA256 hashing for Windows compatibility
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    def check_password(self, password):
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()

class SkillListing(db.Model):
    __tablename__ = 'skill_listings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    time_credits = db.Column(db.Integer, default=0)
    monetary_price = db.Column(db.Float, default=0.0)
    availability = db.Column(db.String(50), default='available')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    provider_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='skill', lazy=True)
    reviews = db.relationship('Review', backref='skill', lazy=True)
    chat_sessions = db.relationship('Chat', backref='skill', lazy=True)

class Wallet(db.Model):
    __tablename__ = 'wallets'
    
    id = db.Column(db.Integer, primary_key=True)
    balance = db.Column(db.Float, default=0.0)
    time_credits = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, default=0.0)
    time_credits = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, cancelled
    transaction_type = db.Column(db.String(20), default='skill_exchange')  # skill_exchange, recharge, withdrawal
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill_listings.id'))

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewed_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill_listings.id'))
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'))

class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill_listings.id'))
    
    messages = db.relationship('Message', backref='chat', lazy=True)

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_edited = db.Column(db.Boolean, default=False)
    edited_at = db.Column(db.DateTime)
    
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

# Schemas
class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        include_fk = True
        load_instance = True

class SkillListingSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SkillListing
        include_fk = True
        load_instance = True

class WalletSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Wallet
        include_fk = True
        load_instance = True

class TransactionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Transaction
        include_fk = True
        load_instance = True

class ReviewSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Review
        include_fk = True
        load_instance = True

class ChatSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Chat
        include_fk = True
        load_instance = True

class MessageSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Message
        include_fk = True
        load_instance = True

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)
skill_schema = SkillListingSchema()
skills_schema = SkillListingSchema(many=True)
wallet_schema = WalletSchema()
transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)
review_schema = ReviewSchema()
reviews_schema = ReviewSchema(many=True)
chat_schema = ChatSchema()
chats_schema = ChatSchema(many=True)
message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        
        user = User()
        user.username = data['username']
        user.email = data['email']
        user.phone = data.get('phone')
        user.role = data.get('role', 'user')
        
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create wallet for user
        wallet = Wallet()
        wallet.user_id = user.id
        db.session.add(wallet)
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user_schema.dump(user)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': user_schema.dump(user)
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({'user': user_schema.dump(user)}), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to get profile', 'error': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'username' in data:
            user.username = data['username']
        if 'phone' in data:
            user.phone = data['phone']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_schema.dump(user)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update profile', 'error': str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        location = request.args.get('location')
        search = request.args.get('search')
        
        query = SkillListing.query.filter_by(is_active=True)
        
        if category:
            query = query.filter_by(category=category)
        if location:
            query = query.filter_by(location=location)
        if search:
            query = query.filter(SkillListing.title.contains(search) | SkillListing.description.contains(search))
        
        skills = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'skills': skills_schema.dump(skills.items),
            'total': skills.total,
            'pages': skills.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to get skills', 'error': str(e)}), 500

@app.route('/api/skills/<int:skill_id>', methods=['GET'])
def get_skill_by_id(skill_id: int):
    try:
        skill = SkillListing.query.get(skill_id)
        if not skill or not skill.is_active:
            return jsonify({'message': 'Skill not found'}), 404
        return jsonify({'skill': skill_schema.dump(skill)}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to get skill', 'error': str(e)}), 500
@app.route('/api/skills', methods=['POST'])
@jwt_required()
def create_skill():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        skill = SkillListing()
        skill.title = data['title']
        skill.description = data['description']
        skill.category = data['category']
        skill.location = data.get('location')
        skill.time_credits = data.get('time_credits', 0)
        skill.monetary_price = data.get('monetary_price', 0.0)
        skill.provider_id = user_id
        
        
        db.session.add(skill)
        db.session.commit()
        
        return jsonify({
            'message': 'Skill created successfully',
            'skill': skill_schema.dump(skill)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create skill', 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'TradeCraft API is running'}), 200

# ------------------------------
# Skill Advanced Search
# ------------------------------
@app.route('/api/skills/search', methods=['POST'])
def search_skills_advanced():
    try:
        data = request.get_json() or {}
        search_text = (data.get('query') or '').strip()
        filters = data.get('filters') or {}

        query = SkillListing.query.filter_by(is_active=True)

        category = (filters.get('category') or '').strip() if isinstance(filters, dict) else None
        location = (filters.get('location') or '').strip() if isinstance(filters, dict) else None
        min_credits = filters.get('min_credits') if isinstance(filters, dict) else None
        max_credits = filters.get('max_credits') if isinstance(filters, dict) else None
        max_price = filters.get('max_price') if isinstance(filters, dict) else None

        if category:
            query = query.filter_by(category=category)
        if location:
            query = query.filter_by(location=location)
        if isinstance(min_credits, int):
            query = query.filter(SkillListing.time_credits >= min_credits)
        if isinstance(max_credits, int):
            query = query.filter(SkillListing.time_credits <= max_credits)
        if isinstance(max_price, (int, float)):
            query = query.filter(SkillListing.monetary_price <= float(max_price))
        if search_text:
            like_expr = f"%{search_text}%"
            query = query.filter(or_(SkillListing.title.like(like_expr),
                                     SkillListing.description.like(like_expr)))

        results = query.order_by(SkillListing.created_at.desc()).all()
        return jsonify({
            'skills': skills_schema.dump(results),
            'total': len(results)
        }), 200
    except Exception as e:
        return jsonify({'message': 'Search failed', 'error': str(e)}), 500

# ------------------------------
# Chat API
# ------------------------------

def _serialize_user_basic(user: User):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email
    }

def _serialize_skill_basic(skill: SkillListing):
    return {
        'id': skill.id,
        'title': skill.title
    }

@app.route('/api/chats', methods=['GET'])
@jwt_required()
def list_chats():
    try:
        user_id = int(get_jwt_identity())
        chats = Chat.query.filter(
            (Chat.user1_id == user_id) | (Chat.user2_id == user_id),
            Chat.is_active == True
        ).order_by(Chat.created_at.desc()).all()

        result = []
        for chat in chats:
            user1 = User.query.get(chat.user1_id)
            user2 = User.query.get(chat.user2_id)
            skill = SkillListing.query.get(chat.skill_id) if chat.skill_id else None
            result.append({
                'id': chat.id,
                'created_at': chat.created_at.isoformat(),
                'is_active': chat.is_active,
                'user1_id': chat.user1_id,
                'user2_id': chat.user2_id,
                'user1': _serialize_user_basic(user1) if user1 else None,
                'user2': _serialize_user_basic(user2) if user2 else None,
                'skill': _serialize_skill_basic(skill) if skill else None
            })
        return jsonify({'chats': result}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load chats', 'error': str(e)}), 500

@app.route('/api/chats', methods=['POST'])
@jwt_required()
def create_chat():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        skill_id = data.get('skill_id')
        other_user_id = data.get('other_user_id')

        if not skill_id and not other_user_id:
            return jsonify({'message': 'skill_id or other_user_id is required'}), 400

        if skill_id:
            skill = SkillListing.query.get(skill_id)
            if not skill:
                return jsonify({'message': 'Skill not found'}), 404
            # Chat is between current user and the skill provider
            user1_id = user_id
            user2_id = skill.provider_id
        else:
            user1_id = user_id
            user2_id = int(other_user_id)

        if user1_id == user2_id:
            return jsonify({'message': 'Cannot create chat with yourself'}), 400

        # Ensure consistent ordering (user1_id < user2_id) to avoid duplicates
        a, b = (user1_id, user2_id) if user1_id < user2_id else (user2_id, user1_id)

        existing = Chat.query.filter_by(user1_id=a, user2_id=b, skill_id=skill_id).first()
        if existing:
            chat = existing
        else:
            chat = Chat()
            chat.user1_id = a
            chat.user2_id = b
            chat.skill_id = skill_id
            db.session.add(chat)
            db.session.commit()

        return jsonify({'message': 'Chat ready', 'chat': {
            'id': chat.id,
            'user1_id': chat.user1_id,
            'user2_id': chat.user2_id,
            'skill_id': chat.skill_id
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create chat', 'error': str(e)}), 500

@app.route('/api/chats/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(chat_id: int):
    try:
        user_id = int(get_jwt_identity())
        chat = Chat.query.get(chat_id)
        if not chat or not chat.is_active:
            return jsonify({'message': 'Chat not found'}), 404
        if user_id not in [chat.user1_id, chat.user2_id]:
            return jsonify({'message': 'Not authorized for this chat'}), 403

        messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.created_at.asc()).all()
        result = [{
            'id': m.id,
            'content': m.content,
            'created_at': m.created_at.isoformat(),
            'is_edited': m.is_edited,
            'edited_at': m.edited_at.isoformat() if m.edited_at else None,
            'chat_id': m.chat_id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id
        } for m in messages]
        return jsonify({'messages': result}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load messages', 'error': str(e)}), 500

@app.route('/api/chats/<int:chat_id>/messages', methods=['POST'])
@jwt_required()
def send_chat_message(chat_id: int):
    try:
        user_id = int(get_jwt_identity())
        chat = Chat.query.get(chat_id)
        if not chat or not chat.is_active:
            return jsonify({'message': 'Chat not found'}), 404
        if user_id not in [chat.user1_id, chat.user2_id]:
            return jsonify({'message': 'Not authorized for this chat'}), 403

        data = request.get_json() or {}
        content = (data.get('content') or '').strip()
        if not content:
            return jsonify({'message': 'Message content is required'}), 400

        receiver_id = chat.user1_id if user_id == chat.user2_id else chat.user2_id

        msg = Message()
        msg.chat_id = chat.id
        msg.sender_id = user_id
        msg.receiver_id = receiver_id
        msg.content = content

        db.session.add(msg)
        db.session.commit()

        return jsonify({'message': 'Message sent', 'data': {
            'id': msg.id,
            'content': msg.content,
            'created_at': msg.created_at.isoformat(),
            'chat_id': msg.chat_id,
            'sender_id': msg.sender_id,
            'receiver_id': msg.receiver_id
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to send message', 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
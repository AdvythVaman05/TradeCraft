// Global variables
let currentUser = null;
let authToken = null;
let currentChatId = null;
let currentChatUserId = null;

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
        showHome();
    } else {
        showHome();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    
    // Post skill form
    document.getElementById('postSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        postSkill();
    });
    
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchSkills();
        }
    });
    
    // Message input
    document.getElementById('messageInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Navigation functions
function showHome() {
    hideAllSections();
    document.getElementById('homeSection').style.display = 'block';
}

function showSkills() {
    hideAllSections();
    document.getElementById('skillsSection').style.display = 'block';
    loadSkills();
}

function showLogin() {
    hideAllSections();
    document.getElementById('loginSection').style.display = 'block';
}

function showRegister() {
    hideAllSections();
    document.getElementById('registerSection').style.display = 'block';
}

function showPostSkill() {
    hideAllSections();
    document.getElementById('postSkillSection').style.display = 'block';
}

function showWallet() {
    hideAllSections();
    document.getElementById('walletSection').style.display = 'block';
    loadWallet();
}

function showChats() {
    hideAllSections();
    document.getElementById('chatsSection').style.display = 'block';
    loadChats();
}

function showProfile() {
    hideAllSections();
    document.getElementById('profileSection').style.display = 'block';
    loadProfile();
}

function showMySkills() {
    hideAllSections();
    document.getElementById('mySkillsSection').style.display = 'block';
    loadMySkills();
}

function hideAllSections() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Authentication functions
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.access_token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            showToast('Login successful!', 'success');
            showHome();
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.access_token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            showToast('Registration successful!', 'success');
            showHome();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Registration error:', error);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    
    updateUIForLoggedOutUser();
    showToast('Logged out successfully', 'success');
    showHome();
}

function updateUIForLoggedInUser() {
    document.getElementById('userDropdown').style.display = 'block';
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('navUsername').textContent = currentUser.username;
}

function updateUIForLoggedOutUser() {
    document.getElementById('userDropdown').style.display = 'none';
    document.getElementById('authButtons').style.display = 'block';
}

// Skill functions
async function loadSkills() {
    try {
        const response = await fetch(`${API_BASE}/skills`);
        const data = await response.json();
        
        if (response.ok) {
            displaySkills(data.skills);
            
            // Load additional features for logged-in users
            if (currentUser) {
                loadSkillSuggestions();
                loadPopularCategories();
                loadUserStats();
            }
        } else {
            showToast('Failed to load skills', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load skills error:', error);
    }
}

async function loadSkillSuggestions() {
    try {
        const response = await fetch(`${API_BASE}/skills/suggestions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok && data.suggestions.length > 0) {
            displaySuggestions(data.suggestions);
            document.getElementById('suggestionsSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Load suggestions error:', error);
    }
}

function displaySuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestionsList');
    suggestionsList.innerHTML = '';
    
    suggestions.forEach(skill => {
        const skillCard = createSuggestionCard(skill);
        suggestionsList.innerHTML += skillCard;
    });
}

function createSuggestionCard(skill) {
    const priceDisplay = skill.monetary_price > 0 ? `$${skill.monetary_price}` : 'Free';
    const creditsDisplay = skill.time_credits > 0 ? `${skill.time_credits} credits` : 'No credits';
    
    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-info">
                <div class="card-body">
                    <h6 class="card-title">${skill.title}</h6>
                    <span class="badge bg-info">${skill.category}</span>
                    <p class="card-text small mt-2">${skill.description.substring(0, 80)}...</p>
                    <div class="d-flex justify-content-between">
                        <small class="text-success">${priceDisplay}</small>
                        <small class="text-info">${creditsDisplay}</small>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-sm btn-info" onclick="contactSkillProvider(${skill.id})">
                        <i class="fas fa-comments me-1"></i>Contact
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadPopularCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories/popular`);
        const data = await response.json();
        
        if (response.ok) {
            displayPopularCategories(data.categories);
        }
    } catch (error) {
        console.error('Load popular categories error:', error);
    }
}

function displayPopularCategories(categories) {
    const popularCategories = document.getElementById('popularCategories');
    popularCategories.innerHTML = '';
    
    categories.forEach(category => {
        const categoryBadge = `
            <span class="badge bg-primary me-2 mb-2 p-2" style="cursor: pointer;" onclick="filterByCategory('${category.name}')">
                ${category.name} (${category.count})
            </span>
        `;
        popularCategories.innerHTML += categoryBadge;
    });
}

function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    searchSkills();
}

async function loadUserStats() {
    try {
        const response = await fetch(`${API_BASE}/user/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            // Update wallet section with stats
            updateWalletWithStats(data);
        }
    } catch (error) {
        console.error('Load user stats error:', error);
    }
}

function updateWalletWithStats(stats) {
    // This could be used to enhance the wallet display
    console.log('User stats:', stats);
}

function toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advancedSearch');
    advancedSearch.style.display = advancedSearch.style.display === 'none' ? 'block' : 'none';
}

async function advancedSearch() {
    const query = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value;
    const minCredits = document.getElementById('minCreditsFilter').value;
    const maxCredits = document.getElementById('maxCreditsFilter').value;
    const maxPrice = document.getElementById('maxPriceFilter').value;
    
    const filters = {
        category,
        location,
        min_credits: minCredits ? parseInt(minCredits) : null,
        max_credits: maxCredits ? parseInt(maxCredits) : null,
        max_price: maxPrice ? parseFloat(maxPrice) : null
    };
    
    try {
        const response = await fetch(`${API_BASE}/skills/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, filters })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displaySkills(data.skills);
            showToast(`Found ${data.total} skills matching your criteria`, 'success');
        } else {
            showToast('Search failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Advanced search error:', error);
    }
}

async function searchSkills() {
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value;
    
    try {
        let url = `${API_BASE}/skills?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (location) url += `location=${encodeURIComponent(location)}&`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displaySkills(data.skills);
        } else {
            showToast('Failed to search skills', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Search skills error:', error);
    }
}

function displaySkills(skills) {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '';
    
    if (skills.length === 0) {
        skillsList.innerHTML = '<div class="col-12"><div class="alert alert-info">No skills found.</div></div>';
        return;
    }
    
    skills.forEach(skill => {
        const skillCard = createSkillCard(skill);
        skillsList.innerHTML += skillCard;
    });
}

function createSkillCard(skill) {
    const createdAt = new Date(skill.created_at).toLocaleDateString();
    const priceDisplay = skill.monetary_price > 0 ? `$${skill.monetary_price}` : 'Free';
    const creditsDisplay = skill.time_credits > 0 ? `${skill.time_credits} credits` : 'No credits';
    
    return `
        <div class="col-md-6 col-lg-4">
            <div class="card skill-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${skill.title}</h5>
                    <span class="skill-category">${skill.category}</span>
                    <p class="card-text mt-2">${skill.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt me-1"></i>${skill.location || 'Remote'}
                            </small>
                        </div>
                        <div>
                            <small class="skill-price">${priceDisplay}</small>
                            <small class="skill-time-credits ms-2">${creditsDisplay}</small>
                        </div>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">Posted on ${createdAt}</small>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm" onclick="contactSkillProvider(${skill.id})">
                        <i class="fas fa-comments me-1"></i>Contact
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="viewSkillDetails(${skill.id})">
                        <i class="fas fa-info-circle me-1"></i>Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function postSkill() {
    const title = document.getElementById('skillTitle').value;
    const description = document.getElementById('skillDescription').value;
    const category = document.getElementById('skillCategory').value;
    const location = document.getElementById('skillLocation').value;
    const timeCredits = parseInt(document.getElementById('skillTimeCredits').value) || 0;
    const monetaryPrice = parseFloat(document.getElementById('skillPrice').value) || 0;
    
    try {
        const response = await fetch(`${API_BASE}/skills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title,
                description,
                category,
                location,
                time_credits: timeCredits,
                monetary_price: monetaryPrice
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Skill posted successfully!', 'success');
            document.getElementById('postSkillForm').reset();
            showMySkills();
        } else {
            const detailParts = [];
            if (data && data.message) detailParts.push(data.message);
            if (data && data.error) detailParts.push(data.error);
            if (data && data.msg) detailParts.push(data.msg); // flask-jwt-extended errors
            const detail = detailParts.length ? `: ${detailParts.join(' - ')}` : '';
            showToast(`Failed to post skill${detail}`, 'error');
            if (response.status === 401 || response.status === 422) {
                // Likely missing/expired token
                console.warn('Authorization issue while posting skill:', data);
            }
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Post skill error:', error);
    }
}

async function loadMySkills() {
    if (!currentUser || !authToken) {
        showToast('Please login to view your skills', 'warning');
        showLogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/user/skills`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayMySkills(data.skills || []);
        } else {
            showToast(data.message || 'Failed to load your skills', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load my skills error:', error);
    }
}

function displayMySkills(skills) {
    const mySkillsList = document.getElementById('mySkillsList');
    mySkillsList.innerHTML = '';
    
    if (skills.length === 0) {
        mySkillsList.innerHTML = `
            <div class="col-12">
                <div class="card text-center p-5" style="background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(10px);">
                    <i class="fas fa-briefcase fa-4x mb-3" style="color: var(--primary); opacity: 0.5;"></i>
                    <h4 class="mb-2">No Skills Posted Yet</h4>
                    <p class="text-muted mb-4">Start sharing your expertise with the community!</p>
                    <button class="btn btn-primary" onclick="showPostSkill()">
                        <i class="fas fa-plus me-2"></i>Post Your First Skill
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    skills.forEach(skill => {
        const skillCard = createMySkillCard(skill);
        mySkillsList.innerHTML += skillCard;
    });
}

function createMySkillCard(skill) {
    const createdAt = new Date(skill.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const priceDisplay = skill.monetary_price > 0 ? `$${skill.monetary_price.toFixed(2)}` : 'Free';
    const creditsDisplay = skill.time_credits > 0 ? `${skill.time_credits} credits` : 'No credits';
    const availabilityBadge = skill.availability === 'available' 
        ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Available</span>'
        : '<span class="badge bg-secondary"><i class="fas fa-pause-circle me-1"></i>Unavailable</span>';
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card skill-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${escapeHtml(skill.title)}</h5>
                        ${availabilityBadge}
                    </div>
                    <span class="skill-category">${escapeHtml(skill.category)}</span>
                    <p class="card-text mt-3 mb-3" style="min-height: 60px;">${escapeHtml(skill.description)}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt me-1"></i>${escapeHtml(skill.location || 'Remote')}
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="skill-price">${priceDisplay}</div>
                            <div class="skill-time-credits">${creditsDisplay}</div>
                        </div>
                    </div>
                    <div class="mt-3 pt-3 border-top">
                        <small class="text-muted">
                            <i class="far fa-calendar me-1"></i>Posted on ${createdAt}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top">
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="editSkill(${skill.id})">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="viewSkillDetails(${skill.id})" title="View Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteSkill(${skill.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Wallet functions
async function loadWallet() {
    try {
        const response = await fetch(`${API_BASE}/wallet`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayWallet(data.wallet);
            loadTransactions();
        } else {
            showToast('Failed to load wallet', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load wallet error:', error);
    }
}

function displayWallet(wallet) {
    document.getElementById('timeCreditsBalance').textContent = wallet.time_credits;
    document.getElementById('moneyBalance').textContent = `$${wallet.balance.toFixed(2)}`;
}

async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayTransactions(data.transactions);
            document.getElementById('totalTransactions').textContent = data.total;
        } else {
            showToast('Failed to load transactions', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load transactions error:', error);
    }
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<div class="alert alert-info">No transactions found.</div>';
        return;
    }
    
    let html = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>With</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString();
        const isSender = transaction.from_user_id === currentUser.id;
        const otherUser = isSender ? transaction.receiver : transaction.sender;
        const amountClass = isSender ? 'text-danger' : 'text-success';
        const amountPrefix = isSender ? '-' : '+';
        
        html += `
            <tr>
                <td>${date}</td>
                <td>${transaction.transaction_type}</td>
                <td class="${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</td>
                <td class="${amountClass}">${amountPrefix}${transaction.time_credits}</td>
                <td><span class="badge bg-${getStatusColor(transaction.status)}">${transaction.status}</span></td>
                <td>${otherUser?.username || 'Unknown'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    transactionsList.innerHTML = html;
}

function getStatusColor(status) {
    switch (status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'failed': return 'danger';
        case 'cancelled': return 'secondary';
        default: return 'secondary';
    }
}

// Chat functions
async function loadChats() {
    try {
        const response = await fetch(`${API_BASE}/chats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayChats(data.chats);
        } else {
            showToast('Failed to load chats', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load chats error:', error);
    }
}

function displayChats(chats) {
    const chatsList = document.getElementById('chatsList');
    
    if (chats.length === 0) {
        chatsList.innerHTML = '<div class="p-3 text-center text-muted">No conversations yet.</div>';
        return;
    }
    
    chatsList.innerHTML = '';
    chats.forEach(chat => {
        const otherUser = chat.user1_id === currentUser.id ? chat.user2 : chat.user1;
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="profile-pic me-3" style="width: 40px; height: 40px; font-size: 1rem;">
                    ${otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${otherUser?.username || 'Unknown'}</div>
                    <small class="text-muted">${chat.skill?.title || 'General chat'}</small>
                </div>
                <small class="text-muted">${new Date(chat.created_at).toLocaleDateString()}</small>
            </div>
        `;
        chatItem.onclick = () => loadChatMessages(chat.id, otherUser);
        chatsList.appendChild(chatItem);
    });
}

async function loadChatMessages(chatId, otherUser) {
    currentChatId = chatId;
    currentChatUserId = otherUser.id;
    
    // Update UI
    document.getElementById('chatTitle').textContent = `Chat with ${otherUser.username}`;
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Highlight active chat
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    try {
        const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayMessages(data.messages);
        } else {
            showToast('Failed to load messages', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load messages error:', error);
    }
}

function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="text-center text-muted">No messages yet. Start the conversation!</div>';
        return;
    }
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        const isSent = message.sender_id === currentUser.id;
        messageDiv.className = `chat-message ${isSent ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            <div>${message.content}</div>
            <div class="timestamp">${new Date(message.created_at).toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const content = document.getElementById('messageInput').value.trim();
    
    if (!content || !currentChatId) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('messageInput').value = '';
            loadChatMessages(currentChatId, { id: currentChatUserId, username: document.getElementById('chatTitle').textContent.replace('Chat with ', '') });
        } else {
            showToast(data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Send message error:', error);
    }
}

// Profile functions
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayProfile(data.user);
            loadUserReviews();
        } else {
            showToast('Failed to load profile', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load profile error:', error);
    }
}

function displayProfile(user) {
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profilePhone').value = user.phone || '';
}

async function updateProfile() {
    const username = document.getElementById('profileUsername').value;
    const phone = document.getElementById('profilePhone').value;
    
    try {
        const response = await fetch(`${API_BASE}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ username, phone })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            showToast('Profile updated successfully!', 'success');
        } else {
            showToast(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Update profile error:', error);
    }
}

async function loadUserReviews() {
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}/reviews`);
        const data = await response.json();
        
        if (response.ok) {
            displayUserReviews(data.reviews);
        } else {
            showToast('Failed to load reviews', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Load reviews error:', error);
    }
}

function displayUserReviews(reviews) {
    const userReviews = document.getElementById('userReviews');
    
    if (reviews.length === 0) {
        userReviews.innerHTML = '<div class="alert alert-info">No reviews yet.</div>';
        return;
    }
    
    userReviews.innerHTML = '';
    reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                    <p class="mb-1">${review.comment}</p>
                    <small class="review-date">By ${review.reviewer?.username || 'Anonymous'} on ${new Date(review.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `;
        userReviews.appendChild(reviewDiv);
    });
}

// Utility functions
function showToast(message, type = 'info') {
    const toastElement = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

async function contactSkillProvider(skillId) {
    if (!currentUser) {
        showToast('Please login to contact skill providers', 'warning');
        showLogin();
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ skill_id: skillId })
        });
        const data = await response.json();
        if (response.ok || response.status === 201) {
            showToast('Chat ready. Opening conversations...', 'success');
            showChats();
        } else {
            const msg = data && (data.message || data.error) ? (data.message || data.error) : 'Failed to start chat';
            showToast(msg, 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Create chat error:', error);
    }
}

function viewSkillDetails(skillId) {
    // Fetch and show detailed skill information in a modal
    (async () => {
        try {
            const response = await fetch(`${API_BASE}/skills/${skillId}`);
            const data = await response.json();
            if (!response.ok) {
                showToast(data.message || 'Failed to load skill details', 'error');
                return;
            }
            const s = data.skill;

            // Ensure a modal container exists
            let modalEl = document.getElementById('skillDetailsModal');
            if (!modalEl) {
                modalEl = document.createElement('div');
                modalEl.id = 'skillDetailsModal';
                modalEl.className = 'modal fade';
                modalEl.tabIndex = -1;
                modalEl.innerHTML = `
<div class="modal-dialog modal-lg">
  <div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title">Skill Details</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body" id="skillDetailsBody"></div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
  </div>
</div>`;
                document.body.appendChild(modalEl);
            }

            const body = modalEl.querySelector('#skillDetailsBody');
            const priceDisplay = s.monetary_price > 0 ? `$${s.monetary_price}` : 'Free';
            const creditsDisplay = s.time_credits > 0 ? `${s.time_credits} credits` : 'No credits';
            body.innerHTML = `
  <div class="mb-3">
    <h4 class="mb-1">${s.title}</h4>
    <span class="badge bg-primary">${s.category}</span>
  </div>
  <p class="mb-3">${s.description}</p>
  <div class="row g-3">
    <div class="col-md-4"><strong>Location:</strong> ${s.location || 'Remote'}</div>
    <div class="col-md-4"><strong>Price:</strong> ${priceDisplay}</div>
    <div class="col-md-4"><strong>Time Credits:</strong> ${creditsDisplay}</div>
  </div>
  <div class="mt-3">
    <small class="text-muted">Posted on ${new Date(s.created_at).toLocaleDateString()}</small>
  </div>
`;

            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } catch (err) {
            console.error('Load skill details error:', err);
            showToast('Network error. Please try again.', 'error');
        }
    })();
}

function editSkill(skillId) {
    // This would open an edit form for the skill
    showToast('Edit skill feature would be implemented here', 'info');
}

async function deleteSkill(skillId) {
    if (!confirm('Are you sure you want to delete this skill?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/skills/${skillId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Skill deleted successfully', 'success');
            loadMySkills();
        } else {
            showToast(data.message || 'Failed to delete skill', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Delete skill error:', error);
    }
}
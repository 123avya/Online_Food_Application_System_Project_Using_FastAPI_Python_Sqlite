const API_BASE = 'http://127.0.0.1:8000';

let currentUser = null;
let isAdmin = false;
let allRestaurants = [];
let allFoods = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) {
        target.classList.add('active');
        currentPage = page;
        updateNavbar();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        switch (page) {
            case 'restaurants':
                loadRestaurants();
                break;
            case 'cart':
                displayCart();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'admin':
                loadDashboard();
                loadRestaurantOptions();
                loadAdminRestaurants();
                loadAdminFoods();
                loadAdminOrders();
                break;
        }
    }
}

function updateNavbar() {
    const navLinks = document.getElementById('nav-links');
    let html = '';

    if (isAdmin) {
        html = `
            <button class="nav-link ${currentPage === 'admin' ? 'active' : ''}" onclick="navigate('admin')">
                <i class="fas fa-chart-pie"></i> Dashboard
            </button>
            <button class="btn-logout" onclick="adminLogout()">
                <i class="fas fa-right-from-bracket"></i> Logout
            </button>
        `;
    } else if (currentUser) {
        const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        html = `
            <button class="nav-link ${currentPage === 'home' ? 'active' : ''}" onclick="navigate('home')">
                <i class="fas fa-home"></i> Home
            </button>
            <button class="nav-link ${currentPage === 'restaurants' ? 'active' : ''}" onclick="navigate('restaurants')">
                <i class="fas fa-store"></i> Restaurants
            </button>
            <button class="nav-link ${currentPage === 'orders' ? 'active' : ''}" onclick="navigate('orders')">
                <i class="fas fa-box"></i> Orders
            </button>
            <button class="nav-link ${currentPage === 'cart' ? 'active' : ''}" onclick="navigate('cart')">
                <i class="fas fa-cart-shopping"></i> Cart
                ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
            </button>
            <span class="nav-user">
                <i class="fas fa-user"></i> ${escapeHtml(currentUser.name)}
            </span>
            <button class="btn-logout" onclick="userLogout()">
                <i class="fas fa-right-from-bracket"></i>
            </button>
        `;
    } else {
        html = `
            <button class="nav-link ${currentPage === 'home' ? 'active' : ''}" onclick="navigate('home')">
                <i class="fas fa-home"></i> Home
            </button>
            <button class="nav-link ${currentPage === 'restaurants' ? 'active' : ''}" onclick="navigate('restaurants')">
                <i class="fas fa-store"></i> Restaurants
            </button>
            <button class="nav-link ${currentPage === 'login' ? 'active' : ''}" onclick="navigate('login')">
                <i class="fas fa-right-to-bracket"></i> Login
            </button>
            <button class="nav-link" onclick="navigate('admin-login')">
                <i class="fas fa-shield-halved"></i> Admin
            </button>
        `;
    }

    navLinks.innerHTML = html;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let modalCallback = null;

function showConfirm(title, message, callback) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('confirm-modal').classList.add('active');
    modalCallback = callback;
    document.getElementById('modal-confirm-btn').onclick = () => {
        closeModal();
        if (modalCallback) modalCallback();
    };
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    modalCallback = null;
}

function showImageModal(src) {
    if (!src) return;
    document.getElementById('preview-large-img').src = src;
    document.getElementById('image-modal').classList.add('active');
}

function closeImageModal(event) {
    if (!event || event.target === document.getElementById('image-modal')) {
        document.getElementById('image-modal').classList.remove('active');
    }
}

async function api(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Request failed');
        }

        return data;
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
        return null;
    }
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];

    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'error');
            input.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            preview.classList.add('has-image');
            const existingImg = preview.querySelector('img');
            if (existingImg) existingImg.remove();

            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function getImageData(fileInputId, urlInputId) {
    const fileInput = document.getElementById(fileInputId);
    const urlInput = document.getElementById(urlInputId);

    if (fileInput.files && fileInput.files[0]) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(fileInput.files[0]);
        });
    }

    const url = urlInput ? urlInput.value.trim() : '';
    if (url) {
        return Promise.resolve(url);
    }

    return Promise.resolve('');
}

async function getSyncImageData(fileInputId, urlInputId) {
    return await getImageData(fileInputId, urlInputId);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderImage(image, placeholder, size) {
    placeholder = placeholder || '🍽️';
    size = size || 'medium';

    if (image) {
        if (size === 'small') {
            return `<img src="${escapeHtml(image)}" alt="" class="table-image" loading="lazy">`;
        }
        return `<img src="${escapeHtml(image)}" alt="" style="width:100%;height:100%;object-fit:cover" loading="lazy">`;
    }

    if (size === 'small') {
        return `<div class="table-image-placeholder">${placeholder}</div>`;
    }
    return `<div style="width:100%;height:100%;background:linear-gradient(135deg,rgba(249,115,22,0.1),rgba(251,191,36,0.1));display:flex;align-items:center;justify-content:center;font-size:48px">${placeholder}</div>`;
}

function getStatusClass(status) {
    const statusMap = {
        'placed': 'status-placed',
        'preparing': 'status-preparing',
        'out for delivery': 'status-out-for-delivery',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-placed';
}

async function loadRestaurants() {
    const container = document.getElementById('restaurants-grid');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading restaurants...</p></div>';

    const [restaurantsData, foodsData] = await Promise.all([
        api('/restaurants'),
        api('/foods')
    ]);

    if (!restaurantsData) {
        container.innerHTML = '<div class="empty-state"><p>Unable to load restaurants</p></div>';
        return;
    }

    allRestaurants = restaurantsData;
    allFoods = foodsData || [];
    renderRestaurantCards(container, restaurantsData);
}

function renderRestaurantCards(container, restaurants) {
    if (restaurants.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏪</div><h2>No Restaurants Found</h2><p>Try adjusting your search</p></div>';
        return;
    }

    container.innerHTML = restaurants.map(restaurant => {
        const foodCount = allFoods.filter(f => f.restaurant_id === restaurant.id).length;
        return `
            <div class="restaurant-card" onclick="openRestaurant(${restaurant.id})">
                <div class="restaurant-image">
                    ${renderImage(restaurant.image, '🏪')}
                </div>
                <div class="restaurant-info">
                    <h3>${escapeHtml(restaurant.name)}</h3>
                    <p>${escapeHtml(restaurant.location)}</p>
                    <div class="restaurant-meta">
                        <span class="restaurant-location">
                            <i class="fas fa-location-dot"></i> ${escapeHtml(restaurant.location)}
                        </span>
                        <span class="restaurant-items-count">${foodCount} items</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterRestaurants() {
    const query = document.getElementById('restaurant-search').value.toLowerCase();
    const container = document.getElementById('restaurants-grid');
    const filtered = allRestaurants.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query)
    );
    renderRestaurantCards(container, filtered);
}

async function openRestaurant(restaurantId) {
    const container = document.getElementById('restaurant-detail-content');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading restaurant...</p></div>';

    const [restaurant, foods] = await Promise.all([
        api('/restaurants'),
        api('/foods')
    ]);

    if (!restaurant) {
        container.innerHTML = '<div class="empty-state"><p>Unable to load restaurant</p></div>';
        return;
    }

    const rest = restaurant.find(r => r.id === restaurantId);
    if (!rest) {
        container.innerHTML = '<div class="empty-state"><p>Restaurant not found</p></div>';
        return;
    }

    const restaurantFoods = (foods || []).filter(f => f.restaurant_id === restaurantId);
    allFoods = foods || [];

    container.innerHTML = `
        <div class="restaurant-detail-header">
            <div class="restaurant-detail-banner">
                ${renderImage(rest.image, '🏪')}
            </div>
            <div class="restaurant-detail-info">
                <h1>${escapeHtml(rest.name)}</h1>
                <p><i class="fas fa-location-dot"></i> ${escapeHtml(rest.location)} &bull; ${restaurantFoods.length} items available</p>
            </div>
        </div>

        <h2 style="font-size: 20px; margin-bottom: 16px;">Menu</h2>

        ${restaurantFoods.length === 0 ?
            '<div class="empty-state"><div class="empty-icon">🍽️</div><h2>No Menu Items</h2><p>This restaurant hasn\'t added any food items yet</p></div>' :
            `<div class="food-grid">
                ${restaurantFoods.map(food => `
                    <div class="food-card">
                        <div class="food-card-image">
                            ${renderImage(food.image, '🍔')}
                        </div>
                        <div class="food-card-content">
                            <h4>${escapeHtml(food.name)}</h4>
                            <p>${escapeHtml(food.description)}</p>
                            <div class="food-card-footer">
                                <span class="food-price">₹${Number(food.price).toFixed(2)}</span>
                                <span class="food-category">${escapeHtml(food.category)}</span>
                            </div>
                        </div>
                        <div style="padding: 0 16px 16px;">
                            <button class="btn btn-primary btn-sm full-width" onclick="addToCart(${food.id}, '${escapeHtml(food.name)}', ${food.price}, '${escapeHtml(food.image)}')">
                                <i class="fas fa-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>`
        }
    `;

    navigate('restaurant-detail');
}

function addToCart(foodId, name, price, image) {
    if (!currentUser) {
        showToast('Please login to add items to cart', 'info');
        navigate('login');
        return;
    }

    const existingIndex = cart.findIndex(item => item.food_id === foodId);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            food_id: foodId,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }

    saveCart();
    updateNavbar();
    showToast(`${name} added to cart`, 'success');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function increaseQuantity(index) {
    cart[index].quantity += 1;
    saveCart();
    displayCart();
    updateNavbar();
}

function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1);
    }
    saveCart();
    displayCart();
    updateNavbar();
}

function removeFromCart(index) {
    const itemName = cart[index].name;
    showConfirm('Remove Item', `Remove ${itemName} from cart?`, () => {
        cart.splice(index, 1);
        saveCart();
        displayCart();
        updateNavbar();
        showToast('Item removed from cart', 'info');
    });
}

function displayCart() {
    const container = document.getElementById('cart-content');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Add some delicious food to your cart</p>
                <button class="btn btn-primary btn-lg" onclick="navigate('restaurants')">
                    <i class="fas fa-store"></i> Browse Restaurants
                </button>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const deliveryFee = subtotal > 0 ? 40 : 0;
    const total = subtotal + deliveryFee;

    container.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items">
                ${cart.map((item, index) => {
                    const itemTotal = item.price * item.quantity;
                    return `
                        <div class="cart-item">
                            <div class="cart-item-image" ${item.image ? `onclick="showImageModal('${escapeHtml(item.image)}')"` : ''}>
                                ${renderImage(item.image, '🍽️')}
                            </div>
                            <div class="cart-item-info">
                                <h4>${escapeHtml(item.name)}</h4>
                                <p>₹${Number(item.price).toFixed(2)}</p>
                            </div>
                            <div class="quantity-control">
                                <button onclick="decreaseQuantity(${index})">−</button>
                                <span>${item.quantity}</span>
                                <button onclick="increaseQuantity(${index})">+</button>
                            </div>
                            <div class="cart-item-total">₹${itemTotal.toFixed(2)}</div>
                            <button class="remove-btn" onclick="removeFromCart(${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="cart-summary">
                <h2>Order Summary</h2>
                <div class="summary-row">
                    <span>Subtotal (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Fee</span>
                    <span>₹${deliveryFee.toFixed(2)}</span>
                </div>
                <div class="summary-row total-row">
                    <span>Total</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-lg full-width" onclick="placeOrder()" id="place-order-btn">
                    <i class="fas fa-paper-plane"></i> Place Order
                </button>
                <button class="btn btn-secondary full-width" onclick="navigate('restaurants')" style="margin-top: 12px;">
                    <i class="fas fa-arrow-left"></i> Continue Shopping
                </button>
            </div>
        </div>
    `;
}

async function placeOrder() {
    if (!currentUser) {
        showToast('Please login to place an order', 'info');
        navigate('login');
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const button = document.getElementById('place-order-btn');
    button.disabled = true;
    button.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Placing Order...';

    const orderData = {
        user_id: currentUser.id,
        items: cart.map(item => ({
            food_id: item.food_id,
            quantity: item.quantity
        }))
    };

    const data = await api('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });

    if (data) {
        cart = [];
        saveCart();
        updateNavbar();
        showToast(`Order #${data.order.id} placed successfully!`, 'success');
        navigate('orders');
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Place Order';
    }
}

async function loadOrders() {
    if (!currentUser) {
        navigate('login');
        return;
    }

    const container = document.getElementById('orders-content');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading orders...</p></div>';

    const data = await api('/orders');
    if (!data) {
        container.innerHTML = '<div class="empty-state"><p>Unable to load orders</p></div>';
        return;
    }

    const userOrders = data.filter(order => order.user_id === currentUser.id);

    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h2>No Orders Yet</h2>
                <p>Place your first order!</p>
                <button class="btn btn-primary btn-lg" onclick="navigate('restaurants')">
                    <i class="fas fa-store"></i> Order Now
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = userOrders.map(order => {
        const itemsPreview = order.items.map(item => `${item.food_name} × ${item.quantity}`).join(', ');
        return `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">#ORD-${String(order.id).padStart(4, '0')}</span>
                    <span class="status-badge ${getStatusClass(order.status)}">${order.status}</span>
                    <span class="order-date"><i class="fas fa-clock"></i> ${order.date_ordered || 'Just now'}</span>
                </div>
                <div class="order-body">
                    <div class="order-items-preview">${escapeHtml(itemsPreview)}</div>
                    <div class="order-total">₹${Number(order.total_amount).toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('login-name').value.trim();
    const email = document.getElementById('login-email').value.trim();
    const messageDiv = document.getElementById('login-message');

    if (!name || !email) {
        messageDiv.innerHTML = '<p class="error-message">Please enter name and email</p>';
        return;
    }

    const data = await api('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email })
    });

    if (data) {
        currentUser = data.user;
        localStorage.setItem('user_id', currentUser.id);
        localStorage.setItem('user_name', currentUser.name);
        localStorage.setItem('user_email', currentUser.email);
        showToast('Login successful!', 'success');
        navigate('restaurants');
        this.reset();
        messageDiv.innerHTML = '';
    } else {
        messageDiv.innerHTML = '<p class="error-message">Login failed. Please try again.</p>';
    }
});

function userLogout() {
    currentUser = null;
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    showToast('Logged out successfully', 'info');
    navigate('home');
}

document.getElementById('admin-login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const messageDiv = document.getElementById('admin-login-message');

    if (email === 'admin@foodie.com' && password === 'admin123') {
        isAdmin = true;
        showToast('Admin login successful!', 'success');
        navigate('admin');
        this.reset();
        messageDiv.innerHTML = '';
    } else {
        messageDiv.innerHTML = '<p class="error-message">Invalid admin credentials</p>';
    }
});

function adminLogout() {
    isAdmin = false;
    showToast('Admin logged out', 'info');
    navigate('home');
}

function switchAdminTab(tabId, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');

    switch (tabId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'add-food':
            loadRestaurantOptions();
            break;
        case 'manage-restaurants':
            loadAdminRestaurants();
            break;
        case 'manage-foods':
            loadAdminFoods();
            break;
        case 'manage-orders':
            loadAdminOrders();
            break;
    }
}

async function loadDashboard() {
    const data = await api('/admin/dashboard');
    if (!data) return;

    document.getElementById('stat-users').textContent = data.users;
    document.getElementById('stat-restaurants').textContent = data.restaurants;
    document.getElementById('stat-foods').textContent = data.foods;
    document.getElementById('stat-orders').textContent = data.orders;
    document.getElementById('stat-sales').textContent = `₹${Number(data.total_sales).toFixed(2)}`;
}

document.getElementById('restaurant-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('restaurant-name').value.trim();
    const location = document.getElementById('restaurant-location').value.trim();
    const messageDiv = document.getElementById('restaurant-message');

    if (!name || !location) {
        messageDiv.innerHTML = '<p class="error-message">Please fill in required fields</p>';
        return;
    }

    const image = await getSyncImageData('restaurant-image', 'restaurant-image-url');

    const data = await api('/restaurants', {
        method: 'POST',
        body: JSON.stringify({ name, location, image })
    });

    if (data) {
        messageDiv.innerHTML = '<p class="success-message">Restaurant added successfully!</p>';
        this.reset();
        const preview = document.getElementById('restaurant-preview');
        preview.classList.remove('has-image');
        const img = preview.querySelector('img');
        if (img) img.remove();
        loadDashboard();
        loadAdminRestaurants();
        loadRestaurantOptions();
    } else {
        messageDiv.innerHTML = '<p class="error-message">Failed to add restaurant</p>';
    }
});

async function loadRestaurantOptions() {
    const select = document.getElementById('food-restaurant');
    const data = await api('/restaurants');

    if (!data) return;

    select.innerHTML = '<option value="">Select Restaurant</option>';
    data.forEach(restaurant => {
        const option = document.createElement('option');
        option.value = restaurant.id;
        option.textContent = restaurant.name;
        select.appendChild(option);
    });
}

document.getElementById('food-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('food-name').value.trim();
    const description = document.getElementById('food-description').value.trim();
    const price = Number(document.getElementById('food-price').value);
    const category = document.getElementById('food-category').value.trim();
    const restaurant_id = Number(document.getElementById('food-restaurant').value);
    const messageDiv = document.getElementById('food-message');

    if (!name || !description || !price || !category || !restaurant_id) {
        messageDiv.innerHTML = '<p class="error-message">Please fill in all required fields</p>';
        return;
    }

    const image = await getSyncImageData('food-image', 'food-image-url');

    const data = await api('/foods', {
        method: 'POST',
        body: JSON.stringify({ name, description, price, category, restaurant_id, image })
    });

    if (data) {
        messageDiv.innerHTML = '<p class="success-message">Food item added successfully!</p>';
        this.reset();
        const preview = document.getElementById('food-preview');
        preview.classList.remove('has-image');
        const img = preview.querySelector('img');
        if (img) img.remove();
        loadDashboard();
        loadAdminFoods();
    } else {
        messageDiv.innerHTML = '<p class="error-message">Failed to add food item</p>';
    }
});

// ===== ADMIN RESTAURANTS LIST =====
async function loadAdminRestaurants() {
    const container = document.getElementById('admin-restaurants-list');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const data = await api('/restaurants');
    if (!data) {
        container.innerHTML = '<p class="error-message">Unable to load restaurants</p>';
        return;
    }

    allRestaurants = data;

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No restaurants found</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(restaurant => `
                    <tr>
                        <td>
                            <div style="cursor:pointer" onclick="showImageModal('${escapeHtml(restaurant.image || '')}')">
                                ${renderImage(restaurant.image, '🏪', 'small')}
                            </div>
                        </td>
                        <td><strong>${escapeHtml(restaurant.name)}</strong></td>
                        <td>${escapeHtml(restaurant.location)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="deleteRestaurant(${restaurant.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function deleteRestaurant(id) {
    showConfirm('Delete Restaurant', 'This will also delete all foods from this restaurant. Continue?', async () => {
        const data = await api(`/restaurants/${id}`, { method: 'DELETE' });
        if (data) {
            showToast('Restaurant deleted successfully', 'success');
            loadDashboard();
            loadAdminRestaurants();
            loadRestaurantOptions();
        }
    });
}

// ===== ADMIN FOODS LIST =====
async function loadAdminFoods() {
    const container = document.getElementById('admin-foods-list');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const data = await api('/foods');
    if (!data) {
        container.innerHTML = '<p class="error-message">Unable to load foods</p>';
        return;
    }

    allFoods = data;

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No food items found</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Restaurant</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(food => {
                    const restaurant = allRestaurants.find(r => r.id === food.restaurant_id);
                    return `
                        <tr>
                            <td>
                                <div style="cursor:pointer" onclick="showImageModal('${escapeHtml(food.image || '')}')">
                                    ${renderImage(food.image, '🍔', 'small')}
                                </div>
                            </td>
                            <td><strong>${escapeHtml(food.name)}</strong></td>
                            <td>${escapeHtml(food.category)}</td>
                            <td><strong>₹${Number(food.price).toFixed(2)}</strong></td>
                            <td>${escapeHtml(restaurant ? restaurant.name : 'Unknown')}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="deleteFood(${food.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function deleteFood(id) {
    showConfirm('Delete Food', 'Are you sure you want to delete this food item?', async () => {
        const data = await api(`/foods/${id}`, { method: 'DELETE' });
        if (data) {
            showToast('Food item deleted successfully', 'success');
            loadDashboard();
            loadAdminFoods();
        }
    });
}

async function loadAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const data = await api('/orders');
    if (!data) {
        container.innerHTML = '<p class="error-message">Unable to load orders</p>';
        return;
    }

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No orders found</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(order => {
                    const itemsPreview = order.items.map(item => `${item.food_name} × ${item.quantity}`).join('<br>');
                    return `
                        <tr>
                            <td><strong>#${order.id}</strong></td>
                            <td>${escapeHtml(order.user_name)}</td>
                            <td style="max-width: 200px;">${itemsPreview}</td>
                            <td><strong>₹${Number(order.total_amount).toFixed(2)}</strong></td>
                            <td>
                                <span class="status-badge ${getStatusClass(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                            <td>
                                <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                                    <option value="">Change Status</option>
                                    <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>Placed</option>
                                    <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                                    <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function updateOrderStatus(orderId, status) {
    if (!status) return;

    const data = await api(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });

    if (data) {
        showToast('Order status updated successfully', 'success');
        loadAdminOrders();
        loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const savedUserId = localStorage.getItem('user_id');
    const savedUserName = localStorage.getItem('user_name');
    const savedUserEmail = localStorage.getItem('user_email');

    if (savedUserId && savedUserName) {
        currentUser = {
            id: parseInt(savedUserId),
            name: savedUserName,
            email: savedUserEmail
        };
    }

    updateNavbar();
});
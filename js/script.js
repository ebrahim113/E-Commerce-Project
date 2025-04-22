import { products } from './products.js';

// State management
let cart = [];
let wishlist = [];
let currentCategory = 'all';
let searchQuery = '';
let isProductsLoading = false;
let lastRenderTime = 0;

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.category-btn');

// Cart elements
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const cartBtn = document.getElementById('cartBtn');
const cartClose = cartModal?.querySelector('.close');

// Wishlist elements
const wishlistModal = document.getElementById('wishlistModal');
const wishlistItems = document.getElementById('wishlistItems');
const wishlistCount = document.getElementById('wishlistCount');
const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistClose = wishlistModal?.querySelector('.close');

// Filter and display products with optimized rendering
function displayProducts() {
    if (isProductsLoading || Date.now() - lastRenderTime < 16) return; // Skip if already loading or too soon
    
    isProductsLoading = true;
    lastRenderTime = Date.now();

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        const filteredProducts = products.filter(product => {
            const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
            const matchesSearch = !searchQuery || 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                product.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        const template = document.createElement('template');
        
        // Batch create product cards
        const productCards = filteredProducts.map(product => {
            return `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="favorite-icon ${wishlist.includes(product.id) ? 'active' : ''}" data-product-id="${product.id}">
                        <i class="${wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </div>
                    <div class="product-image">
                        <img src="${product.image}" 
                             alt="${product.name}"
                             class="product-img">
                    </div>
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button class="btn add-to-cart-btn">Add to Cart</button>
                </div>
            `;
        }).join('');

        template.innerHTML = productCards;
        fragment.appendChild(template.content);
        
        // Clear and update products container in one operation
        productsContainer.innerHTML = '';
        productsContainer.appendChild(fragment);

        // Initialize lazy loading for new images
        initLazyLoading();
        isProductsLoading = false;
    });
}

// Lazy loading implementation
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.onload = () => {
                    img.classList.add('loaded');
                    img.classList.remove('lazy');
                };
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => {
        // If image is already cached, add loaded class immediately
        if (img.complete) {
            img.classList.add('loaded');
        }
        imageObserver.observe(img);
    });
}

// Add to cart
function addToCart(productId) {
    // Convert productId to number if it's a string
    const numericId = Number(productId);
    const product = products.find(p => p.id === numericId);
    
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    const existingItem = cart.find(item => item.id === numericId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
}

// Remove from cart
function removeFromCart(productId) {
    const numericId = Number(productId);
    cart = cart.filter(item => item.id !== numericId);
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cartItems) {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="btn quantity-btn" data-action="decrease" data-product-id="${item.id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="btn quantity-btn" data-action="increase" data-product-id="${item.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <p class="cart-item-total">Total: $${(item.price * item.quantity).toFixed(2)}</p>
                        <button class="btn remove-btn" data-product-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
    }
}

// Wishlist functions
function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index === -1) {
        wishlist.push(productId);
    } else {
        wishlist.splice(index, 1);
    }
    updateWishlistUI();
    // Update only the clicked favorite icon without re-rendering all products
    const favIcons = document.querySelectorAll(`.favorite-icon[data-product-id="${productId}"]`);
    favIcons.forEach(el => {
        const icon = el.querySelector('i');
        if (wishlist.includes(productId)) {
            el.classList.add('active');
            icon.classList.replace('far', 'fas');
        } else {
            el.classList.remove('active');
            icon.classList.replace('fas', 'far');
        }
    });
}

function updateWishlistUI() {
    wishlistCount.textContent = wishlist.length;
    
    const wishlistProducts = products.filter(product => wishlist.includes(product.id));
    wishlistItems.innerHTML = wishlistProducts.map(product => `
        <div class="wishlist-item">
            <div>
                <h4>${product.name}</h4>
                <p>$${product.price.toFixed(2)}</p>
            </div>
            <div>
                <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="btn" onclick="toggleWishlist(${product.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Cart quantity update
function updateQuantity(productId, newQuantity) {
    const numericId = Number(productId);
    const item = cart.find(item => item.id === numericId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(numericId);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
        }
    }
}

// Search functionality with real-time results
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
searchInput.parentElement.appendChild(searchResults);

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.split('').join('.*')})`, 'gi');
    return text.replace(regex, '<span class="highlight-text">$1</span>');
}

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length > 0) {
        const matchedProducts = products.filter(product => {
            const productName = product.name.toLowerCase();
            const productDesc = product.description.toLowerCase();
            
            // Create regex pattern that matches characters in sequence
            const pattern = query.split('').join('.*');
            const regex = new RegExp(pattern);
            
            return regex.test(productName) || regex.test(productDesc);
        });
        
        if (matchedProducts.length > 0) {
            searchResults.innerHTML = matchedProducts.map(product => {
                const highlightedName = highlightMatch(product.name, query);
                const highlightedDesc = highlightMatch(product.description, query);
                
                return `
                    <div class="search-result-item" onclick="selectSearchResult('${product.id}')">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="search-result-info">
                            <h4>${highlightedName}</h4>
                            <p class="result-description">${highlightedDesc}</p>
                            <p class="result-price">$${product.price}</p>
                        </div>
                    </div>
                `;
            }).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="no-results">No products found</div>';
            searchResults.style.display = 'block';
        }
    } else {
        searchResults.style.display = 'none';
    }
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Handle search result selection
function selectSearchResult(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        searchInput.value = product.name;
        searchResults.style.display = 'none';
        currentCategory = 'all';
        displayProducts();
        
        // Scroll to the product
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement) {
            productElement.scrollIntoView({ behavior: 'smooth' });
            productElement.classList.add('highlight');
            setTimeout(() => productElement.classList.remove('highlight'), 2000);
        }
    }
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert(`Thank you for your purchase! Total: $${total.toFixed(2)}`);
    cart = [];
    updateCartUI();
    closeModal(cartModal);
}

// Optimized event listeners with debouncing
const debouncedDisplayProducts = debounce(displayProducts, 150);

// Modal handling functions
function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'block';
    // Trigger reflow to ensure transition works
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300); // Match transition duration
}

// Event Listeners with delegation where possible
if (cartBtn && cartClose) {
    cartBtn.addEventListener('click', () => openModal(cartModal));
    cartClose.addEventListener('click', () => closeModal(cartModal));
}

if (wishlistBtn && wishlistClose) {
    wishlistBtn.addEventListener('click', () => openModal(wishlistModal));
    wishlistClose.addEventListener('click', () => closeModal(wishlistModal));
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        debouncedDisplayProducts();
    });
}

if (document.querySelector('.category-buttons')) {
    document.querySelector('.category-buttons').addEventListener('click', (e) => {
        const button = e.target.closest('.category-btn');
        if (!button) return;

        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentCategory = button.dataset.category;
        debouncedDisplayProducts();
    });
}

window.addEventListener('click', (e) => {
    if (e.target === cartModal) closeModal(cartModal);
    if (e.target === wishlistModal) closeModal(wishlistModal);
});

// Handle form submissions
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message!');
        contactForm.reset();
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('This is a demo - no actual login will occur.');
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('This is a demo - no actual registration will occur.');
    });
}

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.checkout = checkout;
window.selectSearchResult = selectSearchResult;
window.toggleWishlist = toggleWishlist;
window.updateWishlistUI = updateWishlistUI;

// Initialize cart event listeners
if (cartItems) {
    // Add event delegation for cart item buttons
    cartItems.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const productId = Number(btn.dataset.productId);
        
        if (btn.classList.contains('quantity-btn')) {
            const action = btn.dataset.action;
            const currentItem = cart.find(item => item.id === productId);
            if (currentItem) {
                if (action === 'increase') {
                    updateQuantity(productId, currentItem.quantity + 1);
                } else if (action === 'decrease' && currentItem.quantity > 1) {
                    updateQuantity(productId, currentItem.quantity - 1);
                } else if (action === 'decrease' && currentItem.quantity === 1) {
                    removeFromCart(productId);
                }
            }
        } else if (btn.classList.contains('remove-btn')) {
            removeFromCart(productId);
        }
    });
}

// Initialize the page
if (productsContainer) {
    displayProducts();
    
    // Add event delegation for product cards
    productsContainer.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (!productCard) return;
        
        const productId = productCard.dataset.productId;
        
        if (e.target.closest('.favorite-icon')) {
            const favBtn = e.target.closest('.favorite-icon');
            toggleWishlist(Number(favBtn.dataset.productId));
        } else if (e.target.classList.contains('add-to-cart-btn')) {
            addToCart(productId);
        } else if (e.target.closest('.product-image') || e.target.tagName === 'H3') {
            selectSearchResult(productId);
        }
    });
}
updateCartUI();

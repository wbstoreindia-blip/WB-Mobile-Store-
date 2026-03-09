// ==========================================
// UTILITY: Price Formatter (Rupees)
// ==========================================
const formatPrice = (price) => {
    if (!price) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

// ==========================================
// 1. CART STATE MANAGEMENT (LocalStorage)
// ==========================================
// Browser ki memory se purana cart fetch karo, agar khali hai toh empty array []
let cart = JSON.parse(localStorage.getItem('wb_cart')) || [];

function saveCart() {
    localStorage.setItem('wb_cart', JSON.stringify(cart));
    updateCartBadge();
    
    // Agar user Cart page par hai, toh UI ko turant update karo
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
}

// ==========================================
// 2. UPDATE BOTTOM NAV BADGE
// ==========================================
export function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    badges.forEach(badge => {
        badge.innerText = totalItems;
        // Agar cart khali hai toh badge chupa do
        if (totalItems === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'flex';
        }
    });
}

// ==========================================
// 3. ADD TO CART FUNCTION (Global)
// ==========================================
// window. lagane se yeh function poori website mein kahin se bhi call ho sakta hai
window.addToCart = function(id, name, price, image) {
    // Check karo ki phone pehle se cart mein hai ya nahi
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        // Agar pehle se hai, toh sirf quantity badhao
        existingItem.quantity += 1;
    } else {
        // Agar naya phone hai, toh cart list mein daal do
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }

    saveCart();
    
    // Customer ko success message dikhao
    alert(`✅ ${name} added to your cart!`);
};

// ==========================================
// 4. RENDER CART PAGE (cart.html ke liye)
// ==========================================
function renderCartPage() {
    const emptyState = document.getElementById('empty-cart-message');
    const filledState = document.getElementById('filled-cart-container');
    const cartList = document.getElementById('cart-items-list');
    
    // Agar hum cart.html par nahi hain, toh ruk jao
    if (!emptyState || !filledState || !cartList) return;

    if (cart.length === 0) {
        // CART KHALI HAI
        emptyState.style.display = 'flex';
        filledState.style.display = 'none';
    } else {
        // CART BHAR GAYA HAI
        emptyState.style.display = 'none';
        filledState.style.display = 'block';

        let html = '';
        let totalAmount = 0;

        cart.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;

            html += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <p class="cart-item-price">${formatPrice(item.price)}</p>
                        
                        <div class="cart-item-controls">
                            <div class="quantity-btn">
                                <button onclick="updateQuantity('${item.id}', -1)">-</button> 
                                <span style="font-weight: bold; width: 20px; text-align: center;">${item.quantity}</span> 
                                <button onclick="updateQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="delete-btn" onclick="removeFromCart('${item.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        cartList.innerHTML = html;

        // Order Summary Update Karo
        document.getElementById('summary-items-total').innerText = formatPrice(totalAmount);
        document.getElementById('summary-final-total').innerText = formatPrice(totalAmount);
        
        // Checkout Button logic
        const checkoutBtn = document.getElementById('proceed-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.onclick = () => {
                window.location.href = 'checkout.html';
            };
        }
    }
}

// ==========================================
// 5. UPDATE QUANTITY (+ / -)
// ==========================================
window.updateQuantity = function(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        
        // Agar customer quantity 0 kar de, toh item delete kar do
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
        }
    }
};

// ==========================================
// 6. REMOVE ITEM (Trash Icon)
// ==========================================
window.removeFromCart = function(id) {
    // Filter lagakar us item ko hata do jiski ID match karti hai
    cart = cart.filter(item => item.id !== id);
    saveCart();
};

// ==========================================
// INIT (Page load hote hi kya chalana hai)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge(); // Har page par Bottom Nav ka badge update karega
    
    // Agar user cart.html par hai toh render function chalao
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
});

import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// UTILITY: Paise ko Indian Rupees (₹) mein dikhane ke liye
// ==========================================
export const formatPrice = (price) => {
    if (!price) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

// ==========================================
// 1. LOAD BANNERS (For Home Page)
// ==========================================
async function loadBanners() {
    const slider = document.getElementById('banner-slider');
    if (!slider) return;

    try {
        // Sirf wahi banners lao jinka 'active' status true hai
        const q = query(collection(db, 'banners'), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        
        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.image) {
                // CSS scroll-snap ke zariye yeh auto-slider jaisa kaam karega
                html += `<img src="${data.image}" alt="Promo Banner" style="min-width: 100%; scroll-snap-align: center;">`;
            }
        });

        if (html !== '') {
            slider.innerHTML = html;
            slider.style.display = 'flex';
            slider.style.overflowX = 'auto';
            slider.style.scrollSnapType = 'x mandatory';
            slider.style.gap = '10px';
        } else {
            slider.innerHTML = '<p style="text-align:center; color:var(--text-grey);">No active offers right now.</p>';
        }
    } catch (error) {
        console.error("Error loading banners:", error);
    }
}

// ==========================================
// 2. LOAD PRODUCTS (For Home Page Grid)
// ==========================================
async function loadProducts(categoryFilter = 'all') {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="spinner-container"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading Phones...</div>';

    try {
        let q;
        if (categoryFilter === 'all') {
            q = collection(db, 'products');
        } else {
            // Category wise filter (Jaise sirf Android ya sirf iOS)
            q = query(collection(db, 'products'), where('categoryId', '==', categoryFilter));
        }

        const querySnapshot = await getDocs(q);
        let html = '';

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;
            
            // Image handle karna (Agar upload nahi hui toh dummy image)
            const mainImage = (product.images && product.images.length > 0) 
                ? product.images[0] 
                : 'https://via.placeholder.com/300x300/121212/1DB954?text=WB+Store';

            // Discount Badge Logic
            let discountHtml = '';
            if (product.discountPrice && product.price > product.discountPrice) {
                let off = Math.round(((product.price - product.discountPrice) / product.price) * 100);
                discountHtml = `<span class="discount-badge">${off}% OFF</span>`;
            }

            // Product Card Design (HTML string)
            html += `
                <div class="product-grid-card">
                    <div class="card-image-wrapper">
                        <a href="product.html?id=${productId}">
                            <img src="${mainImage}" alt="${product.name}">
                        </a>
                        ${discountHtml}
                        <button class="card-wishlist-btn" onclick="toggleWishlist('${productId}')">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>
                    <div class="card-info">
                        <a href="product.html?id=${productId}">
                            <h3>${product.name || 'Unknown Item'}</h3>
                            <p style="font-size:11px; color:var(--text-grey);">${product.brand || 'WB Store'}</p>
                            <div style="display:flex; align-items:center; gap:5px; margin-top:8px;">
                                <span class="price">${formatPrice(product.discountPrice || product.price)}</span>
                                ${product.discountPrice ? `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
                            </div>
                        </a>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html !== '' ? html : '<p style="text-align:center; width:100%; color:var(--text-grey);">No products found in this category.</p>';

    } catch (error) {
        console.error("Error loading products:", error);
        grid.innerHTML = '<p style="color:var(--danger-red); text-align:center; width:100%;">Failed to load products.</p>';
    }
}

// ==========================================
// 3. CATEGORY CHIPS FILTER LOGIC
// ==========================================
function setupCategoryFilters() {
    const chips = document.querySelectorAll('.chip');
    if (chips.length === 0) return;

    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Remove active class from all
            chips.forEach(c => c.classList.remove('active'));
            // Add active class to clicked
            e.target.classList.add('active');
            
            // Load products based on category
            const category = e.target.getAttribute('data-category');
            loadProducts(category);
        });
    });
}

// ==========================================
// 4. LOAD SINGLE PRODUCT DETAILS (Product Page)
// ==========================================
async function loadProductDetails() {
    const container = document.getElementById('product-details-container');
    const spinner = document.getElementById('loading-spinner');
    if (!container || !spinner) return;

    // URL se phone ki ID nikalna (e.g., product.html?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        spinner.innerHTML = "Product not found!";
        return;
    }

    try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const product = docSnap.data();

            // Hide Spinner, Show Content
            spinner.style.display = 'none';
            container.style.display = 'block';

            // Fill Data in HTML
            document.getElementById('product-title').innerText = product.name;
            document.getElementById('product-brand').innerText = product.brand;
            document.getElementById('product-description').innerText = product.description || 'No description available.';
            
            // Price Setup
            const currentPrice = product.discountPrice || product.price;
            document.getElementById('product-price').innerText = formatPrice(currentPrice);
            
            if (product.discountPrice && product.price > product.discountPrice) {
                const oldPriceEl = document.getElementById('product-old-price');
                oldPriceEl.innerText = formatPrice(product.price);
                oldPriceEl.classList.remove('hidden');
                
                const badge = document.getElementById('product-discount-badge');
                let off = Math.round(((product.price - product.discountPrice) / product.price) * 100);
                badge.innerText = `${off}% OFF`;
                badge.classList.remove('hidden');
            }

            // Image Gallery Setup (5 Images)
            if (product.images && product.images.length > 0) {
                const mainImg = document.getElementById('main-product-image');
                mainImg.src = product.images[0];

                const thumbContainer = document.getElementById('product-thumbnails');
                let thumbHtml = '';
                product.images.forEach((imgUrl, index) => {
                    if(imgUrl) {
                        // Pehli image ko 'active' class do
                        const activeClass = index === 0 ? 'active' : '';
                        thumbHtml += `
                            <div class="thumbnail-box ${activeClass}" onclick="changeMainImage('${imgUrl}', this)">
                                <img src="${imgUrl}" alt="Thumbnail">
                            </div>
                        `;
                    }
                });
                thumbContainer.innerHTML = thumbHtml;
            }

            // Add To Cart Button Par Click Lagana
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            addToCartBtn.onclick = () => {
                // Yeh function cart.js mein banayenge
                if(typeof addToCart === 'function') {
                    addToCart(productId, product.name, currentPrice, product.images[0]);
                } else {
                    alert('Cart system loading...');
                }
            };

        } else {
            spinner.innerHTML = "Product doesn't exist anymore!";
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        spinner.innerHTML = "Failed to load product details.";
    }
}

// Choti photos par click karne se badi photo change hone ka logic (Global function)
window.changeMainImage = function(newSrc, element) {
    document.getElementById('main-product-image').src = newSrc;
    // Update active border
    document.querySelectorAll('.thumbnail-box').forEach(box => box.classList.remove('active'));
    element.classList.add('active');
};

// ==========================================
// INIT (Page load hote hi kya chalana hai)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadBanners();
    loadProducts('all');
    setupCategoryFilters();
    loadProductDetails();
});

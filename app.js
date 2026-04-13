// ===== APP.JS — Homepage logic (Fixed) =====
import { db, auth } from './firebase-config.js';
import {
  collection, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─────────────────────────────────────────────
// TOAST (global)
// ─────────────────────────────────────────────
window.showToast = function (msg, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(20px)';
    t.style.transition = 'all 0.3s';
    setTimeout(() => t.remove(), 300);
  }, duration);
};

// ─────────────────────────────────────────────
// CART BADGE
// ─────────────────────────────────────────────
export function updateCartBadge() {
  const cart  = JSON.parse(localStorage.getItem('wb_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent     = count;
    el.style.display   = count > 0 ? 'flex' : 'none';
  });
}

// ─────────────────────────────────────────────
// AUTH STATE → navbar profile icon behaviour
// ─────────────────────────────────────────────
function initAuthState() {
  onAuthStateChanged(auth, (user) => {
    // Profile link: if guest show login, if user show profile
    const profileLink = document.getElementById('navbar-profile-link');
    if (profileLink) {
      profileLink.href = user ? 'profile.html' : 'login.html';
      profileLink.title = user ? 'My Profile' : 'Login / Register';
    }

    // Guest login prompt banner (if exists on page)
    const guestBanner = document.getElementById('guest-banner');
    if (guestBanner) {
      guestBanner.style.display = user ? 'none' : '';
    }
  });
}

// ─────────────────────────────────────────────
// BANNER SLIDER
// ─────────────────────────────────────────────
async function initBanners() {
  const slider = document.getElementById('banner-slider');
  if (!slider) return;

  const track   = slider.querySelector('.banner-track');
  const dotsWrap = slider.querySelector('.banner-dots');

  let banners = [];
  try {
    const snap = await getDocs(
      query(collection(db, 'banners'), where('active', '==', true))
    );
    banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Banner fetch failed:', e.message);
  }

  // Fallback placeholder when no banners
  if (!banners.length) {
    track.innerHTML = `
      <div class="banner-slide" style="background:linear-gradient(135deg,#4F7C82,#0B2E33);
        display:flex;align-items:center;justify-content:center;min-width:100%;height:100%">
        <div style="text-align:center;padding:20px">
          <p style="color:#B8E3E9;font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:600;margin-bottom:8px">
            WB Mobile Store
          </p>
          <p style="color:rgba(184,227,233,0.7);font-size:0.9rem">Premium Mobiles &amp; Accessories</p>
        </div>
      </div>`;
    if (dotsWrap) dotsWrap.innerHTML = '<div class="banner-dot active"></div>';
    return;
  }

  track.innerHTML = banners.map(b => `
    <div class="banner-slide">
      <img src="${b.imageUrl}" alt="${b.title || 'Banner'}" loading="lazy"
           onerror="this.parentElement.style.background='linear-gradient(135deg,#4F7C82,#0B2E33)'">
    </div>`).join('');

  if (dotsWrap) {
    dotsWrap.innerHTML = banners
      .map((_, i) => `<div class="banner-dot${i === 0 ? ' active' : ''}"></div>`)
      .join('');
  }

  if (banners.length < 2) return; // No need to slide a single banner

  let current = 0;
  const total = banners.length;
  const dots  = dotsWrap ? dotsWrap.querySelectorAll('.banner-dot') : [];

  function goTo(idx) {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  setInterval(() => goTo(current + 1), 2800);
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
let allProducts    = [];
let activeCategory = 'All';
let activeBrand    = 'All';

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:48px">
      <div class="loader-ring" style="margin:0 auto"></div>
    </div>`;

  try {
    const snap = await getDocs(collection(db, 'products'));
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    buildFilters();
    renderProducts(allProducts);
  } catch (e) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="color:#c0392b;margin-top:8px">Could not load products.<br>
          <span style="font-size:0.8rem;opacity:0.7">${e.message}</span>
        </p>
      </div>`;
  }
}

function buildFilters() {
  const catWrap   = document.getElementById('category-filters');
  const brandWrap = document.getElementById('brand-filters');
  if (!catWrap || !brandWrap) return;

  const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const brands     = ['All', ...new Set(allProducts.map(p => p.brand).filter(Boolean))];

  catWrap.innerHTML = categories.map(c =>
    `<button class="chip${c === activeCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');

  brandWrap.innerHTML = brands.map(b =>
    `<button class="chip${b === activeBrand ? ' active' : ''}" data-brand="${b}">${b}</button>`
  ).join('');

  catWrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.cat;
      catWrap.querySelectorAll('.chip').forEach(c =>
        c.classList.toggle('active', c.dataset.cat === activeCategory));
      filterAndRender();
    });
  });

  brandWrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeBrand = chip.dataset.brand;
      brandWrap.querySelectorAll('.chip').forEach(c =>
        c.classList.toggle('active', c.dataset.brand === activeBrand));
      filterAndRender();
    });
  });
}

function filterAndRender() {
  let filtered = allProducts;
  if (activeCategory !== 'All') filtered = filtered.filter(p => p.category === activeCategory);
  if (activeBrand    !== 'All') filtered = filtered.filter(p => p.brand    === activeBrand);
  renderProducts(filtered);
}

function renderProducts(products) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
        <p>No products found</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(p => productCardHTML(p)).join('');

  // Attach events after render
  grid.querySelectorAll('.product-card').forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      window.location.href = `product.html?id=${products[i].id}`;
    });

    const addBtn = card.querySelector('.btn-add-cart');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(products[i]);
      });
    }
  });
}

function productCardHTML(p) {
  const outOfStock = p.stockStatus === 'out' || Number(p.quantity) <= 0;
  const imgSrc     = (p.images && p.images[0]) || 'https://via.placeholder.com/300x300?text=No+Image';
  const displayPrice = Number(p.discountPrice || p.price).toLocaleString('en-IN');
  const origPrice    = p.price && p.price !== p.discountPrice
    ? `<span class="price-original">Rs. ${Number(p.price).toLocaleString('en-IN')}</span>`
    : '';

  return `
    <div class="product-card">
      <div class="product-card-image">
        <img src="${imgSrc}" alt="${p.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
        ${outOfStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-prices">
          ${origPrice}
          <span class="price-discounted">Rs. ${displayPrice}</span>
        </div>
        <button class="btn btn-primary btn-add-cart" ${outOfStock ? 'disabled' : ''}>
          ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// ADD TO CART
// ─────────────────────────────────────────────
window.addToCart = function (product, qty = 1) {
  let cart = JSON.parse(localStorage.getItem('wb_cart') || '[]');
  const idx = cart.findIndex(i => i.id === product.id);
  if (idx >= 0) {
    cart[idx].qty += qty;
  } else {
    cart.push({
      id:    product.id,
      name:  product.name,
      price: product.discountPrice || product.price,
      image: (product.images && product.images[0]) || '',
      qty
    });
  }
  localStorage.setItem('wb_cart', JSON.stringify(cart));
  updateCartBadge();
  window.showToast('Added to cart', 'success');
};

// ─────────────────────────────────────────────
// SEARCH OVERLAY
// ─────────────────────────────────────────────
function initSearch() {
  const input   = document.getElementById('search-input');
  const overlay = document.getElementById('search-overlay');
  const panel   = document.getElementById('search-panel');
  if (!input || !overlay || !panel) return;

  input.addEventListener('focus', () => overlay.classList.add('active'));

  overlay.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== input) {
      overlay.classList.remove('active');
    }
  });

  // Also close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { panel.innerHTML = ''; return; }

    const results = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );

    if (!results.length) {
      panel.innerHTML = '<p style="color:var(--secondary);font-size:0.9rem;padding:4px 0">No results found</p>';
      return;
    }

    panel.innerHTML = results.slice(0, 8).map(p => `
      <div onclick="window.location.href='product.html?id=${p.id}'"
           style="display:flex;gap:12px;align-items:center;padding:10px;border-radius:10px;
                  cursor:pointer;transition:background 0.2s"
           onmouseover="this.style.background='rgba(255,255,255,0.45)'"
           onmouseout="this.style.background='transparent'">
        <img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/44'}"
             style="width:44px;height:44px;border-radius:8px;object-fit:cover;background:#eee;flex-shrink:0"
             onerror="this.src='https://via.placeholder.com/44'">
        <div style="min-width:0">
          <div style="font-size:0.88rem;font-weight:600;color:var(--dark);
               white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
          <div style="font-size:0.8rem;color:var(--card)">
            Rs. ${Number(p.discountPrice || p.price).toLocaleString('en-IN')}
          </div>
        </div>
      </div>`).join('');
  });
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('page-loader');

  try {
    updateCartBadge();
    initAuthState();
    await Promise.all([initBanners(), loadProducts()]);
    initSearch();
  } catch (e) {
    console.error('App init error:', e);
  } finally {
    if (loader) loader.classList.add('hidden');
  }
});

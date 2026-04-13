// app.js — Fixed: admin detection, UI toggle, error handling

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBx724MefpWjw6KfUMX9o7BkygQ5xeD02k",
  authDomain: "wb-mobile-store.firebaseapp.com",
  projectId: "wb-mobile-store",
  storageBucket: "wb-mobile-store.firebasestorage.app",
  messagingSenderId: "54481231902",
  appId: "1:54481231902:web:395ad38266e975fae6ce0f",
  measurementId: "G-5R648HZ40T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_EMAIL = "wbstore.india@gmail.com";

// ─── Utility ──────────────────────────────────────────────────────────────────

function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = `<p style="color:#c0392b;font-size:14px;margin:8px 0;">${message}</p>`;
    el.style.display = "block";
  }
  console.error("[App Error]", message);
}

function showMessage(containerId, message, type = "info") {
  const el = document.getElementById(containerId);
  if (!el) return;
  const color = type === "error" ? "#c0392b" : type === "success" ? "#27ae60" : "#0B2E33";
  el.innerHTML = `<p style="color:${color};font-size:14px;margin:8px 0;">${message}</p>`;
  el.style.display = "block";
}

// ─── Admin Detection ──────────────────────────────────────────────────────────

function toggleAdminUI(user) {
  const adminBtn = document.getElementById("adminBtn");
  const adminNavBtn = document.getElementById("adminNavBtn");
  const adminOnlyEls = document.querySelectorAll(".admin-only");

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (adminBtn) {
    adminBtn.style.display = isAdmin ? "inline-flex" : "none";
    adminBtn.onclick = () => { window.location.href = "admin.html"; };
  }

  if (adminNavBtn) {
    adminNavBtn.style.display = isAdmin ? "inline-flex" : "none";
    adminNavBtn.onclick = () => { window.location.href = "admin.html"; };
  }

  adminOnlyEls.forEach((el) => {
    el.style.display = isAdmin ? "block" : "none";
  });

  console.log("[App] Admin UI:", isAdmin ? "visible" : "hidden");
}

// ─── Auth State ───────────────────────────────────────────────────────────────

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  toggleAdminUI(user);
  initPage(user);
});

// ─── Banner Slider ────────────────────────────────────────────────────────────

async function loadBanners() {
  const sliderEl = document.getElementById("bannerSlider");
  if (!sliderEl) return;

  try {
    const snap = await getDocs(query(
      collection(db, "banners"),
      where("active", "==", true)
    ));

    if (snap.empty) {
      sliderEl.innerHTML = `<div class="banner-slide banner-placeholder">
        <p style="color:#4F7C82;text-align:center;padding:40px;">No banners available</p>
      </div>`;
      return;
    }

    const banners = [];
    snap.forEach((doc) => banners.push({ id: doc.id, ...doc.data() }));

    sliderEl.innerHTML = banners.map((b, i) => `
      <div class="banner-slide ${i === 0 ? "active" : ""}" style="display:${i === 0 ? "block" : "none"};">
        <img src="${b.imageUrl}" alt="Banner ${i + 1}" loading="lazy"
          style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />
      </div>
    `).join("");

    // Auto-slide
    if (banners.length > 1) {
      let current = 0;
      setInterval(() => {
        const slides = sliderEl.querySelectorAll(".banner-slide");
        slides[current].style.display = "none";
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].style.display = "block";
        slides[current].classList.add("active");
      }, 2500);
    }
  } catch (error) {
    console.error("[Banners]", error);
    sliderEl.innerHTML = `<div class="banner-slide">
      <p style="color:#c0392b;text-align:center;padding:40px;">Failed to load banners.</p>
    </div>`;
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

let allProducts = [];
let activeCategory = "all";
let activeBrand = "all";
let searchQuery = "";

async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = `<p style="color:#4F7C82;text-align:center;padding:40px;grid-column:1/-1;">Loading products...</p>`;

  try {
    const snap = await getDocs(collection(db, "products"));
    allProducts = [];
    snap.forEach((doc) => allProducts.push({ id: doc.id, ...doc.data() }));

    populateFilters();
    renderProducts();
  } catch (error) {
    console.error("[Products]", error);
    grid.innerHTML = `<p style="color:#c0392b;text-align:center;grid-column:1/-1;">Failed to load products. Please refresh.</p>`;
  }
}

function populateFilters() {
  const catFilter = document.getElementById("categoryFilter");
  const brandFilter = document.getElementById("brandFilter");
  if (!catFilter || !brandFilter) return;

  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))];

  catFilter.innerHTML = `<option value="all">All Categories</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");

  brandFilter.innerHTML = `<option value="all">All Brands</option>` +
    brands.map((b) => `<option value="${b}">${b}</option>`).join("");

  catFilter.addEventListener("change", (e) => { activeCategory = e.target.value; renderProducts(); });
  brandFilter.addEventListener("change", (e) => { activeBrand = e.target.value; renderProducts(); });
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  let filtered = allProducts.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchBrand = activeBrand === "all" || p.brand === activeBrand;
    const matchSearch = !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery) ||
      p.brand?.toLowerCase().includes(searchQuery) ||
      p.category?.toLowerCase().includes(searchQuery);
    return matchCat && matchBrand && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color:#93B1B5;text-align:center;padding:40px;grid-column:1/-1;">No products found.</p>`;
    return;
  }

  grid.innerHTML = filtered.map((p) => `
    <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-img-wrap">
        <img src="${p.images?.[0] || 'placeholder.png'}" alt="${p.name}" loading="lazy" />
        ${p.stock === false || p.quantity === 0 ? `<span class="out-of-stock-badge">Out of Stock</span>` : ""}
      </div>
      <div class="product-info">
        <p class="product-name">${p.name || "Unnamed Product"}</p>
        <p class="product-brand">${p.brand || ""}</p>
        <div class="product-price">
          ${p.discountPrice ? `<span class="price-original">₹${p.price}</span>
            <span class="price-discount">₹${p.discountPrice}</span>` :
            `<span class="price-discount">₹${p.price}</span>`}
        </div>
        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p.id}', '${p.name}', ${p.discountPrice || p.price}, '${p.images?.[0] || ""}')">
          Add to Cart
        </button>
      </div>
    </div>
  `).join("");
}

// ─── Search ───────────────────────────────────────────────────────────────────

const searchBar = document.getElementById("searchBar");
if (searchBar) {
  searchBar.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderProducts();
  });
}

// ─── Cart (LocalStorage) ──────────────────────────────────────────────────────

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("wb_cart")) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem("wb_cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const countEl = document.getElementById("cartCount");
  if (countEl) {
    const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    countEl.textContent = total;
    countEl.style.display = total > 0 ? "flex" : "none";
  }
}

window.addToCart = function (id, name, price, image) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }
  saveCart(cart);

  // Brief feedback
  const feedback = document.getElementById("cartFeedback");
  if (feedback) {
    feedback.textContent = `${name} added to cart`;
    feedback.style.display = "block";
    setTimeout(() => { feedback.style.display = "none"; }, 2000);
  }
};

// ─── Init ─────────────────────────────────────────────────────────────────────

function initPage(user) {
  updateCartCount();
  loadBanners();
  loadProducts();
}

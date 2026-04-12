// ============================================================
// app.js — Product Fetching, Rendering & Navigation
// Wb Mobile Store
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { addToCart, updateCartBadge } from "./cart.js";
import { observeAuth, logoutUser } from "./auth.js";

// ── On page load ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();
  initNavbar();

  const page = document.body.dataset.page;

  if (page === "home")    await initHomePage();
  if (page === "product") await initProductPage();
});

// ── Navbar setup ─────────────────────────────────────────────
function initNavbar() {
  // Logout button (if present)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  // Hamburger toggle
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      hamburger.classList.toggle("active");
    });
  }

  // Auth-aware nav
  observeAuth((user) => {
    const loginLink  = document.getElementById("navLogin");
    const logoutLink = document.getElementById("navLogout");
    const adminLink  = document.getElementById("navAdmin");

    if (user) {
      if (loginLink)  loginLink.style.display  = "none";
      if (logoutLink) logoutLink.style.display = "flex";
      if (adminLink && user.email === "wbstore.india@gmail.com") {
        adminLink.style.display = "flex";
      }
    } else {
      if (loginLink)  loginLink.style.display  = "flex";
      if (logoutLink) logoutLink.style.display = "none";
      if (adminLink)  adminLink.style.display  = "none";
    }
  });
}

// ── Home Page: product grid ───────────────────────────────────
async function initHomePage() {
  const grid     = document.getElementById("productGrid");
  const skeleton = document.getElementById("skeletonGrid");
  const emptyMsg = document.getElementById("emptyProducts");

  if (!grid) return;

  try {
    const q        = query(collection(db, "products"), orderBy("name"));
    const snapshot = await getDocs(q);

    if (skeleton) skeleton.style.display = "none";

    if (snapshot.empty) {
      if (emptyMsg) emptyMsg.style.display = "flex";
      return;
    }

    const products = [];
    snapshot.forEach(docSnap => products.push({ id: docSnap.id, ...docSnap.data() }));

    grid.innerHTML = products.map(p => productCard(p)).join("");

    // Attach add-to-cart listeners
    grid.querySelectorAll(".add-to-cart-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const prod = {
          id:       btn.dataset.id,
          name:     btn.dataset.name,
          price:    Number(btn.dataset.price),
          imageUrl: btn.dataset.image
        };
        addToCart(prod);
        btn.classList.add("btn-pulse");
        setTimeout(() => btn.classList.remove("btn-pulse"), 600);
      });
    });

  } catch (err) {
    console.error("Error fetching products:", err);
    if (skeleton) skeleton.style.display = "none";
    if (grid) grid.innerHTML = `<p class="error-msg">Failed to load products. Please refresh.</p>`;
  }
}

// ── Product Card HTML ─────────────────────────────────────────
function productCard(p) {
  const price = Number(p.price).toLocaleString("en-IN");
  return `
    <div class="product-card glass-card" data-id="${p.id}">
      <a href="product.html?id=${p.id}" class="product-card-link">
        <div class="product-img-wrap">
          <img
            src="${p.imageUrl || 'https://via.placeholder.com/320x240/1a1a2e/00ffff?text=📱'}"
            alt="${p.name}"
            class="product-img"
            loading="lazy"
          >
          <span class="product-badge">New</span>
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${(p.description || "").slice(0, 70)}${p.description && p.description.length > 70 ? "…" : ""}</p>
          <p class="product-price">₹${price}</p>
        </div>
      </a>
      <button
        class="btn btn-glow add-to-cart-btn"
        data-id="${p.id}"
        data-name="${p.name}"
        data-price="${p.price}"
        data-image="${p.imageUrl || ''}"
      >
        Add to Cart
      </button>
    </div>
  `;
}

// ── Single Product Page ───────────────────────────────────────
async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get("id");

  const container = document.getElementById("productDetail");
  const skeleton  = document.getElementById("productSkeleton");

  if (!id || !container) return;

  try {
    const docRef  = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (skeleton) skeleton.style.display = "none";

    if (!docSnap.exists()) {
      container.innerHTML = `<p class="error-msg">Product not found.</p>`;
      return;
    }

    const p     = { id: docSnap.id, ...docSnap.data() };
    const price = Number(p.price).toLocaleString("en-IN");

    container.innerHTML = `
      <div class="product-detail-inner glass-card">
        <div class="product-detail-img-wrap">
          <img src="${p.imageUrl || 'https://via.placeholder.com/500x400/1a1a2e/00ffff?text=📱'}" alt="${p.name}" class="product-detail-img">
        </div>
        <div class="product-detail-content">
          <h1 class="product-detail-name">${p.name}</h1>
          <p class="product-detail-price">₹${price}</p>
          <p class="product-detail-desc">${p.description || ""}</p>
          <div class="product-actions">
            <button id="detailAddCart" class="btn btn-glow btn-lg">
              🛒 Add to Cart
            </button>
            <a href="index.html" class="btn btn-outline">← Back</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById("detailAddCart").addEventListener("click", () => {
      addToCart({ id: p.id, name: p.name, price: Number(p.price), imageUrl: p.imageUrl });
      const btn = document.getElementById("detailAddCart");
      btn.textContent = "✓ Added!";
      setTimeout(() => btn.textContent = "🛒 Add to Cart", 2000);
    });

  } catch (err) {
    console.error("Error loading product:", err);
    if (skeleton) skeleton.style.display = "none";
    container.innerHTML = `<p class="error-msg">Error loading product.</p>`;
  }
}

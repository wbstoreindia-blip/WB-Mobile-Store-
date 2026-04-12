// ============================================================
// cart.js — Cart Management (localStorage)
// Wb Mobile Store
// ============================================================

const CART_KEY = "wb_cart";

// ── Read / Write ─────────────────────────────────────────────
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

// ── Add Item ─────────────────────────────────────────────────
export function addToCart(product) {
  const cart    = getCart();
  const existing = cart.find(i => i.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  showCartToast(product.name);
}

// ── Remove Item ──────────────────────────────────────────────
export function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

// ── Update Quantity ──────────────────────────────────────────
export function updateQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);

  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart(cart);
}

// ── Clear Cart ───────────────────────────────────────────────
export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

// ── Totals ───────────────────────────────────────────────────
export function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

// ── Badge update ─────────────────────────────────────────────
export function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const count = getCartCount();
  badge.textContent  = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// ── Toast notification ───────────────────────────────────────
function showCartToast(name) {
  let toast = document.getElementById("cartToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cartToast";
    toast.className = "cart-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = `✓ "${name}" added to cart`;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ── Render cart page ─────────────────────────────────────────
export function renderCartPage() {
  const container = document.getElementById("cartItems");
  const totalEl   = document.getElementById("cartTotal");
  const emptyEl   = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = "";
    if (emptyEl)   emptyEl.style.display   = "flex";
    if (summaryEl) summaryEl.style.display = "none";
    return;
  }

  if (emptyEl)   emptyEl.style.display   = "none";
  if (summaryEl) summaryEl.style.display = "block";

  container.innerHTML = cart.map(item => `
    <div class="cart-item glass-card" data-id="${item.id}">
      <div class="cart-item-img">
        <img src="${item.imageUrl || 'https://via.placeholder.com/120x120/1a1a2e/ffffff?text=📱'}" alt="${item.name}" loading="lazy">
      </div>
      <div class="cart-item-info">
        <h3 class="cart-item-name">${item.name}</h3>
        <p class="cart-item-price">₹${Number(item.price).toLocaleString("en-IN")}</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="window.cartAdjust('${item.id}', -1)">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="window.cartAdjust('${item.id}', 1)">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <p class="cart-item-subtotal">₹${(item.price * item.quantity).toLocaleString("en-IN")}</p>
        <button class="remove-btn" onclick="window.cartRemove('${item.id}')">🗑 Remove</button>
      </div>
    </div>
  `).join("");

  if (totalEl) {
    totalEl.textContent = `₹${getCartTotal().toLocaleString("en-IN")}`;
  }
}

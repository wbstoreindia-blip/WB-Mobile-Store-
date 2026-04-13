// ===== CART.JS =====
import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ===== STATE =====
let currentUser = null;
let selectedPayment = 'cod';

// ===== CART LOGIC =====
function getCart() { return JSON.parse(localStorage.getItem('wb_cart') || '[]'); }
function setCart(c) { localStorage.setItem('wb_cart', JSON.stringify(c)); updateBadge(); }

function updateBadge() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function renderCart() {
  const cart = getCart();
  const listEl  = document.getElementById('cart-list');
  const emptyEl = document.getElementById('cart-empty');
  const summaryEl = document.getElementById('cart-summary');
  const checkoutEl = document.getElementById('checkout-section');
  if (!listEl) return;

  if (!cart.length) {
    listEl.innerHTML = '';
    if (emptyEl)   emptyEl.style.display = '';
    if (summaryEl) summaryEl.style.display = 'none';
    if (checkoutEl) checkoutEl.style.display = 'none';
    return;
  }

  if (emptyEl)   emptyEl.style.display = 'none';
  if (summaryEl) summaryEl.style.display = '';
  if (checkoutEl) checkoutEl.style.display = '';

  listEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image || 'https://via.placeholder.com/100?text=Item'}" alt="${item.name}" loading="lazy">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">Rs. ${(Number(item.price) * item.qty).toLocaleString('en-IN')}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)">-</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          </div>
          <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  renderSummary(cart);
}

function renderSummary(cart) {
  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const el = document.getElementById('cart-summary');
  if (!el) return;
  el.innerHTML = `
    <div class="cart-summary-row"><span>Subtotal (${cart.reduce((s,i)=>s+i.qty,0)} items)</span><span>Rs. ${subtotal.toLocaleString('en-IN')}</span></div>
    <div class="cart-summary-row"><span>Delivery</span><span style="color:#1e8449;font-weight:600">Free</span></div>
    <div class="cart-summary-row total"><span>Total</span><span>Rs. ${subtotal.toLocaleString('en-IN')}</span></div>
  `;
}

window.changeQty = function (idx, delta) {
  const cart = getCart();
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  setCart(cart);
  renderCart();
};

window.removeItem = function (idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  setCart(cart);
  renderCart();
  showToast('Item removed', 'info');
};

// ===== PAYMENT OPTIONS =====
function initPaymentOptions() {
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.payment;
      if (opt.classList.contains('payment-disabled')) {
        showToast('Online payment is under development', 'info');
        return;
      }
      selectedPayment = val;
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

// ===== CHECKOUT =====
function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('checkout-error');
    const hide = () => { if (errEl) errEl.style.display = 'none'; };
    const show = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };

    hide();

    if (!currentUser) {
      show('You must be logged in to place an order.');
      return;
    }

    const name    = form['c-name'].value.trim();
    const phone   = form['c-phone'].value.trim();
    const address = form['c-address'].value.trim();

    if (!name)    { show('Please enter your name.');         return; }
    if (!phone)   { show('Please enter your phone number.'); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { show('Enter a valid 10-digit Indian mobile number.'); return; }
    if (!address) { show('Please enter your delivery address.'); return; }

    if (selectedPayment === 'online') {
      show('Online payment is under development. Please select Cash on Delivery.');
      return;
    }

    const cart = getCart();
    if (!cart.length) { show('Your cart is empty.'); return; }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Placing order...';

    const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);

    try {
      await addDoc(collection(db, 'orders'), {
        userId:    currentUser.uid,
        userEmail: currentUser.email,
        name,
        phone,
        address,
        items: cart,
        total,
        paymentMethod: 'cod',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      localStorage.removeItem('wb_cart');
      updateBadge();
      showToast('Order placed successfully!', 'success', 4000);
      setTimeout(() => window.location.href = 'profile.html', 1800);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Place Order';
      show('Failed to place order: ' + err.message);
    }
  });
}

// ===== TOAST (local) =====
function showToast(msg, type = 'info', dur = 3000) {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, dur);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, user => { currentUser = user; });
  updateBadge();
  renderCart();
  initPaymentOptions();
  initCheckout();

  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('hidden');
});

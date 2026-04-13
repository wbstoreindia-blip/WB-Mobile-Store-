// ===== PROFILE.JS =====
import { db, auth, ADMIN_EMAIL } from './firebase-config.js';
import {
  collection, getDocs, query, where, orderBy, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;

const STATUS_STEPS = ['pending','confirmed','shipped','out_for_delivery','delivered'];

function statusIndex(s) { return STATUS_STEPS.indexOf(s); }

function statusLabel(s) {
  const m = { pending:'Pending', confirmed:'Confirmed', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled' };
  return m[s] || s;
}

function renderProfileHeader(user) {
  const emailEl = document.getElementById('profile-email');
  const nameEl  = document.getElementById('profile-name');
  if (emailEl) emailEl.textContent = user.email;
  if (nameEl)  nameEl.textContent  = user.displayName || user.email.split('@')[0];
}

async function loadOrders(user) {
  const listEl  = document.getElementById('orders-list');
  const emptyEl = document.getElementById('orders-empty');
  if (!listEl) return;

  listEl.innerHTML = '<div style="text-align:center;padding:40px"><div class="loader-ring" style="margin:0 auto"></div></div>';

  try {
    const snap = await getDocs(
      query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
    );

    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!orders.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = orders.map(o => orderCard(o)).join('');

    listEl.querySelectorAll('.view-tracking-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.orderId;
        const order   = orders.find(o => o.id === orderId);
        showTrackingModal(order);
      });
    });

    listEl.querySelectorAll('.write-review-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.productId;
        const orderId   = btn.dataset.orderId;
        showReviewModal(productId, orderId, user);
      });
    });

  } catch (err) {
    listEl.innerHTML = `<p class="alert alert-error">Failed to load orders: ${err.message}</p>`;
  }
}

function orderCard(order) {
  const date  = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A';
  const items = order.items || [];
  const isCancelled = order.status === 'cancelled';

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div class="order-id">Order #${order.id.slice(-8).toUpperCase()}</div>
          <div class="order-date">${date}</div>
        </div>
        <span class="badge badge-${order.status}">${statusLabel(order.status)}</span>
      </div>
      <div class="order-items-preview">${items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
      ${isCancelled && order.cancelReason ? `<div class="alert alert-error" style="margin-bottom:10px;margin-top:0">Reason: ${order.cancelReason}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div class="order-total">Rs. ${Number(order.total).toLocaleString('en-IN')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm view-tracking-btn" data-order-id="${order.id}">Track Order</button>
          ${order.status === 'delivered' ? `<button class="btn btn-sm write-review-btn" style="background:var(--dark);color:white" data-order-id="${order.id}" data-product-id="${items[0]?.id || ''}">Write Review</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function showTrackingModal(order) {
  const overlay = document.getElementById('tracking-modal');
  const content = document.getElementById('tracking-content');
  if (!overlay || !content) return;

  const isCancelled = order.status === 'cancelled';
  const curIdx      = statusIndex(order.status);

  const steps = isCancelled
    ? ['pending','confirmed','cancelled']
    : STATUS_STEPS;

  content.innerHTML = `
    <div class="tracking-steps">
      ${steps.map((s, i) => {
        let cls = '';
        if (isCancelled) {
          if (i < steps.length - 1 && statusIndex(s) <= statusIndex(order.status === 'cancelled' ? 'confirmed' : s)) cls = 'done';
          if (s === 'cancelled') cls = 'current';
        } else {
          if (i < curIdx) cls = 'done';
          if (i === curIdx) cls = 'current';
        }
        return `<div class="tracking-step ${cls}">
          <div class="tracking-step-dot"></div>
          <div class="tracking-step-label">${statusLabel(s)}</div>
        </div>`;
      }).join('')}
    </div>
    ${isCancelled && order.cancelReason ? `<div class="alert alert-error">Cancellation reason: ${order.cancelReason}</div>` : ''}
  `;

  overlay.classList.add('active');
  overlay.querySelector('.modal-title').textContent = 'Order #' + order.id.slice(-8).toUpperCase();
}

function showReviewModal(productId, orderId, user) {
  const overlay = document.getElementById('review-modal');
  if (!overlay) return;
  overlay.classList.add('active');
  overlay.dataset.productId = productId;
  overlay.dataset.orderId   = orderId;
}

async function submitReview(productId, orderId, text, user) {
  if (!text.trim()) { showToast('Please write a review', 'error'); return; }
  try {
    await addDoc(collection(db, 'reviews'), {
      productId,
      orderId,
      userId:    user.uid,
      userEmail: user.email,
      text: text.trim(),
      createdAt: serverTimestamp()
    });
    showToast('Review submitted!', 'success');
    document.getElementById('review-modal').classList.remove('active');
  } catch (err) {
    showToast('Failed to submit: ' + err.message, 'error');
  }
}

function showToast(msg, type = 'info', dur = 3000) {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, dur);
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, user => {
    const loader = document.getElementById('page-loader');
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;
    renderProfileHeader(user);
    loadOrders(user);
    if (loader) loader.classList.add('hidden');
  });

  // Close modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Tracking modal close btn
  const closeTrack = document.getElementById('close-tracking');
  if (closeTrack) closeTrack.addEventListener('click', () => document.getElementById('tracking-modal').classList.remove('active'));

  // Review form
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const overlay   = document.getElementById('review-modal');
      const productId = overlay.dataset.productId;
      const orderId   = overlay.dataset.orderId;
      const text      = reviewForm['review-text'].value;
      await submitReview(productId, orderId, text, currentUser);
      reviewForm.reset();
    });
  }

  // Cart badge
  const cart = JSON.parse(localStorage.getItem('wb_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
});

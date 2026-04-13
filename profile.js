// ===== PROFILE.JS — Fixed & Upgraded =====
import { db, auth } from './firebase-config.js';
import {
  collection, getDocs, query, where, orderBy,
  addDoc, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let currentUser    = null;
let savedUserData  = {};   // cached Firestore profile

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function statusLabel(s) {
  const m = {
    pending:          'Pending',
    confirmed:        'Confirmed',
    shipped:          'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled'
  };
  return m[s] || s;
}

function showToast(msg, type = 'info', dur = 3000) {
  let c = document.querySelector('.toast-container');
  if (!c) {
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity   = '0';
    t.style.transform = 'translateY(20px)';
    t.style.transition = 'all 0.3s';
    setTimeout(() => t.remove(), 300);
  }, dur);
}

function el(id) { return document.getElementById(id); }

// ─────────────────────────────────────────────
// SIGN OUT — defined here as backup, also on window
// ─────────────────────────────────────────────
window.signOutUser = async function () {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Sign-out error:', e);
  } finally {
    window.location.replace('login.html');
  }
};

// ─────────────────────────────────────────────
// CART BADGE
// ─────────────────────────────────────────────
function updateCartBadge() {
  const cart  = JSON.parse(localStorage.getItem('wb_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent   = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ─────────────────────────────────────────────
// VIEWS: guest vs logged-in
// ─────────────────────────────────────────────
function showGuestView() {
  const loader = el('page-loader');
  if (loader) loader.classList.add('hidden');

  const guestView   = el('guest-view');
  const loggedView  = el('logged-view');
  if (guestView)  guestView.style.display  = '';
  if (loggedView) loggedView.style.display = 'none';
}

function showLoggedView() {
  const guestView  = el('guest-view');
  const loggedView = el('logged-view');
  if (guestView)  guestView.style.display  = 'none';
  if (loggedView) loggedView.style.display = '';
}

// ─────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────
function renderProfileHeader(user, userData) {
  const nameEl  = el('profile-name');
  const emailEl = el('profile-email');
  if (nameEl)  nameEl.textContent  = userData.name  || user.displayName || user.email.split('@')[0];
  if (emailEl) emailEl.textContent = user.email;

  // Avatar initials
  const avatarEl = el('profile-avatar-letter');
  if (avatarEl) {
    const nm = userData.name || user.email;
    avatarEl.textContent = nm.charAt(0).toUpperCase();
  }
}

// ─────────────────────────────────────────────
// FIRESTORE: load / save user profile
// ─────────────────────────────────────────────
async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    console.warn('Could not load user data:', e.message);
    return {};
  }
}

async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    return true;
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error');
    return false;
  }
}

// ─────────────────────────────────────────────
// ADDRESS FORM
// ─────────────────────────────────────────────
function initAddressForm(userData) {
  const form     = el('address-form');
  const nameInp  = el('addr-name');
  const phoneInp = el('addr-phone');
  const addrInp  = el('addr-address');
  const errEl    = el('address-error');
  const successEl = el('address-success');

  if (!form) return;

  // Pre-fill saved values
  if (nameInp)  nameInp.value  = userData.name    || '';
  if (phoneInp) phoneInp.value = userData.phone   || '';
  if (addrInp)  addrInp.value  = userData.address || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl)     errEl.style.display     = 'none';
    if (successEl) successEl.style.display = 'none';

    const name    = nameInp  ? nameInp.value.trim()  : '';
    const phone   = phoneInp ? phoneInp.value.trim() : '';
    const address = addrInp  ? addrInp.value.trim()  : '';

    if (!name)    { if (errEl) { errEl.textContent = 'Please enter your name.';         errEl.style.display = 'block'; } return; }
    if (!phone)   { if (errEl) { errEl.textContent = 'Please enter your phone number.'; errEl.style.display = 'block'; } return; }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      if (errEl) { errEl.textContent = 'Enter a valid 10-digit Indian mobile number.'; errEl.style.display = 'block'; }
      return;
    }
    if (!address) { if (errEl) { errEl.textContent = 'Please enter your address.';      errEl.style.display = 'block'; } return; }

    const btn = form.querySelector('button[type="submit"]');
    const origLabel = btn ? btn.textContent : 'Save';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span>&nbsp;Saving...'; }

    const ok = await saveUserData(currentUser.uid, { name, phone, address });

    if (btn) { btn.disabled = false; btn.textContent = origLabel; }

    if (ok) {
      savedUserData = { ...savedUserData, name, phone, address };
      renderProfileHeader(currentUser, savedUserData);
      if (successEl) { successEl.textContent = 'Profile saved successfully.'; successEl.style.display = 'block'; }
      showToast('Profile saved!', 'success');
      setTimeout(() => { if (successEl) successEl.style.display = 'none'; }, 3000);
    }
  });
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
async function loadOrders(user) {
  const listEl  = el('orders-list');
  const emptyEl = el('orders-empty');
  if (!listEl) return;

  listEl.innerHTML = `
    <div style="text-align:center;padding:40px">
      <div class="loader-ring" style="margin:0 auto"></div>
    </div>`;

  try {
    const snap = await getDocs(
      query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
    );

    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!orders.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    listEl.innerHTML = orders.map(orderCardHTML).join('');

    // Bind tracking buttons
    listEl.querySelectorAll('.view-tracking-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = orders.find(o => o.id === btn.dataset.orderId);
        if (order) showTrackingModal(order);
      });
    });

    // Bind review buttons
    listEl.querySelectorAll('.write-review-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showReviewModal(btn.dataset.productId, btn.dataset.orderId);
      });
    });

  } catch (err) {
    listEl.innerHTML = `
      <div class="alert alert-error">
        Failed to load orders: ${err.message}
        <br><small>If this is your first query, Firestore may need an index — check the console.</small>
      </div>`;
  }
}

function orderCardHTML(order) {
  const date  = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const items       = order.items || [];
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
      ${isCancelled && order.cancelReason
        ? `<div class="alert alert-error" style="margin:8px 0 0">Reason: ${order.cancelReason}</div>`
        : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:12px">
        <div class="order-total">Rs. ${Number(order.total).toLocaleString('en-IN')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm view-tracking-btn"
                  data-order-id="${order.id}">Track Order</button>
          ${order.status === 'delivered'
            ? `<button class="btn btn-sm write-review-btn"
                       style="background:var(--dark);color:white"
                       data-order-id="${order.id}"
                       data-product-id="${items[0]?.id || ''}">Write Review</button>`
            : ''}
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// TRACKING MODAL
// ─────────────────────────────────────────────
function showTrackingModal(order) {
  const overlay = el('tracking-modal');
  const content = el('tracking-content');
  if (!overlay || !content) return;

  const isCancelled = order.status === 'cancelled';
  const curIdx      = STATUS_STEPS.indexOf(order.status);
  const steps       = isCancelled ? ['pending', 'confirmed', 'cancelled'] : STATUS_STEPS;

  content.innerHTML = `
    <div class="tracking-steps">
      ${steps.map((s, i) => {
        let cls = '';
        if (isCancelled) {
          if (i < steps.length - 1) cls = 'done';
          if (s === 'cancelled')    cls = 'current';
        } else {
          if (i < curIdx)  cls = 'done';
          if (i === curIdx) cls = 'current';
        }
        return `<div class="tracking-step ${cls}">
          <div class="tracking-step-dot"></div>
          <div class="tracking-step-label">${statusLabel(s)}</div>
        </div>`;
      }).join('')}
    </div>
    ${isCancelled && order.cancelReason
      ? `<div class="alert alert-error" style="margin-top:16px">
           Cancellation reason: ${order.cancelReason}
         </div>`
      : ''}`;

  const titleEl = overlay.querySelector('.modal-title');
  if (titleEl) titleEl.textContent = 'Order #' + order.id.slice(-8).toUpperCase();
  overlay.classList.add('active');
}

// ─────────────────────────────────────────────
// REVIEW MODAL
// ─────────────────────────────────────────────
function showReviewModal(productId, orderId) {
  const overlay = el('review-modal');
  if (!overlay) return;
  overlay.dataset.productId = productId;
  overlay.dataset.orderId   = orderId;
  overlay.classList.add('active');
}

async function submitReview(productId, orderId, text) {
  if (!text.trim()) { showToast('Please write a review', 'error'); return; }
  try {
    await addDoc(collection(db, 'reviews'), {
      productId,
      orderId,
      userId:    currentUser.uid,
      userEmail: currentUser.email,
      text:      text.trim(),
      createdAt: serverTimestamp()
    });
    showToast('Review submitted!', 'success');
    el('review-modal').classList.remove('active');
  } catch (err) {
    showToast('Submit failed: ' + err.message, 'error');
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Auth state — single listener handles everything
  onAuthStateChanged(auth, async (user) => {
    const loader = el('page-loader');

    if (!user) {
      // Guest: show guest view instead of hard redirect
      // (allows visitors to see the login prompt UI)
      showGuestView();
      if (loader) loader.classList.add('hidden');
      return;
    }

    // Logged in
    currentUser = user;
    showLoggedView();

    try {
      savedUserData = await loadUserData(user.uid);
    } catch (_) {
      savedUserData = {};
    }

    renderProfileHeader(user, savedUserData);
    initAddressForm(savedUserData);
    await loadOrders(user);

    if (loader) loader.classList.add('hidden');
  });

  // ── Modal close: backdrop click ──
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // ── Tracking modal close button ──
  const closeTrackBtn = el('close-tracking');
  if (closeTrackBtn) {
    closeTrackBtn.addEventListener('click', () => {
      el('tracking-modal')?.classList.remove('active');
    });
  }

  // ── Review form ──
  const reviewForm = el('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const overlay   = el('review-modal');
      const productId = overlay?.dataset.productId || '';
      const orderId   = overlay?.dataset.orderId   || '';
      const text      = reviewForm['review-text'].value;
      await submitReview(productId, orderId, text);
      reviewForm.reset();
    });
  }

  // ── Sign-out button (redundant safety binding) ──
  const signOutBtn = el('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.signOutUser();
    });
  }
});

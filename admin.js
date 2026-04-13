// ===== ADMIN.JS — Fixed & Secured =====
import { db, auth, CLOUDINARY_URL, CLOUDINARY_PRESET, ADMIN_EMAIL } from './firebase-config.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─────────────────────────────────────────────
// SIGN OUT — fixed, always redirects
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
// TOAST
// ─────────────────────────────────────────────
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
    t.style.opacity    = '0';
    t.style.transform  = 'translateY(20px)';
    t.style.transition = 'all 0.3s';
    setTimeout(() => t.remove(), 300);
  }, dur);
}

// ─────────────────────────────────────────────
// SIDEBAR NAV
// ─────────────────────────────────────────────
function initNav() {
  // Sync both desktop sidebar and mobile drawer nav items
  const allNavItems = document.querySelectorAll('.admin-nav-item[data-panel]');

  allNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;

      // Guard: sign-out handled separately
      if (panel === '__logout') { window.signOutUser(); return; }

      // Activate correct nav item in BOTH sidebar and drawer
      allNavItems.forEach(i => i.classList.toggle('active', i.dataset.panel === panel));

      // Show correct panel
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      const target = document.getElementById(`panel-${panel}`);
      if (target) target.classList.add('active');

      // Update page title
      const titleEl = document.getElementById('admin-page-title');
      if (titleEl) titleEl.textContent = panel.charAt(0).toUpperCase() + panel.slice(1);

      // Close mobile drawer
      document.getElementById('admin-drawer')?.classList.remove('active');
      document.getElementById('admin-drawer-overlay')?.classList.remove('active');

      // Load panel data
      if (panel === 'dashboard') loadDashboard();
      if (panel === 'products')  loadProducts();
      if (panel === 'orders')    loadOrders();
      if (panel === 'banners')   loadBanners();
    });
  });

  // Mobile hamburger
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer  = document.getElementById('admin-drawer');
  const overlay = document.getElementById('admin-drawer-overlay');

  menuBtn?.addEventListener('click', () => {
    drawer?.classList.add('active');
    overlay?.classList.add('active');
  });

  overlay?.addEventListener('click', () => {
    drawer?.classList.remove('active');
    overlay?.classList.remove('active');
  });
}

// ─────────────────────────────────────────────
// CLOUDINARY UPLOAD
// ─────────────────────────────────────────────
async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  return data.secure_url;
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
let productImages = [null, null, null, null, null];

function initProductForm() {
  // Image slots
  document.querySelectorAll('.image-slot').forEach((slot, idx) => {
    const input     = slot.querySelector('input[type="file"]');
    const removeBtn = slot.querySelector('.remove-img');

    slot.addEventListener('click', (e) => {
      if (e.target === removeBtn || removeBtn?.contains(e.target)) return;
      input?.click();
    });

    input?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        let img = slot.querySelector('img.preview');
        if (!img) {
          img = document.createElement('img');
          img.className = 'preview';
          slot.appendChild(img);
        }
        img.src = ev.target.result;
        if (removeBtn) removeBtn.style.display = 'flex';
        productImages[idx] = file;
      };
      reader.readAsDataURL(file);
    });

    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      slot.querySelector('img.preview')?.remove();
      if (removeBtn) removeBtn.style.display = 'none';
      productImages[idx] = null;
      if (input) input.value = '';
    });
  });

  const form  = document.getElementById('product-form');
  const errEl = document.getElementById('product-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.style.display = 'none';

    const name  = form['p-name'].value.trim();
    const desc  = form['p-desc'].value.trim();
    const brand = form['p-brand'].value.trim();
    const cat   = form['p-category'].value.trim();
    const price = parseFloat(form['p-price'].value);
    const disc  = parseFloat(form['p-discount'].value);
    const qty   = parseInt(form['p-qty'].value);
    const stock = form['p-stock'].value;

    if (!name || !brand || !cat || isNaN(price) || isNaN(qty)) {
      if (errEl) { errEl.textContent = 'Please fill all required fields (*).'; errEl.style.display = 'block'; }
      return;
    }

    const btn      = form.querySelector('button[type="submit"]');
    const origText = btn ? btn.textContent : 'Add Product';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span>&nbsp;Saving...'; }

    try {
      const filesToUpload = productImages.filter(Boolean);
      const uploadedUrls  = [];

      if (filesToUpload.length) {
        if (btn) btn.innerHTML = `<span class="loading-spinner"></span>&nbsp;Uploading ${filesToUpload.length} image(s)...`;
        for (const file of filesToUpload) {
          const url = await uploadImage(file);
          uploadedUrls.push(url);
        }
      }

      await addDoc(collection(db, 'products'), {
        name,
        desc,
        brand,
        category:      cat,
        price,
        discountPrice: isNaN(disc) ? price : disc,
        quantity:      qty,
        stockStatus:   stock,
        images:        uploadedUrls,
        createdAt:     serverTimestamp()
      });

      // Reset form
      form.reset();
      productImages = [null, null, null, null, null];
      document.querySelectorAll('.image-slot img.preview').forEach(img => img.remove());
      document.querySelectorAll('.remove-img').forEach(b => (b.style.display = 'none'));

      showToast('Product added successfully!', 'success');
      loadProducts();
    } catch (err) {
      if (errEl) { errEl.textContent = 'Error: ' + err.message; errEl.style.display = 'block'; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
  });
}

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr><td colspan="6" style="text-align:center;padding:28px">
      <div class="loader-ring" style="margin:0 auto"></div>
    </td></tr>`;

  try {
    const snap     = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!products.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:var(--secondary);padding:28px">
          No products yet. Add one above.
        </td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <img src="${(p.images && p.images[0]) || ''}"
               style="width:44px;height:44px;object-fit:cover;border-radius:8px;background:#eee"
               onerror="this.style.background='var(--secondary)'">
        </td>
        <td>
          <div style="font-weight:600;font-size:0.88rem">${p.name}</div>
          <div style="font-size:0.75rem;color:var(--secondary)">${p.brand || ''} | ${p.category || ''}</div>
        </td>
        <td>Rs. ${Number(p.discountPrice || p.price).toLocaleString('en-IN')}</td>
        <td>${p.quantity ?? '—'}</td>
        <td>
          <span class="badge ${p.stockStatus === 'out' ? 'badge-cancelled' : 'badge-delivered'}">
            ${p.stockStatus === 'out' ? 'Out of Stock' : 'In Stock'}
          </span>
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>`).join('');

  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="color:#c0392b;padding:16px">
        Error loading products: ${err.message}
      </td></tr>`;
  }
}

window.deleteProduct = async function (id) {
  if (!confirm('Permanently delete this product?')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    showToast('Product deleted', 'info');
    loadProducts();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
const ORDER_STATUSES = [
  'pending', 'confirmed', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled'
];

async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr><td colspan="6" style="text-align:center;padding:28px">
      <div class="loader-ring" style="margin:0 auto"></div>
    </td></tr>`;

  try {
    const snap   = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!orders.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:var(--secondary);padding:28px">
          No orders yet.
        </td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const date    = o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleDateString('en-IN')
        : 'N/A';
      const options = ORDER_STATUSES.map(s =>
        `<option value="${s}" ${o.status === s ? 'selected' : ''}>
          ${s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </option>`
      ).join('');

      return `
        <tr>
          <td style="font-size:0.78rem;font-weight:700;color:var(--secondary)">
            #${o.id.slice(-8).toUpperCase()}
          </td>
          <td>
            <div style="font-size:0.88rem;font-weight:600">${o.name || '—'}</div>
            <div style="font-size:0.75rem;color:var(--secondary)">${o.phone || ''}</div>
          </td>
          <td style="max-width:160px;font-size:0.78rem;color:var(--secondary)">${o.address || '—'}</td>
          <td style="font-weight:700">Rs. ${Number(o.total).toLocaleString('en-IN')}</td>
          <td>
            <select class="form-select"
                    style="padding:6px 12px;font-size:0.82rem;border-radius:8px;min-width:140px"
                    onchange="updateOrderStatus('${o.id}', this.value, this)">
              ${options}
            </select>
          </td>
          <td style="font-size:0.82rem">${date}</td>
        </tr>`;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="color:#c0392b;padding:16px">
        Error loading orders: ${err.message}
      </td></tr>`;
  }
}

window.updateOrderStatus = async function (orderId, status, selectEl) {
  let updateData = { status };

  if (status === 'cancelled') {
    const reason = prompt('Enter cancellation reason (optional):') || '';
    if (reason) updateData.cancelReason = reason;
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), updateData);
    showToast('Order status updated to: ' + status.replace(/_/g, ' '), 'success');
  } catch (err) {
    showToast('Update failed: ' + err.message, 'error');
    // Revert UI select to original value
    loadOrders();
  }
};

// ─────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────
let bannerFile = null;

function initBannerForm() {
  const input   = document.getElementById('banner-file');
  const preview = document.getElementById('banner-preview');

  input?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    bannerFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (preview) {
        preview.src = ev.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });

  const form  = document.getElementById('banner-form');
  const errEl = document.getElementById('banner-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.style.display = 'none';

    if (!bannerFile) {
      if (errEl) { errEl.textContent = 'Please select a banner image.'; errEl.style.display = 'block'; }
      return;
    }

    const btn      = form.querySelector('button[type="submit"]');
    const origText = btn ? btn.textContent : 'Upload Banner';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span>&nbsp;Uploading...'; }

    try {
      const url   = await uploadImage(bannerFile);
      const title = form['banner-title'].value.trim();

      await addDoc(collection(db, 'banners'), {
        imageUrl:  url,
        title:     title || 'Banner',
        active:    true,
        createdAt: serverTimestamp()
      });

      form.reset();
      bannerFile = null;
      if (preview) { preview.src = ''; preview.style.display = 'none'; }

      showToast('Banner uploaded successfully!', 'success');
      loadBanners();
    } catch (err) {
      if (errEl) { errEl.textContent = 'Upload failed: ' + err.message; errEl.style.display = 'block'; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
  });
}

async function loadBanners() {
  const listEl = document.getElementById('banners-list');
  if (!listEl) return;

  listEl.innerHTML = `
    <div style="text-align:center;padding:24px">
      <div class="loader-ring" style="margin:0 auto"></div>
    </div>`;

  try {
    const snap    = await getDocs(query(collection(db, 'banners'), orderBy('createdAt', 'desc')));
    const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!banners.length) {
      listEl.innerHTML = `<p style="color:var(--secondary);text-align:center;padding:24px">No banners yet.</p>`;
      return;
    }

    listEl.innerHTML = banners.map(b => `
      <div style="display:flex;align-items:center;gap:14px;padding:14px;
                  background:var(--glass);border:1px solid var(--glass-border);
                  border-radius:var(--radius-sm);margin-bottom:10px">
        <img src="${b.imageUrl}"
             style="width:90px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#eee"
             onerror="this.style.background='var(--secondary)'">
        <div style="flex:1;min-width:0">
          <div style="font-size:0.88rem;font-weight:600;color:var(--dark)">${b.title || 'Banner'}</div>
          <div style="font-size:0.75rem;margin-top:2px">
            <span class="badge ${b.active ? 'badge-delivered' : 'badge-cancelled'}">
              ${b.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn btn-sm ${b.active ? 'btn-secondary' : 'btn-primary'}"
                  onclick="toggleBanner('${b.id}', ${b.active})">
            ${b.active ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteBanner('${b.id}')">Delete</button>
        </div>
      </div>`).join('');

  } catch (err) {
    listEl.innerHTML = `<p style="color:#c0392b;padding:16px">Error: ${err.message}</p>`;
  }
}

window.toggleBanner = async function (id, currentlyActive) {
  try {
    await updateDoc(doc(db, 'banners', id), { active: !currentlyActive });
    showToast(`Banner ${currentlyActive ? 'deactivated' : 'activated'}`, 'success');
    loadBanners();
  } catch (err) {
    showToast('Update failed: ' + err.message, 'error');
  }
};

window.deleteBanner = async function (id) {
  if (!confirm('Delete this banner permanently?')) return;
  try {
    await deleteDoc(doc(db, 'banners', id));
    showToast('Banner deleted', 'info');
    loadBanners();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
async function loadDashboard() {
  try {
    const snap   = await getDocs(collection(db, 'orders'));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const delivered = orders.filter(o => o.status === 'delivered');
    const revenue   = delivered.reduce((s, o) => s + Number(o.total), 0);
    const pending   = orders.filter(o => o.status === 'pending').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('stat-orders',    orders.length);
    set('stat-revenue',   'Rs. ' + revenue.toLocaleString('en-IN'));
    set('stat-pending',   pending);
    set('stat-cancelled', cancelled);

    // Monthly revenue bar chart
    const months     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly    = Array(12).fill(0);
    delivered.forEach(o => {
      if (!o.createdAt?.toDate) return;
      monthly[o.createdAt.toDate().getMonth()] += Number(o.total);
    });

    const maxVal   = Math.max(...monthly, 1);
    const chartEl  = document.getElementById('revenue-chart');
    if (chartEl) {
      chartEl.innerHTML = months.map((m, i) => {
        const pct = Math.round((monthly[i] / maxVal) * 100);
        return `
          <div class="chart-bar-col" title="Rs. ${monthly[i].toLocaleString('en-IN')}">
            <div class="chart-bar" style="height:${pct}px;min-height:${monthly[i] > 0 ? 4 : 0}px"></div>
            <div class="chart-bar-label">${m}</div>
          </div>`;
      }).join('');
    }

  } catch (err) {
    console.error('Dashboard load error:', err.message);
    const chartEl = document.getElementById('revenue-chart');
    if (chartEl) chartEl.innerHTML = `<p style="color:#c0392b;font-size:0.8rem">Error: ${err.message}</p>`;
  }
}

// ─────────────────────────────────────────────
// INIT — auth guard first, then everything else
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('page-loader');

  onAuthStateChanged(auth, (user) => {
    // Security: block non-admin users immediately
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.replace('login.html');
      return;
    }

    // Admin confirmed — boot the panel
    if (loader) loader.classList.add('hidden');

    initNav();
    initProductForm();
    initBannerForm();

    // Load initial panel data
    loadDashboard();
    loadProducts();
    loadOrders();
    loadBanners();
  });
});

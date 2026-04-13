// ===== ADMIN.JS =====
import { db, auth, CLOUDINARY_URL, CLOUDINARY_PRESET, ADMIN_EMAIL } from './firebase-config.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ===== TOAST =====
function showToast(msg, type = 'info', dur = 3000) {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, dur);
}

// ===== NAV =====
function initNav() {
  const items = document.querySelectorAll('.admin-nav-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      const target = document.getElementById(`panel-${panel}`);
      if (target) target.classList.add('active');

      // Mobile: close drawer
      document.getElementById('admin-drawer')?.classList.remove('active');
      document.getElementById('admin-drawer-overlay')?.classList.remove('active');

      // Reload panel data
      if (panel === 'dashboard') loadDashboard();
      if (panel === 'products')  loadProducts();
      if (panel === 'orders')    loadOrders();
      if (panel === 'banners')   loadBanners();
    });
  });

  // Mobile menu
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer  = document.getElementById('admin-drawer');
  const overlay = document.getElementById('admin-drawer-overlay');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      drawer?.classList.add('active');
      overlay?.classList.add('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      drawer?.classList.remove('active');
      overlay?.classList.remove('active');
    });
  }
}

// ===== CLOUDINARY UPLOAD =====
async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
}

// ===== PRODUCTS =====
let productImages = [null, null, null, null, null];

function initProductForm() {
  const slots = document.querySelectorAll('.image-slot');
  slots.forEach((slot, idx) => {
    const input = slot.querySelector('input[type="file"]');
    slot.addEventListener('click', () => input?.click());
    if (input) {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          let img = slot.querySelector('img.preview');
          if (!img) { img = document.createElement('img'); img.className = 'preview'; slot.appendChild(img); }
          img.src = ev.target.result;
          slot.querySelector('.remove-img')?.style && (slot.querySelector('.remove-img').style.display = 'flex');
          productImages[idx] = file;
        };
        reader.readAsDataURL(file);
      });
    }
    const removeBtn = slot.querySelector('.remove-img');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        slot.querySelector('img.preview')?.remove();
        removeBtn.style.display = 'none';
        productImages[idx] = null;
        if (input) input.value = '';
      });
    }
  });

  const form = document.getElementById('product-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('product-error');
    const hide = () => { errEl.style.display = 'none'; };
    const show = (m) => { errEl.textContent = m; errEl.style.display = 'block'; };
    hide();

    const name   = form['p-name'].value.trim();
    const desc   = form['p-desc'].value.trim();
    const brand  = form['p-brand'].value.trim();
    const cat    = form['p-category'].value.trim();
    const price  = parseFloat(form['p-price'].value);
    const disc   = parseFloat(form['p-discount'].value);
    const qty    = parseInt(form['p-qty'].value);
    const stock  = form['p-stock'].value;

    if (!name || !brand || !cat || isNaN(price) || isNaN(qty)) {
      show('Please fill all required fields.'); return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

    try {
      // Upload images
      const filesToUpload = productImages.filter(Boolean);
      let uploadedUrls = [];
      if (filesToUpload.length) {
        btn.innerHTML = '<span class="loading-spinner"></span> Uploading images...';
        for (const file of filesToUpload) {
          const url = await uploadImage(file);
          uploadedUrls.push(url);
        }
      }

      await addDoc(collection(db, 'products'), {
        name, desc, brand, category: cat,
        price, discountPrice: disc || price,
        quantity: qty,
        stockStatus: stock,
        images: uploadedUrls,
        createdAt: serverTimestamp()
      });

      form.reset();
      productImages = [null, null, null, null, null];
      document.querySelectorAll('.image-slot img.preview').forEach(img => img.remove());
      document.querySelectorAll('.remove-img').forEach(b => b.style.display = 'none');
      showToast('Product added successfully!', 'success');
      loadProducts();
    } catch (err) {
      show('Error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Product';
    }
  });
}

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px"><div class="loader-ring" style="margin:0 auto"></div></td></tr>';
  try {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!products.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--secondary);padding:24px">No products yet</td></tr>'; return; }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${(p.images && p.images[0]) || ''}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;background:#eee"></td>
        <td><div style="font-weight:600;font-size:0.88rem">${p.name}</div><div style="font-size:0.75rem;color:var(--secondary)">${p.brand} | ${p.category}</div></td>
        <td>Rs. ${Number(p.discountPrice || p.price).toLocaleString('en-IN')}</td>
        <td>${p.quantity}</td>
        <td><span class="badge ${p.stockStatus === 'out' ? 'badge-cancelled' : 'badge-delivered'}">${p.stockStatus === 'out' ? 'Out' : 'In Stock'}</span></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#c0392b;padding:16px">Error: ${err.message}</td></tr>`;
  }
}

window.deleteProduct = async function (id) {
  if (!confirm('Delete this product?')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    showToast('Product deleted', 'info');
    loadProducts();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

// ===== ORDERS =====
const ORDER_STATUSES = ['pending','confirmed','shipped','out_for_delivery','delivered','cancelled'];

async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px"><div class="loader-ring" style="margin:0 auto"></div></td></tr>';
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!orders.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--secondary);padding:24px">No orders yet</td></tr>'; return; }
    tbody.innerHTML = orders.map(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN') : 'N/A';
      return `
        <tr>
          <td style="font-size:0.78rem;font-weight:700;color:var(--secondary)">#${o.id.slice(-8).toUpperCase()}</td>
          <td><div style="font-size:0.88rem;font-weight:600">${o.name}</div><div style="font-size:0.75rem;color:var(--secondary)">${o.phone}</div></td>
          <td style="max-width:160px;font-size:0.78rem;color:var(--secondary)">${o.address}</td>
          <td style="font-weight:700">Rs. ${Number(o.total).toLocaleString('en-IN')}</td>
          <td>
            <select class="form-select" style="padding:6px 12px;font-size:0.82rem;border-radius:8px" onchange="updateOrderStatus('${o.id}', this.value, this)">
              ${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>`).join('')}
            </select>
          </td>
          <td>${date}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#c0392b;padding:16px">Error: ${err.message}</td></tr>`;
  }
}

window.updateOrderStatus = async function (orderId, status, selectEl) {
  let cancelReason = '';
  if (status === 'cancelled') {
    cancelReason = prompt('Enter cancellation reason (optional):') || '';
  }
  try {
    const updateData = { status };
    if (cancelReason) updateData.cancelReason = cancelReason;
    await updateDoc(doc(db, 'orders', orderId), updateData);
    showToast('Order status updated', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    loadOrders();
  }
};

// ===== BANNERS =====
let bannerFile = null;

function initBannerForm() {
  const input = document.getElementById('banner-file');
  const preview = document.getElementById('banner-preview');
  if (input) {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      bannerFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    });
  }

  const form = document.getElementById('banner-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('banner-error');
    if (!bannerFile) { errEl.textContent = 'Please select a banner image.'; errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Uploading...';

    try {
      const url = await uploadImage(bannerFile);
      const title = form['banner-title'].value.trim();
      await addDoc(collection(db, 'banners'), {
        imageUrl: url,
        title,
        active: true,
        createdAt: serverTimestamp()
      });
      form.reset();
      bannerFile = null;
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      showToast('Banner uploaded!', 'success');
      loadBanners();
    } catch (err) {
      errEl.textContent = 'Error: ' + err.message;
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Upload Banner';
    }
  });
}

async function loadBanners() {
  const listEl = document.getElementById('banners-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:24px"><div class="loader-ring" style="margin:0 auto"></div></div>';
  try {
    const snap = await getDocs(query(collection(db, 'banners'), orderBy('createdAt', 'desc')));
    const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!banners.length) { listEl.innerHTML = '<p style="color:var(--secondary);text-align:center;padding:24px">No banners yet</p>'; return; }
    listEl.innerHTML = banners.map(b => `
      <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm);margin-bottom:10px">
        <img src="${b.imageUrl}" style="width:80px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0">
        <div style="flex:1;min-width:0"><div style="font-size:0.88rem;font-weight:600;color:var(--dark)">${b.title || 'Banner'}</div></div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn btn-sm ${b.active ? 'btn-secondary' : 'btn-primary'}" onclick="toggleBanner('${b.id}', ${b.active})">${b.active ? 'Deactivate' : 'Activate'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBanner('${b.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<p style="color:#c0392b;padding:16px">Error: ${err.message}</p>`;
  }
}

window.toggleBanner = async function (id, currentActive) {
  try {
    await updateDoc(doc(db, 'banners', id), { active: !currentActive });
    showToast('Banner updated', 'success');
    loadBanners();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

window.deleteBanner = async function (id) {
  if (!confirm('Delete this banner?')) return;
  try {
    await deleteDoc(doc(db, 'banners', id));
    showToast('Banner deleted', 'info');
    loadBanners();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const totalOrders    = orders.length;
    const delivered      = orders.filter(o => o.status === 'delivered');
    const totalRevenue   = delivered.reduce((s, o) => s + Number(o.total), 0);
    const pending        = orders.filter(o => o.status === 'pending').length;
    const cancelled      = orders.filter(o => o.status === 'cancelled').length;

    const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    el('stat-orders',  totalOrders);
    el('stat-revenue', 'Rs. ' + totalRevenue.toLocaleString('en-IN'));
    el('stat-pending', pending);
    el('stat-cancelled', cancelled);

    // Monthly chart
    const monthlyData = {};
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    delivered.forEach(o => {
      if (!o.createdAt?.toDate) return;
      const m = o.createdAt.toDate().getMonth();
      monthlyData[m] = (monthlyData[m] || 0) + Number(o.total);
    });

    const maxVal = Math.max(...Object.values(monthlyData), 1);
    const chartEl = document.getElementById('revenue-chart');
    if (chartEl) {
      chartEl.innerHTML = months.map((m, i) => {
        const val = monthlyData[i] || 0;
        const h   = Math.round((val / maxVal) * 100);
        return `<div class="chart-bar-col">
          <div class="chart-bar" style="height:${h}px" title="Rs. ${val.toLocaleString('en-IN')}"></div>
          <div class="chart-bar-label">${m.slice(0,3)}</div>
        </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async user => {
    const loader = document.getElementById('page-loader');
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = 'index.html';
      return;
    }
    if (loader) loader.classList.add('hidden');
    initNav();
    initProductForm();
    initBannerForm();
    loadDashboard();
    loadProducts();
    loadOrders();
    loadBanners();
  });
});

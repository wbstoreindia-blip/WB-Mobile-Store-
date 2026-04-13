// profile.js — Fixed: order loading, Firestore index fallback, admin visibility, error handling

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = `<p style="color:#c0392b;font-size:14px;margin:10px 0;padding:12px;background:rgba(192,57,43,0.1);border-radius:8px;">${message}</p>`;
    el.style.display = "block";
  }
  console.error("[Profile Error]", message);
}

function clearError(containerId) {
  const el = document.getElementById(containerId);
  if (el) { el.innerHTML = ""; el.style.display = "none"; }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:          { bg: "#fff3cd", color: "#856404" },
  confirmed:        { bg: "#cce5ff", color: "#004085" },
  shipped:          { bg: "#d4edda", color: "#155724" },
  "out for delivery": { bg: "#d1ecf1", color: "#0c5460" },
  delivered:        { bg: "#d4edda", color: "#155724" },
  cancelled:        { bg: "#f8d7da", color: "#721c24" }
};

function statusBadge(status) {
  const s = (status || "pending").toLowerCase();
  const style = STATUS_COLORS[s] || { bg: "#e2e8f0", color: "#0B2E33" };
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return `<span style="background:${style.bg};color:${style.color};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${label}</span>`;
}

// ─── Render Orders ────────────────────────────────────────────────────────────

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:#93B1B5;">
        <div style="font-size:40px;margin-bottom:12px;opacity:0.5;">📦</div>
        <p style="font-size:16px;font-weight:500;">No orders yet</p>
        <p style="font-size:14px;margin-top:4px;">Your orders will appear here once placed.</p>
        <a href="index.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#4F7C82;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Start Shopping</a>
      </div>`;
    return;
  }

  container.innerHTML = orders.map((order) => {
    const date = order.createdAt?.toDate?.()
      ? order.createdAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "N/A";

    const items = (order.items || []).map((item) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(79,124,130,0.1);">
        <img src="${item.image || 'placeholder.png'}" alt="${item.name}"
          style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#B8E3E9;" />
        <div style="flex:1;">
          <p style="margin:0;font-size:14px;font-weight:500;color:#0B2E33;">${item.name}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#4F7C82;">Qty: ${item.qty} &nbsp;|&nbsp; ₹${item.price}</p>
        </div>
      </div>
    `).join("");

    const cancelNote = order.status?.toLowerCase() === "cancelled" && order.cancelReason
      ? `<p style="color:#c0392b;font-size:13px;margin-top:6px;">Reason: ${order.cancelReason}</p>`
      : "";

    return `
      <div class="order-card" style="background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 2px 12px rgba(11,46,51,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <p style="margin:0;font-size:12px;color:#93B1B5;">Order ID</p>
            <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#0B2E33;">#${order.id.slice(-8).toUpperCase()}</p>
          </div>
          <div style="text-align:right;">
            ${statusBadge(order.status)}
            <p style="margin:4px 0 0;font-size:12px;color:#93B1B5;">${date}</p>
          </div>
        </div>
        <div>${items}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
          <p style="margin:0;font-size:13px;color:#4F7C82;">${order.paymentMethod || "Cash on Delivery"}</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0B2E33;">Total: ₹${order.total || 0}</p>
        </div>
        ${cancelNote}
      </div>
    `;
  }).join("");
}

// ─── Load Orders (with index fallback) ───────────────────────────────────────

async function loadOrders(user) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  container.innerHTML = `<p style="color:#4F7C82;text-align:center;padding:32px;font-size:14px;">Loading your orders...</p>`;
  clearError("ordersError");

  try {
    // Try with orderBy first (requires Firestore composite index)
    let snap;
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      snap = await getDocs(q);
    } catch (indexError) {
      console.warn("[Orders] Index not ready, falling back to unordered query:", indexError.message);

      // Fallback: query without orderBy, sort client-side
      const fallbackQ = query(
        collection(db, "orders"),
        where("userId", "==", user.uid)
      );
      snap = await getDocs(fallbackQ);
    }

    const orders = [];
    snap.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));

    // Client-side sort as fallback
    orders.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    renderOrders(orders);
  } catch (error) {
    console.error("[Orders Load Failed]", error);
    showError("ordersError",
      error.code === "failed-precondition"
        ? "Orders are loading, please wait or refresh the page."
        : "Could not load orders. Please check your connection and try again."
    );
    container.innerHTML = "";
  }
}

// ─── Admin UI ────────────────────────────────────────────────────────────────

function toggleAdminUI(user) {
  const adminBtn = document.getElementById("adminBtn");
  const adminNavBtn = document.getElementById("adminNavBtn");
  const adminOnlyEls = document.querySelectorAll(".admin-only");

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (adminBtn) {
    adminBtn.style.display = isAdmin ? "flex" : "none";
    adminBtn.onclick = () => { window.location.href = "admin.html"; };
  }
  if (adminNavBtn) {
    adminNavBtn.style.display = isAdmin ? "flex" : "none";
    adminNavBtn.onclick = () => { window.location.href = "admin.html"; };
  }
  adminOnlyEls.forEach((el) => {
    el.style.display = isAdmin ? "block" : "none";
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────

function attachLogout() {
  const btns = document.querySelectorAll(".signout-btn, #signOutBtn, [data-action='signout']");
  btns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Signing out...";

      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (error) {
        console.error("[Logout Failed]", error);
        btn.disabled = false;
        btn.textContent = original;
        showError("logoutError", "Logout failed: " + (error.message || "Please try again."));
      }
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Display user info
  const emailEl = document.getElementById("userEmail");
  const nameEl = document.getElementById("userName");
  if (emailEl) emailEl.textContent = user.email;
  if (nameEl) nameEl.textContent = user.displayName || user.email.split("@")[0];

  toggleAdminUI(user);
  attachLogout();
  loadOrders(user);
});

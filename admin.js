// ============================================================
// admin.js — Admin Panel: Cloudinary Upload + Firestore Save
// Wb Mobile Store
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { requireAdmin, logoutUser } from "./auth.js";

const CLOUDINARY_URL    = "https://api.cloudinary.com/v1_1/dyt6fwvw0/image/upload";
const CLOUDINARY_PRESET = "Wb_mobile_products";

// ── Guard: admin-only ─────────────────────────────────────────
requireAdmin();

// ── DOM ready ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initAdminNav();
  loadProducts();
  initAddProductForm();
  initImagePreview();
});

// ── Navbar ────────────────────────────────────────────────────
function initAdminNav() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
}

// ── Image preview before upload ───────────────────────────────
function initImagePreview() {
  const fileInput  = document.getElementById("productImage");
  const previewBox = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");

  if (!fileInput) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewBox.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
}

// ── Upload to Cloudinary ──────────────────────────────────────
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file",           file);
  formData.append("upload_preset",  CLOUDINARY_PRESET);

  const res  = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

// ── Add Product Form ──────────────────────────────────────────
function initAddProductForm() {
  const form      = document.getElementById("addProductForm");
  const statusMsg = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitProductBtn");
  const progress  = document.getElementById("uploadProgress");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name        = document.getElementById("productName").value.trim();
    const price       = parseFloat(document.getElementById("productPrice").value);
    const description = document.getElementById("productDesc").value.trim();
    const fileInput   = document.getElementById("productImage");
    const file        = fileInput.files[0];

    // Validation
    if (!name || !price || !description || !file) {
      showStatus("⚠️ All fields are required.", "error");
      return;
    }
    if (price <= 0) {
      showStatus("⚠️ Price must be a positive number.", "error");
      return;
    }

    // Loading state
    submitBtn.disabled  = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Uploading…`;
    if (progress) progress.style.display = "block";
    showStatus("", "");

    try {
      // 1. Upload image to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // 2. Save to Firestore
      await addDoc(collection(db, "products"), {
        name,
        price,
        description,
        imageUrl,
        createdAt: serverTimestamp()
      });

      showStatus("✅ Product added successfully!", "success");
      form.reset();
      document.getElementById("imagePreview").style.display = "none";
      loadProducts(); // refresh list

    } catch (err) {
      console.error("Add product error:", err);
      showStatus(`❌ Error: ${err.message}`, "error");
    } finally {
      submitBtn.disabled  = false;
      submitBtn.innerHTML = "Add Product";
      if (progress) progress.style.display = "none";
    }
  });

  function showStatus(msg, type) {
    if (!statusMsg) return;
    statusMsg.textContent  = msg;
    statusMsg.className    = `form-status ${type}`;
    statusMsg.style.display = msg ? "block" : "none";
  }
}

// ── Load & render product list ────────────────────────────────
async function loadProducts() {
  const tableBody = document.getElementById("productTableBody");
  const countEl   = document.getElementById("productCount");
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="5" class="loading-row">Loading…</td></tr>`;

  try {
    const q        = query(collection(db, "products"), orderBy("name"));
    const snapshot = await getDocs(q);

    if (countEl) countEl.textContent = snapshot.size;

    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="5" class="loading-row">No products yet.</td></tr>`;
      return;
    }

    const rows = [];
    snapshot.forEach(docSnap => {
      const p = { id: docSnap.id, ...docSnap.data() };
      rows.push(`
        <tr>
          <td>
            <img src="${p.imageUrl || ''}" alt="${p.name}" class="admin-thumb">
          </td>
          <td>${p.name}</td>
          <td>₹${Number(p.price).toLocaleString("en-IN")}</td>
          <td class="desc-cell">${(p.description || "").slice(0, 60)}…</td>
          <td>
            <button class="btn btn-danger btn-sm" data-id="${p.id}">Delete</button>
          </td>
        </tr>
      `);
    });

    tableBody.innerHTML = rows.join("");

    // Delete listeners
    tableBody.querySelectorAll(".btn-danger").forEach(btn => {
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });

  } catch (err) {
    console.error("Load products error:", err);
    tableBody.innerHTML = `<tr><td colspan="5" class="loading-row error-row">Failed to load products.</td></tr>`;
  }
}

// ── Delete product ────────────────────────────────────────────
async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  } catch (err) {
    alert("Failed to delete: " + err.message);
  }
}

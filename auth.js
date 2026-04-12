// ============================================================
// auth.js — Authentication Logic
// Wb Mobile Store
// ============================================================

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ADMIN_EMAIL = "wbstore.india@gmail.com";

// ── Login ────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const btn     = document.getElementById("loginBtn");
  const errBox  = document.getElementById("loginError");
  const spinner = document.getElementById("loginSpinner");

  // Reset error
  if (errBox)  errBox.textContent = "";

  // Loading state ON
  if (btn)     { btn.disabled = true; btn.textContent = "Signing in…"; }
  if (spinner) spinner.style.display = "block";

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user        = credential.user;

    // Redirect based on role
    if (user.email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (err) {
    const msg = friendlyError(err.code);
    if (errBox) errBox.textContent = msg;
  } finally {
    if (btn)     { btn.disabled = false; btn.textContent = "Sign In"; }
    if (spinner) spinner.style.display = "none";
  }
}

// ── Logout ───────────────────────────────────────────────────
export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
}

// ── Auth State Observer ───────────────────────────────────────
export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Guard: admin-only pages ──────────────────────────────────
export function requireAdmin() {
  onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = "login.html";
    }
  });
}

// ── Guard: authenticated users ───────────────────────────────
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
  });
}

// ── Friendly error messages ──────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential":   "Invalid credentials. Check email & password."
  };
  return map[code] || "Something went wrong. Please try again.";
}

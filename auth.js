// auth.js — Fixed: logout, auth state, error handling

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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
const auth = getAuth(app);

export { auth, onAuthStateChanged };

// ─── Utility ─────────────────────────────────────────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    el.style.color = "#c0392b";
    el.style.marginTop = "8px";
    el.style.fontSize = "14px";
  }
  console.error("[Auth Error]", message);
}

function clearError(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}

function setLoading(buttonId, loading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait..." : btn.dataset.originalText || btn.textContent;
  if (!btn.dataset.originalText && !loading) return;
  if (loading && !btn.dataset.originalText) btn.dataset.originalText = btn.textContent.replace("Please wait...", "").trim() || btn.textContent;
}

function getFriendlyError(code) {
  const map = {
    "auth/invalid-email": "Invalid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential": "Invalid email or password."
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ─── Login ───────────────────────────────────────────────────────────────────

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError("authError");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showError("authError", "Please enter both email and password.");
      return;
    }

    setLoading("loginBtn", true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.email === "wbstore.india@gmail.com") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("[Login Failed]", error.code, error.message);
      showError("authError", getFriendlyError(error.code));
    } finally {
      setLoading("loginBtn", false);
    }
  });
}

// ─── Register ────────────────────────────────────────────────────────────────

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError("authError");

    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm")?.value;

    if (!email || !password) {
      showError("authError", "Please fill in all fields.");
      return;
    }

    if (confirm !== undefined && password !== confirm) {
      showError("authError", "Passwords do not match.");
      return;
    }

    setLoading("registerBtn", true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (error) {
      console.error("[Register Failed]", error.code, error.message);
      showError("authError", getFriendlyError(error.code));
    } finally {
      setLoading("registerBtn", false);
    }
  });
}

// ─── Logout ──────────────────────────────────────────────────────────────────

function attachLogout() {
  const signOutButtons = document.querySelectorAll(".signout-btn, #signOutBtn, [data-action='signout']");

  signOutButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = "Signing out...";

      try {
        await signOut(auth);
        console.log("[Auth] User signed out successfully.");
        window.location.href = "login.html";
      } catch (error) {
        console.error("[Logout Failed]", error.code, error.message);
        btn.disabled = false;
        btn.textContent = "Sign Out";

        // Show error near button or fallback
        const errEl = document.getElementById("logoutError") || document.getElementById("authError");
        if (errEl) {
          errEl.textContent = "Logout failed: " + (error.message || "Please try again.");
          errEl.style.display = "block";
          errEl.style.color = "#c0392b";
        } else {
          alert("Logout failed. Please try again.");
        }
      }
    });
  });
}

// ─── Auth State Guard ─────────────────────────────────────────────────────────

const ADMIN_EMAIL = "wbstore.india@gmail.com";

function handleAuthState() {
  onAuthStateChanged(auth, (user) => {
    const page = window.location.pathname.split("/").pop();

    // Redirect unauthenticated users away from protected pages
    const protectedPages = ["index.html", "cart.html", "profile.html", "product.html"];
    if (!user && protectedPages.includes(page)) {
      window.location.href = "login.html";
      return;
    }

    // Redirect logged-in users away from login page
    if (user && (page === "login.html" || page === "")) {
      if (user.email === ADMIN_EMAIL) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
      return;
    }

    if (user) {
      // Show/hide admin elements across all pages
      const adminEls = document.querySelectorAll(".admin-only, #adminBtn, #adminNavBtn");
      adminEls.forEach((el) => {
        el.style.display = user.email === ADMIN_EMAIL ? "block" : "none";
      });

      // Update user display name if present
      const userEmailEl = document.getElementById("userEmail");
      if (userEmailEl) userEmailEl.textContent = user.email;

      // Attach logout to any buttons on page
      attachLogout();
    }
  });
}

// Run on every page load
handleAuthState();

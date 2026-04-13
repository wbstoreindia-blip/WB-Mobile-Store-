// ===== AUTH.JS — Fixed & Production-Ready =====
import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─────────────────────────────────────────────
// GLOBAL: sign-out — works from ANY page
// ─────────────────────────────────────────────
window.signOutUser = async function () {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Sign-out error:', e);
  } finally {
    // Always redirect — even if signOut threw
    window.location.replace('login.html');
  }
};

// ─────────────────────────────────────────────
// AUTH GUARDS — importable by other modules
// ─────────────────────────────────────────────

/**
 * Waits for Firebase auth to resolve.
 * Redirects to login.html if no user is signed in.
 * Resolves with the user object when authenticated.
 */
export function requireAuth(redirectTo = 'login.html') {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        window.location.replace(redirectTo);
      } else {
        resolve(user);
      }
    });
  });
}

/**
 * Admin-only guard. Redirects to login.html if not admin.
 */
export function requireAdmin(redirectTo = 'login.html') {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user || user.email !== ADMIN_EMAIL) {
        window.location.replace(redirectTo);
      } else {
        resolve(user);
      }
    });
  });
}

/**
 * Non-blocking: resolves with user or null.
 * Use on public pages that work for both guests and logged-in users.
 */
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user || null);
    });
  });
}

// ─────────────────────────────────────────────
// LOGIN PAGE LOGIC  (only active on login.html)
// ─────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
const regForm   = document.getElementById('register-form');
const errLogin  = document.getElementById('error-login');
const errReg    = document.getElementById('error-register');
const loginTab  = document.getElementById('tab-login');
const regTab    = document.getElementById('tab-register');
const loginPane = document.getElementById('pane-login');
const regPane   = document.getElementById('pane-register');

// helpers
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function hideError(el) {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}
function setLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="loading-spinner"></span>&nbsp;Please wait...'
    : label;
}

// If already logged in, skip login page
if (loginForm || regForm) {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      unsub();
      window.location.replace(user.email === ADMIN_EMAIL ? 'admin.html' : 'index.html');
    }
  });
}

// Tab switching
if (loginTab && regTab) {
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    
    // Explicitly 'block' set karo
    if (loginPane) loginPane.style.display = 'block'; 
    if (regPane)   regPane.style.display   = 'none';
    
    hideError(errLogin);
    hideError(errReg);
  });

  regTab.addEventListener('click', () => {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    
    // Explicitly 'block' set karo
    if (regPane)   regPane.style.display   = 'block'; 
    if (loginPane) loginPane.style.display = 'none';
    
    hideError(errLogin);
    hideError(errReg);
  });
}


// Login submit
if (loginForm) {
  const loginBtn   = loginForm.querySelector('button[type="submit"]');
  const loginLabel = loginBtn ? loginBtn.textContent.trim() : 'Sign In';

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errLogin);

    const email    = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      showError(errLogin, 'Please fill in all fields.');
      return;
    }

    setLoading(loginBtn, true, loginLabel);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      window.location.replace(cred.user.email === ADMIN_EMAIL ? 'admin.html' : 'index.html');
    } catch (err) {
      setLoading(loginBtn, false, loginLabel);
      showError(errLogin, friendlyError(err.code));
    }
  });
}

// Register submit
if (regForm) {
  const regBtn   = regForm.querySelector('button[type="submit"]');
  const regLabel = regBtn ? regBtn.textContent.trim() : 'Create Account';

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errReg);

    const nameInput = regForm['reg-name'];
    const name      = nameInput ? nameInput.value.trim() : '';
    const email     = regForm['reg-email'].value.trim();
    const password  = regForm['reg-password'].value;
    const confirm   = regForm['reg-confirm'].value;

    if (!email || !password || !confirm) {
      showError(errReg, 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      showError(errReg, 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showError(errReg, 'Password must be at least 6 characters.');
      return;
    }

    setLoading(regBtn, true, regLabel);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Save initial profile to Firestore → users/{uid}
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          email,
          name:      name || email.split('@')[0],
          phone:     '',
          address:   '',
          createdAt: serverTimestamp()
        });
      } catch (fsErr) {
        console.warn('Firestore profile save failed (non-fatal):', fsErr.message);
      }

      window.location.replace('index.html');
    } catch (err) {
      setLoading(regBtn, false, regLabel);
      showError(errReg, friendlyError(err.code));
    }
  });
}

// Error code → readable message
function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/user-disabled':          'This account has been disabled.',
  };
  return map[code] || 'An error occurred. Please try again.';
}

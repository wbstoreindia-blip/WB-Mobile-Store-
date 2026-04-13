// ===== AUTH.JS =====
import { auth, ADMIN_EMAIL } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---- UI helpers (login.html) ----
const loginForm   = document.getElementById('login-form');
const regForm     = document.getElementById('register-form');
const errLogin    = document.getElementById('error-login');
const errReg      = document.getElementById('error-register');
const loginTab    = document.getElementById('tab-login');
const regTab      = document.getElementById('tab-register');
const loginPane   = document.getElementById('pane-login');
const regPane     = document.getElementById('pane-register');

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

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="loading-spinner"></span> Please wait...'
    : btn.dataset.label || btn.textContent;
}

// ---- Tab switching ----
if (loginTab && regTab) {
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginPane.style.display = '';
    regPane.style.display = 'none';
    hideError(errLogin); hideError(errReg);
  });

  regTab.addEventListener('click', () => {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    regPane.style.display = '';
    loginPane.style.display = 'none';
    hideError(errLogin); hideError(errReg);
  });
}

// ---- Login ----
if (loginForm) {
  const loginBtn = loginForm.querySelector('button[type="submit"]');
  if (loginBtn) loginBtn.dataset.label = loginBtn.textContent;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errLogin);
    const email    = loginForm.email.value.trim();
    const password = loginForm.password.value;
    if (!email || !password) { showError(errLogin, 'Please fill in all fields.'); return; }
    setLoading(loginBtn, true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (email === ADMIN_EMAIL) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    } catch (err) {
      setLoading(loginBtn, false);
      showError(errLogin, friendlyError(err.code));
    }
  });
}

// ---- Register ----
if (regForm) {
  const regBtn = regForm.querySelector('button[type="submit"]');
  if (regBtn) regBtn.dataset.label = regBtn.textContent;

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errReg);
    const email    = regForm['reg-email'].value.trim();
    const password = regForm['reg-password'].value;
    const confirm  = regForm['reg-confirm'].value;
    if (!email || !password || !confirm) { showError(errReg, 'Please fill in all fields.'); return; }
    if (password !== confirm) { showError(errReg, 'Passwords do not match.'); return; }
    if (password.length < 6) { showError(errReg, 'Password must be at least 6 characters.'); return; }
    setLoading(regBtn, true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = 'index.html';
    } catch (err) {
      setLoading(regBtn, false);
      showError(errReg, friendlyError(err.code));
    }
  });
}

// ---- Sign out (global util) ----
window.signOutUser = async function () {
  await signOut(auth);
  window.location.href = 'login.html';
};

// ---- Auth guard ----
export function requireAuth(redirectTo = 'login.html') {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) { window.location.href = redirectTo; }
      else { resolve(user); }
    });
  });
}

export function requireAdmin(redirectTo = 'index.html') {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user || user.email !== ADMIN_EMAIL) { window.location.href = redirectTo; }
      else { resolve(user); }
    });
  });
}

// ---- Error messages ----
function friendlyError(code) {
  const map = {
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/invalid-credential':    'Invalid email or password.',
    'auth/email-already-in-use':  'An account with this email already exists.',
    'auth/weak-password':         'Password is too weak. Use at least 6 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/network-request-failed':'Network error. Please check your connection.',
    'auth/too-many-requests':     'Too many attempts. Please try again later.',
  };
  return map[code] || 'An error occurred. Please try again.';
}

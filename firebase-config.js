// ============================================================
// firebase-config.js — Firebase Initialization
// Wb Mobile Store
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBx724MefpWjw6KfUMX9o7BkygQ5xeD02k",
  authDomain: "wb-mobile-store.firebaseapp.com",
  projectId: "wb-mobile-store",
  storageBucket: "wb-mobile-store.firebasestorage.app",
  messagingSenderId: "54481231902",
  appId: "1:54481231902:web:395ad38266e975fae6ce0f",
  measurementId: "G-5R648HZ40T"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase SDKs ko seedha Google ke server se import kar rahe hain (No npm needed)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Tumhari WB Mobile Store ki exact Firebase details
const firebaseConfig = {
  apiKey: "AIzaSyBx724MefpWjw6KfUMX9o7BkygQ5xeD02k",
  authDomain: "wb-mobile-store.firebaseapp.com",
  projectId: "wb-mobile-store",
  storageBucket: "wb-mobile-store.firebasestorage.app",
  messagingSenderId: "54481231902",
  appId: "1:54481231902:web:395ad38266e975fae6ce0f",
  measurementId: "G-5R648HZ40T"
};

// Firebase ko chaloo (Initialize) karna
const app = initializeApp(firebaseConfig);

// Database (Firestore) aur Authentication (Login/Signup) ka connection
const db = getFirestore(app);
const auth = getAuth(app);

// Tumhari Cloudinary Details (Admin page se direct photo upload ke liye)
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dyt6fwvw0/image/upload";
const CLOUDINARY_PRESET = "Wb_mobile_products";

// In sabko export kar rahe hain taaki baaki JS files inko use kar sakein
export { app, db, auth, CLOUDINARY_URL, CLOUDINARY_PRESET };

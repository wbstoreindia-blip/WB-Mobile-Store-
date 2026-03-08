import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your exact Firebase project keys
const firebaseConfig = {
  apiKey: "AIzaSyBx724MefpWjw6KfUMX9o7BkygQ5xeD02k",
  authDomain: "wb-mobile-store.firebaseapp.com",
  projectId: "wb-mobile-store",
  storageBucket: "wb-mobile-store.firebasestorage.app",
  messagingSenderId: "54481231902",
  appId: "1:54481231902:web:395ad38266e975fae6ce0f",
  measurementId: "G-5R648HZ40T"
};

// Initialize the Firebase Engine
const app = initializeApp(firebaseConfig);

// Export the Database and Authentication tools so other files can use them
export const db = getFirestore(app);
export const auth = getAuth(app);

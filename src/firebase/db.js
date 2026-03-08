import { db } from './config';
import { collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

// --------------------------------------------------------
// PRODUCT FUNCTIONS
// --------------------------------------------------------

// Fetch ALL products (for the homepage or full catalog)
export const getAllProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    // Fetching products ordered by the newest first
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
};

// Fetch products by specific category (e.g., "android" or "accessories")
export const getProductsByCategory = async (categoryName) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where("category", "==", categoryName));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${categoryName} products:`, error);
    return [];
  }
};

// Fetch a SINGLE product's exact details (when a user clicks to view it)
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error fetching single product:", error);
    return null;
  }
};

// Admin Function: Add a new product to the database
export const addProduct = async (productData) => {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: serverTimestamp() // Automatically stamps the exact time it was uploaded
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, error: error.message };
  }
};

// --------------------------------------------------------
// BANNER FUNCTIONS
// --------------------------------------------------------

// Fetch the sliding banners for the homepage
export const getBanners = async () => {
  try {
    const bannersRef = collection(db, 'banners');
    const snapshot = await getDocs(bannersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};

// --------------------------------------------------------
// ORDER FUNCTIONS
// --------------------------------------------------------

// Save a completed checkout order to the database
export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'Pending', // Automatically set new orders to Pending
      orderDate: serverTimestamp()
    });
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
};

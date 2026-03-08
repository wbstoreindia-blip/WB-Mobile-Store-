import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Context
const CartContext = createContext();

// Custom hook so any file can instantly use the cart
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // 1. Initialize Cart: It looks inside the phone's local storage first!
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('wb-store-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // 2. The Auto-Calculator: Every time the cart changes, this runs automatically
  useEffect(() => {
    // Save the new cart to the phone's memory
    localStorage.setItem('wb-store-cart', JSON.stringify(cart));
    
    // Calculate the total price of everything
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Calculate exactly how many items are in the cart
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    setCartTotal(total);
    setCartCount(count);
  }, [cart]);

  // 3. Add to Cart Logic
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      // Check if the exact phone is already in the cart
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // If it is, just increase the quantity
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // If it's new, add it to the list
      return [...prevCart, { ...product, quantity }];
    });
  };

  // 4. Remove from Cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // 5. Update Quantity (e.g., when they click the "+" or "-" buttons)
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return; // Prevent glitching into negative numbers
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // 6. Clear Cart (Used right after a successful checkout)
  const clearCart = () => {
    setCart([]);
  };

  // Package all these powerful tools together
  const value = {
    cart,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

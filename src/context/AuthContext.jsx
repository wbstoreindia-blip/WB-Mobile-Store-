import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Create the Context
const AuthContext = createContext();

// Custom hook to use the AuthContext easily anywhere in the app
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Your specific Admin email
  const adminEmail = "wbstore.india@gmail.com";

  // Standard Login Function
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Standard Logout Function
  const logout = () => {
    return signOut(auth);
  };

  // Listen to Firebase for real-time login/logout changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Automatically flag if the logged-in user is YOU
      if (user && user.email === adminEmail) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    // Cleanup the listener when the app closes
    return unsubscribe;
  }, []);

  // Everything packed into 'value' can be accessed by any page
  const value = {
    currentUser,
    isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* We only render the app once Firebase has finished checking the login status */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

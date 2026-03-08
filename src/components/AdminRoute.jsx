import React from 'react';
import { Navigate } from 'react-router-dom';

// We will use a simple check for now. 
// Later, we will connect this to your AuthContext for real Firebase security.
const AdminRoute = ({ children }) => {
  // This is your unique Admin ID/Email check
  const adminEmail = "wbstore.india@gmail.com";
  
  // For now, we look at localStorage. 
  // In the next steps, we will make this 100% secure with Firebase Auth.
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || user.email !== adminEmail) {
    // If not the admin, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If you are the admin, show the protected page (Dashboard)
  return children;
};

export default AdminRoute;

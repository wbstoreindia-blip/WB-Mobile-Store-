import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './assets/luna-theme.css' // We import your colors here so they apply everywhere

// This is the starting point of your entire React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ==========================================
// 1. IMPORT ALL MODULES (Saari files ko zinda karna)
// ==========================================
// Jab HTML is main.js ko load karega, toh yeh baaki sab ko khud bula lega
import './firebase-config.js';
import './auth.js';
import './db.js';
import { updateCartBadge } from './cart.js';

// Note: Jaise-jaise hum aage Wishlist, Checkout aur Admin ka logic likhenge, 
// unhe bhi yahan import karna hoga. Example:
// import './wishlist.js';
// import './checkout.js';
// import './admin.js';

// ==========================================
// 2. DARK / LIGHT THEME TOGGLE LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    // A. Memory Check: Dekho user ne pehle kaunsa theme save kiya tha (Default: dark)
    const savedTheme = localStorage.getItem('wb_theme') || 'dark'; 
    
    // B. Website load hote hi wahi theme HTML tag par laga do
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // C. Jab user Top Navbar ke Sun/Moon button par click kare
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // 1. Theme badlo
            htmlElement.setAttribute('data-theme', newTheme);
            // 2. Browser ki memory mein naya theme save kar lo
            localStorage.setItem('wb_theme', newTheme);
            // 3. Icon ko Sun se Moon (ya Moon se Sun) mein badal do
            updateThemeIcon(newTheme);
        });
    }

    // Icon change karne ka function
    function updateThemeIcon(theme) {
        if (!themeIcon) return;
        
        if (theme === 'dark') {
            // Agar Dark mode hai, toh Light mode me jaane ke liye "Sun" dikhao
            themeIcon.className = 'fa-solid fa-sun';
            themeIcon.style.color = '#F59E0B'; // Bright Yellow Sun
        } else {
            // Agar Light mode hai, toh Dark mode me jaane ke liye "Moon" dikhao
            themeIcon.className = 'fa-solid fa-moon';
            themeIcon.style.color = '#121212'; // Dark Grey Moon
        }
    }

    // ==========================================
    // 3. GLOBAL UI UPDATES
    // ==========================================
    // Har naya page khulte hi Bottom Nav ka Cart Badge update kar do
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }
});

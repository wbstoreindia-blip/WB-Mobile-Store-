import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 1. LOGIN / SIGNUP TOGGLE LOGIC
// ==========================================
let isLoginMode = true; 

const toggleBtn = document.getElementById('auth-toggle-btn');
const toggleMsg = document.getElementById('auth-toggle-msg');
const title = document.getElementById('auth-title');
const nameInput = document.getElementById('auth-name');
const phoneInput = document.getElementById('auth-phone');
const submitBtn = document.getElementById('auth-submit-btn');
const authForm = document.getElementById('auth-form');

// Agar hum login page par hain tabhi yeh code chalega
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode; // Mode change karo

        if (isLoginMode) {
            // BACK TO LOGIN MODE
            nameInput.style.display = 'none';
            phoneInput.style.display = 'none';
            nameInput.required = false;
            phoneInput.required = false;
            
            title.innerText = 'Welcome Back';
            submitBtn.innerHTML = 'SIGN IN';
            toggleMsg.innerText = "Don't have an account?";
            toggleBtn.innerText = 'Sign Up';
        } else {
            // SWITCH TO SIGN UP MODE
            nameInput.style.display = 'block';
            phoneInput.style.display = 'block';
            nameInput.required = true;
            phoneInput.required = true;
            
            title.innerText = 'Create Account';
            submitBtn.innerHTML = 'CREATE ACCOUNT';
            toggleMsg.innerText = 'Already have an account?';
            toggleBtn.innerText = 'Login';
        }
    });
}

// ==========================================
// 2. FORM SUBMIT (LOGIN OR SIGNUP)
// ==========================================
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Page refresh hone se roko
        
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        // Button ko disable karo taaki user baar-baar click na kare
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';

        try {
            if (isLoginMode) {
                // LOGIN USER
                await signInWithEmailAndPassword(auth, email, password);
                alert("Login Successful!");
                window.location.href = 'index.html'; // Login ke baad home par bhejo
            } else {
                // SIGN UP USER
                const name = nameInput.value;
                const phone = phoneInput.value;

                // 1. Pehle Firebase Auth mein account banao
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Phir Database (Firestore) ke 'users' collection mein data save karo
                await setDoc(doc(db, 'users', user.uid), {
                    name: name,
                    email: email,
                    phone: phone,
                    role: 'customer', // Isse aage chalkar Admin check karne mein aasaani hogi
                    createdAt: serverTimestamp()
                });

                alert("Account Created Successfully!");
                window.location.href = 'index.html'; // Sign up ke baad home par bhejo
            }
        } catch (error) {
            // Agar koi galti ho (jaise wrong password)
            alert("Error: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = isLoginMode ? 'SIGN IN' : 'CREATE ACCOUNT';
        }
    });
}

// ==========================================
// 3. CHECK USER STATUS & UPDATE UI
// ==========================================
// Yeh hamesha check karega ki user logged in hai ya nahi
onAuthStateChanged(auth, async (user) => {
    
    // Account page ke elements
    const guestState = document.getElementById('guest-state');
    const loggedInState = document.getElementById('logged-in-state');
    const displayName = document.getElementById('user-display-name');
    const displayEmail = document.getElementById('user-display-email');

    if (user) {
        // 🟢 USER LOGGED IN HAI
        if (guestState && loggedInState) {
            guestState.style.display = 'none';
            loggedInState.style.display = 'block';

            // Database se user ka asli naam fetch karo
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                displayName.innerText = userData.name || 'Valued Customer';
                displayEmail.innerText = userData.email || user.email;
            } else {
                displayName.innerText = 'Valued Customer';
                displayEmail.innerText = user.email;
            }
        }
    } else {
        // 🔴 USER LOGGED OUT HAI
        if (guestState && loggedInState) {
            guestState.style.display = 'flex'; // Empty state ke liye flex chahiye
            loggedInState.style.display = 'none';
        }
    }
});

// ==========================================
// 4. LOGOUT FUNCTION
// ==========================================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html'; // Logout karke home pe bhej do
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Error logging out!");
        }
    });
}

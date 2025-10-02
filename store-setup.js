// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// Import data from main app.js for consistency and to avoid duplication
import { firebaseConfig, categories, car_data, translations } from "./app.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentLang = localStorage.getItem("piecety_lang") || "fr";

// Helper functions for DOM safety and error handling
const safeQuery = (id, callback) => {
    const element = document.getElementById(id);
    if (element && callback) callback(element);
    return element;
};

const withErrorBoundary = (fn, fallback = null) => {
    try {
        return fn();
    } catch (error) {
        console.error('Error caught:', error);
        showMessage(translations[currentLang].ad_post_failed || 'An unexpected error occurred.', 'error');
        return fallback;
    }
};

const showMessage = (message, type = 'info') => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'error' ? 'bg-red-100 text-red-800' : 
        type === 'success' ? 'bg-green-100 text-green-800' : 
        'bg-blue-100 text-blue-800'
    }`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 3000);
};

// Main elements with safety checks
const categoriesContainer = safeQuery("storeCategories");
const brandsContainer = safeQuery("storeBrands");
const storeForm = safeQuery("storeForm");
const body = document.body;
const storeNameInput = safeQuery("storeName");
const storeAddressInput = safeQuery("storeAddress");
const submitBtn = safeQuery("storeForm")?.querySelector('button[type="submit"]');

// Check for dark mode preference and apply it
const isDarkMode = localStorage.getItem('piecety_dark_mode') === 'true';
if (isDarkMode && body) {
    body.classList.add('dark');
}

// Render categories checkboxes
const renderCategories = () => withErrorBoundary(() => {
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '';
        Object.entries(categories).forEach(([key, cat]) => {
            const label = document.createElement('label');
            label.className = 'flex gap-2 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors';
            label.innerHTML = `
                <input type="checkbox" value="${key}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${cat[currentLang] || cat.en}</span>
            `;
            categoriesContainer.appendChild(label);
        });
    }
});

// Render brands checkboxes
const renderBrands = () => withErrorBoundary(() => {
    if (brandsContainer) {
        brandsContainer.innerHTML = '';
        Object.keys(car_data).forEach(brand => {
            const label = document.createElement('label');
            label.className = 'flex gap-2 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors';
            label.innerHTML = `
                <input type="checkbox" value="${brand}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${brand}</span>
            `;
            brandsContainer.appendChild(label);
        });
    }
});

// Enhanced form validation
const validateForm = () => {
    const storeName = storeNameInput?.value?.trim();
    const storeAddress = storeAddressInput?.value?.trim();
    const selectedCategories = Array.from(document.querySelectorAll('#storeCategories input:checked'));
    const selectedBrands = Array.from(document.querySelectorAll('#storeBrands input:checked'));

    if (!storeName) {
        showMessage("Store name is required.", "error");
        storeNameInput?.focus();
        return false;
    }
    if (selectedCategories.length === 0) {
        showMessage("Please select at least one category.", "error");
        return false;
    }
    if (selectedBrands.length === 0) {
        showMessage("Please select at least one brand.", "error");
        return false;
    }
    return true;
};

// Enhanced form submission with better error handling
const handleFormSubmission = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        showMessage("You must be logged in to create a store profile.", "error");
        window.location.href = "index.html";
        return;
    }

    if (!validateForm()) {
        return;
    }

    const originalText = submitBtn?.textContent;

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Creating...</span>`;
        }

        const storeName = storeNameInput.value.trim();
        const storeAddress = storeAddressInput.value.trim();
        const selectedCategories = Array.from(document.querySelectorAll('#storeCategories input:checked')).map(cb => cb.value);
        const selectedBrands = Array.from(document.querySelectorAll('#storeBrands input:checked')).map(cb => cb.value);

        // Security hardening:
        // Client-side validation is NOT enough to prevent XSS. Server-side validation is required.
        // We can add a simple client-side check here as a first layer, though.
        const sanitizedStoreName = sanitizeInput(storeName);
        const sanitizedStoreAddress = sanitizeInput(storeAddress);

        await setDoc(doc(db, "stores", user.uid), {
            ownerId: user.uid,
            name: sanitizedStoreName,
            address: sanitizedStoreAddress,
            categories: selectedCategories,
            brands: selectedBrands,
            createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(db, "users", user.uid), {
            role: "store"
        });

        showMessage("✅ Store profile created successfully!", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch (error) {
        console.error("Error saving store profile:", error);
        showMessage("❌ Error saving store profile. Please try again.", "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
};

// New function to sanitize input on the client-side
// This is a basic example; a robust solution requires server-side validation and encoding.
const sanitizeInput = (input) => {
    const element = document.createElement('div');
    element.innerText = input;
    return element.innerHTML;
};

// Handle network status
const handleNetworkStatus = () => {
    const updateOnlineStatus = () => {
        if (!navigator.onLine) {
            showMessage('You are offline. Changes will be saved when connection is restored.', 'error');
        }
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
};

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (!user) {
            showMessage("You must be logged in to create a store profile.", "error");
            // Redirect or show a login prompt
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        } else {
            renderCategories();
            renderBrands();
            if (storeForm) {
                storeForm.addEventListener("submit", handleFormSubmission);
            }
        }
    });

    // Handle network status
    handleNetworkStatus();
});

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service worker registered for store setup'))
        .catch(err => console.error('Service worker registration failed:', err));
}

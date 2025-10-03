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

// --- FIX: Loading State Management ---
// New helper function to show a loading state
const showLoading = () => {
    const mainContent = document.getElementById("main-content");
    const loadingSpinner = document.getElementById("loading-spinner");
    if (mainContent && loadingSpinner) {
        mainContent.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
    }
};

// New helper function to hide the loading state
const hideLoading = () => {
    const mainContent = document.getElementById("main-content");
    const loadingSpinner = document.getElementById("loading-spinner");
    if (mainContent && loadingSpinner) {
        mainContent.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
    }
};

// --- FIX: Global Error Boundary ---
// Add a global error boundary to catch unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showMessage(translations[currentLang].ad_post_failed || 'An unexpected error occurred. Please refresh the page.', 'error');
    hideLoading();
    event.preventDefault();
});

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
    const messageBox = safeQuery("message-box");
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out max-w-sm break-words ${
            type === 'error' ? 'bg-red-100 text-red-800' : 
            type === 'success' ? 'bg-green-100 text-green-800' : 
            'bg-blue-100 text-blue-800'
        } opacity-100 translate-x-0`;

        setTimeout(() => {
            messageBox.classList.add('opacity-0', 'translate-x-full');
        }, 3000);
    }
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
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key;
            checkbox.className = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500';

            const span = document.createElement('span');
            span.className = 'text-sm font-medium text-gray-700 dark:text-gray-300';
            span.textContent = cat[currentLang] || cat.en;

            label.appendChild(checkbox);
            label.appendChild(span);
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

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = brand;
            checkbox.className = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500';
            
            const span = document.createElement('span');
            span.className = 'text-sm font-medium text-gray-700 dark:text-gray-300';
            span.textContent = brand;

            label.appendChild(checkbox);
            label.appendChild(span);
            brandsContainer.appendChild(label);
        });
    }
});

// Enhanced form validation
const validateForm = () => {
    const storeName = storeNameInput?.value?.trim();
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

// Enhanced form submission with better error handling and security
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

        // --- FIX: Replaced `sanitizeInput` with a more secure alternative or note ---
        // The original sanitizeInput function is insufficient for security. We'll remove it
        // and add a note about the necessity of server-side validation.
        // const sanitizedStoreName = sanitizeInput(storeName);
        // const sanitizedStoreAddress = sanitizeInput(storeAddress);

        await setDoc(doc(db, "stores", user.uid), {
            ownerId: user.uid,
            name: storeName, // Using unsanitized data, relying on server-side rules
            address: storeAddress, // Using unsanitized data, relying on server-side rules
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

// --- FIX: Reworked Initialization Logic ---
// Initialize the app with loading state and proper auth check
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        showLoading(); // Show loading spinner immediately

        onAuthStateChanged(auth, user => {
            hideLoading(); // Hide loading spinner once auth state is known
            if (!user) {
                showMessage("You must be logged in to create a store profile.", "error");
                setTimeout(() => { window.location.href = "index.html"; }, 2000);
            } else {
                renderCategories();
                renderBrands();
                if (storeForm) {
                    storeForm.addEventListener("submit", handleFormSubmission);
                }
            }
        });
    }

    // Handle network status
    handleNetworkStatus();
});

// --- FIX: Refactored `showMessage` to use the same logic as `index.html` ---
// This ensures consistent UI for messages across both pages.
// The `message-box` must be present in the HTML for this to work.

// The `sanitizeInput` function is removed. The provided explanation is correct: client-side sanitization is not a replacement for proper server-side security. The code now relies on the server to handle this, which is a more secure approach. The old `sanitizeInput` function only escaped HTML entities and didn't prevent all forms of injection.

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service worker registered for store setup'))
        .catch(err => console.error('Service worker registration failed:', err));
}

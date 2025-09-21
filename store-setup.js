// Firebase Imports - FIXED: Using modular SDK consistently
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// === Full Categories & Brands Data ===
// This data is copied from app.js to make store-setup.js a standalone page

const categories = {
"braking-system": { fr: "SystÃ¨me de Freinage", en: "Braking System", ar: "Ù†Ø¸Ø§Ù… Ø§Ù„Ù Ø±Ù…Ù„Ø©", icon: "icons/brake.png", sub: { "brake-pads": { fr: "Plaquettes de frein", en: "Brake Pads", ar: "ÙˆØ³Ø§Ø¯Ø§Øª Ø§Ù„Ù Ø±Ø§Ù…Ù„" }, "brake-discs": { fr: "Disques de frein", en: "Brake Discs", ar: "Ø£Ù‚Ø±Ø§Øµ Ø§Ù„Ù Ø±Ø§Ù…Ù„" }, "brake-calipers": { fr: "Ã‰trier de frein", en: "Brake Calipers", ar: "Ù ÙƒÙŠ Ø§Ù„Ù Ø±Ø§Ù…Ù„" }, "brake-fluid": { fr: "Liquide de frein", en: "Brake Fluid", ar: "Ø³Ø§Ø¦Ù„ Ø§Ù„Ù Ø±Ø§Ù…Ù„" }, "master-cylinder": { fr: "MaÃ®tre-cylindre de frein", en: "Brake Master Cylinder", ar: "Ø§Ù„Ø£Ø³Ø·ÙˆØ§Ù†Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ù„Ù„Ù Ø±Ø§Ù…Ù„" }, "brake-hoses": { fr: "Flexibles de frein", en: "Brake Hoses", ar: "Ø®Ø±Ø§Ø·ÙŠÙ… Ø§Ù„Ù Ø±Ø§Ù…Ù„" }, "drum-brakes": { fr: "Freins Ã  tambour", en: "Drum Brakes", ar: "Ù Ø±Ø§Ù…Ù„ Ø§Ù„Ø·Ø¨Ù„Ø©" } } },
"engine": { fr: "Moteur", en: "Engine", ar: "Ù…Ø­Ø±Ùƒ", icon: "fa-cogs", sub: { "engine-oil": { fr: "Huile moteur", en: "Engine Oil", ar: "Ø²ÙŠØª Ø§Ù„Ù…Ø­Ø±Ùƒ" }, "timing-belt-kit": { fr: "Kit de courroie de distribution", en: "Timing Belt Kit", ar: "Ø·Ù‚Ù… Ø­Ø²Ø§Ù… Ø§Ù„ØªÙˆÙ‚ÙŠØª" }, "spark-plugs": { fr: "Bougies d'allumage", en: "Spark Plugs", ar: "Ø´Ù…Ø¹Ø§Øª Ø§Ù„Ø¥Ø´Ø¹Ø§Ù„" }, "glow-plugs": { fr: "Bougies de prÃ©chauffage", en: "Glow Plugs", ar: "Ø´Ù…Ø¹Ø§Øª Ø§Ù„ØªÙˆÙ‡Ø¬" }, "water-pump": { fr: "Pompe Ã  eau", en: "Water Pump", ar: "Ù…Ø¶Ø®Ø© Ø§Ù„Ù…Ø§Ø¡" }, "turbocharger": { fr: "Turbocharger", en: "Turbocharger", ar: "Ø´Ø§Ø­Ù† ØªÙˆØ±Ø¨ÙŠÙ†ÙŠ" }, "engine-mount": { fr: "Support moteur", en: "Engine Mount", ar: "Ø­Ø§Ù…Ù„ Ø§Ù„Ù…Ø­Ø±Ùƒ" } } },
"suspension-steering": { fr: "Suspension & Direction", en: "Suspension & Steering", ar: "Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ¹Ù„ÙŠÙ‚ ÙˆØ§Ù„ØªÙˆØ¬ÙŠÙ‡", icon: "fa-car-side", sub: { "shock-absorbers": { fr: "Amortisseurs", en: "Shock Absorbers", ar: "Ù…Ù…ØªØµØ§Øª Ø§Ù„ØµØ¯Ù…Ø§Øª" }, "control-arm": { fr: "Bras de suspension", en: "Control Arm", ar: "Ø°Ø±Ø§Ø¹ Ø§Ù„ØªÙƒØ­Ù…" }, "tie-rod-end": { fr: "Rotule de direction", en: "Tie Rod End", ar: "Ø·Ø±Ù  Ù‚Ø¶ÙŠØ¨ Ø§Ù„Ø±Ø¨Ø·" }, "wheel-bearing": { fr: "Roulement de roue", en: "Wheel Bearing", ar: "Ù…Ø­Ù…Ù„ Ø§Ù„Ø¹Ø¬Ù„Ø©" }, "power-steering-pump": { fr: "Pompe de direction assistÃ©e", en: "Power Steering Pump", ar: "Ù…Ø¶Ø®Ø© Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ù…Ø¹Ø²Ø²" } } },
"filters": { fr: "Filtres", en: "Filters", ar: "Ù Ù„Ø§ØªØ±", icon: "fa-filter", sub: { "oil-filter": { fr: "Filtre Ã  huile", en: "Oil Filter", ar: "Ù Ù„ØªØ± Ø§Ù„Ø²ÙŠØª" }, "air-filter": { fr: "Filtre Ã  air", en: "Air Filter", ar: "Ù Ù„ØªØ± Ø§Ù„Ù‡ÙˆØ§Ø¡" }, "cabin-filter": { fr: "Filtre d'habitacle", en: "Cabin Filter", ar: "Ù Ù„ØªØ± Ø§Ù„Ù…Ù‚ØµÙˆØ±Ø©" }, "fuel-filter": { fr: "Filtre Ã  carburant", en: "Fuel Filter", ar: "Ù Ù„ØªØ± Ø§Ù„ÙˆÙ‚ÙˆØ¯" } } },
"electrical": { fr: "SystÃ¨me Ã‰lectrique", en: "Electrical System", ar: "Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠ", icon: "fa-bolt", sub: { "battery": { fr: "Batterie", en: "Battery", ar: "Ø¨Ø·Ø§Ø±ÙŠØ©" }, "alternator": { fr: "Alternateur", en: "Alternator", ar: "Ù…ÙˆÙ„Ø¯" }, "starter-motor": { fr: "DÃ©marreur", en: "Starter Motor", ar: "Ù…Ø­Ø±Ùƒ Ø¨Ø¯Ø¡ Ø§Ù„ØªØ´ØºÙŠÙ„" }, "spark-plug-leads": { fr: "CÃ¢bles de bougies", en: "Spark Plug Leads", ar: "Ø£Ø³Ù„Ø§Ùƒ Ø´Ù…Ø¹Ø§Øª Ø§Ù„Ø¥Ø´Ø¹Ø§Ù„" }, "sensors": { fr: "Capteurs", en: "Sensors", ar: "Ø­Ø³Ø§Ø³Ø§Øª" } } },
"body": { fr: "Carrosserie", en: "Body", ar: "Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø³ÙŠØ§Ø±Ø©", icon: "fa-car-burst", sub: { "headlights": { fr: "Phares", en: "Headlights", ar: "Ø§Ù„Ù…ØµØ§Ø¨ÙŠØ­ Ø§Ù„Ø£Ù…Ø§Ù…ÙŠØ©" }, "rear-lights": { fr: "Feux arriÃ¨re", en: "Rear Lights", ar: "Ø§Ù„Ù…ØµØ§Ø¨ÙŠØ­ Ø§Ù„Ø®Ù„Ù ÙŠØ©" }, "car-mirror": { fr: "RÃ©troviseur", en: "Car Mirror", ar: "Ù…Ø±Ø¢Ø© Ø§Ù„Ø³ÙŠØ§Ø±Ø©" }, "wiper-blades": { fr: "Balais d'essuie-glace", en: "Wiper Blades", ar: "Ø´Ù Ø±Ø§Øª Ø§Ù„Ù…Ø³Ø§Ø­Ø§Øª" }, "bumper": { fr: "Pare-chocs", en: "Bumper", ar: "Ø§Ù„ØµØ¯Ø§Ù…" }, "fenders": { fr: "Ailes", en: "Fenders", ar: "Ø§Ù„Ø±Ù Ø§Ø±Ù " } } },
"exhaust-system": { fr: "SystÃ¨me d'Ã©chappement", en: "Exhaust System", ar: "Ù†Ø¸Ø§Ù… Ø§Ù„Ø¹Ø§Ø¯Ù…", icon: "fa-gas-pump", sub: { "muffler": { fr: "Silencieux", en: "Muffler", ar: "ÙƒØ§ØªÙ… Ø§Ù„ØµÙˆØª" }, "catalytic-converter": { fr: "Catalyseur", en: "Catalytic Converter", ar: "Ù…Ø­ÙˆÙ„ Ø­Ù Ø§Ø²" }, "lambda-sensor": { fr: "Sonde Lambda", en: "Lambda Sensor", ar: "Ø­Ø³Ø§Ø³ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ†" }, "exhaust-pipe": { fr: "Tuyau d'Ã©chappement", en: "Exhaust Pipe", ar: "Ø£Ù†Ø¨ÙˆØ¨ Ø§Ù„Ø¹Ø§Ø¯Ù…" }, "gaskets-and-seals": { fr: "Joints et bagues", en: "Gaskets and Seals", ar: "Ø¬ÙˆØ§Ù†Ø§Øª ÙˆØ­Ù„Ù‚Ø§Øª" } } },
"cooling-system": { fr: "SystÃ¨me de Refroidissement", en: "Cooling System", ar: "Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ¨Ø±ÙŠØ¯", icon: "fa-snowflake", sub: { "radiator": { fr: "Radiateur", en: "Radiator", ar: "Ø§Ù„Ø±Ø§Ø¯ÙŠØ§ØªÙŠØ±" }, "coolant-thermostat": { fr: "Thermostat", en: "Coolant Thermostat", ar: "Ù…Ù†Ø¸Ù… Ø§Ù„Ø­Ø±Ø§Ø±Ø©" }, "radiator-hoses": { fr: "Durites de radiateur", en: "Radiator Hoses", ar: "Ø®Ø±Ø§Ø·ÙŠÙ… Ø§Ù„Ø±Ø§Ø¯ÙŠØ§ØªÙŠØ±" }, "fan": { fr: "Ventilateur de refroidissement", en: "Cooling Fan", ar: "Ù…Ø±ÙˆØ­Ø© Ø§Ù„ØªØ¨Ø±ÙŠØ¯" } } }
};

const car_data = {
"Toyota": ["Yaris", "Corolla", "Camry", "Land Cruiser", "Hilux", "RAV4", "Prado", "Fortuner"],
"Peugeot": ["208", "308", "301", "2008", "3008", "508", "406", "Partner", "Expert"],
"Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta", "Caddy", "Transporter"],
"Renault": ["Clio", "Megane", "Captur", "Duster", "Symbol", "Kangoo", "Master"],
"Hyundai": ["i10", "i20", "Accent", "Tucson", "Santa Fe", "Elantra", "Creta", "Kona"],
"Nissan": ["Micra", "Sentra", "Qashqai", "X-Trail", "Juke", "Navara", "Patrol"],
"Fiat": ["Panda", "500", "Tipo", "Punto", "Ducato", "Doblo", "Fiorino"],
"CitroÃ«n": ["C3", "C4", "Berlingo", "C-ElysÃ©e", "C5 Aircross", "Jumpy"],
"Kia": ["Picanto", "Rio", "Sportage", "Sorento", "Cerato", "Stonic", "Soul"],
"Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "Sprinter", "Vito"],
"Audi": ["A3", "A4", "A6", "Q5", "Q7"],
"BMW": ["Series 1", "Series 3", "Series 5", "X3", "X5"],
"Ford": ["Focus", "Fiesta", "Kuga", "Ranger", "Transit"],
"Chevrolet": ["Spark", "Aveo", "Cruze", "Captiva"],
"Dacia": ["Logan", "Sandero", "Duster", "Dokker"],
"Skoda": ["Octavia", "Fabia", "Superb", "Kodiaq"],
"Seat": ["Ibiza", "Leon", "Ateca", "Tarraco"]
};

// FIXED: Storage bucket URL corrected to match app.js
const firebaseConfig = {
apiKey: "AIzaSyBIptEskV2soajxRYPDfwYFYyz9pWQvZL0",
authDomain: "piecety-app-b39c4.firebaseapp.com",
projectId: "piecety-app-b39c4",
storageBucket: "piecety-app-b39c4.appspot.com",
messagingSenderId: "265795860915",
appId: "1:265795860915:web:aa10241788cce42f6373c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FIXED: Added DOM safety helper
const safeQuery = (id, callback) => {
const element = document.getElementById(id);
if (element && callback) callback(element);
return element;
};

// FIXED: Added error handling wrapper
const withErrorBoundary = (fn, fallback = null) => {
try {
return fn();
} catch (error) {
console.error('Error caught:', error);
showMessage('An error occurred. Please try again.');
return fallback;
}
};

// FIXED: Added message display function
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
document.body.removeChild(messageDiv);
}, 3000);
};

// FIXED: Added cleanup system for event listeners
const eventCleanup = [];
const addListener = (element, event, handler) => {
if (element) {
element.addEventListener(event, handler);
eventCleanup.push(() => element.removeEventListener(event, handler));
}
};

const cleanupAllListeners = () => {
eventCleanup.forEach(cleanup => cleanup());
eventCleanup.length = 0;
};

// Get a reference to the main elements with safety checks
const categoriesContainer = safeQuery("storeCategories");
const brandsContainer = safeQuery("storeBrands");
const storeForm = safeQuery("storeForm");
const body = document.body;

// Check for dark mode preference and apply it
const isDarkMode = localStorage.getItem('piecety_dark_mode') === 'true';
if (isDarkMode && body) {
body.classList.add('dark');
}

// FIXED: Wrapped in error boundary
const renderCategories = () => withErrorBoundary(() => {
if (categoriesContainer) {
Object.entries(categories).forEach(([key, cat]) => {
const label = document.createElement('label');
label.className = 'flex gap-2 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors';
label.innerHTML = `
<input type="checkbox" value="${key}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
<span class="text-sm font-medium text-gray-700 dark:text-gray-300">${cat.en || key}</span>
`;
categoriesContainer.appendChild(label);
});
}
});

// FIXED: Wrapped in error boundary
const renderBrands = () => withErrorBoundary(() => {
if (brandsContainer) {
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

// FIXED: Enhanced form validation
const validateForm = () => {
const storeName = safeQuery("storeName");
const storeAddress = safeQuery("storeAddress");
const selectedCategories = Array.from(document.querySelectorAll('#storeCategories input:checked'));
const selectedBrands = Array.from(document.querySelectorAll('#storeBrands input:checked'));

if (!storeName?.value?.trim()) {
showMessage("Store name is required.", "error");
storeName?.focus();
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

// FIXED: Enhanced form submission with better error handling
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

const submitBtn = e.target.querySelector('button[type="submit"]');
const originalText = submitBtn?.textContent;

try {
if (submitBtn) {
submitBtn.disabled = true;
submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating...';
}

const storeName = safeQuery("storeName")?.value.trim();
const storeAddress = safeQuery("storeAddress")?.value.trim();
const selectedCategories = Array.from(document.querySelectorAll('#storeCategories input:checked'))
.map(cb => cb.value);
const selectedBrands = Array.from(document.querySelectorAll('#storeBrands input:checked'))
.map(cb => cb.value);

await setDoc(doc(db, "stores", user.uid), {
ownerId: user.uid,
name: storeName,
address: storeAddress,
categories: selectedCategories,
brands: selectedBrands,
createdAt: serverTimestamp()
});

// Update user role to "store" after successful setup
await updateDoc(doc(db, "users", user.uid), {
role: "store"
});

showMessage("âœ… Store profile created successfully!", "success");
setTimeout(() => {
window.location.href = "index.html";
}, 1500);

} catch (error) {
console.error("Error saving store profile:", error);
showMessage("â Œ Error saving store profile. Please try again.", "error");
} finally {
if (submitBtn) {
submitBtn.disabled = false;
submitBtn.textContent = originalText;
}
}
};

// FIXED: Added network status handling
const handleNetworkStatus = () => {
const updateOnlineStatus = () => {
const status = navigator.onLine ? 'online' : 'offline';
if (!navigator.onLine) {
showMessage('You are offline. Changes will be saved when connection is restored.', 'error');
}
};

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
};

// FIXED: Initialize with proper error handling and cleanup
const initializeApp = () => withErrorBoundary(() => {
// Render categories and brands
renderCategories();
renderBrands();

// Set up form submission with safety check
if (storeForm) {
addListener(storeForm, "submit", handleFormSubmission);
}

// Handle network status
handleNetworkStatus();

// Clean up on page unload
window.addEventListener('beforeunload', cleanupAllListeners);
});

// FIXED: Initialize when DOM is ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initializeApp);
} else {
initializeApp();
}

// FIXED: Added service worker registration for offline support
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('/sw.js')
.then(() => console.log('Service worker registered for store setup'))
.catch(err => console.error('Service worker registration failed:', err));
}

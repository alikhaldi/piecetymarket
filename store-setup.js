// Firebase Imports - FIXED: Using modular SDK consistently
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// === Full Categories & Brands Data ===
// This data is copied from app.js to make store-setup.js a standalone page

const categories = {
"braking-system": { fr: "SystÃƒÂ¨me de Freinage", en: "Braking System", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ™ Ã˜Â±Ã™â€¦Ã™â€žÃ˜Â©", icon: "icons/brake.png", sub: { "brake-pads": { fr: "Plaquettes de frein", en: "Brake Pads", ar: "Ã™Ë†Ã˜Â³Ã˜Â§Ã˜Â¯Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" }, "brake-discs": { fr: "Disques de frein", en: "Brake Discs", ar: "Ã˜Â£Ã™â€šÃ˜Â±Ã˜Â§Ã˜Âµ Ã˜Â§Ã™â€žÃ™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" }, "brake-calipers": { fr: "Ãƒâ€°trier de frein", en: "Brake Calipers", ar: "Ã™ Ã™Æ’Ã™Å  Ã˜Â§Ã™â€žÃ™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" }, "brake-fluid": { fr: "Liquide de frein", en: "Brake Fluid", ar: "Ã˜Â³Ã˜Â§Ã˜Â¦Ã™â€ž Ã˜Â§Ã™â€žÃ™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" }, "master-cylinder": { fr: "MaÃƒÂ®tre-cylindre de frein", en: "Brake Master Cylinder", ar: "Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã˜Â·Ã™Ë†Ã˜Â§Ã™â€ Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¦Ã™Å Ã˜Â³Ã™Å Ã˜Â© Ã™â€žÃ™â€žÃ™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" }, "brake-hoses": { fr: "Flexibles de frein", en: "Brake Hoses", ar: "Ã˜Â®Ã˜Â±Ã˜Â§Ã˜Â·Ã™Å Ã™â€¦ Ã˜Â§Ã™â€žÃ™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" }, "drum-brakes": { fr: "Freins Ãƒ  tambour", en: "Drum Brakes", ar: "Ã™ Ã˜Â±Ã˜Â§Ã™â€¦Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â·Ã˜Â¨Ã™â€žÃ˜Â©" } } },
"engine": { fr: "Moteur", en: "Engine", ar: "Ã™â€¦Ã˜Â­Ã˜Â±Ã™Æ’", icon: "fa-cogs", sub: { "engine-oil": { fr: "Huile moteur", en: "Engine Oil", ar: "Ã˜Â²Ã™Å Ã˜Âª Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã˜Â±Ã™Æ’" }, "timing-belt-kit": { fr: "Kit de courroie de distribution", en: "Timing Belt Kit", ar: "Ã˜Â·Ã™â€šÃ™â€¦ Ã˜Â­Ã˜Â²Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã™â€šÃ™Å Ã˜Âª" }, "spark-plugs": { fr: "Bougies d'allumage", en: "Spark Plugs", ar: "Ã˜Â´Ã™â€¦Ã˜Â¹Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â´Ã˜Â¹Ã˜Â§Ã™â€ž" }, "glow-plugs": { fr: "Bougies de prÃƒÂ©chauffage", en: "Glow Plugs", ar: "Ã˜Â´Ã™â€¦Ã˜Â¹Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã™â€¡Ã˜Â¬" }, "water-pump": { fr: "Pompe Ãƒ  eau", en: "Water Pump", ar: "Ã™â€¦Ã˜Â¶Ã˜Â®Ã˜Â© Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â§Ã˜Â¡" }, "turbocharger": { fr: "Turbocharger", en: "Turbocharger", ar: "Ã˜Â´Ã˜Â§Ã˜Â­Ã™â€  Ã˜ÂªÃ™Ë†Ã˜Â±Ã˜Â¨Ã™Å Ã™â€ Ã™Å " }, "engine-mount": { fr: "Support moteur", en: "Engine Mount", ar: "Ã˜Â­Ã˜Â§Ã™â€¦Ã™â€ž Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã˜Â±Ã™Æ’" } } },
"suspension-steering": { fr: "Suspension & Direction", en: "Suspension & Steering", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¹Ã™â€žÃ™Å Ã™â€š Ã™Ë†Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã˜Â¬Ã™Å Ã™â€¡", icon: "fa-car-side", sub: { "shock-absorbers": { fr: "Amortisseurs", en: "Shock Absorbers", ar: "Ã™â€¦Ã™â€¦Ã˜ÂªÃ˜ÂµÃ˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜ÂµÃ˜Â¯Ã™â€¦Ã˜Â§Ã˜Âª" }, "control-arm": { fr: "Bras de suspension", en: "Control Arm", ar: "Ã˜Â°Ã˜Â±Ã˜Â§Ã˜Â¹ Ã˜Â§Ã™â€žÃ˜ÂªÃ™Æ’Ã˜Â­Ã™â€¦" }, "tie-rod-end": { fr: "Rotule de direction", en: "Tie Rod End", ar: "Ã˜Â·Ã˜Â±Ã™  Ã™â€šÃ˜Â¶Ã™Å Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¨Ã˜Â·" }, "wheel-bearing": { fr: "Roulement de roue", en: "Wheel Bearing", ar: "Ã™â€¦Ã˜Â­Ã™â€¦Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â¬Ã™â€žÃ˜Â©" }, "power-steering-pump": { fr: "Pompe de direction assistÃƒÂ©e", en: "Power Steering Pump", ar: "Ã™â€¦Ã˜Â¶Ã˜Â®Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã˜Â¬Ã™Å Ã™â€¡ Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¹Ã˜Â²Ã˜Â²" } } },
"filters": { fr: "Filtres", en: "Filters", ar: "Ã™ Ã™â€žÃ˜Â§Ã˜ÂªÃ˜Â±", icon: "fa-filter", sub: { "oil-filter": { fr: "Filtre Ãƒ  huile", en: "Oil Filter", ar: "Ã™ Ã™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ˜Â²Ã™Å Ã˜Âª" }, "air-filter": { fr: "Filtre Ãƒ  air", en: "Air Filter", ar: "Ã™ Ã™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ™â€¡Ã™Ë†Ã˜Â§Ã˜Â¡" }, "cabin-filter": { fr: "Filtre d'habitacle", en: "Cabin Filter", ar: "Ã™ Ã™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜ÂµÃ™Ë†Ã˜Â±Ã˜Â©" }, "fuel-filter": { fr: "Filtre Ãƒ  carburant", en: "Fuel Filter", ar: "Ã™ Ã™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ™Ë†Ã™â€šÃ™Ë†Ã˜Â¯" } } },
"electrical": { fr: "SystÃƒÂ¨me Ãƒâ€°lectrique", en: "Electrical System", ar: "Ã˜Â§Ã™â€žÃ™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ™Æ’Ã™â€¡Ã˜Â±Ã˜Â¨Ã˜Â§Ã˜Â¦Ã™Å ", icon: "fa-bolt", sub: { "battery": { fr: "Batterie", en: "Battery", ar: "Ã˜Â¨Ã˜Â·Ã˜Â§Ã˜Â±Ã™Å Ã˜Â©" }, "alternator": { fr: "Alternateur", en: "Alternator", ar: "Ã™â€¦Ã™Ë†Ã™â€žÃ˜Â¯" }, "starter-motor": { fr: "DÃƒÂ©marreur", en: "Starter Motor", ar: "Ã™â€¦Ã˜Â­Ã˜Â±Ã™Æ’ Ã˜Â¨Ã˜Â¯Ã˜Â¡ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â´Ã˜ÂºÃ™Å Ã™â€ž" }, "spark-plug-leads": { fr: "CÃƒÂ¢bles de bougies", en: "Spark Plug Leads", ar: "Ã˜Â£Ã˜Â³Ã™â€žÃ˜Â§Ã™Æ’ Ã˜Â´Ã™â€¦Ã˜Â¹Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â´Ã˜Â¹Ã˜Â§Ã™â€ž" }, "sensors": { fr: "Capteurs", en: "Sensors", ar: "Ã˜Â­Ã˜Â³Ã˜Â§Ã˜Â³Ã˜Â§Ã˜Âª" } } },
"body": { fr: "Carrosserie", en: "Body", ar: "Ã™â€¡Ã™Å Ã™Æ’Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â©", icon: "fa-car-burst", sub: { "headlights": { fr: "Phares", en: "Headlights", ar: "Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂµÃ˜Â§Ã˜Â¨Ã™Å Ã˜Â­ Ã˜Â§Ã™â€žÃ˜Â£Ã™â€¦Ã˜Â§Ã™â€¦Ã™Å Ã˜Â©" }, "rear-lights": { fr: "Feux arriÃƒÂ¨re", en: "Rear Lights", ar: "Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂµÃ˜Â§Ã˜Â¨Ã™Å Ã˜Â­ Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ Ã™Å Ã˜Â©" }, "car-mirror": { fr: "RÃƒÂ©troviseur", en: "Car Mirror", ar: "Ã™â€¦Ã˜Â±Ã˜Â¢Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â©" }, "wiper-blades": { fr: "Balais d'essuie-glace", en: "Wiper Blades", ar: "Ã˜Â´Ã™ Ã˜Â±Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â³Ã˜Â§Ã˜Â­Ã˜Â§Ã˜Âª" }, "bumper": { fr: "Pare-chocs", en: "Bumper", ar: "Ã˜Â§Ã™â€žÃ˜ÂµÃ˜Â¯Ã˜Â§Ã™â€¦" }, "fenders": { fr: "Ailes", en: "Fenders", ar: "Ã˜Â§Ã™â€žÃ˜Â±Ã™ Ã˜Â§Ã˜Â±Ã™ " } } },
"exhaust-system": { fr: "SystÃƒÂ¨me d'ÃƒÂ©chappement", en: "Exhaust System", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â§Ã˜Â¯Ã™â€¦", icon: "fa-gas-pump", sub: { "muffler": { fr: "Silencieux", en: "Muffler", ar: "Ã™Æ’Ã˜Â§Ã˜ÂªÃ™â€¦ Ã˜Â§Ã™â€žÃ˜ÂµÃ™Ë†Ã˜Âª" }, "catalytic-converter": { fr: "Catalyseur", en: "Catalytic Converter", ar: "Ã™â€¦Ã˜Â­Ã™Ë†Ã™â€ž Ã˜Â­Ã™ Ã˜Â§Ã˜Â²" }, "lambda-sensor": { fr: "Sonde Lambda", en: "Lambda Sensor", ar: "Ã˜Â­Ã˜Â³Ã˜Â§Ã˜Â³ Ã˜Â§Ã™â€žÃ˜Â£Ã™Æ’Ã˜Â³Ã˜Â¬Ã™Å Ã™â€ " }, "exhaust-pipe": { fr: "Tuyau d'ÃƒÂ©chappement", en: "Exhaust Pipe", ar: "Ã˜Â£Ã™â€ Ã˜Â¨Ã™Ë†Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â§Ã˜Â¯Ã™â€¦" }, "gaskets-and-seals": { fr: "Joints et bagues", en: "Gaskets and Seals", ar: "Ã˜Â¬Ã™Ë†Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã™Ë†Ã˜Â­Ã™â€žÃ™â€šÃ˜Â§Ã˜Âª" } } },
"cooling-system": { fr: "SystÃƒÂ¨me de Refroidissement", en: "Cooling System", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¨Ã˜Â±Ã™Å Ã˜Â¯", icon: "fa-snowflake", sub: { "radiator": { fr: "Radiateur", en: "Radiator", ar: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¯Ã™Å Ã˜Â§Ã˜ÂªÃ™Å Ã˜Â±" }, "coolant-thermostat": { fr: "Thermostat", en: "Coolant Thermostat", ar: "Ã™â€¦Ã™â€ Ã˜Â¸Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â­Ã˜Â±Ã˜Â§Ã˜Â±Ã˜Â©" }, "radiator-hoses": { fr: "Durites de radiateur", en: "Radiator Hoses", ar: "Ã˜Â®Ã˜Â±Ã˜Â§Ã˜Â·Ã™Å Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¯Ã™Å Ã˜Â§Ã˜ÂªÃ™Å Ã˜Â±" }, "fan": { fr: "Ventilateur de refroidissement", en: "Cooling Fan", ar: "Ã™â€¦Ã˜Â±Ã™Ë†Ã˜Â­Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¨Ã˜Â±Ã™Å Ã˜Â¯" } } }
};

const car_data = {
"Toyota": ["Yaris", "Corolla", "Camry", "Land Cruiser", "Hilux", "RAV4", "Prado", "Fortuner"],
"Peugeot": ["208", "308", "301", "2008", "3008", "508", "406", "Partner", "Expert"],
"Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta", "Caddy", "Transporter"],
"Renault": ["Clio", "Megane", "Captur", "Duster", "Symbol", "Kangoo", "Master"],
"Hyundai": ["i10", "i20", "Accent", "Tucson", "Santa Fe", "Elantra", "Creta", "Kona"],
"Nissan": ["Micra", "Sentra", "Qashqai", "X-Trail", "Juke", "Navara", "Patrol"],
"Fiat": ["Panda", "500", "Tipo", "Punto", "Ducato", "Doblo", "Fiorino"],
"CitroÃƒÂ«n": ["C3", "C4", "Berlingo", "C-ElysÃƒÂ©e", "C5 Aircross", "Jumpy"],
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

showMessage("Ã¢Å“â€¦ Store profile created successfully!", "success");
setTimeout(() => {
window.location.href = "index.html";
}, 1500);

} catch (error) {
console.error("Error saving store profile:", error);
showMessage("Ã¢ Å’ Error saving store profile. Please try again.", "error");
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

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// === Full Categories & Brands Data ===
// This data is copied from app.js to make store-setup.js a standalone page
const categories = {
  "braking-system": { fr: "Système de Freinage", en: "Braking System", ar: "نظام الفرملة", icon: "icons/brake.png", sub: { "brake-pads": { fr: "Plaquettes de frein", en: "Brake Pads", ar: "وسادات الفرامل" }, "brake-discs": { fr: "Disques de frein", en: "Brake Discs", ar: "أقراص الفرامل" }, "brake-calipers": { fr: "Étrier de frein", en: "Brake Calipers", ar: "فكي الفرامل" }, "brake-fluid": { fr: "Liquide de frein", en: "Brake Fluid", ar: "سائل الفرامل" }, "master-cylinder": { fr: "Maître-cylindre de frein", en: "Brake Master Cylinder", ar: "الأسطوانة الرئيسية للفرامل" }, "brake-hoses": { fr: "Flexibles de frein", en: "Brake Hoses", ar: "خراطيم الفرامل" }, "drum-brakes": { fr: "Freins à tambour", en: "Drum Brakes", ar: "فرامل الطبلة" } } },
  "engine": { fr: "Moteur", en: "Engine", ar: "محرك", icon: "fa-cogs", sub: { "engine-oil": { fr: "Huile moteur", en: "Engine Oil", ar: "زيت المحرك" }, "timing-belt-kit": { fr: "Kit de courroie de distribution", en: "Timing Belt Kit", ar: "طقم حزام التوقيت" }, "spark-plugs": { fr: "Bougies d'allumage", en: "Spark Plugs", ar: "شمعات الإشعال" }, "glow-plugs": { fr: "Bougies de préchauffage", en: "Glow Plugs", ar: "شمعات التوهج" }, "water-pump": { fr: "Pompe à eau", en: "Water Pump", ar: "مضخة الماء" }, "turbocharger": { fr: "Turbocharger", en: "Turbocharger", ar: "شاحن توربيني" }, "engine-mount": { fr: "Support moteur", en: "Engine Mount", ar: "حامل المحرك" } } },
  "suspension-steering": { fr: "Suspension & Direction", en: "Suspension & Steering", ar: "نظام التعليق والتوجيه", icon: "fa-car-side", sub: { "shock-absorbers": { fr: "Amortisseurs", en: "Shock Absorbers", ar: "ممتصات الصدمات" }, "control-arm": { fr: "Bras de suspension", en: "Control Arm", ar: "ذراع التحكم" }, "tie-rod-end": { fr: "Rotule de direction", en: "Tie Rod End", ar: "طرف قضيب الربط" }, "wheel-bearing": { fr: "Roulement de roue", en: "Wheel Bearing", ar: "محمل العجلة" }, "power-steering-pump": { fr: "Pompe de direction assistée", en: "Power Steering Pump", ar: "مضخة التوجيه المعزز" } } },
  "filters": { fr: "Filtres", en: "Filters", ar: "فلاتر", icon: "fa-filter", sub: { "oil-filter": { fr: "Filtre à huile", en: "Oil Filter", ar: "فلتر الزيت" }, "air-filter": { fr: "Filtre à air", en: "Air Filter", ar: "فلتر الهواء" }, "cabin-filter": { fr: "Filtre d'habitacle", en: "Cabin Filter", ar: "فلتر المقصورة" }, "fuel-filter": { fr: "Filtre à carburant", en: "Fuel Filter", ar: "فلتر الوقود" } } },
  "electrical": { fr: "Système Électrique", en: "Electrical System", ar: "النظام الكهربائي", icon: "fa-bolt", sub: { "battery": { fr: "Batterie", en: "Battery", ar: "بطارية" }, "alternator": { fr: "Alternateur", en: "Alternator", ar: "مولد" }, "starter-motor": { fr: "Démarreur", en: "Starter Motor", ar: "محرك بدء التشغيل" }, "spark-plug-leads": { fr: "Câbles de bougies", en: "Spark Plug Leads", ar: "أسلاك شمعات الإشعال" }, "sensors": { fr: "Capteurs", en: "Sensors", ar: "حساسات" } } },
  "body": { fr: "Carrosserie", en: "Body", ar: "هيكل السيارة", icon: "fa-car-burst", sub: { "headlights": { fr: "Phares", en: "Headlights", ar: "المصابيح الأمامية" }, "rear-lights": { fr: "Feux arrière", en: "Rear Lights", ar: "المصابيح الخلفية" }, "car-mirror": { fr: "Rétroviseur", en: "Car Mirror", ar: "مرآة السيارة" }, "wiper-blades": { fr: "Balais d'essuie-glace", en: "Wiper Blades", ar: "شفرات المساحات" }, "bumper": { fr: "Pare-chocs", en: "Bumper", ar: "الصدام" }, "fenders": { fr: "Ailes", en: "Fenders", ar: "الرفارف" } } },
  "exhaust-system": { fr: "Système d'échappement", en: "Exhaust System", ar: "نظام العادم", icon: "fa-gas-pump", sub: { "muffler": { fr: "Silencieux", en: "Muffler", ar: "كاتم الصوت" }, "catalytic-converter": { fr: "Catalyseur", en: "Catalytic Converter", ar: "محول حفاز" }, "lambda-sensor": { fr: "Sonde Lambda", en: "Lambda Sensor", ar: "حساس الأكسجين" }, "exhaust-pipe": { fr: "Tuyau d'échappement", en: "Exhaust Pipe", ar: "أنبوب العادم" }, "gaskets-and-seals": { fr: "Joints et bagues", en: "Gaskets and Seals", ar: "جوانات وحلقات" } } },
  "cooling-system": { fr: "Système de Refroidissement", en: "Cooling System", ar: "نظام التبريد", icon: "fa-snowflake", sub: { "radiator": { fr: "Radiateur", en: "Radiator", ar: "الرادياتير" }, "coolant-thermostat": { fr: "Thermostat", en: "Coolant Thermostat", ar: "منظم الحرارة" }, "radiator-hoses": { fr: "Durites de radiateur", en: "Radiator Hoses", ar: "خراطيم الرادياتير" }, "fan": { fr: "Ventilateur de refroidissement", en: "Cooling Fan", ar: "مروحة التبريد" } } }
};
const car_data = {
  "Toyota": ["Yaris", "Corolla", "Camry", "Land Cruiser", "Hilux", "RAV4", "Prado", "Fortuner"], 
  "Peugeot": ["208", "308", "301", "2008", "3008", "508", "406", "Partner", "Expert"], 
  "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta", "Caddy", "Transporter"], 
  "Renault": ["Clio", "Megane", "Captur", "Duster", "Symbol", "Kangoo", "Master"], 
  "Hyundai": ["i10", "i20", "Accent", "Tucson", "Santa Fe", "Elantra", "Creta", "Kona"], 
  "Nissan": ["Micra", "Sentra", "Qashqai", "X-Trail", "Juke", "Navara", "Patrol"], 
  "Fiat": ["Panda", "500", "Tipo", "Punto", "Ducato", "Doblo", "Fiorino"], 
  "Citroën": ["C3", "C4", "Berlingo", "C-Elysée", "C5 Aircross", "Jumpy"], 
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
// End of data copy

const firebaseConfig = {
  apiKey: "AIzaSyBIptEskV2soajxRYPDfwYFYyz9pWQvZL0",
  authDomain: "piecety-app-b39c4.firebaseapp.com",
  projectId: "piecety-app-b39c4",
  // FIXED: Corrected storage bucket URL
  storageBucket: "piecety-app-b39c4.appspot.com",
  messagingSenderId: "265795860915",
  appId: "1:265795860915:web:aa10241788cce42f6373c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get a reference to the main elements
const categoriesContainer = document.getElementById("storeCategories");
const brandsContainer = document.getElementById("storeBrands");
const storeForm = document.getElementById("storeForm");
const body = document.body;

// Check for dark mode preference and apply it
const isDarkMode = localStorage.getItem('piecety_dark_mode') === 'true';
if (isDarkMode) {
    body.classList.add('dark');
}

// Render all categories as checkboxes (top-level only)
if (categoriesContainer) {
    Object.entries(categories).forEach(([key, cat]) => {
      const label = document.createElement('label');
      label.className = 'flex gap-2 items-center';
      label.innerHTML = `
        <input type="checkbox" value="${key}" class="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded" />
        <span class="text-gray-800 dark:text-gray-200">${cat.en || key}</span>
      `;
      categoriesContainer.appendChild(label);
    });
}

// Render all brands as checkboxes
if (brandsContainer) {
    Object.keys(car_data).forEach(brand => {
      const label = document.createElement('label');
      label.className = 'flex gap-2 items-center';
      label.innerHTML = `
        <input type="checkbox" value="${brand}" class="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded" />
        <span class="text-gray-800 dark:text-gray-200">${brand}</span>
      `;
      brandsContainer.appendChild(label);
    });
}

// Store form submission
if (storeForm) {
    storeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
    
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to create a store profile.");
        window.location.href = "index.html";
        return;
      }
    
      const storeName = document.getElementById("storeName")?.value.trim();
      const storeAddress = document.getElementById("storeAddress")?.value.trim();
    
      if (!storeName) {
        alert("Store name is required.");
        return;
      }
    
      // Collect selected categories
      const selectedCategories = Array.from(document.querySelectorAll('#storeCategories input:checked'))
        .map(cb => cb.value);
    
      // Collect selected brands
      const selectedBrands = Array.from(document.querySelectorAll('#storeBrands input:checked'))
        .map(cb => cb.value);
    
      try {
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
    
        alert("✅ Store profile created successfully!");
        window.location.href = "index.html"; // Redirect to homepage
      } catch (error) {
        console.error("Error saving store profile:", error);
        alert("❌ Error saving store profile.");
      }
    });
}

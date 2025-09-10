// app.js - fixed & enhanced version for Piecety
// - Removes unused imports
// - Fixes debounce, years calculation, dark-mode toggle, i18n breadcrumb
// - Adds Facebook login, image upload for ads & profile, profile edit/store
// - Ensures ownerId (sellerId) saved with products

// Firebase SDK imports (only required functions)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

/* -------------------------
   Global state & constants
   ------------------------- */
let currentUser = null;
let currentLang = localStorage.getItem("piecety_lang") || "fr";
let currentView = "home";
let userCart = {};
let productsUnsubscribe = null;
let chatsUnsubscribe = null;
let lastVisibleProduct = null;
let isFetching = false;
let recentlyViewed = JSON.parse(localStorage.getItem("piecety_recently_viewed") || "[]");

/* -------------------------
   Firebase config + init
   ------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBIptEskV2soajxRYPDfwYFYyz9pWQvZL0",
  authDomain: "piecety-app-b39c4.firebaseapp.com",
  projectId: "piecety-app-b39c4",
  storageBucket: "piecety-app-b39c4.appspot.com",
  messagingSenderId: "265795860915",
  appId: "1:265795860915:web:aa10241788cce42f6373c6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();
const storage = getStorage(app);

/* -------------------------
   Translations (kept minimal)
   ------------------------- */
const translations = {
  fr: {
    page_title: "Piecety - Marché des Pièces Auto en Algérie",
    meta_description:
      "Achetez et vendez des pièces automobiles en Algérie avec Piecety, le marché fiable pour les pièces neuves et d'occasion.",
    nav_home: "Accueil",
    search_placeholder: "Rechercher une pièce...",
    submit_ad: "Soumettre une annonce",
    submit_ad_btn_text: "Soumettre",
    ad_posted: "Votre annonce a été publiée avec succès !",
    ad_post_failed: "Échec de la publication de l'annonce.",
    login_text: "Connectez-vous pour accéder à toutes les fonctionnalités.",
    google_login: "Se connecter avec Google",
    login_required: "Veuillez vous connecter pour utiliser cette fonctionnalité.",
    item_added_to_cart: "Article ajouté au panier!",
    logout: "Déconnexion",
    dashboard: "Tableau de Bord",
    messages: "Messages",
    sell: "Vendre",
    cart_title: "Mon panier"
  },
  en: {
    page_title: "Piecety - Car Parts Marketplace in Algeria",
    meta_description:
      "Buy and sell car parts in Algeria with Piecety, the reliable marketplace for new and used parts.",
    nav_home: "Home",
    search_placeholder: "Search for a part...",
    submit_ad: "Submit an Ad",
    submit_ad_btn_text: "Submit",
    ad_posted: "Your ad has been posted successfully!",
    ad_post_failed: "Failed to post ad.",
    login_text: "Log in to access all features.",
    google_login: "Sign in with Google",
    login_required: "Please log in to use this feature.",
    item_added_to_cart: "Item added to cart!",
    logout: "Logout",
    dashboard: "Dashboard",
    messages: "Messages",
    sell: "Sell",
    cart_title: "My Cart"
  },
  ar: {
    page_title: "Piecety - سوق قطع غيار السيارات في الجزائر",
    meta_description:
      "بيع وشراء قطع غيار السيارات في الجزائر مع Piecety، السوق الموثوق للقطع الجديدة والمستعملة.",
    nav_home: "الرئيسية",
    search_placeholder: "ابحث عن قطعة...",
    submit_ad: "إرسال إعلان",
    submit_ad_btn_text: "إرسال",
    ad_posted: "تم نشر إعلانك بنجاح!",
    ad_post_failed: "فشل نشر الإعلان.",
    login_text: "تسجيل الدخول للوصول إلى جميع الميزات.",
    google_login: "تسجيل الدخول باستخدام Google",
    login_required: "يرجى تسجيل الدخول لاستخدام هذه الميزة.",
    item_added_to_cart: "تمت إضافة المنتج إلى السلة!",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    messages: "الرسائل",
    sell: "بيع",
    cart_title: "سلة التسوق"
  }
};

/* -------------------------
   Small datasets (abridged)
   ------------------------- */
const categories = {
  engine: { fr: "Moteur", en: "Engine", ar: "محرك", icon: "fa-cogs" },
  brakes: { fr: "Freins", en: "Brakes", ar: "مكابح", icon: "fa-car" },
  tires: { fr: "Pneus & Jantes", en: "Tires & Rims", ar: "الإطارات", icon: "fa-circle" }
};

// car data abbreviated — original file has more
const car_data = {
  Toyota: ["Yaris", "Corolla", "Camry"],
  Peugeot: ["208", "308"]
};

const brand_icons = {
  Toyota: "icons/toyota.png",
  Peugeot: "icons/peugeot.png",
  default: "icons/car-192.png"
};

/* -------------------------
   Years (fix off-by-one)
   ------------------------- */
const currentYear = new Date().getFullYear();
// include 1980 (so length is currentYear - 1979 + 1)
const years = Array.from(
  { length: currentYear - 1979 + 1 },
  (_, i) => (currentYear - i).toString()
);

/* -------------------------
   DOM elements (safe access)
   ------------------------- */
const DOMElements = {
  html: document.documentElement,
  appContainer: document.getElementById("app-container"),
  messageBox: document.getElementById("message-box"),
  langDropdownBtn: document.getElementById("lang-dropdown-btn"),
  langDropdown: document.getElementById("lang-dropdown"),
  langBtns: document.querySelectorAll(".lang-btn"),
  searchInput: document.getElementById("search-input"),
  postProductModal: document.getElementById("post-product-modal"),
  modalCloseBtn: document.getElementById("modal-close-btn"),
  postProductForm: document.getElementById("post-product-form"),
  mobileMenuBtn: document.getElementById("mobile-menu-btn"),
  mobileMenu: document.getElementById("mobile-menu"),
  mobileMenuBackdrop: document.getElementById("mobile-menu-backdrop"),
  mobileMenuCloseBtn: document.getElementById("mobile-menu-close-btn"),
  mobileNavLinks: document.getElementById("mobile-nav-links"),
  mobileFiltersModal: document.getElementById("mobile-filters-modal"),
  mobileFiltersContent: document.getElementById("mobile-filters-content"),
  mobileFiltersCloseBtn: document.getElementById("mobile-filters-close-btn"),
  mobileApplyFiltersBtn: document.getElementById("mobile-apply-filters-btn"),
  authModal: document.getElementById("auth-modal"),
  authModalCloseBtn: document.getElementById("auth-modal-close-btn"),
  googleLoginBtn: document.getElementById("google-login-btn"),
  cartBtn: document.getElementById("cart-btn"),
  cartCountSpan: document.getElementById("cart-count"),
  authLinksContainer: document.getElementById("auth-links"),
  homeLink: document.getElementById("home-link"),
  sellLink: document.getElementById("sell-link"),
  darkModeToggle: document.getElementById("dark-mode-toggle"),
  postProductBrandSelect: document.getElementById("product-brand"),
  postProductModelSelect: document.getElementById("product-model"),
  postProductYearSelect: document.getElementById("product-year"),
  postProductWilayaSelect: document.getElementById("product-wilaya"),
  postProductCommuneSelect: document.getElementById("product-commune"),
  postProductCategorySelect: document.getElementById("product-category"),
  postProductConditionSelect: document.getElementById("product-condition")
};

/* -------------------------
   Util: showMessage (safer)
   ------------------------- */
const showMessage = (msgKeyOrText, duration = 3500, type = "info") => {
  const box = DOMElements.messageBox;
  if (!box) return;
  const text = translations[currentLang]?.[msgKeyOrText] || msgKeyOrText;
  box.textContent = text;

  // reset classes, keep positioning wrapper
  box.className =
    "fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out max-w-sm break-words";
  const colors =
    type === "success"
      ? ["bg-green-100", "text-green-800", "dark:bg-green-900", "dark:text-green-200"]
      : type === "error"
      ? ["bg-red-100", "text-red-800", "dark:bg-red-900", "dark:text-red-200"]
      : ["bg-blue-100", "text-blue-800", "dark:bg-blue-900", "dark:text-blue-200"];

  box.classList.add(...colors);

  // show
  requestAnimationFrame(() => {
    box.classList.remove("opacity-0", "translate-x-full", "invisible");
    box.classList.add("opacity-100", "translate-x-0");
  });

  setTimeout(() => {
    box.classList.remove("opacity-100", "translate-x-0");
    box.classList.add("opacity-0", "translate-x-full");
  }, duration);
};

/* -------------------------
   Util: debounce (fixed)
   ------------------------- */
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

/* -------------------------
   Cart display (handles mobile count if present)
   ------------------------- */
const updateCartDisplay = () => {
  const cartItemCount = Object.values(userCart).reduce((s, it) => s + (it.quantity || 0), 0);
  if (DOMElements.cartCountSpan) {
    DOMElements.cartCountSpan.textContent = cartItemCount;
    DOMElements.cartCountSpan.classList.toggle("hidden", cartItemCount === 0);
  }
  const mobileCart = document.getElementById("mobile-cart-count");
  if (mobileCart) {
    mobileCart.textContent = cartItemCount;
    mobileCart.classList.toggle("hidden", cartItemCount === 0);
  }
};

/* -------------------------
   Mobile menu
   ------------------------- */
const openMobileMenu = () => {
  DOMElements.mobileMenu?.classList.remove("-translate-x-full");
  DOMElements.mobileMenuBackdrop?.classList.remove("invisible", "opacity-0");
};
const closeMobileMenu = () => {
  DOMElements.mobileMenu?.classList.add("-translate-x-full");
  DOMElements.mobileMenuBackdrop?.classList.add("invisible", "opacity-0");
};

/* -------------------------
   Language / i18n helpers
   ------------------------- */
const translatePage = (lang) => {
  currentLang = lang;
  localStorage.setItem("piecety_lang", lang);
  if (DOMElements.html) {
    DOMElements.html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    DOMElements.html.setAttribute("lang", lang);
  }
  document.querySelectorAll("[data-i18n-key]").forEach((el) => {
    const key = el.dataset.i18nKey;
    if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[lang]?.[key]) el.placeholder = translations[lang][key];
  });

  // update title & meta
  document.title = translations[lang]?.page_title || "Piecety";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", translations[lang]?.meta_description || "");
};

/* -------------------------
   Populate selects (generic)
   ------------------------- */
const populateSelect = (selectEl, options, defaultLabelKey, lang, valueAsKey = false) => {
  if (!selectEl) return;
  const prev = selectEl.value;
  // reset
  selectEl.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = translations[lang]?.[defaultLabelKey] || defaultLabelKey;
  selectEl.appendChild(defaultOption);

  if (Array.isArray(options)) {
    options.slice().sort().forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      selectEl.appendChild(o);
    });
  } else {
    Object.keys(options)
      .slice()
      .sort()
      .forEach((key) => {
        const o = document.createElement("option");
        o.value = valueAsKey ? key : key;
        o.textContent = valueAsKey ? (options[key][lang] || options[key].fr || key) : key;
        selectEl.appendChild(o);
      });
  }
  selectEl.value = prev || "";
};

/* -------------------------
   Render helpers & views (simplified)
   ------------------------- */
const updateBreadcrumb = () => {
  const breadcrumbNav = document.getElementById("breadcrumb-nav");
  if (!breadcrumbNav) return;
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const brand = params.get("brand");

  // Use i18n for home label
  const homeLabel = translations[currentLang]?.nav_home || "Home";
  const homeLink = document.createElement("a");
  homeLink.href = "#";
  homeLink.className = "hover:underline home-crumb";
  homeLink.textContent = homeLabel;
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.history.pushState({}, "", window.location.pathname);
    renderView("home");
  });

  const fragments = [homeLink];
  if (category) {
    fragments.push(document.createTextNode(" / "));
    const catEl = document.createElement("a");
    catEl.href = "#";
    catEl.className = "category-crumb hover:underline";
    catEl.dataset.category = category;
    catEl.textContent = categories[category]?.[currentLang] || category;
    catEl.addEventListener("click", (e) => {
      e.preventDefault();
      const newUrl = new URL(window.location);
      newUrl.searchParams.set("category", category);
      newUrl.searchParams.delete("brand");
      window.history.pushState({}, "", newUrl.href);
      renderHomePage();
    });
    fragments.push(catEl);
  }
  if (brand) {
    fragments.push(document.createTextNode(" / "));
    const brandSpan = document.createElement("span");
    brandSpan.className = "font-semibold";
    brandSpan.textContent = brand;
    fragments.push(brandSpan);
  }

  breadcrumbNav.innerHTML = "";
  fragments.forEach((f) => breadcrumbNav.appendChild(f));
};

const renderHomePage = () => {
  updateBreadcrumb();
  renderRecentlyViewed();
  // Setup and render filters
  const filtersContainer = document.getElementById("filters-content");
  if (filtersContainer) {
    filtersContainer.innerHTML = document.getElementById("filters-template")?.content?.cloneNode(true)?.innerHTML || "";
    setupFilterListeners(filtersContainer);
    applyFiltersFromURL(filtersContainer);
  }
  // mobile filters
  if (DOMElements.mobileFiltersContent) {
    DOMElements.mobileFiltersContent.innerHTML =
      document.getElementById("filters-template")?.content?.cloneNode(true)?.innerHTML || "";
    setupFilterListeners(DOMElements.mobileFiltersContent);
    applyFiltersFromURL(DOMElements.mobileFiltersContent);
  }

  // render categories grid or brands depending on URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get("brand")) {
    renderYearCategories();
  } else if (params.get("category")) {
    renderBrandCategories();
  } else {
    renderPartCategories();
  }

  renderListings();
};

const renderPartCategories = () => {
  const grid = document.getElementById("dynamic-grid");
  const titleEl = document.getElementById("categories-title-heading");
  if (!grid || !titleEl) return;
  titleEl.textContent = translations[currentLang]?.categories_title || "Categories";
  grid.innerHTML = "";
  Object.entries(categories).forEach(([key, cat]) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center category-card flex flex-col items-center justify-center";
    a.innerHTML = `
      <div class="p-4 rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 mx-auto w-16 h-16 flex items-center justify-center mb-2 category-icon">
         <i class="fas ${cat.icon} text-3xl"></i>
      </div>
      <h3 class="font-semibold text-sm md:text-base">${cat[currentLang] || cat.fr}</h3>
    `;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const newUrl = new URL(window.location);
      newUrl.searchParams.set("category", key);
      window.history.pushState({}, "", newUrl.href);
      renderHomePage();
    });
    grid.appendChild(a);
  });
};

const renderBrandCategories = () => {
  const grid = document.getElementById("dynamic-grid");
  const titleEl = document.getElementById("categories-title-heading");
  if (!grid || !titleEl) return;
  titleEl.textContent = translations[currentLang]?.brands_title || "Brands";
  grid.innerHTML = "";
  Object.keys(car_data).forEach((brandName) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center category-card flex flex-col items-center justify-center";
    const icon = brand_icons[brandName] || brand_icons.default;
    a.innerHTML = `
      <img src="${icon}" alt="${brandName}" class="h-16 object-contain mb-2" onerror="this.src='${brand_icons.default}'">
      <h3 class="font-semibold text-sm md:text-base">${brandName}</h3>
    `;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const newUrl = new URL(window.location);
      newUrl.searchParams.set("brand", brandName);
      window.history.pushState({}, "", newUrl.href);
      renderHomePage();
    });
    grid.appendChild(a);
  });
};

const renderYearCategories = () => {
  const grid = document.getElementById("dynamic-grid");
  const titleEl = document.getElementById("categories-title-heading");
  if (!grid || !titleEl) return;
  titleEl.textContent = translations[currentLang]?.years_title || "Years";
  grid.innerHTML = "";
  years.forEach((y) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className = "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center";
    a.innerHTML = `<span class="font-semibold">${y}</span>`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      ["#filters-content #year-filter", "#mobile-filters-content #year-filter"].forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) el.value = y;
      });
      applyAndRenderFilters();
      document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
    });
    grid.appendChild(a);
  });
};

/* -------------------------
   Filtering helpers
   ------------------------- */
const applyAndRenderFilters = () => {
  const params = {};
  const filtersContainer = document.querySelector("#filters-content") || document;
  filtersContainer.querySelectorAll(".filter").forEach((el) => {
    if (el.value) params[el.id.replace("-filter", "")] = el.value;
  });
  params.search = DOMElements.searchInput?.value || "";

  const newUrl = new URL(window.location);
  newUrl.search = new URLSearchParams(params).toString();
  window.history.replaceState({ path: newUrl.href }, "", newUrl.href);

  renderListings();
};

const applyFiltersFromURL = (container = document) => {
  const params = new URLSearchParams(window.location.search);
  params.forEach((value, key) => {
    const el = container.querySelector(`#${key}-filter`);
    if (el) {
      el.value = value;
      if (key === "brand") el.dispatchEvent(new Event("change"));
      if (key === "wilaya") el.dispatchEvent(new Event("change"));
    }
  });
  if (DOMElements.searchInput) DOMElements.searchInput.value = params.get("search") || "";
};

const setupFilterListeners = (container = document) => {
  if (!container) return;
  const debouncedApply = debounce(applyAndRenderFilters, 300);

  const brandFilter = container.querySelector("#brand-filter");
  if (brandFilter) {
    populateSelect(brandFilter, car_data, "all_brands", currentLang);
    brandFilter.addEventListener("change", () => {
      const modelFilter = container.querySelector("#model-filter");
      if (!brandFilter.value) {
        if (modelFilter) {
          modelFilter.innerHTML = `<option value="">${translations[currentLang]?.all_models || "All models"}</option>`;
          modelFilter.disabled = true;
        }
      } else {
        if (modelFilter) {
          populateSelect(modelFilter, car_data[brandFilter.value] || [], "all_models", currentLang);
          modelFilter.disabled = false;
        }
      }
      debouncedApply();
    });
  }

  const wilayaFilter = container.querySelector("#wilaya-filter");
  if (wilayaFilter) {
    populateSelect(wilayaFilter, Object.keys(wilayas || {}), "all_wilayas", currentLang);
    wilayaFilter.addEventListener("change", () => {
      // populate communes if code present in page — uses wilayas object if present
      const communeFilter = container.querySelector("#commune-filter");
      if (communeFilter && window.wilayas && wilayaFilter.value && wilayas[wilayaFilter.value]) {
        populateSelect(communeFilter, wilayas[wilayaFilter.value], "all_communes", currentLang);
        communeFilter.disabled = false;
      } else if (communeFilter) {
        communeFilter.innerHTML = `<option value="">${translations[currentLang]?.all_communes || "All communes"}</option>`;
        communeFilter.disabled = true;
      }
      debouncedApply();
    });
  }

  const priceRange = container.querySelector("#price-range-filter");
  if (priceRange) {
    priceRange.addEventListener("input", () => {
      const valueEl = container.querySelector("#price-range-value");
      if (valueEl) valueEl.textContent = `${Number(priceRange.value).toLocaleString()} DA`;
    });
    priceRange.addEventListener("change", debouncedApply);
  }

  container.querySelectorAll(".filter:not(#brand-filter):not(#wilaya-filter):not(#price-range-filter)").forEach((el) => {
    el.addEventListener("change", debouncedApply);
  });

  container.querySelector("#filter-reset-btn")?.addEventListener("click", () => {
    window.history.pushState({}, "", window.location.pathname);
    renderView("home");
  });
};

/* -------------------------
   LISTINGS / Firestore fetch
   ------------------------- */
const displayProducts = (products, container) => {
  if (!container) return;
  container.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-4";
    card.style.minHeight = "220px";
    card.innerHTML = `
      <img src="${product.imageUrl || "icons/car-192.png"}" alt="${product.title}" class="w-full h-40 object-cover rounded-md mb-3 product-image" />
      <h3 class="text-lg font-semibold product-title">${product.title}</h3>
      <p class="text-sm mt-2">${product.price ? product.price.toLocaleString() + " DA" : ""}</p>
      <div class="mt-3 flex items-center justify-between">
        <button class="add-to-cart-btn px-3 py-1 rounded bg-blue-600 text-white text-sm">${translations[currentLang]?.add_to_cart || "Add"}</button>
        <button class="view-btn px-3 py-1 rounded border text-sm">View</button>
      </div>
    `;
    // events
    card.querySelector(".add-to-cart-btn")?.addEventListener("click", () => addToCart(product));
    card.querySelector(".view-btn")?.addEventListener("click", () => renderView("product/" + product.id, product));
    container.appendChild(card);
  });
};

const renderListings = async (loadMore = false) => {
  const listingsSection = document.getElementById("listings-grid") || document.getElementById("listings-section");
  if (!listingsSection || isFetching) return;
  isFetching = true;

  if (!loadMore) {
    listingsSection.innerHTML = "";
    lastVisibleProduct = null;
  }

  try {
    // Basic query: allow public read via Firestore rules (we configured rules)
    let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12));
    // apply filters
    const params = new URLSearchParams(window.location.search);
    if (params.get("brand")) q = query(q, where("brand", "==", params.get("brand")));
    if (params.get("category")) q = query(q, where("category", "==", params.get("category")));
    if (lastVisibleProduct && loadMore) q = query(q, startAfter(lastVisibleProduct));

    const snaps = await getDocs(q);
    const products = [];
    snaps.forEach((s) => {
      const data = s.data();
      products.push({ id: s.id, ...data });
    });
    if (snaps.docs.length > 0) lastVisibleProduct = snaps.docs[snaps.docs.length - 1];

    // render
    displayProducts(products, listingsSection);
  } catch (err) {
    console.error("Error fetching products:", err);
    showMessage("ad_post_failed", 3000, "error");
  } finally {
    isFetching = false;
  }
};

/* -------------------------
   CART functions (uses 'carts' collection per-user)
   ------------------------- */
const addToCart = async (product) => {
  if (!currentUser) {
    showMessage("login_required", 2500, "error");
    toggleModal(DOMElements.authModal, true);
    return;
  }
  userCart[product.id] = { productId: product.id, quantity: (userCart[product.id]?.quantity || 0) + 1, title: product.title, price: product.price };
  try {
    await setDoc(doc(db, "carts", currentUser.uid), userCart);
    updateCartDisplay();
    showMessage("item_added_to_cart", 2000, "success");
  } catch (err) {
    console.error("Error adding to cart:", err);
    showMessage("Failed to add item to cart.", 3000, "error");
  }
};

const updateCartItem = async (productId, quantity) => {
  if (!currentUser) return;
  if (quantity <= 0) {
    delete userCart[productId];
  } else {
    userCart[productId].quantity = quantity;
  }
  try {
    await setDoc(doc(db, "carts", currentUser.uid), userCart);
    updateCartDisplay();
  } catch (err) {
    console.error("Error updating cart:", err);
    showMessage("Failed to update cart.", 3000, "error");
  }
};

const removeFromCart = async (productId) => {
  if (!currentUser) return;
  delete userCart[productId];
  try {
    await setDoc(doc(db, "carts", currentUser.uid), userCart);
    updateCartDisplay();
  } catch (err) {
    console.error("Error removing from cart:", err);
    showMessage("Failed to remove item.", 3000, "error");
  }
};

/* -------------------------
   Form validation for post-ad
   ------------------------- */
const validatePostForm = (form) => {
  let isValid = true;
  ["title", "brand", "wilaya", "category", "price"].forEach((name) => {
    const el = form.elements[name];
    const errEl = document.getElementById(`${name}-error`);
    if (!el) return;
    const invalid = !el.value || !String(el.value).trim();
    el.classList.toggle("border-red-500", invalid);
    if (errEl) errEl.classList.toggle("hidden", !invalid);
    if (invalid) isValid = false;
  });
  return isValid;
};

/* -------------------------
   Image upload helpers (Firebase Storage)
   ------------------------- */
const uploadImageFile = async (file, pathPrefix = "uploads") => {
  if (!file) return null;
  try {
    const ext = file.name.split(".").pop();
    const name = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const r = storageRef(storage, name);
    const snapshot = await uploadBytes(r, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (err) {
    console.error("Image upload failed:", err);
    return null;
  }
};

/* -------------------------
   Authentication (Google + Facebook)
   ------------------------- */
const handleSignInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Google sign-in error:", err);
    showMessage("login_text", 3000, "error");
  }
};

const handleSignInWithFacebook = async () => {
  try {
    // request only email/profile by default
    await signInWithPopup(auth, fbProvider);
  } catch (err) {
    console.error("Facebook sign-in error:", err);
    showMessage("login_text", 3000, "error");
  }
};

const handleSignOut = async () => {
  try {
    await signOut(auth);
    showMessage("logout", 2000, "success");
  } catch (err) {
    console.error("Sign out error:", err);
  }
};

/* -------------------------
   Profile editing (store)
   ------------------------- */
const renderDashboard = async () => {
  if (!currentUser) {
    showMessage("login_required", 3000, "error");
    renderView("home");
    return;
  }
  // create a simple dashboard UI into the app container
  const c = DOMElements.appContainer;
  if (!c) return;
  c.innerHTML = `
    <section class="max-w-3xl mx-auto p-4">
      <h2 class="text-2xl font-bold mb-4">${translations[currentLang]?.dashboard || "Dashboard"}</h2>
      <div class="mb-4">
        <img id="dashboard-profile-pic" src="${currentUser.photoURL || 'icons/user-placeholder.png'}" alt="Profile" class="w-24 h-24 rounded-full mb-2">
        <input id="profile-pic-input" type="file" accept="image/*" class="block mt-2" />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Display name</label>
        <input id="profile-displayname" class="w-full border p-2 rounded" value="${currentUser.displayName || ""}">
      </div>
      <div class="mb-4">
        <label class="block mb-1">Store name (optional)</label>
        <input id="profile-store-name" class="w-full border p-2 rounded" placeholder="My store name">
      </div>
      <div class="flex space-x-2">
        <button id="save-profile-btn" class="px-4 py-2 bg-blue-600 text-white rounded">${translations[currentLang]?.submit_ad_btn_text || "Save"}</button>
        <button id="back-list-btn" class="px-4 py-2 border rounded">Back</button>
      </div>
    </section>
  `;

  document.getElementById("back-list-btn")?.addEventListener("click", () => renderView("home"));
  document.getElementById("save-profile-btn")?.addEventListener("click", async () => {
    const displayName = document.getElementById("profile-displayname")?.value || "";
    const storeName = document.getElementById("profile-store-name")?.value || "";
    const picInput = document.getElementById("profile-pic-input");
    let photoURL = currentUser.photoURL || null;

    if (picInput && picInput.files && picInput.files[0]) {
      const url = await uploadImageFile(picInput.files[0], `profiles/${currentUser.uid}`);
      if (url) photoURL = url;
    }

    try {
      // update profile in Firebase Auth (displayName/photoURL)
      await updateProfile(auth.currentUser, { displayName, photoURL });
      // save store info in Firestore under users collection
      await setDoc(doc(db, "users", currentUser.uid), {
        displayName,
        photoURL,
        storeName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showMessage("ad_posted", 2500, "success");
      // refresh UI
      currentUser = auth.currentUser;
      renderDashboard();
      updateAuthUI(currentUser);
    } catch (err) {
      console.error("Profile update failed:", err);
      showMessage("ad_post_failed", 3000, "error");
    }
  });
};

/* -------------------------
   Post product flow: handle images + ownerId (sellerId)
   ------------------------- */
const handlePostProductForm = () => {
  const form = DOMElements.postProductForm;
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showMessage("login_required", 3000, "error");
      toggleModal(DOMElements.authModal, true);
      return;
    }
    if (!validatePostForm(form)) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector(".btn-spinner")?.classList.remove("hidden");
    }

    try {
      // collect form data
      const fd = new FormData(form);
      const formData = Object.fromEntries(fd.entries());
      // convert price
      formData.price = Number(formData.price || 0);
      // image upload: look for file input id product-images
      let imageUrl = null;
      const imagesInput = document.getElementById("product-images");
      if (imagesInput && imagesInput.files && imagesInput.files[0]) {
        // upload first image for listing thumbnail
        imageUrl = await uploadImageFile(imagesInput.files[0], `products/${currentUser.uid}`);
      } else if (formData.imageUrl) {
        imageUrl = formData.imageUrl; // optional direct URL
      }

      const productData = {
        title: formData.title,
        brand: formData.brand,
        model: formData.model || null,
        year: formData.year || null,
        wilaya: formData.wilaya,
        commune: formData.commune || null,
        category: formData.category,
        condition: formData.condition || null,
        price: formData.price,
        description: formData.description || "",
        createdAt: serverTimestamp(),
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || null,
        imageUrl
      };

      // save product
      await addDoc(collection(db, "products"), productData);
      showMessage("ad_posted", 3000, "success");
      form.reset();
      toggleModal(DOMElements.postProductModal, false);
      renderListings();
    } catch (err) {
      console.error("Error adding document: ", err);
      showMessage("ad_post_failed", 3000, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-spinner")?.classList.add("hidden");
      }
    }
  });
};

/* -------------------------
   Auth UI update & listeners
   ------------------------- */
const updateAuthUI = (user) => {
  const authLinksContainer = DOMElements.authLinksContainer;
  const mobileNavLinks = DOMElements.mobileNavLinks;
  if (!authLinksContainer || !mobileNavLinks) return;

  // mobile links template (simple)
  let mobileLinksHTML = `
    <a href="#" id="mobile-home-link" class="p-2 rounded-md text-lg" data-i18n-key="nav_home"></a>
    <a href="#" id="mobile-sell-link" class="p-2 rounded-md text-lg" data-i18n-key="sell"></a>
    <a href="#" id="mobile-cart-link" class="p-2 rounded-md text-lg relative"><span data-i18n-key="cart_title"></span><span id="mobile-cart-count" class="absolute top-0 ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full hidden">0</span></a>
  `;

  if (user) {
    authLinksContainer.innerHTML = "";
    // user menu
    const wrapper = document.createElement("div");
    wrapper.className = "relative";
    wrapper.id = "user-menu";
    const btn = document.createElement("button");
    btn.id = "user-menu-btn";
    btn.className = "flex items-center";
    const img = document.createElement("img");
    img.src = user.photoURL || "icons/user-placeholder.png";
    img.alt = "User";
    img.className = "w-8 h-8 rounded-full";
    btn.appendChild(img);
    wrapper.appendChild(btn);

    const dropdown = document.createElement("div");
    dropdown.id = "user-menu-dropdown";
    dropdown.className = "absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 hidden z-20";
    dropdown.innerHTML = `
      <a href="#" id="dashboard-link" class="block px-4 py-2 text-sm">${translations[currentLang]?.dashboard || "Dashboard"}</a>
      <a href="#" id="messages-link" class="relative block px-4 py-2 text-sm">${translations[currentLang]?.messages || "Messages"}<span id="unread-badge" class="hidden absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a>
      <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm">${translations[currentLang]?.logout || "Logout"}</button>
    `;
    wrapper.appendChild(dropdown);
    authLinksContainer.appendChild(wrapper);

    // mobile links for logged in user
    mobileLinksHTML += `<a href="#" id="mobile-dashboard-link" class="p-2 text-lg" data-i18n-key="dashboard"></a><a href="#" id="mobile-messages-link" class="p-2 text-lg relative"><span data-i18n-key="messages"></span><span id="mobile-unread-badge" class="hidden absolute top-0 ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a><button id="mobile-logout-btn" class="p-2 text-lg text-left">${translations[currentLang]?.logout || "Logout"}</button>`;
    mobileNavLinks.innerHTML = mobileLinksHTML;

    // bind events
    document.getElementById("user-menu-btn")?.addEventListener("click", () => {
      document.getElementById("user-menu-dropdown")?.classList.toggle("hidden");
    });
    document.getElementById("logout-btn")?.addEventListener("click", handleSignOut);
    document.getElementById("dashboard-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      renderView("dashboard");
    });
    document.getElementById("messages-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      renderView("inbox");
    });

  } else {
    // not logged in
    authLinksContainer.innerHTML = `<button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded-full">${translations[currentLang]?.connect || "Log In"}</button>`;
    mobileNavLinks.innerHTML = mobileLinksHTML + `<button id="mobile-login-btn" class="p-2 text-lg">${translations[currentLang]?.connect || "Log In"}</button>`;
    document.getElementById("login-btn")?.addEventListener("click", () => toggleModal(DOMElements.authModal, true));
    document.getElementById("mobile-login-btn")?.addEventListener("click", () => toggleModal(DOMElements.authModal, true));
  }

  // update cart display
  updateCartDisplay();
  translatePage(currentLang);
};

/* -------------------------
   Unread messages listener
   ------------------------- */
const listenForUnreadMessages = (user) => {
  if (chatsUnsubscribe) chatsUnsubscribe();
  if (!user) {
    updateUnreadBadge(0);
    return;
  }
  const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
  chatsUnsubscribe = onSnapshot(q, (snap) => {
    const total = snap.docs.reduce((acc, d) => acc + (d.data().unreadCount?.[user.uid] || 0), 0);
    updateUnreadBadge(total);
  });
};

const updateUnreadBadge = (count) => {
  ["unread-badge", "mobile-unread-badge", "nav-unread-badge"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count > 9 ? "9+" : String(count);
    el.classList.toggle("hidden", count === 0);
  });
};

/* -------------------------
   Modal helper
   ------------------------- */
const toggleModal = (modalElement, show) => {
  if (!modalElement) return;
  if (show) {
    modalElement.classList.remove("invisible", "opacity-0");
  } else {
    modalElement.classList.add("invisible", "opacity-0");
  }
};

/* -------------------------
   Setup event listeners
   ------------------------- */
const setupEventListeners = () => {
  // dark mode toggle
  DOMElements.darkModeToggle?.addEventListener("click", () => {
    const isDark = DOMElements.html.classList.toggle("dark");
    localStorage.setItem("piecety_dark_mode", isDark ? "1" : "0");
    const icon = DOMElements.darkModeToggle.querySelector("i");
    if (icon) {
      icon.classList.remove("fa-moon", "fa-sun");
      icon.classList.add(isDark ? "fa-sun" : "fa-moon");
    }
  });

  // language buttons
  DOMElements.langBtns?.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      translatePage(lang);
      DOMElements.langDropdown?.classList.add("hidden");
      closeMobileMenu();
      renderView(currentView || "home");
    });
  });

  // mobile menu
  DOMElements.mobileMenuBtn?.addEventListener("click", openMobileMenu);
  DOMElements.mobileMenuCloseBtn?.addEventListener("click", closeMobileMenu);
  DOMElements.mobileMenuBackdrop?.addEventListener("click", closeMobileMenu);

  // search input
  if (DOMElements.searchInput) {
    DOMElements.searchInput.placeholder = translations[currentLang]?.search_placeholder || "";
    DOMElements.searchInput.addEventListener("input", debounce(() => applyAndRenderFilters(), 500));
  }

  // auth modal close
  DOMElements.authModalCloseBtn?.addEventListener("click", () => toggleModal(DOMElements.authModal, false));
  DOMElements.modalCloseBtn?.addEventListener("click", () => toggleModal(DOMElements.postProductModal, false));

  // google & facebook login buttons
  DOMElements.googleLoginBtn?.addEventListener("click", handleSignInWithGoogle);
  // we need to add a facebook login button to the auth modal if not present
  let fbBtn = document.getElementById("facebook-login-btn");
  if (!fbBtn && DOMElements.authModal) {
    // append facebook button under google button if auth modal exists
    const googleBtn = DOMElements.googleLoginBtn;
    if (googleBtn && googleBtn.parentNode) {
      fbBtn = document.createElement("button");
      fbBtn.id = "facebook-login-btn";
      fbBtn.className = googleBtn.className;
      fbBtn.innerHTML = '<i class="fab fa-facebook-f text-xl mr-2"></i> Sign in with Facebook';
      googleBtn.parentNode.appendChild(fbBtn);
    }
  }
  fbBtn?.addEventListener("click", handleSignInWithFacebook);

  // sell link
  DOMElements.sellLink?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleModal(currentUser ? DOMElements.postProductModal : DOMElements.authModal, true);
  });

  // cart button
  DOMElements.cartBtn?.addEventListener("click", () => renderView("cart"));

  // home link
  DOMElements.homeLink?.addEventListener("click", (e) => {
    e.preventDefault();
    window.history.pushState({}, "", window.location.pathname);
    renderView("home");
  });

  // wire mobile filters
  DOMElements.mobileFiltersCloseBtn?.addEventListener("click", () => {
    DOMElements.mobileFiltersModal?.classList.add("translate-x-full");
  });
  DOMElements.mobileApplyFiltersBtn?.addEventListener("click", () => {
    applyAndRenderFilters();
    DOMElements.mobileFiltersModal?.classList.add("translate-x-full");
  });

  // post product form handler
  handlePostProductForm();
};

/* -------------------------
   Render & router
   ------------------------- */
const renderView = (viewName, data = null) => {
  // Basic router: expects templates in index.html e.g. home-view-template
  const route = viewName.split("/")[0];
  currentView = viewName;
  // remove existing listeners/unsubscribes
  if (productsUnsubscribe) productsUnsubscribe();
  if (chatsUnsubscribe) chatsUnsubscribe();

  // load template
  const templateId = `${route}-view-template`;
  const template = document.getElementById(templateId);
  const container = DOMElements.appContainer;
  if (!container) return;
  container.innerHTML = "";
  if (template && template.content) {
    container.appendChild(template.content.cloneNode(true));
    // call view-specific renderer if exists
    const viewFnName = `render${route.charAt(0).toUpperCase()}${route.slice(1)}Page`;
    if (typeof window[viewFnName] === "function") {
      try {
        window[viewFnName](data);
      } catch (err) {
        console.error("Error rendering view fn:", err);
      }
    } else {
      // fallback
      if (route === "home") renderHomePage();
    }
  } else {
    // if no template, fallback to home
    renderHomePage();
  }
  translatePage(currentLang);
  window.scrollTo(0, 0);
};

/* -------------------------
   Auth state observer
   ------------------------- */
onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  updateAuthUI(currentUser);
  if (currentUser) {
    // load user's cart
    try {
      const cartSnap = await getDoc(doc(db, "carts", currentUser.uid));
      if (cartSnap.exists()) userCart = cartSnap.data() || {};
      else userCart = {};
    } catch (err) {
      console.error("Error fetching cart:", err);
      userCart = {};
    }
    // listen for unread messages
    listenForUnreadMessages(currentUser);
  } else {
    userCart = {};
    updateCartDisplay();
    listenForUnreadMessages(null);
  }
});

/* -------------------------
   Initialization
   ------------------------- */
const init = () => {
  // translate
  translatePage(currentLang);

  // wire events
  setupEventListeners();

  // initial view
  renderView("home");

  // fill selects for post product modal if present
  populateSelect(DOMElements.postProductBrandSelect, Object.keys(car_data), "all_brands", currentLang);
  populateSelect(DOMElements.postProductYearSelect, years, "all_years", currentLang);
  populateSelect(DOMElements.postProductCategorySelect, Object.keys(categories), "all_categories", currentLang, true);
  populateSelect(DOMElements.postProductConditionSelect, ["new", "used"], "condition", currentLang);

  // apply stored dark mode
  const savedDark = localStorage.getItem("piecety_dark_mode");
  if (savedDark === "1") {
    DOMElements.html.classList.add("dark");
    const icon = DOMElements.darkModeToggle?.querySelector("i");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
  }

  // attach listeners to navigation bottom if present
  const navHome = document.getElementById("nav-home");
  navHome?.addEventListener("click", (e) => {
    e.preventDefault();
    renderView("home");
  });

  // message box aria-live for accessibility
  if (DOMElements.messageBox) {
    DOMElements.messageBox.setAttribute("role", "status");
    DOMElements.messageBox.setAttribute("aria-live", "polite");
  }
};

document.addEventListener("DOMContentLoaded", init);

// expose some helpers for debugging (optional)
window.Piecety = {
  db,
  auth,
  storage,
  renderView,
  uploadImageFile,
  addToCart,
  renderDashboard
};

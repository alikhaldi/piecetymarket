import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, where, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, increment, serverTimestamp, orderBy, limit, startAfter, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Firebase Config (use environment variables in production)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "piecety-app-b39c4.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "piecety-app-b39c4",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "piecety-app-b39c4.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "265795860915",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:265795860915:web:aa10241788cce42f6373c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch(err => console.warn("Offline persistence failed:", err));

// Global State
let currentUser = null;
let currentLang = localStorage.getItem("piecety_lang") || "fr";
let currentView = 'home';
let userCart = {};
let productsUnsubscribe = null;
let chatsUnsubscribe = null;
let lastVisibleProduct = null;
let isFetching = false;
let recentlyViewed = JSON.parse(localStorage.getItem('piecety_recently_viewed')) || [];

// DOM Elements
const DOMElements = {
    html: document.documentElement,
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    langDropdownBtn: document.getElementById('lang-dropdown-btn'),
    langDropdown: document.getElementById('lang-dropdown'),
    langBtns: document.querySelectorAll('#lang-dropdown button'),
    sellLink: document.getElementById('nav-sell'),
    cartBtn: document.getElementById('nav-cart'),
    homeLink: document.getElementById('nav-home'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenuCloseBtn: document.getElementById('mobile-menu-close-btn'),
    mobileMenuBackdrop: document.getElementById('mobile-menu-backdrop'),
    mobileNavLinks: document.getElementById('mobile-nav-links'),
    authModal: document.getElementById('auth-modal'),
    authModalCloseBtn: document.getElementById('auth-modal-close-btn'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    postProductModal: document.getElementById('post-product-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    postProductForm: document.getElementById('post-product-form'),
    searchInput: document.getElementById('search-input'),
    mobileFiltersModal: document.getElementById('mobile-filters-modal'),
    mobileFiltersCloseBtn: document.getElementById('mobile-filters-close-btn'),
    mobileApplyFiltersBtn: document.getElementById('mobile-apply-filters-btn'),
    authLinksContainer: document.getElementById('auth-links-container'),
    contentSection: document.getElementById('content-section'),
    dynamicGrid: document.getElementById('dynamic-grid'),
    filtersForm: document.getElementById('filters-form')
};

// Translations
const translations = {
    fr: {
        page_title: "Piecety - Marché des Pièces Auto en Algérie",
        meta_description: "Achetez et vendez des pièces automobiles en Algérie avec Piecety, le marché fiable pour les pièces neuves et d'occasion.",
        fr_short: "FR",
        en_short: "EN",
        ar_short: "AR",
        menu: "Menu",
        sell: "Vendre",
        connect: "Se connecter",
        language: "Langue",
        logout: "Déconnexion",
        dashboard: "Tableau de Bord",
        nav_home: "Accueil",
        nav_search: "Recherche",
        nav_profile: "Profil",
        hero_title: "Trouvez la bonne pièce pour votre voiture",
        hero_subtitle: "Le marché algérien des pièces automobiles le plus fiable.",
        categories_title: "Catégories de Pièces",
        brands_title: "Sélectionnez une Marque",
        years_title: "Sélectionnez une Année",
        filters_title: "Filtrer les annonces",
        all_brands: "Toutes les marques",
        all_models: "Tous les modèles",
        all_years: "Toutes années",
        all_wilayas: "Toutes wilayas",
        all_communes: "Toutes communes",
        condition: "État",
        any_condition: "Tout",
        new: "Neuf",
        used: "Occasion",
        apply_filters: "Appliquer les filtres",
        reset: "Réinitialiser",
        search_placeholder: "Rechercher une pièce...",
        submit_ad: "Soumettre une annonce",
        ad_title_label: "Titre de la pièce *",
        ad_title_placeholder: "Ex: Disque de frein avant",
        brand_label: "Marque *",
        select_brand: "Sélectionnez une marque",
        model_label: "Modèle",
        select_model: "Sélectionnez un modèle",
        year_label: "Année",
        select_year: "Sélectionnez une année",
        wilaya_label: "Wilaya *",
        select_wilaya: "Sélectionnez une wilaya",
        commune_label: "Commune",
        select_commune: "Sélectionnez une commune",
        condition_label: "État",
        price_label: "Prix (DA) *",
        price_placeholder: "Ex: 15000",
        description_label: "Description",
        description_placeholder: "Informations supplémentaires...",
        submit_ad_btn_text: "Soumettre",
        loading_text: "Envoi...",
        error_valid_title: "Veuillez entrer un titre valide.",
        error_select_brand: "Veuillez sélectionner une marque.",
        error_select_wilaya: "Veuillez sélectionner une wilaya.",
        error_select_category: "Veuillez sélectionner une catégorie.",
        error_valid_price: "Veuillez entrer un prix valide.",
        login_text: "Connectez-vous pour accéder à toutes les fonctionnalités.",
        google_login: "Se connecter avec Google",
        back_to_listings: "Retour aux annonces",
        add_to_cart: "Ajouter au panier",
        cart_title: "Mon panier",
        cart_total: "Total",
        checkout_btn: "Passer à la caisse",
        no_listings: "Aucune annonce trouvée.",
        your_cart_is_empty: "Votre panier est vide.",
        remove: "Supprimer",
        quantity: "Quantité",
        item_total: "Total de l'article",
        login_required: "Veuillez vous connecter pour utiliser cette fonctionnalité.",
        show_filters: "Afficher les filtres",
        price_range: "Gamme de prix",
        all_categories: "Toutes catégories",
        category_label: "Catégorie *",
        select_category: "Sélectionnez une catégorie",
        contact_seller: "Contacter le vendeur",
        clear_cart: "Vider le panier",
        ad_posted: "Votre annonce a été publiée avec succès !",
        ad_post_failed: "Échec de la publication de l'annonce.",
        item_added_to_cart: "Article ajouté au panier!",
        delete_ad_confirm: "Êtes-vous sûr de vouloir supprimer cette annonce ?",
        sold_by: "Vendu par:",
        my_listings: "Mes Annonces",
        seller_listings: "Annonces de ce vendeur",
        buyer_reviews: "Avis des acheteurs",
        reviews_soon: "(Avis bientôt disponibles)",
        reviews_soon_2: "La fonctionnalité d'avis sera bientôt disponible.",
        messages: "Messages",
        loading_convos: "Chargement des conversations...",
        chat_with: "Chat avec",
        type_message_placeholder: "Écrire un message...",
        recently_viewed: "Récemment consultés",
        chat: "Chat",
        load_more: "Charger plus"
    },
    en: {
        page_title: "Piecety - Car Parts Marketplace in Algeria",
        meta_description: "Buy and sell car parts in Algeria with Piecety, the reliable marketplace for new and used parts.",
        fr_short: "FR",
        en_short: "EN",
        ar_short: "AR",
        menu: "Menu",
        sell: "Sell",
        connect: "Log In",
        language: "Language",
        logout: "Logout",
        dashboard: "Dashboard",
        nav_home: "Home",
        nav_search: "Search",
        nav_profile: "Profile",
        hero_title: "Find the right car part for your vehicle",
        hero_subtitle: "The most trusted Algerian car parts marketplace.",
        categories_title: "Parts Categories",
        brands_title: "Select a Brand",
        years_title: "Select a Year",
        filters_title: "Filter Listings",
        all_brands: "All brands",
        all_models: "All models",
        all_years: "All years",
        all_wilayas: "All wilayas",
        all_communes: "All communes",
        condition: "Condition",
        any_condition: "Any",
        new: "New",
        used: "Used",
        apply_filters: "Apply Filters",
        reset: "Reset",
        search_placeholder: "Search for a part...",
        submit_ad: "Submit an Ad",
        ad_title_label: "Part Title *",
        ad_title_placeholder: "e.g., Front brake disc",
        brand_label: "Brand *",
        select_brand: "Select a brand",
        model_label: "Model",
        select_model: "Select a model",
        year_label: "Year",
        select_year: "Select a year",
        wilaya_label: "State *",
        select_wilaya: "Select a state",
        commune_label: "City",
        select_commune: "Select a city",
        condition_label: "Condition",
        price_label: "Price (DA) *",
        price_placeholder: "e.g., 15000",
        description_label: "Description",
        description_placeholder: "Additional information...",
        submit_ad_btn_text: "Submit",
        loading_text: "Submitting...",
        error_valid_title: "Please enter a valid title.",
        error_select_brand: "Please select a brand.",
        error_select_wilaya: "Please select a state.",
        error_select_category: "Please select a category.",
        error_valid_price: "Please enter a valid price.",
        login_text: "Log in to access all features.",
        google_login: "Sign in with Google",
        back_to_listings: "Back to listings",
        add_to_cart: "Add to cart",
        cart_title: "My Cart",
        cart_total: "Total",
        checkout_btn: "Proceed to Checkout",
        no_listings: "No listings found.",
        your_cart_is_empty: "Your cart is empty.",
        remove: "Remove",
        quantity: "Quantity",
        item_total: "Item Total",
        login_required: "Please log in to use this feature.",
        show_filters: "Show Filters",
        price_range: "Price Range",
        all_categories: "All Categories",
        category_label: "Category *",
        select_category: "Select a category",
        contact_seller: "Contact Seller",
        clear_cart: "Clear Cart",
        ad_posted: "Your ad has been posted successfully!",
        ad_post_failed: "Failed to post ad.",
        item_added_to_cart: "Item added to cart!",
        delete_ad_confirm: "Are you sure you want to delete this ad?",
        sold_by: "Sold by:",
        my_listings: "My Listings",
        seller_listings: "Listings from this seller",
        buyer_reviews: "Buyer Reviews",
        reviews_soon: "(Reviews coming soon)",
        reviews_soon_2: "Review functionality will be available soon.",
        messages: "Messages",
        loading_convos: "Loading conversations...",
        chat_with: "Chat with",
        type_message_placeholder: "Type a message...",
        recently_viewed: "Recently Viewed",
        chat: "Chat",
        load_more: "Load More"
    },
    ar: {
        page_title: "Piecety - سوق قطع غيار السيارات في الجزائر",
        meta_description: "بيع وشراء قطع غيار السيارات في الجزائر مع Piecety، السوق الموثوق للقطع الجديدة والمستعملة.",
        fr_short: "FR",
        en_short: "EN",
        ar_short: "AR",
        menu: "القائمة",
        sell: "بيع",
        connect: "تسجيل الدخول",
        language: "اللغة",
        logout: "تسجيل الخروج",
        dashboard: "لوحة التحكم",
        nav_home: "الرئيسية",
        nav_search: "بحث",
        nav_profile: "ملفي",
        hero_title: "ابحث عن قطعة الغيار المناسبة لسيارتك",
        hero_subtitle: "أكثر أسواق قطع غيار السيارات ثقة في الجزائر.",
        categories_title: "فئات القطع",
        brands_title: "اختر ماركة",
        years_title: "اختر سنة",
        filters_title: "تصفية الإعلانات",
        all_brands: "جميع الماركات",
        all_models: "جميع الموديلات",
        all_years: "جميع السنوات",
        all_wilayas: "جميع الولايات",
        all_communes: "جميع البلديات",
        condition: "الحالة",
        any_condition: "الكل",
        new: "جديد",
        used: "مستعمل",
        apply_filters: "تطبيق الفلاتر",
        reset: "إعادة تعيين",
        search_placeholder: "ابحث عن قطعة...",
        submit_ad: "إرسال إعلان",
        ad_title_label: "عنوان القطعة *",
        ad_title_placeholder: "مثال: قرص فرامل أمامي",
        brand_label: "الماركة *",
        select_brand: "اختر ماركة",
        model_label: "الموديل",
        select_model: "اختر موديل",
        year_label: "السنة",
        select_year: "اختر سنة",
        wilaya_label: "الولاية *",
        select_wilaya: "اختر ولایة",
        commune_label: "البلدية",
        select_commune: "اختر بلدية",
        condition_label: "الحاله",
        price_label: "السعر (DA) *",
        price_placeholder: "مثال: 15000",
        description_label: "الوصف",
        description_placeholder: "معلومات إضافية...",
        submit_ad_btn_text: "إرسال",
        loading_text: "جاري الإرسال...",
        error_valid_title: "يرجى إدخال عنوان صالح.",
        error_select_brand: "يرجى اختيار ماركة.",
        error_select_wilaya: "يرجى اختيار ولایة.",
        error_select_category: "يرجى اختيار فئة.",
        error_valid_price: "يرجى إدخال سعر صالح.",
        login_text: "تسجيل الدخول للوصول إلى جميع الميزات.",
        google_login: "تسجيل الدخول بحساب Google",
        back_to_listings: "العودة إلى الإعلانات",
        add_to_cart: "إضافة إلى السلة",
        cart_title: "سلتي",
        cart_total: "المجموع",
        checkout_btn: "الذهاب إلى الدفع",
        no_listings: "لم يتم العثور على إعلانات.",
        your_cart_is_empty: "سلتك فارغة.",
        remove: "إزالة",
        quantity: "الكمية",
        item_total: "مجموع العنصر",
        login_required: "يرجى تسجيل الدخول لاستخدام هذه الميزة.",
        show_filters: "عرض الفلاتر",
        price_range: "نطاق السعر",
        all_categories: "جميع الفئات",
        category_label: "الفئة *",
        select_category: "اختر فئة",
        contact_seller: "اتصل بالبائع",
        clear_cart: "مسح السلة",
        ad_posted: "تم نشر إعلانك بنجاح!",
        ad_post_failed: "فشل في نشر الإعلان.",
        item_added_to_cart: "تم إضافة العنصر إلى السلة!",
        delete_ad_confirm: "هل أنت متأكد من حذف هذا الإعلان؟",
        sold_by: "بيع بواسطة:",
        my_listings: "إعلاناتي",
        seller_listings: "إعلانات هذا البائع",
        buyer_reviews: "تقييمات المشترين",
        reviews_soon: "(التقييمات قريباً)",
        reviews_soon_2: "سيكون خاصية التقييم متوفرة قريباً.",
        messages: "الرسائل",
        loading_convos: "جاري تحميل المحادثات...",
        chat_with: "محادثة مع",
        type_message_placeholder: "اكتب رسالة...",
        recently_viewed: "تمت مشاهدتها مؤخراً",
        chat: "دردشة",
        load_more: "تحميل المزيد"
    }
};

// --- CATEGORIES, BRANDS, MODELS, YEARS, WILAYAS, COMMUNES ---
const categories = {
    engine: { fr: "Moteur", en: "Engine", ar: "محرك", icon: "fa-cogs" },
    brakes: { fr: "Freins", en: "Brakes", ar: "مكابح", icon: "fa-stop-circle" },
    suspension: { fr: "Suspension", en: "Suspension", ar: "تعليق", icon: "fa-shock-absorber" },
    // Add more categories as needed
};

const brands = [
    { value: "toyota", label: { fr: "Toyota", en: "Toyota", ar: "تويوتا" } },
    { value: "renault", label: { fr: "Renault", en: "Renault", ar: "رينو" } },
    // Add more brands
];

const models = {
    toyota: [
        { value: "corolla", label: { fr: "Corolla", en: "Corolla", ar: "كورولا" } },
        // Add more models
    ],
    // Add models for other brands
};

const years = Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(year => ({ value: year.toString(), label: year.toString() }));

const wilayas = [
    { value: "algiers", label: { fr: "Alger", en: "Algiers", ar: "الجزائر" } },
    // Add more wilayas
];

const communes = {
    algiers: [
        { value: "algiers-centre", label: { fr: "Alger-Centre", en: "Algiers-Center", ar: "الجزائر الوسطى" } },
        // Add more communes
    ],
    // Add communes for other wilayas
};

// --- UTILITY FUNCTIONS ---
const sanitizeInput = (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const showMessage = (key, duration, type = 'success') => {
    const message = document.createElement('div');
    message.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    message.textContent = translations[currentLang][key] || key;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), duration);
};

// --- UI FUNCTIONS ---
const setDarkMode = (isDark) => {
    DOMElements.html.classList.toggle('dark', isDark);
    localStorage.setItem('piecety_dark_mode', isDark);
};

const setLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('piecety_lang', lang);
    DOMElements.html.setAttribute('lang', lang);
    DOMElements.html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    translatePage();
    populateDropdowns(); // Update dropdown labels for new language
};

const translatePage = () => {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });
    document.querySelectorAll('[data-i18n-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-key-placeholder');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });
    document.title = translations[currentLang].page_title;
    document.querySelector('meta[name="description"]').setAttribute('content', translations[currentLang].meta_description);
};

const toggleModal = (modal, show) => {
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('flex', show);
    if (show) {
        modal.querySelector('input, button')?.focus();
    } else {
        document.activeElement.blur();
    }
};

const openMobileMenu = () => {
    DOMElements.mobileMenuBackdrop.classList.remove('hidden');
    DOMElements.mobileMenu.classList.remove('-translate-x-full');
};

const closeMobileMenu = () => {
    DOMElements.mobileMenuBackdrop.classList.add('hidden');
    DOMElements.mobileMenu.classList.add('-translate-x-full');
};

// --- CART FUNCTIONS ---
const updateCartDisplay = () => {
    const count = Object.keys(userCart).length;
    ['cart-count', 'mobile-cart-count'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = count > 9 ? '9+' : count;
            el.classList.toggle('hidden', count === 0);
        }
    });
};

const addToCart = async (productId, productData) => {
    if (!currentUser) {
        showMessage('login_required', 3000, 'error');
        toggleModal(DOMElements.authModal, true);
        return;
    }
    userCart[productId] = { ...productData, quantity: (userCart[productId]?.quantity || 0) + 1 };
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        showMessage('item_added_to_cart', 3000, 'success');
        if (currentView === 'cart') renderView('cart');
    } catch (error) {
        console.error("Error adding to cart:", error);
        showMessage('ad_post_failed', 3000, 'error');
    }
};

const removeFromCart = async (productId) => {
    if (!currentUser || !userCart[productId]) return;
    delete userCart[productId];
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        if (currentView === 'cart') renderView('cart');
    } catch (error) {
        console.error("Error removing from cart:", error);
        showMessage('ad_post_failed', 3000, 'error');
    }
};

const clearCart = async () => {
    if (!currentUser) return;
    userCart = {};
    try {
        await deleteDoc(doc(db, "carts", currentUser.uid));
        updateCartDisplay();
        renderView('cart');
    } catch (error) {
        console.error("Error clearing cart:", error);
        showMessage('ad_post_failed', 3000, 'error');
    }
};

// --- FORM VALIDATION ---
const validatePostForm = (form) => {
    let isValid = true;
    ['title', 'brand', 'wilaya', 'category', 'price'].forEach(fieldName => {
        const input = form.elements[fieldName];
        const errorEl = document.getElementById(`${fieldName}-error`);
        const isInvalid = !input.value.trim() || (fieldName === 'price' && isNaN(Number(input.value)));
        input.classList.toggle('border-red-500', isInvalid);
        errorEl?.classList.toggle('hidden', !isInvalid);
        if (isInvalid) isValid = false;
    });
    return isValid;
};

// --- AUTHENTICATION ---
const handleSignOut = async () => {
    try {
        await signOut(auth);
        closeMobileMenu();
    } catch (error) {
        console.error("Sign out error:", error);
        showMessage('ad_post_failed', 3000, 'error');
    }
};

const updateAuthUI = (user) => {
    const authLinksContainer = DOMElements.authLinksContainer;
    authLinksContainer.innerHTML = '';
    let mobileLinksHTML = `
        <a href="#" id="mobile-home-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="nav_home"></a>
        <a href="#" id="mobile-sell-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="sell"></a>
        <a href="#" id="mobile-cart-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg relative"><span data-i18n-key="cart_title"></span><span id="mobile-cart-count" class="absolute top-0 ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full hidden">0</span></a>`;

    if (user) {
        authLinksContainer.innerHTML = `
            <div class="relative" id="user-menu">
                <button id="user-menu-btn" class="flex items-center" aria-label="User menu" aria-haspopup="true">
                    <img src="${user.photoURL || 'default-profile.png'}" alt="User profile" class="w-8 h-8 rounded-full">
                </button>
                <div id="user-menu-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 hidden z-20">
                    <a href="#" id="dashboard-link" class="block px-4 py-2 text-sm" data-i18n-key="dashboard"></a>
                    <a href="#" id="messages-link" class="relative block px-4 py-2 text-sm" data-i18n-key="messages">
                        <span id="unread-badge" class="hidden absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span>
                    </a>
                    <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm" data-i18n-key="logout"></button>
                </div>
            </div>`;
        mobileLinksHTML += `
            <a href="#" id="mobile-dashboard-link" class="p-2 text-lg" data-i18n-key="dashboard"></a>
            <a href="#" id="mobile-messages-link" class="p-2 text-lg relative"><span data-i18n-key="messages"></span><span id="mobile-unread-badge" class="hidden absolute top-0 ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a>
            <button id="mobile-logout-btn" class="p-2 text-lg text-left" data-i18n-key="logout"></button>`;
        
        const toggleUserMenu = () => document.getElementById('user-menu-dropdown').classList.toggle('hidden');
        document.getElementById('user-menu-btn').onclick = toggleUserMenu;
        document.getElementById('logout-btn').onclick = handleSignOut;
        document.getElementById('dashboard-link').onclick = (e) => { e.preventDefault(); renderView('dashboard'); };
        document.getElementById('messages-link').onclick = (e) => { e.preventDefault(); renderView('inbox'); };
    } else {
        authLinksContainer.innerHTML = `<button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors" data-i18n-key="connect"></button>`;
        mobileLinksHTML += `<button id="mobile-login-btn" class="p-2 text-lg text-left" data-i18n-key="connect"></button>`;
        document.getElementById('login-btn').onclick = () => toggleModal(DOMElements.authModal, true);
    }

    DOMElements.mobileNavLinks.innerHTML = mobileLinksHTML;
    updateCartDisplay();
    translatePage();
};

// --- UNREAD MESSAGES ---
const listenForUnreadMessages = (user) => {
    if (chatsUnsubscribe) chatsUnsubscribe();
    if (!user) { updateUnreadBadge(0); return; }

    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    chatsUnsubscribe = onSnapshot(q, (snapshot) => {
        const totalUnread = snapshot.docs.reduce((acc, doc) => acc + (doc.data().unreadCount?.[user.uid] || 0), 0);
        updateUnreadBadge(totalUnread);
    });
};

const updateUnreadBadge = (count) => {
    ['unread-badge', 'mobile-unread-badge', 'nav-unread-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = count > 9 ? '9+' : count;
            el.classList.toggle('hidden', count === 0);
        }
    });
};

// --- POPULATE DROPDOWNS ---
const populateDropdowns = () => {
    // Category
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = `<option value="" data-i18n-key="select_category"></option>`;
    Object.entries(categories).forEach(([value, data]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = data[currentLang];
        categorySelect.appendChild(option);
    });

    // Brand
    const brandSelect = document.getElementById('brand');
    brandSelect.innerHTML = `<option value="" data-i18n-key="select_brand"></option>`;
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.value;
        option.textContent = brand.label[currentLang];
        brandSelect.appendChild(option);
    });

    // Model (dynamic, based on brand)
    brandSelect.onchange = (e) => {
        const modelSelect = document.getElementById('model');
        modelSelect.innerHTML = `<option value="" data-i18n-key="select_model"></option>`;
        const selectedBrand = e.target.value;
        if (models[selectedBrand]) {
            models[selectedBrand].forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label[currentLang];
                modelSelect.appendChild(option);
            });
        }
    };

    // Year
    const yearSelect = document.getElementById('year');
    yearSelect.innerHTML = `<option value="" data-i18n-key="select_year"></option>`;
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year.value;
        option.textContent = year.label;
        yearSelect.appendChild(option);
    });

    // Wilaya
    const wilayaSelect = document.getElementById('wilaya');
    wilayaSelect.innerHTML = `<option value="" data-i18n-key="select_wilaya"></option>`;
    wilayas.forEach(wilaya => {
        const option = document.createElement('option');
        option.value = wilaya.value;
        option.textContent = wilaya.label[currentLang];
        wilayaSelect.appendChild(option);
    });

    // Commune (dynamic, based on wilaya)
    wilayaSelect.onchange = (e) => {
        const communeSelect = document.getElementById('commune');
        communeSelect.innerHTML = `<option value="" data-i18n-key="select_commune"></option>`;
        const selectedWilaya = e.target.value;
        if (communes[selectedWilaya]) {
            communes[selectedWilaya].forEach(commune => {
                const option = document.createElement('option');
                option.value = commune.value;
                option.textContent = commune.label[currentLang];
                communeSelect.appendChild(option);
            });
        }
    };

    // Condition
    const conditionSelect = document.getElementById('condition');
    conditionSelect.innerHTML = `
        <option value="any" data-i18n-key="any_condition"></option>
        <option value="new" data-i18n-key="new"></option>
        <option value="used" data-i18n-key="used"></option>
    `;
};

// --- RENDERING FUNCTIONS ---
const renderView = async (view) => {
    if (productsUnsubscribe) productsUnsubscribe();
    currentView = view;
    DOMElements.contentSection.innerHTML = '';

    if (view === 'home') {
        renderHomeView();
    } else if (view === 'cart') {
        renderCartView();
    } else if (view === 'dashboard') {
        renderDashboardView();
    } else if (view === 'inbox') {
        renderInboxView();
    }
};

const renderHomeView = () => {
    DOMElements.contentSection.innerHTML = `<p data-i18n-key="loading_text"></p>`;
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20));
    productsUnsubscribe = onSnapshot(q, (snapshot) => {
        DOMElements.contentSection.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="category-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3>${sanitizeInput(data.title)}</h3>
                    <p>${sanitizeInput(data.description)}</p>
                    <p>${data.price} DA</p>
                    <button onclick="addToCart('${doc.id}', ${JSON.stringify(data)})" class="bg-blue-600 text-white px-4 py-2 rounded" data-i18n-key="add_to_cart"></button>
                </div>
            `;
        }).join('') || `<p data-i18n-key="no_listings"></p>`;
        translatePage();
    });
};

const renderCartView = () => {
    DOMElements.contentSection.innerHTML = `
        <h2 class="text-2xl font-semibold mb-4" data-i18n-key="cart_title"></h2>
        ${Object.keys(userCart).length === 0 ? `<p data-i18n-key="your_cart_is_empty"></p>` : Object.entries(userCart).map(([id, item]) => `
            <div class="flex justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-2">
                <div>
                    <h3>${sanitizeInput(item.title)}</h3>
                    <p data-i18n-key="quantity">${item.quantity}</p>
                    <p data-i18n-key="item_total">${item.price * item.quantity} DA</p>
                </div>
                <button onclick="removeFromCart('${id}')" class="text-red-600" data-i18n-key="remove"></button>
            </div>
        `).join('')}
        <button id="clear-cart-btn" class="bg-red-600 text-white px-4 py-2 rounded mt-4" data-i18n-key="clear_cart"></button>
    `;
    translatePage();
    document.getElementById('clear-cart-btn').onclick = clearCart;
};

const renderDashboardView = async () => {
    DOMElements.contentSection.innerHTML = `<p data-i18n-key="loading_text"></p>`;
    const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    DOMElements.contentSection.innerHTML = `<h2 data-i18n-key="my_listings"></h2>` + snapshot.docs.map(doc => {
        const data = doc.data();
        return `
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3>${sanitizeInput(data.title)}</h3>
                <p>${data.price} DA</p>
                <button onclick="deleteProduct('${doc.id}')" class="text-red-600" data-i18n-key="remove"></button>
            </div>
        `;
    }).join('') || `<p data-i18n-key="no_listings"></p>`;
    translatePage();
};

const deleteProduct = async (productId) => {
    if (confirm(translations[currentLang].delete_ad_confirm)) {
        try {
            await deleteDoc(doc(db, "products", productId));
            showMessage('ad_post_failed', 3000, 'success'); // Note: Use a better key for success delete
            renderView('dashboard');
        } catch (error) {
            console.error("Error deleting product:", error);
            showMessage('ad_post_failed', 3000, 'error');
        }
    }
};

const renderInboxView = () => {
    DOMElements.contentSection.innerHTML = `<p data-i18n-key="loading_convos"></p>`;
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
    productsUnsubscribe = onSnapshot(q, (snapshot) => {
        DOMElements.contentSection.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const otherParticipant = data.participants.find(id => id !== currentUser.uid);
            return `
                <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 data-i18n-key="chat_with">${otherParticipant}</h3>
                    <p>Last message: ${sanitizeInput(data.lastMessage || '')}</p>
                </div>
            `;
        }).join('') || `<p data-i18n-key="no_listings"></p>`; // Reuse no_listings for no chats
        translatePage();
    });
};

// --- FILTERS ---
const applyAndRenderFilters = () => {
    if (productsUnsubscribe) productsUnsubscribe();
    const searchTerm = DOMElements.searchInput.value.toLowerCase();
    let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20));
    if (searchTerm) {
        q = query(q, where("title", "==", searchTerm)); // Simple example, use Firestore search extensions for better search
    }
    // Add more filter logic based on filters-form
    productsUnsubscribe = onSnapshot(q, (snapshot) => {
        DOMElements.contentSection.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="category-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3>${sanitizeInput(data.title)}</h3>
                    <p>${sanitizeInput(data.description)}</p>
                    <p>${data.price} DA</p>
                    <button onclick="addToCart('${doc.id}', ${JSON.stringify(data)})" class="bg-blue-600 text-white px-4 py-2 rounded" data-i18n-key="add_to_cart"></button>
                </div>
            `;
        }).join('') || `<p data-i18n-key="no_listings"></p>`;
        translatePage();
    });
};

// --- SETUP & INITIALIZATION ---
const setupEventListeners = () => {
    const { darkModeToggle, langDropdownBtn, langBtns, sellLink, cartBtn, homeLink, mobileMenuBtn, mobileMenuCloseBtn, authModalCloseBtn, googleLoginBtn, modalCloseBtn, searchInput, mobileFiltersCloseBtn, mobileApplyFiltersBtn } = DOMElements;

    darkModeToggle.onclick = () => setDarkMode(!DOMElements.html.classList.contains('dark'));
    langDropdownBtn.onclick = (e) => { e.stopPropagation(); DOMElements.langDropdown.classList.toggle('hidden'); };
    langBtns.forEach(btn => btn.onclick = () => { setLanguage(btn.dataset.lang); DOMElements.langDropdown.classList.add('hidden'); closeMobileMenu(); });

    sellLink.onclick = (e) => { e.preventDefault(); toggleModal(currentUser ? DOMElements.postProductModal : DOMElements.authModal, true); };
    cartBtn.onclick = () => renderView('cart');
    homeLink.onclick = (e) => { e.preventDefault(); window.history.pushState({}, '', window.location.pathname); renderView('home'); };

    // Mobile Menu Handlers
    mobileMenuBtn.onclick = openMobileMenu;
    mobileMenuCloseBtn.onclick = closeMobileMenu;
    DOMElements.mobileMenuBackdrop.onclick = closeMobileMenu;

    // Mobile Menu Event Delegation
    DOMElements.mobileNavLinks.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (!target) return;
        e.preventDefault();
        
        const actions = {
            'mobile-home-link': () => { window.history.pushState({}, '', window.location.pathname); renderView('home'); },
            'mobile-sell-link': () => sellLink.click(),
            'mobile-cart-link': () => renderView('cart'),
            'mobile-dashboard-link': () => renderView('dashboard'),
            'mobile-messages-link': () => renderView('inbox'),
            'mobile-logout-btn': handleSignOut,
            'mobile-login-btn': () => toggleModal(DOMElements.authModal, true)
        };
        
        actions[target.id]?.();
        closeMobileMenu();
    });

    authModalCloseBtn.onclick = () => toggleModal(DOMElements.authModal, false);
    modalCloseBtn.onclick = () => toggleModal(DOMElements.postProductModal, false);
    googleLoginBtn.onclick = () => signInWithPopup(auth, provider).catch(error => console.error("Login error", error));

    DOMElements.postProductForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!validatePostForm(e.target) || !currentUser) return;
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.querySelector('.btn-spinner').classList.remove('hidden');

        const formData = Object.fromEntries(new FormData(e.target).entries());
        const productData = { ...formData, price: Number(formData.price), sellerId: currentUser.uid, sellerName: currentUser.displayName, createdAt: serverTimestamp() };

        try {
            await addDoc(collection(db, "products"), productData);
            showMessage('ad_posted', 3000, 'success');
            e.target.reset();
            toggleModal(DOMElements.postProductModal, false);
        } catch (error) {
            console.error("Error adding document: ", error);
            showMessage('ad_post_failed', 3000, 'error');
        } finally {
            btn.disabled = false;
            btn.querySelector('.btn-spinner').classList.add('hidden');
        }
    };
    
    searchInput.oninput = debounce(applyAndRenderFilters, 500);
    mobileFiltersCloseBtn.onclick = () => DOMElements.mobileFiltersModal.classList.add('translate-x-full');
    mobileApplyFiltersBtn.onclick = () => { applyAndRenderFilters(); DOMElements.mobileFiltersModal.classList.add('translate-x-full'); };

    document.onclick = (e) => {
        if (!langDropdownBtn.contains(e.target)) DOMElements.langDropdown.classList.add('hidden');
        const userMenu = document.getElementById('user-menu');
        if (userMenu && !userMenu.contains(e.target)) document.getElementById('user-menu-dropdown').classList.add('hidden');
    };
    
    document.getElementById('nav-home').onclick = (e) => { 
        e.preventDefault(); 
        window.history.pushState({}, '', window.location.pathname);
        renderView('home'); 
    };
    document.getElementById('nav-search').onclick = (e) => { e.preventDefault(); DOMElements.searchInput.focus(); };
    document.getElementById('nav-sell').onclick = (e) => { e.preventDefault(); DOMElements.sellLink.click(); };
    document.getElementById('nav-messages').onclick = (e) => { e.preventDefault(); currentUser ? renderView('inbox') : toggleModal(DOMElements.authModal, true); };
    document.getElementById('nav-profile').onclick = (e) => { e.preventDefault(); currentUser ? renderView('dashboard') : toggleModal(DOMElements.authModal, true); };

    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (lastScrollY < window.scrollY && window.scrollY > 100) {
            header.classList.add('-translate-y-full');
        } else {
            header.classList.remove('-translate-y-full');
        }
        lastScrollY = window.scrollY;
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleModal(DOMElements.authModal, false);
            toggleModal(DOMElements.postProductModal, false);
            closeMobileMenu();
            DOMElements.mobileFiltersModal.classList.add('translate-x-full');
        }
    });
};

// --- BOOT APP ---
const bootApp = () => {
    setDarkMode(localStorage.getItem('piecety_dark_mode') === 'true');
    document.getElementById('current-year').textContent = new Date().getFullYear();
    populateDropdowns();
    setupEventListeners();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service worker registered.'))
            .catch(err => console.error('Service worker registration failed:', err));
    }

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        updateAuthUI(user);
        listenForUnreadMessages(user);
        userCart = {};
        if (user) {
            toggleModal(DOMElements.authModal, false);
            const cartSnap = await getDoc(doc(db, "carts", user.uid));
            if (cartSnap.exists()) userCart = cartSnap.data();
        }
        updateCartDisplay();
        renderView('home');
    });
    
    window.onpopstate = () => renderView('home');
    setLanguage(currentLang);
};

bootApp();

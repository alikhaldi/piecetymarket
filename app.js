import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, where, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, FacebookAuthProvider, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// --- GLOBAL STATE & CONSTANTS ---
let currentUser = null;
let currentLang = localStorage.getItem("piecety_lang") || "fr";
let currentView = 'home';
let userCart = {};
let productsUnsubscribe = null;
let chatsUnsubscribe = null;
let lastVisibleProduct = null;
let isFetching = false;
let recentlyViewed = JSON.parse(localStorage.getItem('piecety_recently_viewed')) || [];

// --- FIREBASE CONFIGURATION ---
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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// --- TRANSLATIONS ---
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
        images_label: "Images",
        submit_ad_btn_text: "Soumettre",
        loading_text: "Envoi...",
        error_valid_title: "Veuillez entrer un titre valide.",
        error_select_brand: "Veuillez sélectionner une marque.",
        error_select_wilaya: "Veuillez sélectionner une wilaya.",
        error_select_category: "Veuillez sélectionner une catégorie.",
        error_valid_price: "Veuillez entrer un prix valide.",
        login_text: "Connectez-vous pour accéder à toutes les fonctionnalités.",
        google_login: "Se connecter avec Google",
        facebook_login: "Se connecter avec Facebook",
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
        load_more: "Charger plus",
        edit_ad: "Modifier l'annonce",
        ad_updated: "Annonce mise à jour avec succès !",
        create_store: "Créer une boutique",
        store_created: "Boutique créée avec succès !",
        edit_profile: "Modifier le profil",
        profile_updated: "Profil mis à jour avec succès !",
        store_name: "Nom de la boutique",
        store_description: "Description de la boutique",
        profile_name: "Nom",
        profile_picture: "Photo de profil"
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
        images_label: "Images",
        submit_ad_btn_text: "Submit",
        loading_text: "Submitting...",
        error_valid_title: "Please enter a valid title.",
        error_select_brand: "Please select a brand.",
        error_select_wilaya: "Please select a state.",
        error_select_category: "Please select a category.",
        error_valid_price: "Please enter a valid price.",
        login_text: "Log in to access all features.",
        google_login: "Sign in with Google",
        facebook_login: "Sign in with Facebook",
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
        load_more: "Load More",
        edit_ad: "Edit Ad",
        ad_updated: "Ad updated successfully!",
        create_store: "Create Store",
        store_created: "Store created successfully!",
        edit_profile: "Edit Profile",
        profile_updated: "Profile updated successfully!",
        store_name: "Store Name",
        store_description: "Store Description",
        profile_name: "Name",
        profile_picture: "Profile Picture"
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
        select_wilaya: "اختر ولاية",
        commune_label: "البلدية",
        select_commune: "اختر بلدية",
        condition_label: "الحالة",
        price_label: "السعر (دج) *",
        price_placeholder: "مثال: 15000",
        description_label: "الوصف",
        description_placeholder: "معلومات إضافية...",
        images_label: "الصور",
        submit_ad_btn_text: "إرسال",
        loading_text: "جار الإرسال...",
        error_valid_title: "الرجاء إدخال عنوان صالح.",
        error_select_brand: "الرجاء اختيار ماركة.",
        error_select_wilaya: "الرجاء اختيار ولاية.",
        error_select_category: "الرجاء اختيار فئة.",
        error_valid_price: "الرجاء إدخال سعر صالح.",
        login_text: "تسجيل الدخول للوصول إلى جميع الميزات.",
        google_login: "تسجيل الدخول باستخدام Google",
        facebook_login: "تسجيل الدخول باستخدام Facebook",
        back_to_listings: "العودة إلى الإعلانات",
        add_to_cart: "أضف إلى السلة",
        cart_title: "سلة التسوق",
        cart_total: "الإجمالي",
        checkout_btn: "الدفع",
        no_listings: "لم يتم العثور على إعلانات.",
        your_cart_is_empty: "سلة التسوق فارغة.",
        remove: "حذف",
        quantity: "الكمية",
        item_total: "إجمالي السلعة",
        login_required: "يرجى تسجيل الدخول لاستخدام هذه الميزة.",
        show_filters: "إظهار الفلاتر",
        price_range: "نطاق السعر",
        all_categories: "جميع الفئات",
        category_label: "الفئة *",
        select_category: "اختر فئة",
        contact_seller: "اتصل بالبائع",
        clear_cart: "إفراغ السلة",
        ad_posted: "تم نشر إعلانك بنجاح!",
        ad_post_failed: "فشل نشر الإعلان.",
        item_added_to_cart: "تمت إضافة المنتج إلى السلة!",
        delete_ad_confirm: "هل أنت متأكد من أنك تريد حذف هذا الإعلان؟",
        sold_by: "البائع:",
        my_listings: "إعلاناتي",
        seller_listings: "إعلانات من هذا البائع",
        buyer_reviews: "تقييمات المشترين",
        reviews_soon: "(التقييمات قريبا)",
        reviews_soon_2: "ميزة التقييم ستكون متاحة قريبا.",
        messages: "الرسائل",
        loading_convos: "جاري تحميل المحادثات...",
        chat_with: "محادثة مع",
        type_message_placeholder: "اكتب رسالة...",
        recently_viewed: "شوهدت مؤخرا",
        chat: "محادثة",
        load_more: "تحميل المزيد",
        edit_ad: "تعديل الإعلان",
        ad_updated: "تم تحديث الإعلان بنجاح!",
        create_store: "إنشاء متجر",
        store_created: "تم إنشاء المتجر بنجاح!",
        edit_profile: "تعديل الملف الشخصي",
        profile_updated: "تم تحديث الملف الشخصي بنجاح!",
        store_name: "اسم المتجر",
        store_description: "وصف المتجر",
        profile_name: "الاسم",
        profile_picture: "الصورة الشخصية"
    }
};

// --- DATA ---
const categories = {
    "engine": { fr: "Moteur", en: "Engine", ar: "محرك", icon: "fa-cogs" },
    "brakes": { fr: "Freins", en: "Brakes", ar: "مكابح", icon: "fa-car" },
    "fuel_system": { fr: "Système de carburant", en: "Fuel System", ar: "نظام الوقود", icon: "fa-gas-pump" },
    "cooling": { fr: "Refroidissement", en: "Cooling", ar: "التبريد", icon: "fa-fan" },
    "tires": { fr: "Pneus & Jantes", en: "Tires & Rims", ar: "إطارات وجنوط", icon: "fa-circle" }
};

const currentYear = new Date().getFullYear();
const years = Array.from({length: currentYear - 1979 + 1}, (_, i) => (currentYear - i).toString());

// --- DOM ELEMENTS ---
const DOMElements = {
    html: document.documentElement,
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    langDropdownBtn: document.getElementById('lang-dropdown-btn'),
    langDropdown: document.getElementById('lang-dropdown'),
    langBtns: document.querySelectorAll('[data-lang]'),
    sellLink: document.getElementById('sell-link'),
    cartBtn: document.getElementById('cart-btn'),
    homeLink: document.getElementById('home-link'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenuCloseBtn: document.getElementById('mobile-menu-close-btn'),
    mobileMenuBackdrop: document.getElementById('mobile-menu-backdrop'),
    mobileNavLinks: document.getElementById('mobile-nav-links'),
    authModal: document.getElementById('auth-modal'),
    authModalCloseBtn: document.getElementById('auth-modal-close-btn'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    facebookLoginBtn: document.getElementById('facebook-login-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    postProductModal: document.getElementById('post-product-modal'),
    postProductForm: document.getElementById('post-product-form'),
    searchInput: document.getElementById('search-input'),
    mobileFiltersCloseBtn: document.getElementById('mobile-filters-close-btn'),
    mobileApplyFiltersBtn: document.getElementById('mobile-apply-filters-btn'),
    authLinksContainer: document.getElementById('auth-links-container'),
    profileEditModal: document.getElementById('profile-edit-modal'),
    storeCreateModal: document.getElementById('store-create-modal'),
    adEditModal: document.getElementById('ad-edit-modal'),
    mobileCartCount: document.getElementById('mobile-cart-count'),
    content: document.getElementById('content')
};

// --- UTILITY FUNCTIONS ---
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const setDarkMode = (enable) => {
    DOMElements.html.classList.toggle('dark', enable);
    localStorage.setItem('piecety_dark_mode', enable);
    const icon = DOMElements.darkModeToggle.querySelector('i');
    icon.classList.replace(enable ? 'fa-moon' : 'fa-sun', enable ? 'fa-sun' : 'fa-moon');
};

const setLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem("piecety_lang", lang);
    translatePage(lang);
    DOMElements.html.setAttribute("lang", lang);
    DOMElements.html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.querySelector(`[data-lang="${lang}"]`).classList.add("font-bold");
    document.querySelectorAll(`[data-lang]:not([data-lang="${lang}"])`).forEach(btn => btn.classList.remove("font-bold"));
};

const translatePage = (lang) => {
    document.querySelectorAll("[data-i18n-key]").forEach(el => {
        const key = el.getAttribute("data-i18n-key");
        el.textContent = translations[lang][key] || el.textContent;
    });
    document.title = translations[lang].page_title;
    document.querySelector('meta[name="description"]').setContent(translations[lang].meta_description);
};

const toggleModal = (modal, show) => {
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('opacity-0', !show);
    modal.classList.toggle('invisible', !show);
};

const showMessage = (key, duration, type) => {
    const msg = document.createElement('div');
    msg.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`;
    msg.textContent = translations[currentLang][key];
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), duration);
};

const uploadImages = async (files, folder) => {
    const urls = [];
    for (const file of files) {
        const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
    }
    return urls;
};

// --- CART FUNCTIONS ---
const addToCart = async (productId, quantity = 1) => {
    if (!currentUser) return showMessage('login_required', 3000, 'error');
    if (!userCart[productId]) userCart[productId] = { quantity: 0 };
    userCart[productId].quantity += quantity;
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        if (currentView === 'cart') renderCartPage();
        showMessage('item_added_to_cart', 3000, 'success');
    } catch (error) {
        console.error("Error adding to cart:", error);
        showMessage('error', 3000, 'error');
    }
};

const updateCartItem = async (productId, quantity) => {
    if (!currentUser || !userCart[productId]) return;
    userCart[productId].quantity = quantity;
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        if (currentView === 'cart') renderCartPage();
    } catch (error) {
        console.error("Error updating cart item:", error);
        showMessage('error', 3000, 'error');
    }
};

const removeFromCart = async (productId) => {
    if (!currentUser || !userCart[productId]) return;
    delete userCart[productId];
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        if (currentView === 'cart') renderCartPage();
    } catch (error) {
        console.error("Error removing from cart:", error);
        showMessage('error', 3000, 'error');
    }
};

const updateCartDisplay = () => {
    const count = Object.values(userCart).reduce((sum, item) => sum + item.quantity, 0);
    ['cart-count', 'mobile-cart-count'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = count;
            el.classList.toggle('hidden', count === 0);
        }
    });
};

const validatePostForm = (form) => {
    let isValid = true;
    ['title', 'brand', 'wilaya', 'category', 'price'].forEach(fieldName => {
        const input = form.elements[fieldName];
        const errorEl = document.getElementById(`${fieldName}-error`);
        const isInvalid = !input.value.trim();
        input.classList.toggle('border-red-500', isInvalid);
        errorEl?.classList.toggle('hidden', !isInvalid);
        if (isInvalid) isValid = false;
    });
    return isValid;
};

// --- RENDER FUNCTIONS ---
const renderView = async (view) => {
    currentView = view;
    DOMElements.content.innerHTML = ''; // Clear content
    if (view === 'home') {
        renderHomePage();
    } else if (view === 'cart') {
        renderCartPage();
    } else if (view === 'dashboard') {
        renderDashboardPage();
    } else if (view === 'inbox') {
        renderInboxPage();
    }
    updateBottomNav(view);
};

const renderHomePage = () => {
    DOMElements.content.innerHTML = `
        <section class="py-12">
            <h1 class="text-3xl font-bold" data-i18n-key="hero_title">${translations[currentLang].hero_title}</h1>
            <p class="mt-2 text-lg" data-i18n-key="hero_subtitle">${translations[currentLang].hero_subtitle}</p>
            <!-- Add category grid, product listings, etc. -->
        </section>
    `;
};

const renderCartPage = () => {
    DOMElements.content.innerHTML = `
        <section class="py-12">
            <h2 class="text-2xl font-bold" data-i18n-key="cart_title">${translations[currentLang].cart_title}</h2>
            <!-- Cart items -->
        </section>
    `;
};

const renderDashboardPage = async () => {
    const storeDoc = currentUser ? await getDoc(doc(db, "stores", currentUser.uid)) : null;
    const storeExists = storeDoc?.exists();
    DOMElements.content.innerHTML = `
        <section class="py-12">
            <h2 class="text-2xl font-bold" data-i18n-key="dashboard">${translations[currentLang].dashboard}</h2>
            <div class="mt-4">
                <button id="edit-profile-btn" class="btn btn-primary mr-2" data-i18n-key="edit_profile">${translations[currentLang].edit_profile}</button>
                <button id="create-store-btn" class="btn btn-primary" data-i18n-key="create_store" ${storeExists ? 'disabled' : ''}>${translations[currentLang].create_store}</button>
            </div>
            <h3 class="mt-6 text-xl font-semibold" data-i18n-key="my_listings">${translations[currentLang].my_listings}</h3>
            <div id="my-listings" class="mt-4"></div>
        </section>
    `;
    document.getElementById('edit-profile-btn').onclick = () => editProfile();
    if (!storeExists) document.getElementById('create-store-btn').onclick = () => createStore();
    if (currentUser) {
        const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
        onSnapshot(q, (snapshot) => {
            const listings = document.getElementById('my-listings');
            listings.innerHTML = snapshot.docs.map(doc => `
                <div class="p-4 border rounded-lg">
                    <h4>${doc.data().title}</h4>
                    <button class="btn btn-secondary edit-ad-btn" data-id="${doc.id}" data-i18n-key="edit_ad">${translations[currentLang].edit_ad}</button>
                </div>
            `).join('');
            document.querySelectorAll('.edit-ad-btn').forEach(btn => {
                btn.onclick = () => editAd(btn.dataset.id);
            });
        });
    }
};

const renderInboxPage = () => {
    DOMElements.content.innerHTML = `
        <section class="py-12">
            <h2 class="text-2xl font-bold" data-i18n-key="messages">${translations[currentLang].messages}</h2>
            <!-- Inbox content -->
        </section>
    `;
};

const updateBottomNav = (activeView) => {
    ['nav-home', 'nav-search', 'nav-sell', 'nav-messages', 'nav-profile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('text-blue-600', id === `nav-${activeView}`);
    });
};

// --- AUTHENTICATION & UI UPDATES ---
const updateAuthUI = (user) => {
    const { authLinksContainer, mobileNavLinks } = DOMElements;
    authLinksContainer.innerHTML = '';
    
    let mobileLinksHTML = `
        <a href="#" id="mobile-home-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="nav_home">${translations[currentLang].nav_home}</a>
        <a href="#" id="mobile-sell-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="sell">${translations[currentLang].sell}</a>
        <a href="#" id="mobile-cart-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg relative">
            <span data-i18n-key="cart_title">${translations[currentLang].cart_title}</span>
            <span id="mobile-cart-count" class="absolute top-0 ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${Object.keys(userCart).length ? '' : 'hidden'}">0</span>
        </a>`;

    if (user) {
        authLinksContainer.innerHTML = `
            <div class="relative" id="user-menu">
                <button id="user-menu-btn" class="flex items-center">
                    <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="User" class="w-8 h-8 rounded-full">
                </button>
                <div id="user-menu-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 hidden z-20">
                    <a href="#" id="dashboard-link" class="block px-4 py-2 text-sm" data-i18n-key="dashboard">${translations[currentLang].dashboard}</a>
                    <a href="#" id="messages-link" class="relative block px-4 py-2 text-sm" data-i18n-key="messages">
                        <span id="unread-badge" class="hidden absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span>
                    </a>
                    <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm" data-i18n-key="logout">${translations[currentLang].logout}</button>
                </div>
            </div>`;
        mobileLinksHTML += `
            <a href="#" id="mobile-dashboard-link" class="p-2 text-lg" data-i18n-key="dashboard">${translations[currentLang].dashboard}</a>
            <a href="#" id="mobile-messages-link" class="p-2 text-lg relative">
                <span data-i18n-key="messages">${translations[currentLang].messages}</span>
                <span id="mobile-unread-badge" class="hidden absolute top-0 ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span>
            </a>
            <button id="mobile-logout-btn" class="p-2 text-lg text-left" data-i18n-key="logout">${translations[currentLang].logout}</button>`;
        
        const toggleUserMenu = () => document.getElementById('user-menu-dropdown').classList.toggle('hidden');
        document.getElementById('user-menu-btn').onclick = toggleUserMenu;
        document.getElementById('logout-btn').onclick = handleSignOut;
        document.getElementById('dashboard-link').onclick = (e) => { e.preventDefault(); renderView('dashboard'); };
        document.getElementById('messages-link').onclick = (e) => { e.preventDefault(); renderView('inbox'); };
    } else {
        authLinksContainer.innerHTML = `
            <button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors" data-i18n-key="connect">${translations[currentLang].connect}</button>`;
        mobileLinksHTML += `
            <button id="mobile-login-btn" class="p-2 text-lg text-left" data-i18n-key="connect">${translations[currentLang].connect}</button>`;
        document.getElementById('login-btn').onclick = () => toggleModal(DOMElements.authModal, true);
    }

    mobileNavLinks.innerHTML = mobileLinksHTML;
    updateCartDisplay();
    translatePage(currentLang);
};

const handleSignOut = () => {
    signOut(auth).then(() => {
        currentUser = null;
        userCart = {};
        updateAuthUI(null);
        renderView('home');
    });
};

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
    ['unread-badge', 'mobile-unread-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = count > 9 ? '9+' : count;
            el.classList.toggle('hidden', count === 0);
        }
    });
};

// --- NEW FEATURES ---
const editAd = async (adId) => {
    if (!currentUser) return showMessage('login_required', 3000, 'error');
    const adDoc = await getDoc(doc(db, "products", adId));
    if (adDoc.exists() && adDoc.data().sellerId === currentUser.uid) {
        const data = adDoc.data();
        DOMElements.adEditModal.querySelector('form').innerHTML = `
            <div class="mb-4">
                <label class="block" data-i18n-key="ad_title_label">${translations[currentLang].ad_title_label}</label>
                <input type="text" name="title" value="${data.title}" class="w-full p-2 border rounded">
                <p id="title-error" class="text-red-500 hidden" data-i18n-key="error_valid_title">${translations[currentLang].error_valid_title}</p>
            </div>
            <div class="mb-4">
                <label class="block" data-i18n-key="category_label">${translations[currentLang].category_label}</label>
                <select name="category" class="w-full p-2 border rounded">
                    <option value="" data-i18n-key="select_category">${translations[currentLang].select_category}</option>
                    ${Object.keys(categories).map(key => `<option value="${key}" ${data.category === key ? 'selected' : ''}>${categories[key][currentLang]}</option>`).join('')}
                </select>
                <p id="category-error" class="text-red-500 hidden" data-i18n-key="error_select_category">${translations[currentLang].error_select_category}</p>
            </div>
            <div class="mb-4">
                <label class="block" data-i18n-key="images_label">${translations[currentLang].images_label}</label>
                <input type="file" name="images" multiple accept="image/*" class="w-full p-2 border rounded">
                <div class="image-upload-preview">${data.images?.map(url => `<img src="${url}" class="image-preview" alt="Ad image">`).join('') || ''}</div>
            </div>
            <button type="submit" class="btn btn-primary" data-i18n-key="submit_ad_btn_text">${translations[currentLang].submit_ad_btn_text}</button>
        `;
        toggleModal(DOMElements.adEditModal, true);
        DOMElements.adEditModal.querySelector('form').onsubmit = async (e) => {
            e.preventDefault();
            if (!validatePostForm(e.target)) return;
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            const formData = Object.fromEntries(new FormData(e.target).entries());
            const images = e.target.elements['images'].files;
            if (images.length > 0) {
                formData.images = await uploadImages(images, `ads/${adId}`);
            } else {
                formData.images = data.images || [];
            }
            try {
                await updateDoc(doc(db, "products", adId), { ...formData, price: Number(formData.price), updatedAt: serverTimestamp() });
                toggleModal(DOMElements.adEditModal, false);
                showMessage('ad_updated', 3000, 'success');
            } catch (error) {
                console.error("Error updating ad:", error);
                showMessage('ad_post_failed', 3000, 'error');
            } finally {
                btn.disabled = false;
            }
        };
    }
};

const editProfile = async () => {
    if (!currentUser) return showMessage('login_required', 3000, 'error');
    DOMElements.profileEditModal.querySelector('form').innerHTML = `
        <div class="mb-4">
            <label class="block" data-i18n-key="profile_name">${translations[currentLang].profile_name}</label>
            <input type="text" name="displayName" value="${currentUser.displayName || ''}" class="w-full p-2 border rounded">
        </div>
        <div class="mb-4">
            <label class="block" data-i18n-key="profile_picture">${translations[currentLang].profile_picture}</label>
            <input type="file" name="profilePic" accept="image/*" class="w-full p-2 border rounded">
            <div class="image-upload-preview">
                ${currentUser.photoURL ? `<img src="${currentUser.photoURL}" class="image-preview" alt="Profile picture">` : ''}
            </div>
        </div>
        <button type="submit" class="btn btn-primary" data-i18n-key="submit_ad_btn_text">${translations[currentLang].submit_ad_btn_text}</button>
    `;
    toggleModal(DOMElements.profileEditModal, true);
    DOMElements.profileEditModal.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        const formData = Object.fromEntries(new FormData(e.target).entries());
        let photoURL = currentUser.photoURL;
        const photo = e.target.elements['profilePic'].files[0];
        if (photo) {
            photoURL = (await uploadImages([photo], `profiles/${currentUser.uid}`))[0];
        }
        try {
            await updateProfile(currentUser, { displayName: formData.displayName, photoURL });
            toggleModal(DOMElements.profileEditModal, false);
            showMessage('profile_updated', 3000, 'success');
            updateAuthUI(currentUser);
        } catch (error) {
            console.error("Error updating profile:", error);
            showMessage('error', 3000, 'error');
        } finally {
            btn.disabled = false;
        }
    };
};

const createStore = async () => {
    if (!currentUser) return showMessage('login_required', 3000, 'error');
    DOMElements.storeCreateModal.querySelector('form').innerHTML = `
        <div class="mb-4">
            <label class="block" data-i18n-key="store_name">${translations[currentLang].store_name}</label>
            <input type="text" name="name" class="w-full p-2 border rounded">
            <p id="name-error" class="text-red-500 hidden">Please enter a valid store name.</p>
        </div>
        <div class="mb-4">
            <label class="block" data-i18n-key="store_description">${translations[currentLang].store_description}</label>
            <textarea name="description" class="w-full p-2 border rounded"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" data-i18n-key="submit_ad_btn_text">${translations[currentLang].submit_ad_btn_text}</button>
    `;
    toggleModal(DOMElements.storeCreateModal, true);
    DOMElements.storeCreateModal.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        const formData = Object.fromEntries(new FormData(e.target).entries());
        if (!formData.name.trim()) {
            document.getElementById('name-error').classList.remove('hidden');
            btn.disabled = false;
            return;
        }
        try {
            await setDoc(doc(db, "stores", currentUser.uid), {
                name: formData.name,
                description: formData.description,
                ownerId: currentUser.uid,
                createdAt: serverTimestamp()
            });
            toggleModal(DOMElements.storeCreateModal, false);
            showMessage('store_created', 3000, 'success');
            renderView('dashboard');
        } catch (error) {
            console.error("Error creating store:", error);
            showMessage('error', 3000, 'error');
        } finally {
            btn.disabled = false;
        }
    };
};

// --- SETUP & EVENT LISTENERS ---
const setupEventListeners = () => {
    const { darkModeToggle, langDropdownBtn, langBtns, sellLink, cartBtn, homeLink, mobileMenuBtn, mobileMenuCloseBtn, authModalCloseBtn, googleLoginBtn, facebookLoginBtn, modalCloseBtn, searchInput, mobileFiltersCloseBtn, mobileApplyFiltersBtn } = DOMElements;

    darkModeToggle.onclick = () => setDarkMode(!DOMElements.html.classList.contains('dark'));
    langDropdownBtn.onclick = (e) => { e.stopPropagation(); DOMElements.langDropdown.classList.toggle('hidden'); };
    langBtns.forEach(btn => btn.onclick = () => {
        setLanguage(btn.dataset.lang);
        DOMElements.langDropdown.classList.add('hidden');
        closeMobileMenu();
    });

    sellLink.onclick = (e) => { e.preventDefault(); toggleModal(currentUser ? DOMElements.postProductModal : DOMElements.authModal, true); };
    cartBtn.onclick = () => renderView('cart');
    homeLink.onclick = (e) => { e.preventDefault(); window.history.pushState({}, '', window.location.pathname); renderView('home'); };

    mobileMenuBtn.onclick = () => {
        DOMElements.mobileMenuBackdrop.classList.remove('hidden', 'opacity-0', 'invisible');
        DOMElements.mobileMenu.classList.remove('translate-x-full');
    };
    mobileMenuCloseBtn.onclick = closeMobileMenu;
    DOMElements.mobileMenuBackdrop.onclick = closeMobileMenu;

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
    DOMElements.profileEditModal.querySelector('.modal-close-btn').onclick = () => toggleModal(DOMElements.profileEditModal, false);
    DOMElements.storeCreateModal.querySelector('.modal-close-btn').onclick = () => toggleModal(DOMElements.storeCreateModal, false);
    DOMElements.adEditModal.querySelector('.modal-close-btn').onclick = () => toggleModal(DOMElements.adEditModal, false);

    googleLoginBtn.onclick = () => signInWithPopup(auth, googleProvider).catch(error => console.error("Google login error:", error));
    facebookLoginBtn.onclick = () => signInWithPopup(auth, facebookProvider).catch(error => console.error("Facebook login error:", error));

    DOMElements.postProductForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || !validatePostForm(e.target)) return;
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.querySelector('.btn-spinner')?.classList.remove('hidden');

        const formData = Object.fromEntries(new FormData(e.target).entries());
        const images = e.target.elements['images'].files;
        const productData = { ...formData, price: Number(formData.price), sellerId: currentUser.uid, sellerName: currentUser.displayName, createdAt: serverTimestamp() };

        if (images.length > 0) {
            productData.images = await uploadImages(images, 'ads');
        }

        try {
            await addDoc(collection(db, "products"), productData);
            showMessage('ad_posted', 3000, 'success');
            e.target.reset();
            toggleModal(DOMElements.postProductModal, false);
        } catch (error) {
            console.error("Error adding document:", error);
            showMessage('ad_post_failed', 3000, 'error');
        } finally {
            btn.disabled = false;
            btn.querySelector('.btn-spinner')?.classList.add('hidden');
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
    document.getElementById('nav-search').onclick = (e) => { e.preventDefault(); DOMElements.searchInput.focus(); updateBottomNav('search'); };
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
};

const applyAndRenderFilters = () => {
    // Implement filter logic
    console.log('Applying filters');
};

const closeMobileMenu = () => {
    DOMElements.mobileMenuBackdrop.classList.add('hidden', 'opacity-0', 'invisible');
    DOMElements.mobileMenu.classList.add('translate-x-full');
};

// --- BOOTSTRAP ---
const bootApp = () => {
    setDarkMode(localStorage.getItem('piecety_dark_mode') === 'true');
    document.getElementById('current-year').textContent = new Date().getFullYear();
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

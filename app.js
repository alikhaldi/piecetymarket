// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, where, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, increment, serverTimestamp, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, FacebookAuthProvider, onAuthStateChanged, deleteUser, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// --- GLOBAL STATE & CONSTANTS ---
const PRODUCTS_PER_PAGE = 12;
let currentUser = null;
let currentLang = localStorage.getItem("piecety_lang") || "fr";
let currentView = 'home';
let userCart = {};
let productsUnsubscribe = null;
let chatsUnsubscribe = null;
let messagesListener = null;
let lastVisibleProduct = null;
let isFetching = false;
let recentlyViewed = JSON.parse(localStorage.getItem('piecety_recently_viewed')) || [];
let userProfile = null;
let userInteractions = JSON.parse(localStorage.getItem('userInteractions') || '{}');

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBIptEskV2soajxRYPDfwYFYyz9pWQvZL0",
    authDomain: "piecety-app-b39c4.firebaseapp.com",
    projectId: "piecety-app-b39c4",
    storageBucket: "piecety-app-b39c4.firebasestorage.app",
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
        page_title: "Piecety - Marché des Pièces Auto en Algérie", meta_description: "Achetez et vendez des pièces automobiles en Algérie avec Piecety, le marché fiable pour les pièces neuves et d'occasion.", fr_short: "FR", en_short: "EN", ar_short: "AR", menu: "Menu", sell: "Vendre", connect: "Se connecter", language: "Langue", logout: "Déconnexion", dashboard: "Tableau de Bord", nav_home: "Accueil", nav_search: "Recherche", nav_profile: "Profil", hero_title: "Trouvez la bonne pièce pour votre voiture", hero_subtitle: "Le marché algérien des pièces automobiles le plus fiable.", categories_title: "Catégories de Pièces", brands_title: "Sélectionnez une Marque", years_title: "Sélectionnez une Année", filters_title: "Filtrer les annonces", all_brands: "Toutes les marques", all_models: "Tous les modèles", all_years: "Toutes années", all_wilayas: "Toutes wilayas", all_communes: "Toutes communes", condition: "État", any_condition: "Tout", new: "Neuf", used: "Occasion", apply_filters: "Appliquer les filtres", reset: "Réinitialiser", search_placeholder: "Rechercher une pièce...", submit_ad: "Soumettre une annonce", ad_title_label: "Titre de la pièce *", ad_title_placeholder: "Ex: Disque de frein avant", brand_label: "Marque *", select_brand: "Sélectionnez une marque", model_label: "Modèle", select_model: "Sélectionnez un modèle", year_label: "Année", select_year: "Sélectionnez une année", wilaya_label: "Wilaya *", select_wilaya: "Sélectionnez une wilaya", commune_label: "Commune", select_commune: "Sélectionnez une commune", condition_label: "État", price_label: "Prix (DA) *", price_placeholder: "Ex: 15000", description_label: "Description", description_placeholder: "Informations supplémentaires...", submit_ad_btn_text: "Soumettre", loading_text: "Envoi...", error_valid_title: "Veuillez entrer un titre valide.", error_select_brand: "Veuillez sélectionner une marque.", error_select_wilaya: "Veuillez sélectionner une wilaya.", error_select_category: "Veuillez sélectionner une catégorie.", error_valid_price: "Veuillez entrer un prix valide.", login_text: "Connectez-vous pour accéder à toutes les fonctionnalités.", google_login: "Se connecter avec Google", back_to_listings: "Retour aux annonces", add_to_cart: "Ajouter au panier", cart_title: "Mon panier", cart_total: "Total", checkout_btn: "Passer à la caisse", no_listings: "Aucune annonce trouvée.", your_cart_is_empty: "Votre panier est vide.", remove: "Supprimer", quantity: "Quantité", item_total: "Total de l'article", login_required: "Veuillez vous connecter pour utiliser cette fonctionnalité.", show_filters: "Afficher les filtres", price_range: "Gamme de prix", all_categories: "Toutes catégories", category_label: "Catégorie *", select_category: "Sélectionnez une catégorie", contact_seller: "Contacter le vendeur", clear_cart: "Vider le panier", ad_posted: "Votre annonce a été publiée avec succès !", ad_post_failed: "Échec de la publication de l'annonce.", item_added_to_cart: "Article ajouté au panier!", delete_ad_confirm: "Êtes-vous sûr de vouloir supprimer cette annonce ?", sold_by: "Vendu par:", my_listings: "Mes Annonces", seller_listings: "Annonces de ce vendeur", buyer_reviews: "Avis des acheteurs", reviews_soon: "(Avis bientôt disponibles)", reviews_soon_2: "La fonctionnalité d'avis sera bientôt disponible.", messages: "Messages", loading_convos: "Chargement des conversations...", chat_with: "Chat avec", type_message_placeholder: "Écrire un message...", recently_viewed: "Récemment consultés", chat: "Chat", load_more: "Charger plus", ad_image_label: "Image de la pièce *", facebook_login: "Se connecter avec Facebook", store_label: "Nom du magasin", store_name_placeholder: "Ex: Pièces Autos Abdelkader", store_profile: "Profil de Magasin", setup_store_profile: "Configurer le Profil de Magasin", store_name_label: "Nom du Magasin", store_logo_label: "Logo du Magasin", save: "Enregistrer", profile_pic_label: "Photo de Profil", update_profile_pic: "Mettre à jour la Photo",
        // New translations
        contact_us: "Contactez-nous",
        terms_of_service: "Conditions d'utilisation",
        terms_title: "Conditions d'utilisation",
        terms_last_updated: "Dernière mise à jour :",
        terms_intro_title: "1. Introduction",
        terms_intro_text: "Bienvenue sur Piecety. En accédant ou en utilisant notre application, vous acceptez d'être lié par ces conditions. Si vous n'êtes pas d'accord avec une partie de ces conditions, veuillez ne pas utiliser notre service.",
        terms_use_title: "2. Utilisation de l'application",
        terms_use_text: "Piecety est un marché en ligne pour l'achat et la vente de pièces automobiles. Vous êtes responsable de toute activité liée à votre compte. L'application ne peut être utilisée qu'à des fins légales et d'une manière qui ne porte pas atteinte aux droits d'autrui.",
        terms_account_title: "3. Comptes utilisateurs",
        terms_account_text: "Vous devez être âgé d'au moins 18 ans pour créer un compte. Vous êtes responsable de la sécurité de votre mot de passe et de votre compte. Vous acceptez de ne pas partager les informations de votre compte ou de les utiliser pour d'autres personnes.",
        terms_delete_account_policy: "Vous pouvez supprimer votre compte à tout moment. La suppression de votre compte entraînera la suppression définitive de toutes vos annonces, messages et données personnelles.",
        terms_content_title: "4. Contenu utilisateur",
        terms_content_text: "Vous êtes seul responsable du contenu (annonces, photos, messages) que vous publiez sur l'application. Vous garantissez que vous avez les droits nécessaires pour publier ce contenu et qu'il n'est pas illégal, menaçant, diffamatoire ou obscène. Piecety se réserve le droit de supprimer tout contenu jugé inapproprié.",
        terms_liability_title: "5. Limitation de responsabilité",
        terms_liability_text: "Piecety est fourni 'tel quel'. Nous ne garantissons pas que le service sera ininterrompu ou sans erreur. En aucun cas, Piecety ne sera responsable des dommages directs ou indirects résultant de votre utilisation du service.",
        terms_termination_title: "6. Résiliation du compte",
        terms_termination_text: "Nous pouvons résilier ou suspendre votre compte et votre accès à l'application, sans préavis ni responsabilité, pour quelque raison que ce soit, y compris si vous enfreignez les Conditions. Vous pouvez supprimer votre compte à tout moment depuis votre tableau de bord.",
        danger_zone: "Zone de danger",
        delete_account: "Supprimer mon compte",
        delete_account_confirm: "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos annonces, messages et données personnelles. Cette action est IRREVERSIBLE!",
        sub_categories_title: "Sous-catégories pour",
        back: "Retour",
        edit_profile: "Modifier le profil",
        name_label: "Nom",
        write_review_placeholder: "Écrivez votre avis ici...",
        add_review: "Ajouter un avis",
        submit_review: "Soumettre l'avis",
        offer_btn_text: "Faire une offre",
        offer_prompt: "Entrez votre prix d'offre :",
        offer_sent: "Votre offre a été envoyée.",
        recommendations: "Recommandations pour vous",
    },
    en: {
        page_title: "Piecety - Car Parts Marketplace in Algeria", meta_description: "Buy and sell car parts in Algeria with Piecety, the reliable marketplace for new and used parts.", fr_short: "FR", en_short: "EN", ar_short: "AR", menu: "Menu", sell: "Sell", connect: "Log In", language: "Language", logout: "Logout", dashboard: "Dashboard", nav_home: "Home", nav_search: "Search", nav_profile: "Profile", hero_title: "Find the right car part for your vehicle", hero_subtitle: "The most trusted Algerian car parts marketplace.", categories_title: "Parts Categories", brands_title: "Select a Brand", years_title: "Select a Year", filters_title: "Filter Listings", all_brands: "All brands", all_models: "All models", all_years: "All years", all_wilayas: "All wilayas", all_communes: "All communes", condition: "Condition", any_condition: "Any", new: "New", used: "Used", apply_filters: "Apply Filters", reset: "Reset", search_placeholder: "Search for a part...", submit_ad: "Submit an Ad", ad_title_label: "Part Title *", ad_title_placeholder: "e.g., Front brake disc", brand_label: "Brand *", select_brand: "Select a brand", model_label: "Model", select_model: "Select a model", year_label: "Year", select_year: "Select a year", wilaya_label: "State *", select_wilaya: "Select a state", commune_label: "City", select_commune: "Select a city", condition_label: "Condition", price_label: "Price (DA) *", price_placeholder: "e.g., 15000", description_label: "Description", description_placeholder: "Additional information...", submit_ad_btn_text: "Submit", loading_text: "Submitting...", error_valid_title: "Please enter a valid title.", error_select_brand: "Please select a brand.", error_select_wilaya: "Please select a state.", error_select_category: "Please select a category.", error_valid_price: "Please enter a valid price.", login_text: "Log in to access all features.", google_login: "Sign in with Google", back_to_listings: "Back to listings", add_to_cart: "Add to cart", cart_title: "My Cart", cart_total: "Total", checkout_btn: "Proceed to Checkout", no_listings: "No listings found.", your_cart_is_empty: "Your cart is empty.", remove: "Remove", quantity: "Quantity", item_total: "Item Total", login_required: "Please log in to use this feature.", show_filters: "Show Filters", price_range: "Price Range", all_categories: "All Categories", category_label: "Category *", select_category: "Select a category", contact_seller: "Contact Seller", clear_cart: "Clear Cart", ad_posted: "Your ad has been posted successfully!", ad_post_failed: "Failed to post ad.", item_added_to_cart: "Item added to cart!", delete_ad_confirm: "Are you sure you want to delete this ad?", sold_by: "Sold by:", my_listings: "My Listings", seller_listings: "Listings from this seller", buyer_reviews: "Buyer Reviews", reviews_soon: "(Reviews coming soon)", reviews_soon_2: "Review functionality will be available soon.", messages: "Messages", loading_convos: "Loading conversations...", chat_with: "Chat with", type_message_placeholder: "Type a message...", recently_viewed: "Recently Viewed", chat: "Chat", load_more: "Load More", ad_image_label: "Part Image *", facebook_login: "Sign in with Facebook", store_label: "Store Name", store_name_placeholder: "e.g., Abdelkader Auto Parts", store_profile: "Store Profile", setup_store_profile: "Set Up Store Profile", store_name_label: "Store Name", store_logo_label: "Store Logo", save: "Save", profile_pic_label: "Profile Picture", update_profile_pic: "Update Picture",
        // New translations
        contact_us: "Contact Us",
        terms_of_service: "Terms of Service",
        terms_title: "Terms of Service",
        terms_last_updated: "Last Updated:",
        terms_intro_title: "1. Introduction",
        terms_intro_text: "Welcome to Piecety. By accessing or using our app, you agree to be bound by these terms. If you disagree with any part of these terms, please do not use our service.",
        terms_delete_account_policy: "You can delete your account at any time. Deleting your account will result in the permanent deletion of all your ads, messages, and personal data.",
        terms_use_title: "2. Use of the App",
        terms_use_text: "Piecety is an online marketplace for buying and selling car parts. You are responsible for all activity under your account. The app may only be used for lawful purposes and in a way that does not infringe on the rights of others.",
        terms_account_title: "3. User Accounts",
        terms_account_text: "You must be at least 18 years old to create an account. You are responsible for keeping your password and account secure. You agree not to share your account information or use it for any other person.",
        terms_content_title: "4. User Content",
        terms_content_text: "You are solely responsible for the content (ads, photos, messages) you post on the app. You warrant that you have the necessary rights to post this content and that it is not unlawful, threatening, defamatory, or obscene. Piecety reserves the right to remove any content deemed inappropriate.",
        terms_liability_title: "5. Limitation of Liability",
        terms_liability_text: "Piecety is provided 'as is'. We do not warrant that the service will be uninterrupted or without error. In no event shall Piecety be liable for any direct or indirect damages resulting from your use of the service.",
        terms_termination_title: "6. Account Termination",
        terms_termination_text: "We may terminate or suspend your account and access to the app, without prior notice or liability, for any reason whatsoever, including if you breach the Terms. You may delete your account at any time from your dashboard.",
        danger_zone: "Danger Zone",
        delete_account: "Delete My Account",
        delete_account_confirm: "Are you sure you want to delete your account? This action is irreversible and will permanently delete all your ads, messages, and personal data. This action is IRREVERSIBLE!",
        sub_categories_title: "Sub-categories for",
        back: "Back",
        edit_profile: "Edit Profile",
        name_label: "Name",
        write_review_placeholder: "Write your review here...",
        add_review: "Add a review",
        submit_review: "Submit Review",
        offer_btn_text: "Make Offer",
        offer_prompt: "Enter your offer price:",
        offer_sent: "Your offer has been sent.",
        recommendations: "Recommendations for you",
    },
    ar: {
        page_title: "Piecety - سوق قطع غيار السيارات في الجزائر", meta_description: "بيع وشراء قطع غيار السيارات في الجزائر مع Piecety، السوق الموثوق للقطع الجديدة والمستعملة.", fr_short: "FR", en_short: "EN", ar_short: "AR", menu: "القائمة", sell: "بيع", connect: "تسجيل الدخول", language: "اللغة", logout: "تسجيل الخروج", dashboard: "لوحة التحكم", nav_home: "الرئيسية", nav_search: "بحث", nav_profile: "ملفي", hero_title: "ابحث عن قطعة الغيار المناسبة لسيارتك", hero_subtitle: "أكثر أسواق قطع غيار السيارات ثقة في الجزائر.", categories_title: "فئات القطع", brands_title: "اختر ماركة", years_title: "اختر سنة", filters_title: "تصفية الإعلانات", all_brands: "جميع الماركات", all_models: "جميع الموديلات", all_years: "جميع السنوات", all_wilayas: "جميع الولايات", all_communes: "جميع البلديات", condition: "الحالة", any_condition: "الكل", new: "جديد", used: "مستعمل", apply_filters: "تطبيق الفلاتر", reset: "إعادة تعيين", search_placeholder: "ابحث عن قطعة...", submit_ad: "إرسال إعلان", ad_title_label: "عنوان القطعة *", ad_title_placeholder: "مثال: قرص فرامل أمامي", brand_label: "الماركة *", select_brand: "اختر ماركة", model_label: "الموديل", select_model: "اختر موديل", year_label: "السنة", select_year: "اختر سنة", wilaya_label: "الولاية *", select_wilaya: "اختر ولاية", commune_label: "البلدية", select_commune: "اختر بلدية", condition_label: "الحالة", price_label: "السعر (دج) *", price_placeholder: "مثال: 15000", description_label: "الوصف", description_placeholder: "معلومات إضافية...", submit_ad_btn_text: "إرسال", loading_text: "جاري الإرسال...", error_valid_title: "الرجاء إدخال عنوان صالح.", error_select_brand: "الرجاء اختيار ماركة.", error_select_wilaya: "الرجاء اختيار ولاية.", error_select_category: "الرجاء اختيار فئة.", error_valid_price: "الرجاء إدخال سعر صالح.", login_text: "تسجيل الدخول للوصول إلى جميع الميزات.", google_login: "تسجيل الدخول باستخدام Google", back_to_listings: "العودة إلى الإعلانات", add_to_cart: "أضف إلى السلة", cart_title: "سلة التسوق", cart_total: "الإجمالي", checkout_btn: "الدفع", no_listings: "لم يتم العثور على إعلانات.", your_cart_is_empty: "سلة التسوق فارغة.", remove: "حذف", quantity: "الكمية", item_total: "إجمالي السلعة", login_required: "يرجى تسجيل الدخول لاستخدام هذه الميزة.", show_filters: "إظهار الفلاتر", price_range: "نطاق السعر", all_categories: "جميع الفئات", category_label: "الفئة *", select_category: "اختر فئة", contact_seller: "اتصل بالبائع", clear_cart: "إفراغ السلة", ad_posted: "تم نشر إعلانك بنجاح!", ad_post_failed: "فشل نشر الإعلان.", item_added_to_cart: "تمت إضافة المنتج إلى السلة!", delete_ad_confirm: "هل أنت متأكد من أنك تريد حذف هذا الإعلان؟", sold_by: "البائع:", my_listings: "إعلاناتي", seller_listings: "إعلانات من هذا البائع", buyer_reviews: "تقييمات المشترين", reviews_soon: "(التقييمات قريبا)", reviews_soon_2: "ميزة التقييم ستكون متاحة قريبا.", messages: "الرسائل", loading_convos: "جاري تحميل المحادثات...", chat_with: "محادثة مع", type_message_placeholder: "اكتب رسالة...", recently_viewed: "شوهدت مؤخرا", chat: "محادثة", load_more: "تحميل المزيد", ad_image_label: "صورة القطعة *", facebook_login: "تسجيل الدخول باستخدام Facebook", store_label: "اسم المتجر", store_name_placeholder: "مثال: قطع غيار سيارات عبد القادر", store_profile: "ملف المتجر", setup_store_profile: "إعداد ملف المتجر", store_name_label: "اسم المتجر", store_logo_label: "شعار المتجر", save: "حفظ", profile_pic_label: "صورة الملف الشخصي", update_profile_pic: "تحديث الصورة",
        // New translations
        contact_us: "Contact Us",
        terms_of_service: "Terms of Service",
        terms_title: "Terms of Service",
        terms_last_updated: "Last Updated:",
        terms_intro_title: "1. Introduction",
        terms_intro_text: "Welcome to Piecety. By accessing or using our app, you agree to be bound by these terms. If you disagree with any part of these terms, please do not use our service.",
        terms_delete_account_policy: "You can delete your account at any time. Deleting your account will result in the permanent deletion of all your ads, messages, and personal data.",
        terms_use_title: "2. Use of the App",
        terms_use_text: "Piecety is an online marketplace for buying and selling car parts. You are responsible for all activity under your account. The app may only be used for lawful purposes and in a way that does not infringe on the rights of others.",
        terms_account_title: "3. User Accounts",
        terms_account_text: "You must be at least 18 years old to create an account. You are responsible for keeping your password and account secure. You agree not to share your account information or use it for any other person.",
        terms_content_title: "4. User Content",
        terms_content_text: "You are solely responsible for the content (ads, photos, messages) you post on the app. You warrant that you have the necessary rights to post this content and that it is not unlawful, threatening, defamatory, or obscene. Piecety reserves the right to remove any content deemed inappropriate.",
        terms_liability_title: "5. Limitation of Liability",
        terms_liability_text: "Piecety is provided 'as is'. We do not warrant that the service will be uninterrupted or without error. In no event shall Piecety be liable for any direct or indirect damages resulting from your use of the service.",
        terms_termination_title: "6. Account Termination",
        terms_termination_text: "We may terminate or suspend your account and access to the app, without prior notice or liability, for any reason whatsoever, including if you breach the Terms. You may delete your account at any time from your dashboard.",
        danger_zone: "Danger Zone",
        delete_account: "Delete My Account",
        delete_account_confirm: "Are you sure you want to delete your account? This action is irreversible and will permanently delete all your ads, messages, and personal data. This action is IRREVERSIBLE!",
        sub_categories_title: "Sub-categories for",
        back: "Back",
        edit_profile: "Edit Profile",
        name_label: "Name",
        write_review_placeholder: "Write your review here...",
        add_review: "Add a review",
        submit_review: "Submit Review",
        offer_btn_text: "Make Offer",
        offer_prompt: "Enter your offer price:",
        offer_sent: "Your offer has been sent.",
        recommendations: "Recommandations for you",
    }
};

// --- DATA ---
const categories = {
    "engine": { fr: "Moteur", en: "Engine", ar: "محرك", icon: "fa-cogs", sub: {
        "engine_mount": { fr: "Support moteur", en: "Engine Mount", ar: "حامل المحرك" },
        "turbo": { fr: "Turbo", en: "Turbocharger", ar: "شاحن توربيني" },
        "water_pump": { fr: "Pompe à eau", en: "Water Pump", ar: "مضخة الماء" },
        "head_gasket": { fr: "Joint de culasse", en: "Head Gasket", ar: "حشية رأس الأسطوانة" }
    }},
    "brakes": { fr: "Freins", en: "Brakes", ar: "مكابح", icon: "fa-car", sub: {
        "brake_discs": { fr: "Disques de frein", en: "Brake Discs", ar: "أقراص الفرامل" },
        "brake_pads": { fr: "Plaquettes de frein", en: "Brake Pads", ar: "وسادات الفرامل" },
        "brake_caliper": { fr: "Étrier de frein", en: "Brake Caliper", ar: "فكي الفرامل" }
    }},
    "filters": { fr: "Filtres", en: "Filters", ar: "فلاتر", icon: "fa-filter", sub: {
        "oil_filter": { fr: "Filtre à huile", en: "Oil Filter", ar: "فلتر الزيت" },
        "air_filter": { fr: "Filtre à air", en: "Air Filter", ar: "فلتر الهواء" },
        "cabin_filter": { fr: "Filtre d'habitacle", en: "Cabin Filter", ar: "فلتر المقصورة" },
        "fuel_filter": { fr: "Filtre à carburant", en: "Fuel Filter", ar: "فلتر الوقود" }
    }},
    "suspension": { fr: "Suspension", en: "Suspension", ar: "نظام التعليق", icon: "fa-car-side", sub: {
        "shock_absorber": { fr: "Amortisseur", en: "Shock Absorber", ar: "ممتص الصدمات" },
        "suspension_arm": { fr: "Bras de suspension", en: "Suspension Arm", ar: "ذراع التحكم" },
        "wheel_bearing": { fr: "Roulement de roue", en: "Wheel Bearing", ar: "محمل العجلة" }
    }},
    "electrical": { fr: "Électrique", en: "Electrical", ar: "كهربائي", icon: "fa-bolt", sub: {
        "alternator": { fr: "Alternateur", en: "Alternator", ar: "مولد" },
        "battery": { fr: "Batterie", en: "Battery", ar: "بطارية" },
        "starter": { fr: "Démarreur", en: "Starter", ar: "بادئ التشغيل" },
        "spark_plugs": { fr: "Bougies d'allumage", en: "Spark Plugs", ar: "شمعات الإشعال" }
    }},
    "body": { fr: "Carrosserie", en: "Body", ar: "هيكل السيارة", icon: "fa-car-side", sub: {
        "headlights": { fr: "Phares", en: "Headlights", ar: "المصابيح الأمامية" },
        "rear_lights": { fr: "Feux arrière", en: "Rear Lights", ar: "المصابيح الخلفية" },
        "mirror": { fr: "Rétroviseur", en: "Mirror", ar: "مرآة" },
        "wiper_blades": { fr: "Balais d'essuie-glace", en: "Wiper Blades", ar: "شفرات المساحات" }
    }}
};
const wilayas = {
    "Adrar": ["Adrar", "Charouine", "Reggane", "Aoulef", "Timimoun", "Bordj Badji Mokhtar", "In Salah"], "Chlef": ["Chlef", "Ténès", "Ouled Farès", "El Marsa", "Oued Fodda"], "Laghouat": ["Laghouat", "Aflou", "Aïn Madhi", "Ksar El Hirane", "Hassi R'Mel"], "Oum El Bouaghi": ["Oum El Bouaghi", "Aïn Beïda", "Aïn M'lila", "F'kirina", "Souk Naamane"], "Batna": ["Batna", "Barika", "Arris", "Merouana", "Timgad"], "Béjaïa": ["Béjaïa", "Akbou", "El Kseur", "Sidi Aïch", "Aokas"], "Biskra": ["Biskra", "Tolga", "Sidi Okba", "El Kantara", "Ouled Djellal"], "Béchar": ["Béchar", "Kenadsa", "Beni Ounif", "Taghit", "Abadla"], "Blida": ["Blida", "Boufarik", "Larbaâ", "Meftah", "Mouzaia"], "Bouira": ["Bouira", "Lakhdaria", "Sour El Ghozlane", "Aïn Bessem", "M'chedallah"], "Tamanrasset": ["Tamanrasset", "In Salah", "In Guezzam", "Djanet"], "Tébessa": ["Tébessa", "Bir El Ater", "Cheria", "El Aouinet", "Ouenza"], "Tlemcen": ["Tlemcen", "Maghnia", "Ghazaouet", "Remchi", "Nedroma"], "Tiaret": ["Tiaret", "Frenda", "Sougueur", "Ksar Chellala", "Mahdia"], "Tizi Ouzou": ["Tizi Ouzou", "Azazga", "Draâ Ben Khedda", "Tigzirt", "Larbaâ Nath Irathen"], "Alger": ["Alger Centre", "Bab El Oued", "Hussein Dey", "Kouba", "El Harrach", "Dar El Beïda"], "Djelfa": ["Djelfa", "Messaad", "Aïn Oussera", "Hassi Bahbah", "El Idrissia"], "Jijel": ["Jijel", "Taher", "El Milia", "Chekfa", "Ziama Mansouriah"], "Sétif": ["Sétif", "El Eulma", "Aïn Oulmane", "Bougaâ", "Beni Ouartilane"], "Saïda": ["Saïda", "Aïn El Hadjar", "Sidi Boubkeur", "Youb", "Ouled Brahim"], "Skikda": ["Skikda", "Azzaba", "Collo", "El Harrouch", "Ramdane Djamel"], "Sidi Bel Abbès": ["Sidi Bel Abbès", "Telagh", "Sfisef", "Ras El Ma", "Ben Badis"], "Annaba": ["Annaba", "El Bouni", "El Hadjar", "Sidi Amar", "Berrahal"], "Guelma": ["Guelma", "Oued Zenati", "Héliopolis", "Bouchegouf", "Ain Reggada"], "Constantine": ["Constantine", "El Khroub", "Hamma Bouziane", "Didouche Mourad", "Aïn Smara"], "Médéa": ["Médéa", "Berrouaghia", "Ksar Boukhari", "Tablat", "Aïn Boucif"], "Mostaganem": ["Mostaganem", "Sidi Ali", "Achaacha", "Hassi Mameche", "Aïn Tédelès"], "M'Sila": ["M'Sila", "Bou Saâda", "Sidi Aïssa", "Aïn El Melh", "Magra"], "Mascara": ["Mascara", "Tighennif", "Sig", "Ghriss", "Mohammadia"], "Ouargla": ["Ouargla", "Hassi Messaoud", "Touggourt", "Rouissat", "N'Goussa"], "Oran": ["Oran", "Es Senia", "Arzew", "Bir El Djir", "Aïn El Turk"], "El Bayadh": ["El Bayadh", "Bougtob", "Brezina", "Rogassa", "El Abiodh Sidi Cheikh"], "Illizi": ["Illizi", "Djanet", "In Amenas", "Bordj Omar Driss"], "Bordj Bou Arréridj": ["Bordj Bou Arréridj", "Ras El Oued", "Mansoura", "Medjana", "El Achir"], "Boumerdès": ["Boumerdès", "Boudouaou", "Dellys", "Réghaïa", "Isser"], "El Tarf": ["El Tarf", "El Kala", "Ben M'Hidi", "Besbes", "Dréan"], "Tindouf": ["Tindouf", "Oum El Assel"], "Tissemsilt": ["Tissemsilt", "Théniet El Had", "Lardjem", "Bordj Bounaama", "Ammi Moussa"], "El Oued": ["El Oued", "Guemar", "Debila", "Robbah", "El M'Ghair"], "Khenchela": ["Khenchela", "Kais", "Chechar", "Ouled Rechache", "El Hamma"], "Souk Ahras": ["Souk Ahras", "M'daourouch", "Sedrata", "Taoura", "Heddada"], "Tipaza": ["Tipaza", "Cherchell", "Koléa", "Hadjout", "Fouka"], "Mila": ["Mila", "Ferdjioua", "Grarem Gouga", "Tadjenanet", "Chelghoum Laïd"], "Aïn Defla": ["Aïn Defla", "Khemis Miliana", "Miliana", "El Attaf", "Djelida"], "Naâma": ["Naâma", "Mécheria", "Aïn Sefra", "Sfissifa", "Moghrar"], "Aïn Témouchent": ["Aïn Témouchent", "Béni Saf", "Hammam Bou Hadjar", "El Malah", "Aghlal"], "Ghardaïa": ["Ghardaïa", "Metlili", "El Guerrara", "Berriane", "Bounoura"], "Relizane": ["Relizane", "Oued Rhiou", "Mazouna", "Ammi Moussa", "Zemmoura"], "El M'ghair": ["El M'ghair", "Djamaa", "Sidi Amrane", "Oum Toub"], "El Meniaa": ["El Meniaa", "Hassi Gara", "Mansourah"],
};
const car_data = {
    "Toyota": ["Yaris", "Corolla", "Camry", "Land Cruiser", "Hilux"], "Peugeot": ["208", "308", "301", "2008", "3008", "508"], "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta"], "Renault": ["Clio", "Megane", "Captur", "Duster", "Symbol"], "Hyundai": ["i10", "i20", "Accent", "Tucson", "Santa Fe"], "Nissan": ["Micra", "Sentra", "Qashqai", "X-Trail", "Juke"], "Fiat": ["Panda", "500", "Tipo", "Punto"], "Citroën": ["C3", "C4", "Berlingo", "C-Elysée"], "Kia": ["Picanto", "Rio", "Sportage", "Sorento"], "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC"]
};
const brand_icons = {
    "Toyota": "icons/toyota.png", "Peugeot": "icons/peugeot.png", "Volkswagen": "icons/volkswagen.png", "Renault": "icons/renault.png", "Hyundai": "icons/hyundai.png", "Nissan": "icons/nissan.png", "Fiat": "icons/fiat.png", "Citroën": "icons/citroen.png", "Kia": "icons/kia.png", "Mercedes-Benz": "icons/mercedes.png"
};
const currentYear = new Date().getFullYear();
const years = Array.from({length: currentYear - 1979}, (_, i) => (currentYear - i).toString());

// --- DOM ELEMENTS ---
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
    facebookLoginBtn: document.getElementById("facebook-login-btn"),
    cartBtn: document.getElementById("cart-btn"),
    cartCountSpan: document.getElementById("cart-count"),
    authLinksContainer: document.getElementById("auth-links"),
    homeLink: document.getElementById("home-link"),
    sellLink: document.getElementById("sell-link"),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    postProductBrandSelect: document.getElementById('product-brand'),
    postProductModelSelect: document.getElementById('product-model'),
    postProductYearSelect: document.getElementById('product-year'),
    postProductWilayaSelect: document.getElementById('product-wilaya'),
    postProductCommuneSelect: document.getElementById('product-commune'),
    postProductCategorySelect: document.getElementById('product-category'),
    postProductConditionSelect: document.getElementById('product-condition'),
    postProductImageInput: document.getElementById('product-image'),
    liveRegion: document.getElementById('live-region'),
    searchSuggestions: document.getElementById('search-suggestions')
};

// --- UTILITY FUNCTIONS ---
const announceToScreenReader = (message) => {
  if (DOMElements.liveRegion) {
    DOMElements.liveRegion.textContent = message;
    setTimeout(() => {
      DOMElements.liveRegion.textContent = '';
    }, 1000);
  }
};

const showMessage = (msgKey, duration = 3500, type = "info") => {
    const msg = translations[currentLang][msgKey] || msgKey;
    const { messageBox } = DOMElements;
    if (!messageBox) return;
    messageBox.textContent = msg;
    announceToScreenReader(msg);

    messageBox.className = `fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out max-w-sm break-words`;
    
    let colors = type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    messageBox.classList.add(...colors.split(' '));

    requestAnimationFrame(() => {
        messageBox.classList.remove('opacity-0', 'translate-x-full');
        messageBox.classList.add('opacity-100', 'translate-x-0');
    });

    setTimeout(() => {
        messageBox.classList.remove('opacity-100', 'translate-x-0');
        messageBox.classList.add('opacity-0', 'translate-x-full');
    }, duration);
};

const toggleModal = (modalElement, show) => {
    if (show) {
        modalElement.classList.remove('invisible', 'opacity-0');
    } else {
        modalElement.classList.add('invisible', 'opacity-0');
    }
};

const updateCartDisplay = () => {
   const { cartCountSpan } = DOMElements;
   const mobileCartCount = document.getElementById('mobile-cart-count');
   const cartItemCount = Object.values(userCart).reduce((sum, item) => sum + item.quantity, 0);

   [cartCountSpan, mobileCartCount].forEach(el => {
       if (el) {
           el.textContent = cartItemCount;
           el.classList.toggle('hidden', cartItemCount === 0);
       }
   });
};

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

const trackUserInteraction = (productId, interactionType) => {
  if (!currentUser) return;
  
  if (!userInteractions[currentUser.uid]) {
    userInteractions[currentUser.uid] = {
      viewed: [],
      searched: [],
      purchased: []
    };
  }
  
  const interactionData = { productId, timestamp: Date.now() };
  userInteractions[currentUser.uid][interactionType].push(interactionData);
  localStorage.setItem('userInteractions', JSON.stringify(userInteractions));
};

const getRecommendations = async () => {
  if (!currentUser || !userInteractions[currentUser.uid]) return [];
  
  const userData = userInteractions[currentUser.uid];
  const viewedProducts = userData.viewed || [];
  if (viewedProducts.length === 0) return [];

  const viewedProductIds = viewedProducts.map(i => i.productId);
  const q = query(collection(db, "products"), 
    where("id", "in", viewedProductIds));
  
  try {
    const snapshots = await getDocs(q);
    const categories = [...new Set(snapshots.docs.map(doc => doc.data().category).filter(Boolean))];
    
    if (categories.length === 0) return [];

    const recsQuery = query(collection(db, "products"), 
      where("category", "in", categories.slice(0, 10)),
      orderBy("createdAt", "desc"),
      limit(10));
    
    const recsSnapshot = await getDocs(recsQuery);
    return recsSnapshot.docs.filter(doc => !viewedProductIds.includes(doc.id)).map(doc => ({ id: doc.id, ...doc.data() }));

  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

// --- MOBILE MENU CONTROL ---
let touchStartX = 0;
let touchEndX = 0;

const openMobileMenu = () => {
    DOMElements.mobileMenu.classList.remove('-translate-x-full');
    DOMElements.mobileMenuBackdrop.classList.remove('invisible', 'opacity-0');
};

const closeMobileMenu = () => {
    DOMElements.mobileMenu.classList.add('-translate-x-full');
    DOMElements.mobileMenuBackdrop.classList.add('invisible', 'opacity-0');
};

const handleSwipe = () => {
    if (touchEndX < touchStartX - 50) {
        if (!DOMElements.mobileMenu.classList.contains('-translate-x-full')) {
            closeMobileMenu();
        }
    }
    if (touchEndX > touchStartX + 50) {
        if (DOMElements.mobileMenu.classList.contains('-translate-x-full')) {
            openMobileMenu();
        }
    }
};

// --- APP LOGIC ---
const setDarkMode = (isDark) => {
    DOMElements.html.classList.toggle('dark', isDark);
    localStorage.setItem('piecety_dark_mode', isDark);
    DOMElements.darkModeToggle.querySelector('i').className = isDark ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
};

const setLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem("piecety_lang", lang);
    translatePage(lang);
    updateTitle(currentView);
    if (currentView) {
        renderView(currentView);
    }
};

const updateTitle = (view) => {
    const titleKeyMap = { cart: "cart_title", dashboard: "dashboard", inbox: "messages", chat: "messages", terms: "terms_title" };
    const titleKey = titleKeyMap[view] || "page_title";
    document.title = translations[currentLang][titleKey] || "Piecety";
    document.querySelector('meta[name="description"]').setAttribute("content", translations[currentLang]["meta_description"]);
};

const translatePage = (lang) => {
    const { html } = DOMElements;
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    html.setAttribute("lang", lang);

    document.getElementById("current-lang").textContent = translations[lang]?.[`${lang}_short`] || lang.toUpperCase();
    
    document.querySelectorAll("[data-i18n-key]").forEach(el => {
        const key = el.dataset.i18nKey;
        if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[lang]?.[key]) el.placeholder = translations[lang][key];
    });
};

const populateSelect = (selectEl, options, defaultLabelKey, lang, valueAsKey = false) => {
    if (!selectEl) return;
    const currentValue = selectEl.value;
    selectEl.innerHTML = `<option value="">${translations[lang][defaultLabelKey]}</option>`;
    
    const optionData = Array.isArray(options) ? options.sort() : Object.keys(options).sort();
    
    optionData.forEach(opt => {
        const value = valueAsKey ? opt : opt;
        const text = valueAsKey ? (options[opt][lang] || options[opt]['fr']) : opt;
        selectEl.innerHTML += `<option value="${value}">${text}</option>`;
    });
    selectEl.value = currentValue;
};

const applyAndRenderFilters = () => {
    const params = {};
    const filtersContainer = document.getElementById('filters-content') || document;
    
    filtersContainer.querySelectorAll('.filter').forEach(el => {
        const key = el.id.replace('-filter', '');
        if (el.value && !(el.type === 'range' && el.value === el.max)) {
            params[key] = el.value;
        }
    });
    params.search = DOMElements.searchInput.value;
    
    trackUserInteraction(null, 'searched');

    const newUrl = new URL(window.location);
    newUrl.search = new URLSearchParams(params).toString();
    window.history.replaceState({ path: newUrl.href }, '', newUrl.href);
    
    lastVisibleProduct = null;
    renderListings();
};

const applyFiltersFromURL = (container = document) => {
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
        const el = container.querySelector(`#${key}-filter`);
        if (el) {
            el.value = value;
            if (key === 'brand' || key === 'wilaya') {
                el.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    const childKey = key === 'brand' ? 'model' : 'commune';
                    const childVal = params.get(childKey);
                    if (childVal) {
                        const childEl = container.querySelector(`#${childKey}-filter`);
                        if (childEl) childEl.value = childVal;
                    }
                }, 100);
            }
        }
    });
    DOMElements.searchInput.value = params.get('search') || '';
};

// --- VIEW RENDERING ---
const updateBottomNav = (viewName) => {
    const navLinks = {
        home: document.getElementById('nav-home'),
        search: document.getElementById('nav-search'),
        sell: document.getElementById('nav-sell'),
        inbox: document.getElementById('nav-messages'),
        dashboard: document.getElementById('nav-profile'),
        profile: document.getElementById('nav-profile') 
    };
    Object.values(navLinks).forEach(link => {
        if (link) {
            link.classList.remove('text-blue-600', 'dark:text-blue-400');
            link.classList.add('text-gray-600', 'dark:text-gray-300');
        }
    });
    const activeLink = navLinks[viewName];
    if (activeLink) {
        activeLink.classList.remove('text-gray-600', 'dark:text-gray-300');
        activeLink.classList.add('text-blue-600', 'dark:text-blue-400');
    }
};

const renderView = (viewName, data = null) => {
    if (productsUnsubscribe) productsUnsubscribe();
    if (chatsUnsubscribe) chatsUnsubscribe();
    if (messagesListener) messagesListener();
    DOMElements.appContainer.innerHTML = '';
    
    const route = viewName.split('/')[0];
    updateTitle(route, data);

    const templateId = `${route}-view-template`;
    const template = document.getElementById(templateId);

    if (template) {
        DOMElements.appContainer.appendChild(template.content.cloneNode(true));
        const renderFunction = window[`render${route.charAt(0).toUpperCase() + route.slice(1)}Page`];
        if (typeof renderFunction === 'function') {
            renderFunction(data);
        }
    } else {
        renderView('home');
        return;
    }
    
    currentView = viewName;
    updateBottomNav(route);
    window.scrollTo(0, 0);
    translatePage(currentLang);
};

window.renderHomePage = async () => {
    updateBreadcrumb();
    const params = new URLSearchParams(window.location.search);
    if (params.get('brand')) renderYearCategories(params.get('brand'), params.get('model'), params.get('category'));
    else if (params.get('sub_category')) renderBrandCategories(params.get('sub_category'));
    else if (params.get('category')) renderSubCategories(params.get('category'));
    else renderPartCategories();
    
    renderRecentlyViewed();
    renderRecommendations();

    const setupFilters = (container) => {
        container.innerHTML = document.getElementById('filters-template').content.cloneNode(true).innerHTML;
        setupFilterListeners(container);
        applyFiltersFromURL(container);
    };

    setupFilters(document.getElementById('filters-content'));
    setupFilters(DOMElements.mobileFiltersContent);

    document.getElementById('show-filters-btn')?.addEventListener('click', () => {
        DOMElements.mobileFiltersModal.classList.remove('translate-x-full');
    });
    
    renderListings();
};

const updateBreadcrumb = () => {
    const breadcrumbNav = document.getElementById('breadcrumb-nav');
    if (!breadcrumbNav) return;

    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const sub_category = params.get('sub_category');
    const brand = params.get('brand');
    const model = params.get('model');
    const year = params.get('year');

    let html = `<a href="#" class="hover:underline home-crumb" data-route="home">${translations[currentLang].nav_home}</a>`;
    if (category) {
        const catName = categories[category]?.[currentLang] || category;
        html += ` <span class="mx-2">/</span> <a href="#" class="hover:underline category-crumb" data-route="home" data-category="${category}">${catName}</a>`;
    }
    if (sub_category) {
        const subCatName = categories[category]?.sub[sub_category]?.[currentLang] || sub_category;
        html += ` <span class="mx-2">/</span> <a href="#" class="hover:underline sub-category-crumb" data-route="home" data-category="${category}" data-sub-category="${sub_category}">${subCatName}</a>`;
    }
    if (brand) {
        html += ` <span class="mx-2">/</span> <a href="#" class="hover:underline brand-crumb" data-route="home" data-category="${category}" data-sub-category="${sub_category}" data-brand="${brand}">${brand}</a>`;
    }
    if (model) {
        html += ` <span class="mx-2">/</span> <a href="#" class="hover:underline model-crumb" data-route="home" data-category="${category}" data-sub-category="${sub_category}" data-brand="${brand}" data-model="${model}">${model}</a>`;
    }
    if (year) {
        html += ` <span class="mx-2">/</span> <span class="font-semibold">${year}</span>`;
    }
    
    breadcrumbNav.innerHTML = html;
    
    breadcrumbNav.querySelectorAll('a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const newUrl = new URL(window.location.origin + window.location.pathname);
            if (e.target.dataset.category) newUrl.searchParams.set('category', e.target.dataset.category);
            if (e.target.dataset.subCategory) newUrl.searchParams.set('sub_category', e.target.dataset.subCategory);
            if (e.target.dataset.brand) newUrl.searchParams.set('brand', e.target.dataset.brand);
            if (e.target.dataset.model) newUrl.searchParams.set('model', e.target.dataset.model);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            renderHomePage();
        };
    });
};

const renderDynamicGrid = (titleKey, items, cardGenerator, clickHandler) => {
    const grid = document.getElementById('dynamic-grid');
    const titleEl = document.getElementById('categories-title-heading');
    if (!grid || !titleEl) return;

    titleEl.textContent = translations[currentLang][titleKey];
    grid.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('a');
        card.href = "#";
        card.className = "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center category-card flex flex-col items-center justify-center";
        card.innerHTML = cardGenerator(item);
        card.addEventListener('click', (e) => clickHandler(e, item));
        grid.appendChild(card);
    });
};

const renderPartCategories = () => {
    renderDynamicGrid('categories_title', Object.entries(categories), 
        ([key, cat]) => `
            <div class="p-4 rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 mx-auto w-16 h-16 flex items-center justify-center mb-2 category-icon">
                <i class="fas ${cat.icon} text-3xl"></i>
            </div>
            <h3 class="font-semibold text-sm md:text-base">${cat[currentLang]}</h3>`,
        (e, [key]) => {
            e.preventDefault();
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('category', key);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            renderHomePage();
        }
    );
};

const renderSubCategories = (categoryKey) => {
    const subCategories = categories[categoryKey]?.sub;
    if (!subCategories) { renderPartCategories(); return; }
    
    renderDynamicGrid(`sub_categories_title`, Object.entries(subCategories),
        ([key, subCat]) => `
            <div class="p-4 rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 mx-auto w-16 h-16 flex items-center justify-center mb-2 category-icon">
                <i class="fas fa-tools text-3xl"></i>
            </div>
            <h3 class="font-semibold text-sm md:text-base">${subCat[currentLang]}</h3>`,
        (e, [key]) => {
            e.preventDefault();
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('sub_category', key);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            renderHomePage();
        }
    );
};

const renderBrandCategories = (subCategoryKey) => {
    renderDynamicGrid('brands_title', Object.entries(car_data), 
        ([brandName]) => `
            <img src="${brand_icons[brandName] || 'icons/car-192.png'}" alt="${brandName}" class="h-16 object-contain mb-2" onerror="this.src='icons/car-192.png'">
            <h3 class="font-semibold text-sm md:text-base">${brandName}</h3>`,
        (e, [brandName]) => {
            e.preventDefault();
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('brand', brandName);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            renderHomePage();
        }
    );
};

const renderYearCategories = (brand, model) => {
    renderDynamicGrid('years_title', years, 
        (year) => `<span class="font-semibold">${year}</span>`,
        (e, year) => {
            e.preventDefault();
            ['#filters-content #year-filter', '#mobile-filters-content #year-filter'].forEach(selector => {
                const el = document.querySelector(selector);
                if (el) el.value = year;
            });
            applyAndRenderFilters();
            document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    );
};

const setupFilterListeners = (container = document) => {
    const debouncedApply = debounce(applyAndRenderFilters, 300);

    const brandFilter = container.querySelector('#brand-filter');
    brandFilter?.addEventListener('change', () => {
        const modelContainer = container.querySelector('#model-filter-container');
        const modelFilter = container.querySelector('#model-filter');
        const selectedBrand = brandFilter.value;
        if (selectedBrand && car_data[selectedBrand]) {
            populateSelect(modelFilter, car_data[selectedBrand], 'all_models', currentLang);
            modelContainer.classList.remove('hidden');
        } else {
            modelContainer.classList.add('hidden');
            if(modelFilter) modelFilter.value = '';
        }
        debouncedApply();
    });
    
    const wilayaFilter = container.querySelector('#wilaya-filter');
    wilayaFilter?.addEventListener('change', () => {
        const communeContainer = container.querySelector('#commune-filter-container');
        const communeFilter = container.querySelector('#commune-filter');
        const selectedWilaya = wilayaFilter.value;
        if (selectedWilaya && wilayas[selectedWilaya]) {
            populateSelect(communeFilter, wilayas[selectedWilaya], 'all_communes', currentLang);
            communeContainer.classList.remove('hidden');
        } else {
            communeContainer.classList.add('hidden');
            if(communeFilter) communeFilter.value = '';
        }
        debouncedApply();
    });
    
    const priceFilter = container.querySelector('#price-range-filter');
    if (priceFilter) {
        priceFilter.addEventListener('input', () => {
            container.querySelector('#price-range-value').textContent = `${Number(priceFilter.value).toLocaleString()} DA`;
        });
        priceFilter.addEventListener('change', debouncedApply);
    }
    
    container.querySelectorAll('.filter:not(#brand-filter):not(#wilaya-filter):not(#price-range-filter)').forEach(el => {
        el.addEventListener('change', debouncedApply);
    });
    
    container.querySelector('#filter-reset-btn')?.addEventListener('click', () => {
        window.history.pushState({}, '', window.location.pathname);
        renderView('home');
    });

    populateSelect(brandFilter, car_data, 'all_brands', currentLang);
    populateSelect(container.querySelector('#year-filter'), years, 'all_years', currentLang);
    populateSelect(wilayaFilter, wilayas, 'all_wilayas', currentLang);
    populateSelect(container.querySelector('#category-filter'), categories, 'all_categories', currentLang, true);
};

const renderListings = async (loadMore = false) => {
    const listingsSection = document.getElementById('listings-section');
    const loadMoreContainer = document.getElementById('load-more-container');
    const recommendationsSection = document.getElementById('recommendations-section');
    if (!listingsSection || isFetching) return;

    isFetching = true;
    if (!loadMore) {
        listingsSection.innerHTML = `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>`.repeat(8);
        lastVisibleProduct = null;
        if (recommendationsSection) recommendationsSection.classList.add('hidden');
    }
    if (loadMoreContainer) loadMoreContainer.innerHTML = '';

    const params = new URLSearchParams(window.location.search);
    const filters = {};
    params.forEach((value, key) => {
        if (['category', 'sub_category', 'brand', 'model', 'year', 'wilaya', 'condition'].includes(key)) {
            filters[key] = value;
        }
    });

    const searchQuery = DOMElements.searchInput.value.trim().toLowerCase();
    
    let baseQuery = collection(db, "products");
    
    for (const key in filters) {
        baseQuery = query(baseQuery, where(key, "==", filters[key]));
    }
    
    let finalQuery = query(baseQuery, orderBy("createdAt", "desc"));
    if (loadMore && lastVisibleProduct) {
        finalQuery = query(finalQuery, startAfter(lastVisibleProduct));
    }
    finalQuery = query(finalQuery, limit(PRODUCTS_PER_PAGE));

    try {
        const snapshot = await getDocs(finalQuery);
        let productsToShow = snapshot.docs;

        if (searchQuery) {
            productsToShow = productsToShow.filter(doc => {
                const product = doc.data();
                return product.title.toLowerCase().includes(searchQuery) || 
                       (product.description && product.description.toLowerCase().includes(searchQuery));
            });
        }
        
        if (!loadMore) listingsSection.innerHTML = '';
        if (productsToShow.length === 0 && !loadMore) {
            listingsSection.innerHTML = `<p class="col-span-full text-center p-8 text-lg text-gray-500" data-i18n-key="no_listings"></p>`;
            const recs = await getRecommendations();
            if (recs.length > 0 && recommendationsSection) {
                recommendationsSection.classList.remove('hidden');
                displayProducts(recs, document.getElementById('recommendations-grid'));
            }
        } else {
            displayProducts(productsToShow.map(p => ({ id: p.id, ...p.data() })), listingsSection);
            lastVisibleProduct = snapshot.docs[snapshot.docs.length - 1];
            if (snapshot.docs.length === PRODUCTS_PER_PAGE && loadMoreContainer) {
                loadMoreContainer.innerHTML = `<button id="load-more-btn" class="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors" data-i18n-key="load_more"></button>`;
                document.getElementById('load-more-btn').onclick = () => renderListings(true);
            }
        }
        translatePage(currentLang);
    } catch (error) {
        console.error("❌ Error loading products:", error);
        listingsSection.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading products: ${error.message}</p>`;
    } finally {
        isFetching = false;
    }
};

const displayProducts = (docs, container) => {
  if (!container) return;
  if (docs.length === 0 && container.innerHTML === '') {
    container.innerHTML = `<p class="col-span-full text-center p-8 text-lg text-gray-500" data-i18n-key="no_listings"></p>`;
    return;
  }
  
  docs.forEach(product => {
    const id = product.id;
    const card = document.createElement('div');
    card.className = "listing-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col";

    const isMyProduct = currentUser && currentUser.uid === product.sellerId;

    card.innerHTML = `
      <picture>
        <source srcset="${product.imageUrl.replace(/\.(png|jpe?g)$/i, '.webp')}" type="image/webp">
        <img loading="lazy" src="${product.imageUrl || './assets/placeholder.png'}" alt="${product.title || ''}" class="w-full h-40 object-cover cursor-pointer product-image">
      </picture>
      <div class="p-4 flex flex-col flex-grow">
        <h3 class="font-bold text-lg truncate product-title cursor-pointer">${product.title || ''}</h3>
        <p class="text-blue-600 dark:text-blue-400 font-semibold text-xl my-2">${(product.price||0).toLocaleString()} DA</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4"><i class="fas fa-map-marker-alt mr-1"></i> ${product.wilaya || ''}${product.commune ? `, ${product.commune}` : ''}</p>
        <div class="mt-auto">
          ${!isMyProduct ? `<button class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 chat-btn"><i class="fas fa-comments"></i> <span data-i18n-key="chat"></span></button>` : ''}
        </div>
      </div>
    `;

    const imgEl = card.querySelector('.product-image');
    const titleEl = card.querySelector('.product-title');

    if (imgEl) imgEl.onclick = () => renderView('product', product);
    if (titleEl) titleEl.onclick = () => renderView('product', product);

    if (!isMyProduct) {
      const chatBtn = card.querySelector('.chat-btn');
      if (chatBtn) chatBtn.onclick = () => startOrOpenChat(product.sellerId, product.sellerName, product.id);
    }

    container.appendChild(card);
  });
};

const renderRecommendations = async () => {
    const section = document.getElementById('recommendations-section');
    const grid = document.getElementById('recommendations-grid');
    if (!section || !grid) return;

    grid.innerHTML = '';
    const recommendations = await getRecommendations();
    if (recommendations.length > 0) {
        section.classList.remove('hidden');
        displayProducts(recommendations, grid);
    } else {
        section.classList.add('hidden');
    }
};

window.renderProductPage = async (product) => {
    if (!product) { renderView('home'); return; }
    
    trackUserInteraction(product.id, 'viewed');

    recentlyViewed = [product.id, ...recentlyViewed.filter(id => id !== product.id)].slice(0, 4);
    localStorage.setItem('piecety_recently_viewed', JSON.stringify(recentlyViewed));
    
    document.getElementById('product-title-detail').textContent = product.title;
    document.getElementById('product-price-detail').textContent = `${product.price.toLocaleString()} DA`;
    document.getElementById('product-image-detail').src = product.imageUrl || './assets/placeholder.png';
    document.getElementById('product-image-webp').srcset = product.imageUrl.replace(/\.(png|jpe?g)$/i, '.webp');
    document.getElementById('product-brand-detail').textContent = product.brand;
    document.getElementById('product-model-detail').textContent = product.model || 'N/A';
    document.getElementById('product-year-detail').textContent = product.year || 'N/A';
    document.getElementById('product-wilaya-detail').textContent = product.wilaya;
    document.getElementById('product-commune-detail').textContent = product.commune || 'N/A';
    document.getElementById('product-description-detail').textContent = product.description || 'No description available.';

    const sellerLink = document.getElementById('seller-profile-link');
    sellerLink.textContent = product.sellerName || 'Anonymous';
    sellerLink.onclick = (e) => {
        e.preventDefault();
        renderView('profile', { userId: product.sellerId, userName: product.sellerName });
    };

    document.getElementById('back-to-listings-btn').onclick = () => window.history.back();
    document.getElementById('add-to-cart-btn').onclick = () => addToCart(product);
    document.getElementById('contact-seller-btn').onclick = () => startOrOpenChat(product.sellerId, product.sellerName, product.id);

    renderProductReviews(product.id);
    if(currentUser) {
        renderAddReviewSection(product.id);
    }
};

const renderProductReviews = async (productId) => {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    reviewsList.innerHTML = `<p class="text-center text-gray-500">Loading reviews...</p>`;
    
    try {
        const q = query(collection(db, "reviews"), where("productId", "==", productId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        reviewsList.innerHTML = '';
        if (snapshot.empty) {
            reviewsList.innerHTML = `<p class="text-gray-500 dark:text-gray-400" data-i18n-key="reviews_soon_2"></p>`;
        } else {
            snapshot.forEach(doc => {
                const review = doc.data();
                const reviewEl = document.createElement('div');
                reviewEl.className = 'border-b dark:border-gray-700 pb-2 mb-2';
                reviewEl.innerHTML = `
                    <div class="flex items-center text-sm font-semibold mb-1">
                        <span>${review.reviewerName}</span>
                        <span class="ml-2">${renderStarRating(review.rating).outerHTML}</span>
                    </div>
                    <p class="text-sm">${review.review}</p>
                `;
                reviewsList.appendChild(reviewEl);
            });
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        reviewsList.innerHTML = `<p class="text-red-500">Could not load reviews.</p>`;
    }
    translatePage(currentLang);
};

const renderStarRating = (rating) => {
    const container = document.createElement('span');
    container.className = 'flex items-center text-yellow-500';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = `fas fa-star ${i > rating ? 'text-gray-300 dark:text-gray-600' : ''}`;
        container.appendChild(star);
    }
    return container;
};

const renderAddReviewSection = (productId) => {
    const section = document.getElementById('add-review-section');
    if (!section) return;
    section.classList.remove('hidden');

    const starsContainer = document.getElementById('rating-stars');
    const reviewTextarea = document.getElementById('review-text');
    const submitBtn = document.getElementById('submit-review-btn');
    let selectedRating = 0;

    starsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star text-2xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
        star.dataset.rating = i;
        star.onclick = () => {
            selectedRating = i;
            starsContainer.querySelectorAll('i').forEach(s => s.classList.toggle('text-yellow-500', s.dataset.rating <= selectedRating));
        };
        starsContainer.appendChild(star);
    }

    submitBtn.onclick = async () => {
        if (selectedRating === 0) {
            showMessage("Please select a rating.", 3000, "error");
            return;
        }
        if (reviewTextarea.value.trim().length < 10) {
            showMessage("Please write a more detailed review.", 3000, "error");
            return;
        }

        submitBtn.disabled = true;
        try {
            await addDoc(collection(db, "reviews"), {
                productId,
                userId: currentUser.uid,
                reviewerName: currentUser.displayName,
                rating: selectedRating,
                review: reviewTextarea.value.trim(),
                createdAt: serverTimestamp()
            });
            showMessage("Review submitted!", 3000, "success");
            renderProductReviews(productId);
            section.classList.add('hidden');
        } catch (error) {
            console.error("Error submitting review:", error);
            showMessage("Failed to submit review.", 3000, "error");
        } finally {
            submitBtn.disabled = false;
        }
    };
};

window.renderCartPage = async () => {
    if (!currentUser) {
        showMessage('login_required', 3000, 'error');
        renderView('home');
        return;
    }
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');
    container.innerHTML = `<div class="text-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>`;

    if (Object.keys(userCart).length === 0) {
        container.innerHTML = `<p class="text-center p-8 text-lg text-gray-500" data-i18n-key="your_cart_is_empty"></p>`;
        summary.classList.add('hidden');
        translatePage(currentLang);
        return;
    } 
    
    summary.classList.remove('hidden');
    
    try {
        const productIds = Object.keys(userCart);
        const productRefs = productIds.map(id => doc(db, "products", id));
        const productSnaps = await Promise.all(productRefs.map(ref => getDoc(ref)));
        
        let totalPrice = 0;
        container.innerHTML = '';
        productSnaps.forEach(snap => {
            if (snap.exists()) {
                const product = { id: snap.id, ...snap.data() };
                const item = userCart[product.id];
                totalPrice += product.price * item.quantity;
                const itemEl = document.createElement('div');
                itemEl.className = 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg';
                itemEl.innerHTML = `
                    <div class="flex items-center"><img src="${product.imageUrl || './assets/placeholder.png'}" alt="${product.title}" class="w-16 h-16 object-cover rounded-md mr-4"><div><h4 class="font-semibold">${product.title}</h4><p class="text-sm text-gray-500">${product.price.toLocaleString()} DA</p></div></div>
                    <div class="flex items-center gap-4"><input type="number" min="1" value="${item.quantity}" class="w-16 p-1 border rounded-md dark:bg-gray-600 quantity-input" data-id="${product.id}"><button class="text-red-500 hover:text-red-700 remove-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button></div>`;
                container.appendChild(itemEl);
            }
        });
        document.getElementById('cart-total-price').textContent = `${totalPrice.toLocaleString()} DA`;

        container.querySelectorAll('.quantity-input').forEach(input => input.onchange = (e) => updateCartItem(e.target.dataset.id, parseInt(e.target.value)));
        container.querySelectorAll('.remove-btn').forEach(btn => btn.onclick = (e) => removeFromCart(e.currentTarget.dataset.id));

    } catch (error) {
        console.error("Error rendering cart:", error);
        container.innerHTML = `<p class="text-red-500">Could not load cart items.</p>`;
    }

    document.getElementById('back-from-cart-btn').onclick = () => renderView('home');
    document.getElementById('clear-cart-btn').onclick = clearCart;
};

window.renderDashboardPage = async () => {
    if (!currentUser) { renderView('home'); return; }
    const grid = document.getElementById('my-listings-grid');
    grid.innerHTML = `<div class="col-span-full text-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>`;

    try {
        const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        grid.innerHTML = '';
        if (snapshot.empty) {
            grid.innerHTML = `<p class="col-span-full text-center p-8 text-lg text-gray-500">You have no active listings.</p>`;
        } else {
            snapshot.docs.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                const card = document.createElement('div');
                card.className = "relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden";
                card.innerHTML = `
                    <img src="${product.imageUrl || './assets/placeholder.png'}" alt="${product.title}" class="w-full h-40 object-cover">
                    <div class="p-4"><h3 class="font-bold text-lg truncate">${product.title}</h3><p class="text-blue-600 dark:text-blue-400 font-semibold text-xl my-2">${product.price.toLocaleString()} DA</p></div>
                    <div class="absolute top-2 right-2"><button class="delete-ad-btn bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"><i class="fas fa-trash"></i></button></div>`;
                card.querySelector('.delete-ad-btn').onclick = async () => {
                    const shouldDelete = new Promise((resolve) => {
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                        modal.innerHTML = `
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
                                <p class="text-lg font-semibold mb-4">${translations[currentLang].delete_ad_confirm}</p>
                                <div class="flex justify-center space-x-4">
                                    <button id="cancel-delete" class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">${translations[currentLang].back}</button>
                                    <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">${translations[currentLang].delete_account}</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        modal.querySelector('#cancel-delete').onclick = () => { document.body.removeChild(modal); resolve(false); };
                        modal.querySelector('#confirm-delete').onclick = () => { document.body.removeChild(modal); resolve(true); };
                    });
                    if (await shouldDelete) {
                        try {
                            await deleteDoc(doc(db, "products", product.id));
                            showMessage("Ad deleted successfully!", 3000, "success");
                            renderDashboardPage();
                        } catch (error) {
                            console.error("Error deleting ad:", error);
                            showMessage("Failed to delete ad.", 3000, "error");
                        }
                    }
                };
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error fetching dashboard listings:", error);
        grid.innerHTML = `<p class="text-red-500">Could not load your listings.</p>`;
    }
    
    document.getElementById('delete-account-btn').onclick = () => {
        const shouldDelete = new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
                    <p class="text-lg font-semibold mb-4 text-red-500">${translations[currentLang].danger_zone}</p>
                    <p class="mb-4">${translations[currentLang].delete_account_confirm}</p>
                    <div class="flex justify-center space-x-4">
                        <button id="cancel-delete" class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">${translations[currentLang].back}</button>
                        <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">${translations[currentLang].delete_account}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#cancel-delete').onclick = () => { document.body.removeChild(modal); resolve(false); };
            modal.querySelector('#confirm-delete').onclick = () => { document.body.removeChild(modal); resolve(true); };
        });
        shouldDelete.then(result => {
            if (result) deleteUserData();
        });
    };
};

window.renderProfilePage = async (data) => {
    if (!data?.userId) { renderView('home'); return; }
    
    const isCurrentUserProfile = currentUser && currentUser.uid === data.userId;
    const userSnap = await getDoc(doc(db, "users", data.userId));
    const profileData = userSnap.exists() ? userSnap.data() : { isStore: false };

    document.getElementById('profile-name').textContent = isCurrentUserProfile ? currentUser.displayName : data.userName || 'Seller Profile';
    document.getElementById('profile-pic').src = (isCurrentUserProfile ? currentUser.photoURL : profileData.photoURL) || './assets/placeholder.png';

    const storeNameDisplay = document.getElementById('store-name-display');
    const storeProfileLabel = document.getElementById('store-profile-label');
    const setupStoreSection = document.getElementById('store-setup-section');
    const editProfileSection = document.getElementById('profile-edit-section');

    if (isCurrentUserProfile) {
        editProfileSection.classList.remove('hidden');
        document.getElementById('profile-name-input').value = currentUser.displayName || '';
    } else {
        editProfileSection.classList.add('hidden');
    }

    if (profileData.isStore && profileData.storeName) {
        storeNameDisplay.textContent = profileData.storeName;
        storeNameDisplay.classList.remove('hidden');
        storeProfileLabel.classList.remove('hidden');
    } else {
        storeNameDisplay.classList.add('hidden');
        storeProfileLabel.classList.add('hidden');
    }

    if (isCurrentUserProfile && !profileData.isStore) {
        setupStoreSection.classList.remove('hidden');
    } else {
        setupStoreSection.classList.add('hidden');
    }
    
    document.getElementById('profile-edit-form')?.addEventListener('submit', updateProfileData);
    document.getElementById('store-setup-form')?.addEventListener('submit', setupStoreProfile);
    
    const grid = document.getElementById('user-products-grid');
    grid.innerHTML = `<div class="col-span-full text-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>`;
    
    try {
        const q = query(collection(db, "products"), where("sellerId", "==", data.userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        displayProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), grid);
    } catch (error) {
        console.error("Error fetching user products:", error);
        grid.innerHTML = `<p class="text-red-500">Could not load seller's products.</p>`;
    }

    const reviewsList = document.getElementById('user-reviews-list');
    reviewsList.innerHTML = `<p class="text-gray-500 dark:text-gray-400" data-i18n-key="reviews_soon_2"></p>`;
};

const updateProfileData = async (e) => {
    e.preventDefault();
    if (!currentUser) { showMessage('login_required', 3000, 'error'); return; }

    const form = e.target;
    const displayName = form.elements['displayName'].value.trim();
    const profilePicFile = form.elements['profilePic'].files[0];

    if (!displayName) {
        showMessage('Please enter a name.', 3000, 'error');
        return;
    }
    
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
        let newPhotoURL = currentUser.photoURL;

        if (profilePicFile) {
            const imageRef = ref(storage, `profile_pictures/${currentUser.uid}/${profilePicFile.name}`);
            await uploadBytes(imageRef, profilePicFile);
            newPhotoURL = await getDownloadURL(imageRef);
        }

        await updateProfile(currentUser, { displayName, photoURL: newPhotoURL });
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            displayName: displayName,
            photoURL: newPhotoURL,
        });

        showMessage('Profile updated successfully!', 3000, 'success');
        renderView('profile', { userId: currentUser.uid, userName: displayName });
    } catch (error) {
        console.error("Error updating profile:", error);
        showMessage("Failed to update profile.", 3000, "error");
    } finally {
        btn.disabled = false;
    }
};

window.renderInboxPage = () => {
    if (!currentUser) { renderView('home'); return; }
    const listContainer = document.getElementById('conversations-list');
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid), orderBy("lastMessageTimestamp", "desc"));

    chatsUnsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            listContainer.innerHTML = `<p class="text-center text-gray-500">You have no messages.</p>`;
            return;
        }
        listContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const chat = doc.data();
            const otherUserId = chat.participants.find(id => id !== currentUser.uid);
            const otherUserName = chat.participantNames?.[otherUserId] || 'Unknown User';
            
            const convoEl = document.createElement('div');
            convoEl.className = 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center';
            convoEl.innerHTML = `
                <div><h4 class="font-bold">${otherUserName}</h4><p class="text-sm text-gray-500 dark:text-gray-400 truncate">${chat.lastMessage}</p></div>
                ${chat.unreadCount?.[currentUser.uid] > 0 ? `<span class="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${chat.unreadCount[currentUser.uid]}</span>` : ''}`;
            convoEl.onclick = () => renderView('chat', { chatId: doc.id, otherUserName });
            listContainer.appendChild(convoEl);
        });
    }, (error) => {
        console.error("Error listening to inbox:", error);
        listContainer.innerHTML = `<p class="text-red-500">Could not load conversations.</p>`;
    });
};

window.renderChatPage = async (chatData) => {
    if (!currentUser || !chatData) { renderView('home'); return; }
    
    const { chatId, otherUserName, productId } = chatData;
    const chatRef = doc(db, "chats", chatId);
    try {
        await updateDoc(chatRef, { [`unreadCount.${currentUser.uid}`]: 0 });
    } catch (error) {
        console.error("Error updating unread count:", error);
    }

    document.getElementById('chat-with-name').textContent = `${translations[currentLang].chat_with} ${otherUserName}`;
    document.getElementById('back-to-inbox-btn').onclick = () => renderView('inbox');

    const messagesContainer = document.getElementById('messages-container');
    const messageForm = document.getElementById('send-message-form');
    const messageInput = document.getElementById('message-input');
    const chatActions = document.getElementById('chat-actions');
    
    if (productId) {
        const productSnap = await getDoc(doc(db, "products", productId));
        if (productSnap.exists()) {
            const product = productSnap.data();
            const offerBtn = document.createElement('button');
            offerBtn.textContent = translations[currentLang].offer_btn_text;
            offerBtn.className = 'px-4 py-2 bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600 transition-colors shadow-md';
            offerBtn.onclick = () => {
                const offeredPrice = prompt(translations[currentLang].offer_prompt);
                if (offeredPrice && !isNaN(offeredPrice) && parseFloat(offeredPrice) > 0) {
                    const offerMessage = `${currentUser.displayName} has offered you ${offeredPrice} DA for "${product.title}".`;
                    sendMessage(offerMessage, true);
                    showMessage(translations[currentLang].offer_sent, 3000, "success");
                }
            };
            chatActions.appendChild(offerBtn);
        }
    }
    
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "desc"), limit(25));
    if(messagesListener) messagesListener();
    messagesListener = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = snapshot.empty ? '<p class="text-center text-gray-500">No messages yet. Say hi!</p>' : '';
        snapshot.docs.reverse().forEach(doc => {
            const msg = doc.data();
            const msgEl = document.createElement('div');
            msgEl.className = `p-3 rounded-lg max-w-xs ${msg.senderId === currentUser.uid ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 dark:bg-gray-600 self-start'}`;
            msgEl.textContent = msg.text;
            messagesContainer.appendChild(msgEl);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, (error) => {
        console.error("Error listening to messages:", error);
        messagesContainer.innerHTML = `<p class="text-red-500">Could not load messages.</p>`;
    });

    const sendMessage = async (text, isOffer = false) => {
        if (!text) return;
        try {
            await addDoc(collection(db, "chats", chatId, "messages"), {
                senderId: currentUser.uid,
                text: text,
                timestamp: serverTimestamp(),
                isOffer: isOffer
            });
            const otherUserId = chatId.replace(currentUser.uid, '').replace('_', '');
            await updateDoc(chatRef, { 
                lastMessage: text, 
                lastMessageTimestamp: serverTimestamp(),
                [`unreadCount.${otherUserId}`]: increment(1)
            });
        } catch (error) {
            console.error("Error sending message:", error);
            showMessage("Failed to send message.", 3000, "error");
        }
    };

    messageForm.onsubmit = async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        messageInput.value = '';
        await sendMessage(text);
    };
};

window.renderTermsPage = () => {
    document.getElementById('last-updated').textContent = "September 13, 2025";
};

const setupStoreProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) { return; }

    const form = e.target;
    const storeName = form.elements['storeName'].value.trim();
    const storeLogoFile = form.elements['storeLogo'].files[0];

    if (!storeName) {
        showMessage('Please enter a store name.', 3000, 'error');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
        let storeLogoUrl = userProfile?.storeLogoUrl || null;

        if (storeLogoFile) {
            const imageRef = ref(storage, `store_logos/${currentUser.uid}/${storeLogoFile.name}`);
            const snapshot = await uploadBytes(imageRef, storeLogoFile);
            storeLogoUrl = await getDownloadURL(snapshot.ref);
        }

        await updateDoc(doc(db, "users", currentUser.uid), {
            isStore: true,
            storeName: storeName,
            storeLogoUrl: storeLogoUrl,
        });

        showMessage('Store profile created successfully!', 3000, 'success');
        renderView('dashboard');
    } catch (error) {
        console.error("Error creating store profile:", error);
        showMessage('Failed to create store profile.', 3000, 'error');
    } finally {
        btn.disabled = false;
    }
};

const deleteUserData = async () => {
    if (!currentUser) {
        showMessage("You must be logged in to delete your account.", 3000, 'error');
        return;
    }

    try {
        const productsQuery = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
        const productsSnapshot = await getDocs(productsQuery);
        const deleteProductPromises = productsSnapshot.docs.map(docToDelete => deleteDoc(doc(db, "products", docToDelete.id)));
        await Promise.all(deleteProductPromises);

        await deleteDoc(doc(db, "carts", currentUser.uid));
        await deleteDoc(doc(db, "users", currentUser.uid));

        await deleteUser(auth.currentUser);

        showMessage("Your account and all associated data have been deleted.", 5000, 'success');
        renderView('home');
    } catch (error) {
        console.error("Error deleting user data:", error);
        showMessage("Failed to delete account. Please log in again and retry.", 5000, 'error');
    }
};

// --- USER ACTIONS ---
const handleSignOut = () => signOut(auth).catch(error => console.error("Sign out error", error));

const startOrOpenChat = async (sellerId, sellerName, productId = null) => {
    if (!currentUser) { showMessage('login_required', 3000, 'error'); return; }
    if (currentUser.uid === sellerId) { showMessage("You cannot message yourself.", 3000, 'error'); return; }

    const chatId = [currentUser.uid, sellerId].sort().join('_');
    const chatRef = doc(db, "chats", chatId);
    
    try {
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
            await setDoc(chatRef, {
                participants: [currentUser.uid, sellerId],
                participantNames: { [currentUser.uid]: currentUser.displayName, [sellerId]: sellerName },
                lastMessage: "Chat started.",
                lastMessageTimestamp: serverTimestamp(),
                unreadCount: { [currentUser.uid]: 0, [sellerId]: 0 }
            });
        }
        renderView('chat', { chatId, otherUserName: sellerName, productId });
    } catch (error) {
        console.error("Error starting chat:", error);
        showMessage("Could not open chat.", 3000, 'error');
    }
};

const clearCart = async () => {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, "carts", currentUser.uid), {});
        userCart = {};
        updateCartDisplay();
        if(currentView === 'cart') renderCartPage();
    } catch (error) {
        console.error("Error clearing cart:", error);
        showMessage("Failed to clear cart.", 3000, "error");
    }
};

const addToCart = async (product) => {
    if (!currentUser) { showMessage('login_required', 3000, 'error'); return; }
    userCart[product.id] = { productId: product.id, quantity: (userCart[product.id]?.quantity || 0) + 1 };
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        showMessage('item_added_to_cart', 2000, 'success');
    } catch (error) {
        console.error("Error adding to cart:", error);
        showMessage("Failed to add item to cart.", 3000, "error");
    }
};

const updateCartItem = async (productId, quantity) => {
    if (!currentUser || !userCart[productId]) return;
    if (quantity <= 0) { removeFromCart(productId); return; }
    userCart[productId].quantity = quantity;
    try {
        await setDoc(doc(db, "carts", currentUser.uid), userCart);
        updateCartDisplay();
        if (currentView === 'cart') renderCartPage();
    } catch (error) {
        console.error("Error updating cart item:", error);
        showMessage("Failed to update cart.", 3000, "error");
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
        showMessage("Failed to remove item.", 3000, "error");
    }
};

const validatePostForm = (form) => {
    let isValid = true;
    ['title', 'brand', 'wilaya', 'category', 'price'].forEach(fieldName => {
        const input = form.elements[fieldName];
        const errorEl = document.getElementById(`${fieldName}-error`);
        let isInvalid = false;
        if (input.type === 'file') {
             return;
        } else {
            isInvalid = !input.value.trim();
        }
        input.classList.toggle('border-red-500', isInvalid);
        errorEl?.classList.toggle('hidden', !isInvalid);
        if (isInvalid) isValid = false;
    });
    return isValid;
};

// --- AUTHENTICATION & UI UPDATES ---
const updateAuthUI = (user) => {
    const { authLinksContainer, mobileNavLinks } = DOMElements;
    authLinksContainer.innerHTML = '';
    
    let mobileLinksHTML = `
        <a href="#" id="mobile-home-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="nav_home"></a>
        <a href="#" id="mobile-search-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="nav_search"></a>
        <a href="#" id="mobile-sell-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="sell"></a>
        <a href="#" id="mobile-cart-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg relative"><span data-i18n-key="cart_title"></span><span id="mobile-cart-count" class="absolute top-0 ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full hidden">0</span></a>`;

    if (user) {
        authLinksContainer.innerHTML = `<div class="relative" id="user-menu"><button id="user-menu-btn" class="flex items-center"><img src="${user.photoURL}" alt="User" class="w-8 h-8 rounded-full border-2 border-transparent hover:border-blue-500 transition-colors"></button><div id="user-menu-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 hidden z-20"><a href="#" id="profile-link" class="block px-4 py-2 text-sm" data-i18n-key="nav_profile"></a><a href="#" id="dashboard-link" class="block px-4 py-2 text-sm" data-i18n-key="dashboard"></a><a href="#" id="messages-link" class="relative block px-4 py-2 text-sm" data-i18n-key="messages"><span id="unread-badge" class="hidden absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a><button id="logout-btn" class="w-full text-left px-4 py-2 text-sm" data-i18n-key="logout"></button></div></div>`;
        mobileLinksHTML += `<a href="#" id="mobile-profile-link" class="p-2 text-lg" data-i18n-key="nav_profile"></a><a href="#" id="mobile-dashboard-link" class="p-2 text-lg" data-i18n-key="dashboard"></a><a href="#" id="mobile-messages-link" class="p-2 text-lg relative"><span data-i18n-key="messages"></span><span id="mobile-unread-badge" class="hidden absolute top-0 ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a><button id="mobile-logout-btn" class="p-2 text-lg text-left" data-i18n-key="logout"></button>`;
        
        const toggleUserMenu = () => document.getElementById('user-menu-dropdown').classList.toggle('hidden');
        document.getElementById('user-menu-btn').onclick = toggleUserMenu;
        document.getElementById('logout-btn').onclick = handleSignOut;
        document.getElementById('profile-link').onclick = (e) => { e.preventDefault(); renderView('profile', { userId: currentUser.uid, userName: currentUser.displayName }); };
        document.getElementById('dashboard-link').onclick = (e) => { e.preventDefault(); renderView('dashboard'); };
        document.getElementById('messages-link').onclick = (e) => { e.preventDefault(); currentUser ? renderView('inbox') : toggleModal(DOMElements.authModal, true); };
    } else {
        authLinksContainer.innerHTML = `<button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" data-i18n-key="connect"></button>`;
        mobileLinksHTML += `<button id="mobile-login-btn" class="p-2 text-lg text-left" data-i18n-key="connect"></button>`;
        document.getElementById('login-btn').onclick = () => toggleModal(DOMElements.authModal, true);
    }

    mobileNavLinks.innerHTML = mobileLinksHTML;
    updateCartDisplay();
    translatePage(currentLang);
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
    ['unread-badge', 'mobile-unread-badge', 'nav-unread-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = count > 9 ? '9+' : count;
            el.classList.toggle('hidden', count === 0);
        }
    });
};

// --- SETUP & INITIALIZATION ---
const setupEventListeners = () => {
    const { darkModeToggle, langDropdownBtn, langBtns, sellLink, cartBtn, homeLink, mobileMenuBtn, mobileMenuCloseBtn, authModalCloseBtn, googleLoginBtn, facebookLoginBtn, modalCloseBtn, searchInput, mobileFiltersCloseBtn, mobileApplyFiltersBtn } = DOMElements;

    darkModeToggle.onclick = () => setDarkMode(!DOMElements.html.classList.contains('dark'));
    langDropdownBtn.onclick = (e) => { e.stopPropagation(); DOMElements.langDropdown.classList.toggle('hidden'); };
    langBtns.forEach(btn => btn.onclick = () => { setLanguage(btn.dataset.lang); DOMElements.langDropdown.classList.add('hidden'); closeMobileMenu(); });

    sellLink.onclick = (e) => { e.preventDefault(); toggleModal(currentUser ? DOMElements.postProductModal : DOMElements.authModal, true); };
    cartBtn.onclick = () => renderView('cart');
    homeLink.onclick = (e) => { e.preventDefault(); window.history.pushState({}, '', window.location.pathname); renderView('home'); };

    mobileMenuBtn.onclick = openMobileMenu;
    mobileMenuCloseBtn.onclick = closeMobileMenu;
    DOMElements.mobileMenuBackdrop.onclick = closeMobileMenu;

    document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

    DOMElements.mobileNavLinks.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (!target) return;
        e.preventDefault();
        
        const actions = {
            'mobile-home-link': () => { window.history.pushState({}, '', window.location.pathname); renderView('home'); },
            'mobile-search-link': () => DOMElements.searchInput.focus(),
            'mobile-sell-link': () => sellLink.click(),
            'mobile-cart-link': () => renderView('cart'),
            'mobile-profile-link': () => renderView('profile', { userId: currentUser.uid, userName: currentUser.displayName }),
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
    googleLoginBtn.onclick = () => signInWithPopup(auth, googleProvider).catch(error => console.error("Login error", error));
    facebookLoginBtn.onclick = () => signInWithPopup(auth, facebookProvider).catch(error => console.error("Login error", error));
    
    DOMElements.postProductModal.addEventListener('transitionend', (e) => {
        if (!DOMElements.postProductModal.classList.contains('invisible')) {
            populateSelect(DOMElements.postProductBrandSelect, car_data, 'select_brand', currentLang);
            populateSelect(DOMElements.postProductYearSelect, years, 'select_year', currentLang);
            populateSelect(DOMElements.postProductWilayaSelect, wilayas, 'select_wilaya', currentLang);
            populateSelect(DOMElements.postProductCategorySelect, categories, 'select_category', currentLang, true);
        }
    });

    DOMElements.postProductForm.onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!validatePostForm(form) || !currentUser) return;
        
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.querySelector('.btn-spinner').classList.remove('hidden');

        const formData = Object.fromEntries(new FormData(form).entries());
        const imageFile = DOMElements.postProductImageInput.files[0];
        
        try {
            if (!imageFile) {
                showMessage("Please select an image first!", 3000, "error");
                btn.disabled = false;
                btn.querySelector('.btn-spinner').classList.add('hidden');
                return;
            }

            const progressBar = document.getElementById("uploadProgress");
            progressBar.style.display = "block";
            progressBar.value = 0;

            const storageRef = ref(storage, `product_images/${Date.now()}_${imageFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, imageFile);

            await new Promise((resolve, reject) => {
              uploadTask.on('state_changed',
                snapshot => {
                  if (progressBar && snapshot.totalBytes) {
                    progressBar.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  }
                },
                err => reject(err),
                () => resolve()
              );
            });

            const imageUrl = await getDownloadURL(storageRef);
            
            progressBar.style.display = "none";

            const productData = {
                ...formData,
                price: Number(formData.price) || 0,
                sellerId: currentUser.uid,
                sellerName: userProfile?.storeName || currentUser.displayName || 'Anonymous',
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
                keywords: formData.title.toLowerCase().split(' ')
            };

            await addDoc(collection(db, "products"), productData);
            showMessage('ad_posted', 3000, 'success');
            form.reset();
            toggleModal(DOMElements.postProductModal, false);
        } catch (error) {
            console.error("❌ Upload or Firestore write failed:", error);
            showMessage('ad_post_failed', 3000, 'error');
        } finally {
            btn.disabled = false;
            btn.querySelector('.btn-spinner').classList.add('hidden');
            const progressBar = document.getElementById('uploadProgress');
            if (progressBar) progressBar.style.display = 'none';
        }
    };
    
    DOMElements.postProductBrandSelect.onchange = () => {
        const modelSelect = DOMElements.postProductModelSelect;
        const selectedBrand = DOMElements.postProductBrandSelect.value;
        if (selectedBrand && car_data[selectedBrand]) {
            populateSelect(modelSelect, car_data[selectedBrand], 'select_model', currentLang);
            modelSelect.disabled = false;
        } else {
            modelSelect.disabled = true;
            modelSelect.innerHTML = `<option value="">${translations[currentLang].select_model}</option>`;
        }
    };
    
    DOMElements.postProductWilayaSelect.onchange = () => {
        const communeSelect = DOMElements.postProductCommuneSelect;
        const selectedWilaya = DOMElements.postProductWilayaSelect.value;
        if (selectedWilaya && wilayas[selectedWilaya]) {
            populateSelect(communeSelect, wilayas[selectedWilaya], 'select_commune', currentLang);
            communeSelect.disabled = false;
        } else {
            communeSelect.disabled = true;
            communeSelect.innerHTML = `<option value="">${translations[currentLang].select_commune}</option>`;
        }
    };
    
    searchInput.oninput = debounce(applyAndRenderFilters, 500);
    mobileFiltersCloseBtn.onclick = () => DOMElements.mobileFiltersModal.classList.add('translate-x-full');
    mobileApplyFiltersBtn.onclick = () => { applyAndRenderFilters(); DOMElements.mobileFiltersModal.classList.add('translate-x-full'); };

    document.onclick = (e) => {
        if (!langDropdownBtn.contains(e.target)) DOMElements.langDropdown.classList.add('hidden');
        const userMenu = document.getElementById('user-menu');
        if (userMenu && !userMenu.contains(e.target)) document.getElementById('user-menu-dropdown').classList.add('hidden');
        if (DOMElements.searchSuggestions && !DOMElements.searchInput.contains(e.target)) DOMElements.searchSuggestions.classList.add('hidden');
    };

    DOMElements.searchInput.addEventListener('input', debounce(async (e) => {
      const queryText = e.target.value.trim();
      if (queryText.length < 2) {
        DOMElements.searchSuggestions.classList.add('hidden');
        return;
      }
      
      const q = query(collection(db, "products"), 
        where("keywords", "array-contains", queryText.toLowerCase()),
        limit(5));
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        DOMElements.searchSuggestions.innerHTML = '';
        snapshot.forEach(doc => {
          const product = doc.data();
          const suggestion = document.createElement('div');
          suggestion.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
          suggestion.textContent = product.title;
          suggestion.onclick = () => {
            DOMElements.searchInput.value = product.title;
            DOMElements.searchSuggestions.classList.add('hidden');
            applyAndRenderFilters();
          };
          DOMElements.searchSuggestions.appendChild(suggestion);
        });
        DOMElements.searchSuggestions.classList.remove('hidden');
      } else {
        DOMElements.searchSuggestions.classList.add('hidden');
      }
    }, 300));

    document.getElementById('nav-home').onclick = (e) => { 
        e.preventDefault(); 
        window.history.pushState({}, '', window.location.pathname);
        renderView('home'); 
    };
    document.getElementById('nav-search').onclick = (e) => { e.preventDefault(); DOMElements.searchInput.focus(); updateBottomNav('search'); };
    document.getElementById('nav-sell').onclick = (e) => { e.preventDefault(); DOMElements.sellLink.click(); };
    document.getElementById('nav-messages').onclick = (e) => { e.preventDefault(); currentUser ? renderView('inbox') : toggleModal(DOMElements.authModal, true); };
    document.getElementById('nav-profile').onclick = (e) => { e.preventDefault(); currentUser ? renderView('dashboard') : toggleModal(DOMElements.authModal, true); };
    
    document.getElementById('terms-link').onclick = (e) => {
        e.preventDefault();
        renderView('terms');
    };
    
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
        userProfile = null;
        if (user) {
            toggleModal(DOMElements.authModal, false);
            try {
                const cartSnap = await getDoc(doc(db, "carts", user.uid));
                if (cartSnap.exists()) userCart = cartSnap.data();
            } catch (error) {
                console.error("Error fetching cart:", error);
            }
            
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);
            userProfile = userSnap.exists() ? userSnap.data() : null;

            if (!userSnap.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    isStore: false
                });
            }
        }
        updateCartDisplay();
    });
    
    window.onpopstate = () => renderView('home');
    renderView('home');
    setLanguage(currentLang);
};

bootApp();

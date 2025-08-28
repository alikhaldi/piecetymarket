// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, where, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, increment, writeBatch, serverTimestamp, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Global state variables
let currentUser = null;
let currentLang = localStorage.getItem("piecety_lang") || "fr";
let currentView = 'home';
let userCart = {};
let productsUnsubscribe = null;
let chatsUnsubscribe = null;
let lastVisibleProduct = null;
let isFetching = false;
let allProductsCache = []; // For search autocomplete
let recentlyViewed = JSON.parse(localStorage.getItem('piecety_recently_viewed')) || [];

// Firebase Configuration
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
const provider = new GoogleAuthProvider();

// Translations
const translations = {
    fr: {
        page_title: "Piecety - Marché des Pièces Auto en Algérie",
        meta_description: "Achetez et vendez des pièces automobiles en Algérie avec Piecety, le marché fiable pour les pièces neuves et d'occasion.",
        fr_short: "FR", en_short: "EN", ar_short: "AR",
        menu: "Menu", sell: "Vendre", connect: "Se connecter", language: "Langue", logout: "Déconnexion", dashboard: "Tableau de Bord",
        nav_home: "Accueil", nav_search: "Recherche", nav_profile: "Profil",
        hero_title: "Trouvez la bonne pièce pour votre voiture",
        hero_subtitle: "Le marché algérien des pièces automobiles le plus fiable.",
        categories_title: "Catégories de Pièces",
        brands_title: "Sélectionnez une Marque",
        years_title: "Sélectionnez une Année",
        filters_title: "Filtrer les annonces", all_brands: "Toutes les marques", all_models: "Tous les modèles",
        all_years: "Toutes années", all_wilayas: "Toutes wilayas", all_communes: "Toutes communes",
        condition: "État", any_condition: "Tout", new: "Neuf", used: "Occasion",
        apply_filters: "Appliquer les filtres", reset: "Réinitialiser",
        search_placeholder: "Rechercher une pièce...",
        submit_ad: "Soumettre une annonce", ad_title_label: "Titre de la pièce *", ad_title_placeholder: "Ex: Disque de frein avant",
        brand_label: "Marque *", select_brand: "Sélectionnez une marque",
        model_label: "Modèle", select_model: "Sélectionnez un modèle",
        year_label: "Année", select_year: "Sélectionnez une année",
        wilaya_label: "Wilaya *", select_wilaya: "Sélectionnez une wilaya",
        commune_label: "Commune", select_commune: "Sélectionnez une commune",
        condition_label: "État", price_label: "Prix (DA) *", price_placeholder: "Ex: 15000",
        description_label: "Description", description_placeholder: "Informations supplémentaires...",
        submit_ad_btn_text: "Soumettre", loading_text: "Envoi...",
        error_valid_title: "Veuillez entrer un titre valide.", error_select_brand: "Veuillez sélectionner une marque.",
        error_select_wilaya: "Veuillez sélectionner une wilaya.", error_select_category: "Veuillez sélectionner une catégorie.",
        error_valid_price: "Veuillez entrer un prix valide.",
        login_text: "Connectez-vous pour accéder à toutes les fonctionnalités.", google_login: "Se connecter avec Google",
        back_to_listings: "Retour aux annonces", add_to_cart: "Ajouter au panier",
        cart_title: "Mon panier", cart_total: "Total", checkout_btn: "Passer à la caisse",
        no_listings: "Aucune annonce trouvée.",
        your_cart_is_empty: "Votre panier est vide.",
        remove: "Supprimer", quantity: "Quantité", item_total: "Total de l'article",
        login_required: "Veuillez vous connecter pour utiliser cette fonctionnalité.",
        show_filters: "Afficher les filtres", price_range: "Gamme de prix", all_categories: "Toutes catégories",
        category_label: "Catégorie *", select_category: "Sélectionnez une catégorie", contact_seller: "Contacter le vendeur",
        clear_cart: "Vider le panier", ad_posted: "Votre annonce a été publiée avec succès !", ad_post_failed: "Échec de la publication de l'annonce.",
        item_added_to_cart: "Article ajouté au panier!", delete_ad_confirm: "Êtes-vous sûr de vouloir supprimer cette annonce ?",
        sold_by: "Vendu par:", my_listings: "Mes Annonces", seller_listings: "Annonces de ce vendeur",
        buyer_reviews: "Avis des acheteurs", reviews_soon: "(Avis bientôt disponibles)", reviews_soon_2: "La fonctionnalité d'avis sera bientôt disponible.",
        messages: "Messages", loading_convos: "Chargement des conversations...", chat_with: "Chat avec", type_message_placeholder: "Écrire un message...",
        recently_viewed: "Récemment consultés", chat: "Chat", load_more: "Charger plus"
    },
    en: {
        page_title: "Piecety - Car Parts Marketplace in Algeria",
        meta_description: "Buy and sell car parts in Algeria with Piecety, the reliable marketplace for new and used parts.",
        fr_short: "FR", en_short: "EN", ar_short: "AR",
        menu: "Menu", sell: "Sell", connect: "Log In", language: "Language", logout: "Logout", dashboard: "Dashboard",
        nav_home: "Home", nav_search: "Search", nav_profile: "Profile",
        hero_title: "Find the right car part for your vehicle",
        hero_subtitle: "The most trusted Algerian car parts marketplace.",
        categories_title: "Parts Categories",
        brands_title: "Select a Brand",
        years_title: "Select a Year",
        filters_title: "Filter Listings", all_brands: "All brands", all_models: "All models",
        all_years: "All years", all_wilayas: "All wilayas", all_communes: "All communes",
        condition: "Condition", any_condition: "Any", new: "New", used: "Used",
        apply_filters: "Apply Filters", reset: "Reset",
        search_placeholder: "Search for a part...",
        submit_ad: "Submit an Ad", ad_title_label: "Part Title *", ad_title_placeholder: "e.g., Front brake disc",
        brand_label: "Brand *", select_brand: "Select a brand",
        model_label: "Model", select_model: "Select a model",
        year_label: "Year", select_year: "Select a year",
        wilaya_label: "State *", select_wilaya: "Select a state",
        commune_label: "City", select_commune: "Select a city",
        condition_label: "Condition", price_label: "Price (DA) *", price_placeholder: "e.g., 15000",
        description_label: "Description", description_placeholder: "Additional information...",
        submit_ad_btn_text: "Submit", loading_text: "Submitting...",
        error_valid_title: "Please enter a valid title.", error_select_brand: "Please select a brand.",
        error_select_wilaya: "Please select a state.", error_select_category: "Please select a category.",
        error_valid_price: "Please enter a valid price.",
        login_text: "Log in to access all features.", google_login: "Sign in with Google",
        back_to_listings: "Back to listings", add_to_cart: "Add to cart",
        cart_title: "My Cart", cart_total: "Total", checkout_btn: "Proceed to Checkout",
        no_listings: "No listings found.",
        your_cart_is_empty: "Your cart is empty.",
        remove: "Remove", quantity: "Quantity", item_total: "Item Total",
        login_required: "Please log in to use this feature.",
        show_filters: "Show Filters", price_range: "Price Range", all_categories: "All Categories",
        category_label: "Category *", select_category: "Select a category", contact_seller: "Contact Seller",
        clear_cart: "Clear Cart", ad_posted: "Your ad has been posted successfully!", ad_post_failed: "Failed to post ad.",
        item_added_to_cart: "Item added to cart!", delete_ad_confirm: "Are you sure you want to delete this ad?",
        sold_by: "Sold by:", my_listings: "My Listings", seller_listings: "Listings from this seller",
        buyer_reviews: "Buyer Reviews", reviews_soon: "(Reviews coming soon)", reviews_soon_2: "Review functionality will be available soon.",
        messages: "Messages", loading_convos: "Loading conversations...", chat_with: "Chat with", type_message_placeholder: "Type a message...",
        recently_viewed: "Recently Viewed", chat: "Chat", load_more: "Load More"
    },
    ar: {
        page_title: "Piecety - سوق قطع غيار السيارات في الجزائر",
        meta_description: "بيع وشراء قطع غيار السيارات في الجزائر مع Piecety، السوق الموثوق للقطع الجديدة والمستعملة.",
        fr_short: "FR", en_short: "EN", ar_short: "AR",
        menu: "القائمة", sell: "بيع", connect: "تسجيل الدخول", language: "اللغة", logout: "تسجيل الخروج", dashboard: "لوحة التحكم",
        nav_home: "الرئيسية", nav_search: "بحث", nav_profile: "ملفي",
        hero_title: "ابحث عن قطعة الغيار المناسبة لسيارتك",
        hero_subtitle: "أكثر أسواق قطع غيار السيارات ثقة في الجزائر.",
        categories_title: "فئات القطع",
        brands_title: "اختر ماركة",
        years_title: "اختر سنة",
        filters_title: "تصفية الإعلانات", all_brands: "جميع الماركات", all_models: "جميع الموديلات",
        all_years: "جميع السنوات", all_wilayas: "جميع الولايات", all_communes: "جميع البلديات",
        condition: "الحالة", any_condition: "الكل", new: "جديد", used: "مستعمل",
        apply_filters: "تطبيق الفلاتر", reset: "إعادة تعيين",
        search_placeholder: "ابحث عن قطعة...",
        submit_ad: "إرسال إعلان", ad_title_label: "عنوان القطعة *", ad_title_placeholder: "مثال: قرص فرامل أمامي",
        brand_label: "الماركة *", select_brand: "اختر ماركة",
        model_label: "الموديل", select_model: "اختر موديل",
        year_label: "السنة", select_year: "اختر سنة",
        wilaya_label: "الولاية *", select_wilaya: "اختر ولاية",
        commune_label: "البلدية", select_commune: "اختر بلدية",
        condition_label: "الحالة", price_label: "السعر (دج) *", price_placeholder: "مثال: 15000",
        description_label: "الوصف", description_placeholder: "معلومات إضافية...",
        submit_ad_btn_text: "إرسال", loading_text: "جار الإرسال...",
        error_valid_title: "الرجاء إدخال عنوان صالح.", error_select_brand: "الرجاء اختيار ماركة.",
        error_select_wilaya: "الرجاء اختيار ولاية.", error_select_category: "الرجاء اختيار فئة.",
        error_valid_price: "الرجاء إدخال سعر صالح.",
        login_text: "تسجيل الدخول للوصول إلى جميع الميزات.", google_login: "تسجيل الدخول باستخدام Google",
        back_to_listings: "العودة إلى الإعلانات", add_to_cart: "أضف إلى السلة",
        cart_title: "سلة التسوق", cart_total: "الإجمالي", checkout_btn: "الدفع",
        no_listings: "لم يتم العثور على إعلانات.",
        your_cart_is_empty: "سلة التسوق فارغة.",
        remove: "حذف", quantity: "الكمية", item_total: "إجمالي السلعة",
        login_required: "يرجى تسجيل الدخول لاستخدام هذه الميزة.",
        show_filters: "إظهار الفلاتر", price_range: "نطاق السعر", all_categories: "جميع الفئات",
        category_label: "الفئة *", select_category: "اختر فئة", contact_seller: "اتصل بالبائع",
        clear_cart: "إفراغ السلة", ad_posted: "تم نشر إعلانك بنجاح!", ad_post_failed: "فشل نشر الإعلان.",
        item_added_to_cart: "تمت إضافة المنتج إلى السلة!", delete_ad_confirm: "هل أنت متأكد من أنك تريد حذف هذا الإعلان؟",
        sold_by: "البائع:", my_listings: "إعلاناتي", seller_listings: "إعلانات من هذا البائع",
        buyer_reviews: "تقييمات المشترين", reviews_soon: "(التقييمات قريبا)", reviews_soon_2: "ميزة التقييم ستكون متاحة قريبا.",
        messages: "الرسائل", loading_convos: "جاري تحميل المحادثات...", chat_with: "محادثة مع", type_message_placeholder: "اكتب رسالة...",
        recently_viewed: "شوهدت مؤخرا", chat: "محادثة", load_more: "تحميل المزيد"
    }
};

// Data for dynamic dropdowns
const categories = {
    "engine": { fr: "Moteur", en: "Engine", ar: "محرك", icon: "fa-cogs" },
    "brakes": { fr: "Freins", en: "Brakes", ar: "مكابح", icon: "fa-car" },
    "fuel_system": { fr: "Système de carburant", en: "Fuel System", ar: "نظام الوقود", icon: "fa-gas-pump" },
    "cooling": { fr: "Refroidissement", en: "Cooling", ar: "التبريد", icon: "fa-fan" },
    "tires": { fr: "Pneus & Jantes", en: "Tires & Rims", ar: "الإطارات والعجلات", icon: "fa-circle" },
    "electrical": { fr: "Électrique", en: "Electrical", ar: "كهربائي", icon: "fa-bolt" },
    "body": { fr: "Carrosserie", en: "Body", ar: "هيكل", icon: "fa-car-side" },
    "tools": { fr: "Outillage", en: "Tools", ar: "أدوات", icon: "fa-wrench" },
};
const wilayas = {
    "Adrar": ["Adrar", "Charouine", "Tamest", "Reggane", "Aoulef", "Fenoughil", "Timimoun", "Talmine", "Bordj Badji Mokhtar", "In Salah"], 
    "Chlef": ["Chlef", "Ténès", "Ouled Farès", "El Marsa", "Abou El Hassan", "Oued Fodda", "Beni Haoua", "El Karimia", "Taougrite", "Harchoun"], 
    "Laghouat": ["Aïn Madhi", "Aflou", "El Ghicha", "El Houaita", "El Assafia", "Ksar El Hirane", "Laghouat", "Taougrite", "Sidi Makhlouf", "Ouled Farès", "Hassi R'Mel"], 
    "Oum El Bouaghi": ["Aïn Beïda", "Aïn Fekroun", "Aïn Babouche", "Aïn M'lila", "Dhalaâ", "F'kirina", "Oum El Bouaghi", "Sidi R'ghiss", "Souk Naamane", "El Fedjoudj"], 
    "Batna": ["Aïn Touta", "Arris", "Barika", "Batna", "El Madher", "Menaa", "Merouana", "Ras El Aioun", "Timgad", "Ouled Si Slimane"], 
    "Béjaïa": ["Aïn El Kebira", "Akbou", "Béjaïa", "El Kseur", "Sidi Aïch", "Tichy", "Toudja", "Aokas", "Ighil Ali", "Darguina"], 
    "Biskra": ["Biskra", "El Kantara", "Sidi Okba", "Ourlal", "Zeribet El Oued", "Tolga", "Sidi Khaled", "Djemorah", "M'chouneche", "El Outaya"], 
    "Béchar": ["Béchar", "Abadla", "Beni Ounif", "Lahmar", "Tabelbala", "Kenadsa", "Igli", "Taghit", "Mechraâ Houari Boumediene", "Ouled Khoudir"], 
    "Blida": ["Blida", "Boufarik", "Chebli", "Oued El Alleug", "Larbaâ", "Meftah", "Soumaâ", "Bougara", "Mouzaia", "Chréa"], 
    "Bouira": ["Bouira", "Lakhdaria", "Sour El Ghozlane", "Ahnif", "Bir Ghbalou", "Haïzer", "M'chedallah", "El Hachimia", "Sidi Aïssa", "Taghzout"], 
    "Tamanrasset": ["Tamanrasset", "Abalessa", "Idles", "In Amguel", "Tazrouk", "Tin Zaouatine", "In Guezzam", "Djanet", "Bordj Omar Driss", "Illizi"], 
    "Tébessa": ["Tébessa", "Bir El Ater", "Cheria", "El Aouinet", "El Kouif", "El Ma Labiod", "Morsott", "Ouenza", "Bir Mokkadem", "Hammamet"], 
    "Tlemcen": ["Tlemcen", "Ghazaouet", "Maghnia", "Remchi", "Sebdou", "Sidi Djillali", "Hennaya", "Nedroma", "Marsa Ben M'Hidi", "Beni Snous"], 
    "Tiaret": ["Tiaret", "Aïn Deheb", "Frenda", "Ksar Chellala", "Mahdia", "Rahouia", "Sougueur", "Dahmouni", "Sidi Ali Mellal", "Medroussa"], 
    "Tizi Ouzou": ["Tizi Ouzou", "Aïn El Hammam", "Azazga", "Bouzeguène", "Draâ Ben Khedda", "Ouacif", "Larbaâ Nath Irathen", "Tigzirt", "Tizi Gheniff", "Maâtkas"], 
    "Alger": ["Alger", "Bab El Oued", "Baraki", "Bir Mourad Raïs", "Birkhadem", "Bologhine", "Bordj El Kiffan", "Hussein Dey", "Hydra", "Dar El Beïda"], 
    "Djelfa": ["Djelfa", "Aïn Oussera", "Messaad", "Hassi Bahbah", "Had Sahary", "Guettara", "El Idrissia", "Dar Chioukh", "Zaccar", "Faidh El Botma"], 
    "Jijel": ["Jijel", "Taher", "El Milia", "Chekfa", "Ziamamansouria", "Texenna", "Djemaa Beni Habibi", "Sidi Maarouf", "Settara", "Kaous"], 
    "Sétif": ["Sétif", "Aïn Oulmane", "El Eulma", "Bousselam", "Beni Ouartilane", "Bougaâ", "Salah Bey", "Hammamlou", "Guenzet", "Maouaklane"], 
    "Saïda": ["Saïda", "Aïn El Hadjar", "Sidi Boubkeur", "Youb", "El Hassasna", "Tircine", "Maamora", "Ouled Brahim", "Aïn Sekhouna", "Moulay Larbi"], 
    "Skikda": ["Skikda", "Aïn Bouziane", "Azzaba", "El Harrouch", "Collo", "Filfila", "Ramdane Djamel", "Salah Bouchaour", "Zerdaza", "Beni Oulbane"], 
    "Sidi Bel Abbès": ["Sidi Bel Abbès", "Sfisef", "Telagh", "Ras El Ma", "Tessala", "Aïn El Berd", "Boukhanafis", "Ben Badis", "Sidi Chaib", "Moulay Slissen"], 
    "Annaba": ["Annaba", "El Hadjar", "Berrahal", "El Bouni", "Seraïdi", "Chetaïbi", "Oued El Aneb", "Aïn El Berda", "Trézel", "Sidi Amar"], 
    "Guelma": ["Guelma", "Héliopolis", "Oued Zenati", "Bouchegouf", "Ain Reggada", "Tamlouka", "Dkhila", "Bou Hachana", "Belkheir", "Bordj Sabath"], 
    "Constantine": ["Constantine", "El Khroub", "Hamma Bouziane", "Aïn Smara", "Didouche Mourad", "Zighoud Youcef", "Messaoud Boudjriou", "Beni Hamidane", "Ibn Ziad", "Oued El Hadjar"], 
    "Médéa": ["Médéa", "Berrouaghia", "Chahbounia", "Tablat", "Aïn Boucif", "Beni Slimane", "El Azizia", "Si Mahdjoub", "Ouzera", "Ksar Boukhari"], 
    "Mostaganem": ["Mostaganem", "Hassi Mameche", "Aïn Tédelès", "Sidi Ali", "Bouguirat", "Achaacha", "Khadra", "Oued El Kheir", "Mazagran", "Foran"], 
    "M'Sila": ["M'Sila", "Bou Saâda", "Aïn El Melh", "Sidi Aïssa", "Magra", "M'Cif", "Hammam Dhalaâ", "Ouled Derradj", "Ben Srour", "Ouanougha"], 
    "Mascara": ["Mascara", "Ghriss", "Tighennif", "Sig", "Bou Hanifia", "Oued Taria", "Hachem", "Mohammadia", "El Bordj", "Aïn Fares"], 
    "Ouargla": ["Ouargla", "Hassi Messaoud", "Rouissat", "N'Goussa", "Sidi Khouiled", "Blidet Amor", "El Borma", "Tebesbest", "Zaouia El Abidia", "Hassi Ben Abdallah"], 
    "Oran": ["Oran", "Arzew", "Bir El Djir", "Es Senia", "Boutlélis", "Hassi Bounif", "Oued Tlélat", "Sidi Chami", "Gdyel", "Aïn El Turk"], 
    "El Bayadh": ["El Bayadh", "Bougtob", "Chellala", "Breïna", "Rogassa", "Brezina", "Boussemghoun", "El Kheiter", "Kraïr", "Ghassoul"], 
    "Illizi": ["Illizi", "Djanet", "Bordj El Houasse", "Tamanrasset", "In Salah", "Abalessa", "Tazrouk", "Idles", "In Amguel", "Tin Zaouatine"], 
    "Bordj Bou Arréridj": ["Bordj Bou Arréridj", "Ras El Oued", "Mansoura", "Tassameurt", "El Achir", "Medjana", "Bordj Ghedir", "Hammam El Biban", "L'Hassaneia", "Ghassira"], 
    "Boumerdès": ["Boumerdès", "Dellys", "Boudouaou", "Isser", "Béni Amrane", "Naciria", "Corso", "Zemmouri", "Réghaïa", "Tidjelabine"], 
    "El Tarf": ["El Tarf", "Ben M'Hidi", "Besbes", "Drea", "El Kala", "Bougous", "Raml Souk", "Sidi Khelil", "Oued Zitoun", "Aïn Kerma"], 
    "Tindouf": ["Tindouf", "Oum El Assel"], "Tissemsilt": ["Tissemsilt", "Bordj Bounaama", "Lardjem", "Théniet El Had", "Ammi Moussa", "Sidi Boutouchent", "Layoune", "Lazharia", "Bougara", "Bordj Emir Khaled"], 
    "El Oued": ["El Oued", "Guemar", "Hassi Khalifa", "Robbah", "Debila", "Bayadha", "Magrane", "Nakhla", "Kouinine", "El Ogla"], 
    "Khenchela": ["Khenchela", "Aïn Touila", "Bab El Ain", "Kais", "Yabous", "Chechar", "M'Sara", "Ouled Rechache", "Taouzianat", "Remila"], 
    "Souk Ahras": ["Souk Ahras", "Heddada", "M'daourouch", "Mechrouha", "Ouled Driss", "Taoura", "Zaarouria", "Ouillen", "Sidi Fredj", "Tiffech"], 
    "Tipaza": ["Tipaza", "Cherchell", "Koléa", "Fouka", "Hadjout", "Sidi Rached", "Menaceur", "Bou Ismaïl", "Khemis Miliana", "Aïn Tagourait"], 
    "Mila": ["Mila", "Bouhatem", "Ferdjioua", "Grarem Gouga", "Tadjenanet", "Sidi Merouane", "Oued Endja", "Teleghma", "Chigara", "Rouached"], 
    "Aïn Defla": ["Aïn Defla", "Khemis Miliana", "El Attaf", "Aïn Torki", "Djelida", "Rouina", "Hammam Righa", "Miliana", "Boumedfaa", "Aïn Soltane"], 
    "Naâma": ["Naâma", "Mécheria", "Aïn Sefra", "Moghrar", "Tiout", "Sfissifa", "Makman Ben Amer", "Asla", "Kasdir", "El Biod"], 
    "Aïn Témouchent": ["Aïn Témouchent", "Hammam Bou Hadjar", "El Malah", "Béni Saf", "Aghlal", "Chaabat El Ham", "Oued Berkeche", "Aoubellil", "Bouzedjar", "Tamesna"], 
    "Ghardaïa": ["Ghardaïa", "El Guerrara", "Berriane", "Dhayet Bendhahoua", "Metlili", "Zelfana", "Bounoura", "El Atteuf", "Guerrara", "Dra' El Mizan"], 
    "Relizane": ["Relizane", "Oued Rhiou", "Zemmoura", "Sidi M'Hamed Ben Ali", "El H'madna", "Ammi Moussa", "Mazouna", "Mendes", "Ain Tarek", "Oued El Djemaa"], 
    "El M'ghair": ["El M'ghair", "Sidi Amrane", "Djamaa", "Oum Toub", "M'Rara", "Oued Allenda", "Sidi Khelil", "Oued R'hiou", "Sidi Yahia", "Bouchakroun"], 
    "El Meniaa": ["El Meniaa", "Hassi Gara", "Mansourah", "Dhiafat", "El Guerrara", "Tadjmout", "El Hachane", "El Oued", "Chabet El Ami", "Ouled Gacem"]
};
const car_data = {
    "Toyota": ["Yaris", "Corolla", "Camry", "Land Cruiser", "Hilux"], "Peugeot": ["208", "308", "301", "2008", "3008", "508"], "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta"], "Renault": ["Clio", "Megane", "Captur", "Duster", "Symbol"], "Hyundai": ["i10", "i20", "Accent", "Tucson", "Santa Fe"], "Nissan": ["Micra", "Sentra", "Qashqai", "X-Trail", "Juke"], "Fiat": ["Panda", "500", "Tipo", "Punto"], "Citroën": ["C3", "C4", "Berlingo", "C-Elysée"], "Kia": ["Picanto", "Rio", "Sportage", "Sorento"], "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC"]
};
 const brand_icons = {
    "Toyota": "icons/toyota.png",
    "Peugeot": "icons/peugeot.png",
    "Volkswagen": "icons/volkswagen.png",
    "Renault": "icons/renault.png",
    "Hyundai": "icons/hyundai.png",
    "Nissan": "icons/nissan.png",
    "Fiat": "icons/fiat.png",
    "Citroën": "icons/citroen.png",
    "Kia": "icons/kia.png",
    "Mercedes-Benz": "icons/mercedes.png"
};
const currentYear = new Date().getFullYear();
const years = Array.from({length: currentYear - 1979}, (_, i) => (currentYear - i).toString());

// DOM Elements
const DOMElements = {
    html: document.documentElement,
    body: document.body,
    appContainer: document.getElementById("app-container"),
    messageBox: document.getElementById("message-box"),
    langDropdownBtn: document.getElementById("lang-dropdown-btn"),
    langDropdown: document.getElementById("lang-dropdown"),
    currentLangSpan: document.getElementById("current-lang"),
    langBtns: document.querySelectorAll(".lang-btn"),
    searchInput: document.getElementById("search-input"),
    postProductModal: document.getElementById("post-product-modal"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    postProductForm: document.getElementById("post-product-form"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    mobileMenu: document.getElementById("mobile-menu"),
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
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    postProductBrandSelect: document.getElementById('product-brand'),
    postProductModelSelect: document.getElementById('product-model'),
    postProductYearSelect: document.getElementById('product-year'),
    postProductWilayaSelect: document.getElementById('product-wilaya'),
    postProductCommuneSelect: document.getElementById('product-commune'),
    postProductCategorySelect: document.getElementById('product-category'),
};

// ... (The rest of the JavaScript functions remain the same) ...

// The bootApp function remains the same
const bootApp = () => {
    setDarkMode(localStorage.getItem('piecety_dark_mode') === 'true');
    document.getElementById('current-year').textContent = new Date().getFullYear();
    setupEventListeners();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service worker registered successfully.'))
        .catch(err => console.error('Service worker registration failed:', err));
    }

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        updateAuthUI(user);
        listenForUnreadMessages(user);

        if (user) {
            toggleModal(DOMElements.authModal, false);
            const cartRef = doc(db, "carts", user.uid);
            const cartSnap = await getDoc(cartRef);
            if (cartSnap.exists()) {
                userCart = cartSnap.data();
            } else {
                userCart = {};
            }
        } else {
            userCart = {};
        }
        updateCartDisplay();
    });
    
    window.addEventListener('popstate', () => {
        renderView('home'); 
    });
    renderView('home');
};

bootApp();
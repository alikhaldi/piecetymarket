// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, where, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, increment, serverTimestamp, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, FacebookAuthProvider, onAuthStateChanged, deleteUser, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import { documentId } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
let listingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// --- FIREBASE CONFIGURATION ---
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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// --- TRANSLATIONS ---
const translations = {
    fr: {
        page_title: "Piecety - MarchÃƒÂ© des PiÃƒÂ¨ces Auto en AlgÃƒÂ©rie", meta_description: "Achetez et vendez des piÃƒÂ¨ces automobiles en AlgÃƒÂ©rie avec Piecety, le marchÃƒÂ© fiable pour les piÃƒÂ¨ces neuves et d'occasion.", fr_short: "FR", en_short: "EN", ar_short: "AR", menu: "Menu", sell: "Vendre", connect: "Se connecter", language: "Langue", logout: "DÃƒÂ©connexion", dashboard: "Tableau de Bord", nav_home: "Accueil", nav_search: "Recherche", nav_profile: "Profil", hero_title: "Trouvez la bonne piÃƒÂ¨ce pour votre voiture", hero_subtitle: "Le marchÃƒÂ© algÃƒÂ©rien des piÃƒÂ¨ces automobiles le plus fiable.", categories_title: "CatÃƒÂ©gories de PiÃƒÂ¨ces", sub_categories_title: "Sous-catÃƒÂ©gories pour", brands_title: "SÃƒÂ©lectionnez une Marque", years_title: "SÃƒÂ©lectionnez une AnnÃƒÂ©e", filters_title: "Filtrer les annonces", all_brands: "Toutes les marques", all_models: "Tous les modÃƒÂ¨les", all_years: "Toutes annÃƒÂ©es", all_wilayas: "Toutes wilayas", all_communes: "Toutes communes", condition: "Ãƒâ€°tat", any_condition: "Tout", new: "Neuf", used: "Occasion", apply_filters: "Appliquer les filtres", reset: "RÃƒÂ©initialiser", search_placeholder: "Rechercher une piÃƒÂ¨ce...", submit_ad: "Soumettre une annonce", ad_title_label: "Titre de la piÃƒÂ¨ce *", ad_title_placeholder: "Ex: Disque de frein avant", brand_label: "Marque *", select_brand: "SÃƒÂ©lectionnez une marque", model_label: "ModÃƒÂ¨le", select_model: "SÃƒÂ©lectionnez un modÃƒÂ¨le", year_label: "AnnÃƒÂ©e", select_year: "SÃƒÂ©lectionnez une annÃƒÂ©e", wilaya_label: "Wilaya *", select_wilaya: "SÃƒÂ©lectionnez une wilaya", commune_label: "Commune", select_commune: "SÃƒÂ©lectionnez une commune", condition_label: "Ãƒâ€°tat", price_label: "Prix (DA) *", price_placeholder: "Ex: 15000", description_label: "Description", description_placeholder: "Informations supplÃƒÂ©mentaires...", submit_ad_btn_text: "Soumettre", loading_text: "Envoi...", error_valid_title: "Veuillez entrer un titre valide.", error_select_brand: "Veuillez sÃƒÂ©lectionner une marque.", error_select_wilaya: "Veuillez sÃƒÂ©lectionner une wilaya.", error_select_category: "Veuillez sÃƒÂ©lectionner une catÃƒÂ©gorie.", error_valid_price: "Veuillez entrer un prix valide.", login_text: "Connectez-vous pour accÃƒÂ©der Ãƒ  toutes les fonctionnalitÃƒÂ©s.", google_login: "Se connecter avec Google", back_to_listings: "Retour aux annonces", add_to_cart: "Ajouter au panier", cart_title: "Mon panier", cart_total: "Total", checkout_btn: "Passer Ãƒ  la caisse", no_listings: "Aucune annonce trouvÃƒÂ©e.", your_cart_is_empty: "Votre panier est vide.", remove: "Supprimer", quantity: "QuantitÃƒÂ©", item_total: "Total de l'article", login_required: "Veuillez vous connecter pour utiliser cette fonctionnalitÃƒÂ©.", show_filters: "Afficher les filtres", price_range: "Gamme de prix", all_categories: "Toutes catÃƒÂ©gories", category_label: "CatÃƒÂ©gorie *", select_category: "SÃƒÂ©lectionnez une catÃƒÂ©gorie", contact_seller: "Contacter le vendeur", clear_cart: "Vider le panier", ad_posted: "Votre annonce a ÃƒÂ©tÃƒÂ© publiÃƒÂ©e avec succÃƒÂ¨s !", ad_post_failed: "Ãƒâ€°chec de la publication de l'annonce.", item_added_to_cart: "Article ajoutÃƒÂ© au panier!", delete_ad_confirm: "ÃƒÅ tes-vous sÃƒÂ»r de vouloir supprimer cette annonce ?", sold_by: "Vendu par:", my_listings: "Mes Annonces", seller_listings: "Annonces de ce vendeur", buyer_reviews: "Avis des acheteurs", reviews_soon: "(Avis bientÃƒÂ´t disponibles)", reviews_soon_2: "La fonctionnalitÃƒÂ© d'avis sera bientÃƒÂ´t disponible.", messages: "Messages", loading_convos: "Chargement des conversations...", chat_with: "Chat avec", type_message_placeholder: "Ãƒâ€°crire un message...", recently_viewed: "RÃƒÂ©cemment consultÃƒÂ©s", chat: "Chat", load_more: "Charger plus", ad_image_label: "Image de la piÃƒÂ¨ce *", facebook_login: "Se connecter avec Facebook", store_label: "Nom du magasin", store_name_placeholder: "Ex: PiÃƒÂ¨ces Autos Abdelkader", store_profile: "Profil de Magasin", setup_store_profile: "Configurer le Profil de Magasin", store_name_label: "Nom du Magasin", store_logo_label: "Logo du Magasin", save: "Enregistrer", profile_pic_label: "Photo de Profil", update_profile_pic: "Mettre Ãƒ  jour la Photo",
        contact_us: "Contactez-nous", terms_of_service: "Conditions d'utilisation", terms_title: "Conditions d'utilisation", terms_last_updated: "DerniÃƒÂ¨re mise Ãƒ  jour :", terms_intro_title: "1. Introduction", terms_intro_text: "Bienvenue sur Piecety. En accÃƒÂ©dant ou en utilisant notre application, vous acceptez d'ÃƒÂªtre liÃƒÂ© par ces conditions. Si vous n'ÃƒÂªtes pas d'accord avec une partie de ces conditions, veuillez ne pas utiliser notre service.", terms_use_title: "2. Utilisation de l'application", terms_use_text: "Piecety est un marchÃƒÂ© en ligne pour l'achat et la vente de piÃƒÂ¨ces automobiles. Vous ÃƒÂªtes responsable de toute activitÃƒÂ© liÃƒÂ©e Ãƒ  votre compte. L'application ne peut ÃƒÂªtre utilisÃƒÂ©e qu'Ãƒ  des fins lÃƒÂ©gales et d'une maniÃƒÂ¨re qui ne porte pas atteinte aux droits d'autrui.", terms_account_title: "3. Comptes utilisateurs", terms_account_text: "Vous devez ÃƒÂªtre ÃƒÂ¢gÃƒÂ© d'au moins 18 ans pour crÃƒÂ©er un compte. Vous ÃƒÂªtes responsable de la sÃƒÂ©curitÃƒÂ© de votre mot de passe et de votre compte. Vous acceptez de ne pas partager les informations de votre compte ou de les utiliser pour d'autres personnes.", terms_delete_account_policy: "Vous pouvez supprimer votre compte Ãƒ  tout moment. La suppression de votre compte entraÃƒÂ®nera la suppression dÃƒÂ©finitive de toutes vos annonces, messages et donnÃƒÂ©es personnelles.", terms_content_title: "4. Contenu utilisateur", terms_content_text: "Vous ÃƒÂªtes seul responsable du contenu (annonces, photos, messages) que vous publiez sur l'application. Vous garantissez que vous avez les droits nÃƒÂ©cessaires pour publier ce contenu et qu'il n'est pas illÃƒÂ©gal, menaÃƒÂ§ant, diffamatoire ou obscÃƒÂ¨ne. Piecety se rÃƒÂ©serve le droit de supprimer tout contenu jugÃƒÂ© inappropriÃƒÂ©.", terms_liability_title: "5. Limitation de responsabilitÃƒÂ©", terms_liability_text: "Piecety est fourni 'tel quel'. Nous ne garantissons pas que le service sera ininterrompu ou sans erreur. En aucun cas, Piecety ne sera responsable des dommages directs ou indirects rÃƒÂ©sultant de votre utilisation du service.", terms_termination_title: "6. RÃƒÂ©siliation du compte", terms_termination_text: "Nous pouvons rÃƒÂ©silier ou suspendre votre compte et votre accÃƒÂ¨s Ãƒ  l'application, sans prÃƒÂ©avis ni responsabilitÃƒÂ©, pour quelque raison que ce soit, y inclus si vous enfreignez les Conditions. Vous pouvez supprimer votre compte Ãƒ  tout moment depuis votre tableau de bord.", danger_zone: "Zone de danger", delete_account: "Supprimer mon compte", delete_account_confirm: "ÃƒÅ tes-vous sÃƒÂ»r de vouloir supprimer votre compte ? Cette action est irrÃƒÂ©versible et supprimera toutes vos annonces, messages et donnÃƒÂ©es personnelles. Cette action est IRREVERSIBLE!", back: "Retour", edit_profile: "Modifier le profil", name_label: "Nom", write_review_placeholder: "Ãƒâ€°crivez votre avis ici...", add_review: "Ajouter un avis", submit_review: "Soumettre l'avis", offer_btn_text: "Faire une offre", offer_prompt: "Entrez votre prix d'offre :", offer_sent: "Votre offre a ÃƒÂ©tÃƒÂ© envoyÃƒÂ©e.", recommendations: "Recommandations pour vous",
    },
    en: {
        page_title: "Piecety - Car Parts Marketplace in Algeria", meta_description: "Buy and sell car parts in Algeria with Piecety, the reliable marketplace for new and used parts.", fr_short: "FR", en_short: "EN", ar_short: "AR", menu: "Menu", sell: "Sell", connect: "Log In", language: "Language", logout: "Logout", dashboard: "Dashboard", nav_home: "Home", nav_search: "Search", nav_profile: "Profile", hero_title: "Find the right car part for your vehicle", hero_subtitle: "The most trusted Algerian car parts marketplace.", categories_title: "Parts Categories", sub_categories_title: "Sub-categories for", brands_title: "Select a Brand", years_title: "Select a Year", filters_title: "Filter Listings", all_brands: "All brands", all_models: "All models", all_years: "All years", all_wilayas: "All wilayas", all_communes: "All communes", condition: "Condition", any_condition: "Any", new: "New", used: "Used", apply_filters: "Apply Filters", reset: "Reset", search_placeholder: "Search for a part...", submit_ad: "Submit an Ad", ad_title_label: "Part Title *", ad_title_placeholder: "e.g., Front brake disc", brand_label: "Brand *", select_brand: "Select a brand", model_label: "Model", select_model: "Select a model", year_label: "Year", select_year: "Select a year", wilaya_label: "State *", select_wilaya: "Select a state", commune_label: "City", select_commune: "Select a city", condition_label: "Condition", price_label: "Price (DA) *", price_placeholder: "e.g., 15000", description_label: "Description", description_placeholder: "Additional information...", submit_ad_btn_text: "Submit", loading_text: "Submitting...", error_valid_title: "Please enter a valid title.", error_select_brand: "Please select a brand.", error_select_wilaya: "Please select a state.", error_select_category: "Please select a category.", error_valid_price: "Please enter a valid price.", login_text: "Log in to access all features.", google_login: "Sign in with Google", back_to_listings: "Back to listings", add_to_cart: "Add to cart", cart_title: "My Cart", cart_total: "Total", checkout_btn: "Proceed to Checkout", no_listings: "No listings found.", your_cart_is_empty: "Your cart is empty.", remove: "Remove", quantity: "Quantity", item_total: "Item Total", login_required: "Please log in to use this feature.", show_filters: "Show Filters", price_range: "Price Range", all_categories: "All Categories", category_label: "Category *", select_category: "Select a category", contact_seller: "Contact Seller", clear_cart: "Clear Cart", ad_posted: "Your ad has been posted successfully!", ad_post_failed: "Failed to post ad.", item_added_to_cart: "Item added to cart!", delete_ad_confirm: "Are you sure you want to delete this ad?", sold_by: "Sold by:", my_listings: "My Listings", seller_listings: "Listings from this seller", buyer_reviews: "Buyer Reviews", reviews_soon: "(Reviews coming soon)", reviews_soon_2: "Review functionality will be available soon.", messages: "Messages", loading_convos: "Loading conversations...", chat_with: "Chat with", type_message_placeholder: "Type a message...", recently_viewed: "Recently Viewed", chat: "Chat", load_more: "Load More", ad_image_label: "Part Image *", facebook_login: "Sign in with Facebook", store_label: "Store Name", store_name_placeholder: "e.g., Abdelkader Auto Parts", store_profile: "Store Profile", setup_store_profile: "Set Up Store Profile", store_name_label: "Store Name", store_logo_label: "Store Logo", save: "Save", profile_pic_label: "Profile Picture", update_profile_pic: "Update Picture",
        contact_us: "Contact Us", terms_of_service: "Terms of Service", terms_title: "Terms of Service", terms_last_updated: "Last Updated:", terms_intro_title: "1. Introduction", terms_intro_text: "Welcome to Piecety. By accessing or using our app, you agree to be bound by these terms. If you disagree with any part of these terms, please do not use our service.", terms_delete_account_policy: "You can delete your account at any time. Deleting your account will result in the permanent deletion of all your ads, messages, and personal data.", terms_use_title: "2. Use of the App", terms_use_text: "Piecety is an online marketplace for buying and selling car parts. You are responsible for all activity under your account. The app may only be used for lawful purposes and in a way that does not infringe on the rights of others.", terms_account_title: "3. User Accounts", terms_account_text: "You must be at least 18 years old to create an account. You are responsible for keeping your password and account secure. You agree not to share your account information or use it for any other person.", terms_content_title: "4. User Content", terms_content_text: "You are solely responsible for the content (ads, photos, messages) you post on the app. You warrant that you have the necessary rights to post this content and that it is not unlawful, threatening, defamatory, or obscene. Piecety reserves the right to remove any content deemed inappropriate.", terms_liability_title: "5. Limitation of Liability", terms_liability_text: "Piecety is provided 'as is'. We do not warrant that the service will be uninterrupted or without error. In no event shall Piecety be liable for any direct or indirect damages resulting from your use of the service.", terms_termination_title: "6. Account Termination", terms_termination_text: "We may terminate or suspend your account and access to the app, without prior notice or liability, for any reason whatsoever, including if you breach the Terms. You may delete your account at any time from your dashboard.", danger_zone: "Danger Zone", delete_account: "Delete My Account", delete_account_confirm: "Are you sure you want to delete your account? This action is irreversible and will permanently delete all your ads, messages, and personal data. This action is IRREVERSIBLE!", sub_categories_title: "Sub-categories for", back: "Back", edit_profile: "Edit Profile", name_label: "Name", write_review_placeholder: "Write your review here...", add_review: "Add a review", submit_review: "Submit Review", offer_btn_text: "Make Offer", offer_prompt: "Enter your offer price:", offer_sent: "Your offer has been sent.", recommendations: "Recommendations for you",
    },
    ar: {
        page_title: "Piecety - Ã˜Â³Ã™Ë†Ã™â€š Ã™â€šÃ˜Â·Ã˜Â¹ Ã˜ÂºÃ™Å Ã˜Â§Ã˜Â± Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â²Ã˜Â§Ã˜Â¦Ã˜Â±", meta_description: "Ã˜Â¨Ã™Å Ã˜Â¹ Ã™Ë†Ã˜Â´Ã˜Â±Ã˜Â§Ã˜Â¡ Ã™â€šÃ˜Â·Ã˜Â¹ Ã˜ÂºÃ™Å Ã˜Â§Ã˜Â± Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â²Ã˜Â§Ã˜Â¦Ã˜Â± Ã™â€¦Ã˜Â¹ PiecetyÃ˜Å’ Ã˜Â§Ã™â€žÃ˜Â³Ã™Ë†Ã™â€š Ã˜Â§Ã™â€žÃ™â€¦Ã™Ë†Ã˜Â«Ã™Ë†Ã™â€š Ã™â€žÃ™â€žÃ™â€šÃ˜Â·Ã˜Â¹ Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯Ã˜Â© Ã™Ë†Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â³Ã˜ÂªÃ˜Â¹Ã™â€¦Ã™â€žÃ˜Â©.", fr_short: "FR", en_short: "EN", ar_short: "AR", menu: "Ã˜Â§Ã™â€žÃ™â€šÃ˜Â§Ã˜Â¦Ã™â€¦Ã˜Â©", sell: "Ã˜Â¨Ã™Å Ã˜Â¹", connect: "Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž", language: "Ã˜Â§Ã™â€žÃ™â€žÃ˜ÂºÃ˜Â©", logout: "Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â®Ã˜Â±Ã™Ë†Ã˜Â¬", dashboard: "Ã™â€žÃ™Ë†Ã˜Â­Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â­Ã™Æ’Ã™â€¦", nav_home: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¦Ã™Å Ã˜Â³Ã™Å Ã˜Â©", nav_search: "Ã˜Â¨Ã˜Â­Ã˜Â«", nav_profile: "Ã™â€¦Ã™â€žÃ™ÂÃ™Å ", hero_title: "Ã˜Â§Ã˜Â¨Ã˜Â­Ã˜Â« Ã˜Â¹Ã™â€  Ã™â€šÃ˜Â·Ã˜Â¹Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂºÃ™Å Ã˜Â§Ã˜Â± Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â§Ã˜Â³Ã˜Â¨Ã˜Â© Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜ÂªÃ™Æ’", hero_subtitle: "Ã˜Â£Ã™Æ’Ã˜Â«Ã˜Â± Ã˜Â£Ã˜Â³Ã™Ë†Ã˜Â§Ã™â€š Ã™â€šÃ˜Â·Ã˜Â¹ Ã˜ÂºÃ™Å Ã˜Â§Ã˜Â± Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª Ã˜Â«Ã™â€šÃ˜Â© Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â²Ã˜Â§Ã˜Â¦Ã˜Â±.", categories_title: "Ã™ÂÃ˜Â¦Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™â€šÃ˜Â·Ã˜Â¹", sub_categories_title: "Ã˜Â§Ã™â€žÃ™ÂÃ˜Â¦Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â¹Ã™Å Ã˜Â© Ã™â€žÃ™â‚¬", brands_title: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™â€¦Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â©", years_title: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã˜Â³Ã™â€ Ã˜Â©", filters_title: "Ã˜ÂªÃ˜ÂµÃ™ÂÃ™Å Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã˜Â§Ã˜Âª", all_brands: "Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â§Ã˜Âª", all_models: "Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ™â€¦Ã™Ë†Ã˜Â¯Ã™Å Ã™â€žÃ˜Â§Ã˜Âª", all_years: "Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ˜Â³Ã™â€ Ã™Ë†Ã˜Â§Ã˜Âª", all_wilayas: "Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ™Ë†Ã™â€žÃ˜Â§Ã™Å Ã˜Â§Ã˜Âª", all_communes: "Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ˜Â¨Ã™â€žÃ˜Â¯Ã™Å Ã˜Â§Ã˜Âª", condition: "Ã˜Â§Ã™â€žÃ˜Â­Ã˜Â§Ã™â€žÃ˜Â©", any_condition: "Ã˜Â§Ã™â€žÃ™Æ’Ã™â€ž", new: "Ã˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯", used: "Ã™â€¦Ã˜Â³Ã˜ÂªÃ˜Â¹Ã™â€¦Ã™â€ž", apply_filters: "Ã˜ÂªÃ˜Â·Ã˜Â¨Ã™Å Ã™â€š Ã˜Â§Ã™â€žÃ™ÂÃ™â€žÃ˜Â§Ã˜ÂªÃ˜Â±", reset: "Ã˜Â¥Ã˜Â¹Ã˜Â§Ã˜Â¯Ã˜Â© Ã˜ÂªÃ˜Â¹Ã™Å Ã™Å Ã™â€ ", search_placeholder: "Ã˜Â§Ã˜Â¨Ã˜Â­Ã˜Â« Ã˜Â¹Ã™â€  Ã™â€šÃ˜Â·Ã˜Â¹Ã˜Â©...", submit_ad: "Ã˜Â¥Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€ž Ã˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ ", ad_title_label: "Ã˜Â¹Ã™â€ Ã™Ë†Ã˜Â§Ã™â€  Ã˜Â§Ã™â€žÃ™â€šÃ˜Â·Ã˜Â¹Ã˜Â© *", ad_title_placeholder: "Ã™â€¦Ã˜Â«Ã˜Â§Ã™â€ž: Ã™â€šÃ˜Â±Ã˜Âµ Ã™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž Ã˜Â£Ã™â€¦Ã˜Â§Ã™â€¦Ã™Å ", brand_label: "Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â© *", select_brand: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™â€¦Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â©", model_label: "Ã˜Â§Ã™â€žÃ™â€¦Ã™Ë†Ã˜Â¯Ã™Å Ã™â€ž", select_model: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™â€¦Ã™Ë†Ã˜Â¯Ã™Å Ã™â€ž", year_label: "Ã˜Â§Ã™â€žÃ˜Â³Ã™â€ Ã˜Â©", select_year: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã˜Â³Ã™â€ Ã˜Â©", wilaya_label: "Ã˜Â§Ã™â€žÃ™Ë†Ã™â€žÃ˜Â§Ã™Å Ã˜Â© *", select_wilaya: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™Ë†Ã™â€žÃ˜Â§Ã™Å Ã˜Â©", commune_label: "Ã˜Â§Ã™â€žÃ˜Â¨Ã™â€žÃ˜Â¯Ã™Å Ã˜Â©", select_commune: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã˜Â¨Ã™â€žÃ˜Â¯Ã™Å Ã˜Â©", condition_label: "Ã˜Â§Ã™â€žÃ˜Â­Ã˜Â§Ã™â€žÃ˜Â©", price_label: "Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¹Ã˜Â± (Ã˜Â¯Ã˜Â¬) *", price_placeholder: "Ã™â€¦Ã˜Â«Ã˜Â§Ã™â€ž: 15000", description_label: "Ã˜Â§Ã™â€žÃ™Ë†Ã˜ÂµÃ™Â", description_placeholder: "Ã™â€¦Ã˜Â¹Ã™â€žÃ™Ë†Ã™â€¦Ã˜Â§Ã˜Âª Ã˜Â¥Ã˜Â¶Ã˜Â§Ã™ÂÃ™Å Ã˜Â©...", submit_ad_btn_text: "Ã˜Â¥Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€ž", loading_text: "Ã˜Â¬Ã˜Â§Ã˜Â±Ã™Å  Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€ž...", error_valid_title: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¬Ã˜Â§Ã˜Â¡ Ã˜Â¥Ã˜Â¯Ã˜Â®Ã˜Â§Ã™â€ž Ã˜Â¹Ã™â€ Ã™Ë†Ã˜Â§Ã™â€  Ã˜ÂµÃ˜Â§Ã™â€žÃ˜Â­.", error_select_brand: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¬Ã˜Â§Ã˜Â¡ Ã˜Â§Ã˜Â®Ã˜ÂªÃ™Å Ã˜Â§Ã˜Â± Ã™â€¦Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â©.", error_select_wilaya: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¬Ã˜Â§Ã˜Â¡ Ã˜Â§Ã˜Â®Ã˜ÂªÃ™Å Ã˜Â§Ã˜Â± Ã™Ë†Ã™â€žÃ˜Â§Ã™Å Ã˜Â©.", error_select_category: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¬Ã˜Â§Ã˜Â¡ Ã˜Â§Ã˜Â®Ã˜ÂªÃ™Å Ã˜Â§Ã˜Â± Ã™ÂÃ˜Â¦Ã˜Â©.", error_valid_price: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¬Ã˜Â§Ã˜Â¡ Ã˜Â¥Ã˜Â¯Ã˜Â®Ã˜Â§Ã™â€ž Ã˜Â³Ã˜Â¹Ã˜Â± Ã˜ÂµÃ˜Â§Ã™â€žÃ˜Â­.", login_text: "Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž Ã™â€žÃ™â€žÃ™Ë†Ã˜ÂµÃ™Ë†Ã™â€ž Ã˜Â¥Ã™â€žÃ™â€° Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ™â€¦Ã™Å Ã˜Â²Ã˜Â§Ã˜Âª.", google_login: "Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž Ã˜Â¨Ã˜Â§Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â¯Ã˜Â§Ã™â€¦ Google", back_to_listings: "Ã˜Â§Ã™â€žÃ˜Â¹Ã™Ë†Ã˜Â¯Ã˜Â© Ã˜Â¥Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã˜Â§Ã˜Âª", add_to_cart: "Ã˜Â£Ã˜Â¶Ã™Â Ã˜Â¥Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã™â€žÃ˜Â©", cart_title: "Ã˜Â³Ã™â€žÃ˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â³Ã™Ë†Ã™â€š", cart_total: "Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¬Ã™â€¦Ã˜Â§Ã™â€žÃ™Å ", checkout_btn: "Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹", no_listings: "Ã™â€žÃ™â€¦ Ã™Å Ã˜ÂªÃ™â€¦ Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â«Ã™Ë†Ã˜Â± Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã˜Â§Ã˜Âª.", your_cart_is_empty: "Ã˜Â³Ã™â€žÃ˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â³Ã™Ë†Ã™â€š Ã™ÂÃ˜Â§Ã˜Â±Ã˜ÂºÃ˜Â©.", remove: "Ã˜Â­Ã˜Â°Ã™Â", quantity: "Ã˜Â§Ã™â€žÃ™Æ’Ã™â€¦Ã™Å Ã˜Â©", item_total: "Ã˜Â¥Ã˜Â¬Ã™â€¦Ã˜Â§Ã™â€žÃ™Å  Ã˜Â§Ã™â€žÃ˜Â³Ã™â€žÃ˜Â¹Ã˜Â©", login_required: "Ã™Å Ã˜Â±Ã˜Â¬Ã™â€° Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž Ã™â€žÃ˜Â§Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â¯Ã˜Â§Ã™â€¦ Ã™â€¡Ã˜Â°Ã™â€¡ Ã˜Â§Ã™â€žÃ™â€¦Ã™Å Ã˜Â²Ã˜Â©.", show_filters: "Ã˜Â¥Ã˜Â¸Ã™â€¡Ã˜Â§Ã˜Â± Ã˜Â§Ã™â€žÃ™ÂÃ™â€žÃ˜Â§Ã˜ÂªÃ˜Â±", price_range: "Ã™â€ Ã˜Â·Ã˜Â§Ã™â€š Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¹Ã˜Â±", all_categories: "Ã˜Â¬Ã™â€¦Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â¦Ã˜Â§Ã˜Âª", category_label: "Ã˜Â§Ã™â€žÃ™ÂÃ˜Â¦Ã˜Â© *", select_category: "Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™ÂÃ˜Â¦Ã˜Â©", contact_seller: "Ã˜Â§Ã˜ÂªÃ˜ÂµÃ™â€ž Ã˜Â¨Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â§Ã˜Â¦Ã˜Â¹", clear_cart: "Ã˜Â¥Ã™ÂÃ˜Â±Ã˜Â§Ã˜Âº Ã˜Â§Ã™â€žÃ˜Â³Ã™â€žÃ˜Â©", ad_posted: "Ã˜ÂªÃ™â€¦ Ã™â€ Ã˜Â´Ã˜Â± Ã˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã™Æ’ Ã˜Â¨Ã™â€ Ã˜Â¬Ã˜Â§Ã˜Â­!", ad_post_failed: "Ã™ÂÃ˜Â´Ã™â€ž Ã™â€ Ã˜Â´Ã˜Â± Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ .", item_added_to_cart: "Ã˜ÂªÃ™â€¦Ã˜Âª Ã˜Â¥Ã˜Â¶Ã˜Â§Ã™ÂÃ˜Â© Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜ÂªÃ˜Â¬ Ã˜Â¥Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â³Ã™â€žÃ˜Â©!", delete_ad_confirm: "Ã™â€¡Ã™â€ž Ã˜Â£Ã™â€ Ã˜Âª Ã™â€¦Ã˜ÂªÃ˜Â£Ã™Æ’Ã˜Â¯ Ã™â€¦Ã™â€  Ã˜Â£Ã™â€ Ã™Æ’ Ã˜ÂªÃ˜Â±Ã™Å Ã˜Â¯ Ã˜Â­Ã˜Â°Ã™Â Ã™â€¡Ã˜Â°Ã˜Â§ Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã˜Å¸", sold_by: "Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â§Ã˜Â¦Ã˜Â¹:", my_listings: "Ã˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã˜Â§Ã˜ÂªÃ™Å ", seller_listings: "Ã˜Â¥Ã˜Â¹Ã™â€žÃ˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã™â€¦Ã™â€  Ã™â€¡Ã˜Â°Ã˜Â§ Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â§Ã˜Â¦Ã˜Â¹", buyer_reviews: "Ã˜ÂªÃ™â€šÃ™Å Ã™Å Ã™â€¦Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â´Ã˜ÂªÃ˜Â±Ã™Å Ã™â€ ", reviews_soon: "(Ã˜Â§Ã™â€žÃ˜ÂªÃ™â€šÃ™Å Ã™Å Ã™â€¦Ã˜Â§Ã˜Âª Ã™â€šÃ˜Â±Ã™Å Ã˜Â¨Ã˜Â§)", reviews_soon_2: "Ã™â€¦Ã™Å Ã˜Â²Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ™â€šÃ™Å Ã™Å Ã™â€¦ Ã˜Â³Ã˜ÂªÃ™Æ’Ã™Ë†Ã™â€  Ã™â€¦Ã˜ÂªÃ˜Â§Ã˜Â­Ã˜Â© Ã™â€šÃ˜Â±Ã™Å Ã˜Â¨Ã˜Â§.", messages: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â³Ã˜Â§Ã˜Â¦Ã™â€ž", loading_convos: "Ã˜Â¬Ã˜Â§Ã˜Â±Ã™Å  Ã˜ÂªÃ˜Â­Ã™â€¦Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã˜Â§Ã˜Â¯Ã˜Â«Ã˜Â§Ã˜Âª...", chat_with: "Ã™â€¦Ã˜Â­Ã˜Â§Ã˜Â¯Ã˜Â«Ã˜Â© Ã™â€¦Ã˜Â¹", type_message_placeholder: "Ã˜Â§Ã™Æ’Ã˜ÂªÃ˜Â¨ Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€žÃ˜Â©...", recently_viewed: "Ã˜Â´Ã™Ë†Ã™â€¡Ã˜Â¯Ã˜Âª Ã™â€¦Ã˜Â¤Ã˜Â®Ã˜Â±Ã˜Â§", chat: "Ã™â€¦Ã˜Â­Ã˜Â§Ã˜Â¯Ã˜Â«Ã˜Â©", load_more: "Ã˜ÂªÃ˜Â­Ã™â€¦Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â²Ã™Å Ã˜Â¯", ad_image_label: "Ã˜ÂµÃ™Ë†Ã˜Â±Ã˜Â© Ã˜Â§Ã™â€žÃ™â€šÃ˜Â·Ã˜Â¹Ã˜Â© *", facebook_login: "Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž Ã˜Â¨Ã˜Â§Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â¯Ã˜Â§Ã™â€¦ Facebook", store_label: "Ã˜Â§Ã˜Â³Ã™â€¦ Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂªÃ˜Â¬Ã˜Â±", store_name_placeholder: "Ã™â€¦Ã˜Â«Ã˜Â§Ã™â€ž: Ã™â€šÃ˜Â·Ã˜Â¹ Ã˜ÂºÃ™Å Ã˜Â§Ã˜Â± Ã˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª Ã˜Â¹Ã˜Â¨Ã˜Â¯ Ã˜Â§Ã™â€žÃ™â€šÃ˜Â§Ã˜Â¯Ã˜Â±", store_profile: "Ã™â€¦Ã™â€žÃ™Â Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂªÃ˜Â¬Ã˜Â±", setup_store_profile: "Ã˜Â¥Ã˜Â¹Ã˜Â¯Ã˜Â§Ã˜Â¯ Ã™â€¦Ã™â€žÃ™Â Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂªÃ˜Â¬Ã˜Â±", store_name_label: "Ã˜Â§Ã˜Â³Ã™â€¦ Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂªÃ˜Â¬Ã˜Â±", store_logo_label: "Ã˜Â´Ã˜Â¹Ã˜Â§Ã˜Â± Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂªÃ˜Â¬Ã˜Â±", save: "Ã˜Â­Ã™ÂÃ˜Â¸", profile_pic_label: "Ã˜ÂµÃ™Ë†Ã˜Â±Ã˜Â© Ã˜Â§Ã™â€žÃ™â€¦Ã™â€žÃ™Â Ã˜Â§Ã™â€žÃ˜Â´Ã˜Â®Ã˜ÂµÃ™Å ", update_profile_pic: "Ã˜ÂªÃ˜Â­Ã˜Â¯Ã™Å Ã˜Â« Ã˜Â§Ã™â€žÃ˜ÂµÃ™Ë†Ã˜Â±Ã˜Â©",
    }
};

const categories = {
    "braking-system": { fr: "SystÃƒÂ¨me de Freinage", en: "Braking System", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã™â€¦Ã™â€žÃ˜Â©", icon: "icons/brake.png", sub: {
        "brake-pads": { fr: "Plaquettes de frein", en: "Brake Pads", ar: "Ã™Ë†Ã˜Â³Ã˜Â§Ã˜Â¯Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" },
        "brake-discs": { fr: "Disques de frein", en: "Brake Discs", ar: "Ã˜Â£Ã™â€šÃ˜Â±Ã˜Â§Ã˜Âµ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" },
        "brake-calipers": { fr: "Ãƒâ€°trier de frein", en: "Brake Calipers", ar: "Ã™ÂÃ™Æ’Ã™Å  Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" },
        "brake-fluid": { fr: "Liquide de frein", en: "Brake Fluid", ar: "Ã˜Â³Ã˜Â§Ã˜Â¦Ã™â€ž Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" },
        "master-cylinder": { fr: "MaÃƒÂ®tre-cylindre de frein", en: "Brake Master Cylinder", ar: "Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â³Ã˜Â·Ã™Ë†Ã˜Â§Ã™â€ Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¦Ã™Å Ã˜Â³Ã™Å Ã˜Â© Ã™â€žÃ™â€žÃ™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" },
        "brake-hoses": { fr: "Flexibles de frein", en: "Brake Hoses", ar: "Ã˜Â®Ã˜Â±Ã˜Â§Ã˜Â·Ã™Å Ã™â€¦ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž" },
        "drum-brakes": { fr: "Freins Ãƒ  tambour", en: "Drum Brakes", ar: "Ã™ÂÃ˜Â±Ã˜Â§Ã™â€¦Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â·Ã˜Â¨Ã™â€žÃ˜Â©" }
    }},
    "engine": { fr: "Moteur", en: "Engine", ar: "Ã™â€¦Ã˜Â­Ã˜Â±Ã™Æ’", icon: "fa-cogs", sub: {
        "engine-oil": { fr: "Huile moteur", en: "Engine Oil", ar: "Ã˜Â²Ã™Å Ã˜Âª Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã˜Â±Ã™Æ’" },
        "timing-belt-kit": { fr: "Kit de courroie de distribution", en: "Timing Belt Kit", ar: "Ã˜Â·Ã™â€šÃ™â€¦ Ã˜Â­Ã˜Â²Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã™â€šÃ™Å Ã˜Âª" },
        "spark-plugs": { fr: "Bougies d'allumage", en: "Spark Plugs", ar: "Ã˜Â´Ã™â€¦Ã˜Â¹Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â´Ã˜Â¹Ã˜Â§Ã™â€ž" },
        "glow-plugs": { fr: "Bougies de prÃƒÂ©chauffage", en: "Glow Plugs", ar: "Ã˜Â´Ã™â€¦Ã˜Â¹Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã™â€¡Ã˜Â¬" },
        "water-pump": { fr: "Pompe Ãƒ  eau", en: "Water Pump", ar: "Ã™â€¦Ã˜Â¶Ã˜Â®Ã˜Â© Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â§Ã˜Â¡" },
        "turbocharger": { fr: "Turbocharger", en: "Turbocharger", ar: "Ã˜Â´Ã˜Â§Ã˜Â­Ã™â€  Ã˜ÂªÃ™Ë†Ã˜Â±Ã˜Â¨Ã™Å Ã™â€ Ã™Å " },
        "engine-mount": { fr: "Support moteur", en: "Engine Mount", ar: "Ã˜Â­Ã˜Â§Ã™â€¦Ã™â€ž Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã˜Â±Ã™Æ’" }
    }},
    "suspension-steering": { fr: "Suspension & Direction", en: "Suspension & Steering", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¹Ã™â€žÃ™Å Ã™â€š Ã™Ë†Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã˜Â¬Ã™Å Ã™â€¡", icon: "fa-car-side", sub: {
        "shock-absorbers": { fr: "Amortisseurs", en: "Shock Absorbers", ar: "Ã™â€¦Ã™â€¦Ã˜ÂªÃ˜ÂµÃ˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜ÂµÃ˜Â¯Ã™â€¦Ã˜Â§Ã˜Âª" },
        "control-arm": { fr: "Bras de suspension", en: "Control Arm", ar: "Ã˜Â°Ã˜Â±Ã˜Â§Ã˜Â¹ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â­Ã™Æ’Ã™â€¦" },
        "tie-rod-end": { fr: "Rotule de direction", en: "Tie Rod End", ar: "Ã˜Â·Ã˜Â±Ã™Â Ã™â€šÃ˜Â¶Ã™Å Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¨Ã˜Â·" },
        "wheel-bearing": { fr: "Roulement de roue", en: "Wheel Bearing", ar: "Ã™â€¦Ã˜Â­Ã™â€¦Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â¬Ã™â€žÃ˜Â©" },
        "power-steering-pump": { fr: "Pompe de direction assistÃƒÂ©e", en: "Power Steering Pump", ar: "Ã™â€¦Ã˜Â¶Ã˜Â®Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã˜Â¬Ã™Å Ã™â€¡ Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¹Ã˜Â²Ã˜Â²" }
    }},
    "filters": { fr: "Filtres", en: "Filters", ar: "Ã™ÂÃ™â€žÃ˜Â§Ã˜ÂªÃ˜Â±", icon: "fa-filter", sub: {
        "oil-filter": { fr: "Filtre Ãƒ  huile", en: "Oil Filter", ar: "Ã™ÂÃ™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ˜Â²Ã™Å Ã˜Âª" },
        "air-filter": { fr: "Filtre Ãƒ  air", en: "Air Filter", ar: "Ã™ÂÃ™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ™â€¡Ã™Ë†Ã˜Â§Ã˜Â¡" },
        "cabin-filter": { fr: "Filtre d'habitacle", en: "Cabin Filter", ar: "Ã™ÂÃ™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ™â€¦Ã™â€šÃ˜ÂµÃ™Ë†Ã˜Â±Ã˜Â©" },
        "fuel-filter": { fr: "Filtre Ãƒ  carburant", en: "Fuel Filter", ar: "Ã™ÂÃ™â€žÃ˜ÂªÃ˜Â± Ã˜Â§Ã™â€žÃ™Ë†Ã™â€šÃ™Ë†Ã˜Â¯" }
    }},
    "electrical": { fr: "SystÃƒÂ¨me Ãƒâ€°lectrique", en: "Electrical System", ar: "Ã˜Â§Ã™â€žÃ™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ™Æ’Ã™â€¡Ã˜Â±Ã˜Â¨Ã˜Â§Ã˜Â¦Ã™Å ", icon: "fa-bolt", sub: {
        "battery": { fr: "Batterie", en: "Battery", ar: "Ã˜Â¨Ã˜Â·Ã˜Â§Ã˜Â±Ã™Å Ã˜Â©" },
        "alternator": { fr: "Alternateur", en: "Alternator", ar: "Ã™â€¦Ã™Ë†Ã™â€žÃ˜Â¯" },
        "starter-motor": { fr: "DÃƒÂ©marreur", en: "Starter Motor", ar: "Ã™â€¦Ã˜Â­Ã˜Â±Ã™Æ’ Ã˜Â¨Ã˜Â¯Ã˜Â¡ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â´Ã˜ÂºÃ™Å Ã™â€ž" },
        "spark-plug-leads": { fr: "CÃƒÂ¢bles de bougies", en: "Spark Plug Leads", ar: "Ã˜Â£Ã˜Â³Ã™â€žÃ˜Â§Ã™Æ’ Ã˜Â´Ã™â€¦Ã˜Â¹Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â´Ã˜Â¹Ã˜Â§Ã™â€ž" },
        "sensors": { fr: "Capteurs", en: "Sensors", ar: "Ã˜Â­Ã˜Â³Ã˜Â§Ã˜Â³Ã˜Â§Ã˜Âª" }
    }},
    "body": { fr: "Carrosserie", en: "Body", ar: "Ã™â€¡Ã™Å Ã™Æ’Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â©", icon: "fa-car-burst", sub: {
        "headlights": { fr: "Phares", en: "Headlights", ar: "Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂµÃ˜Â§Ã˜Â¨Ã™Å Ã˜Â­ Ã˜Â§Ã™â€žÃ˜Â£Ã™â€¦Ã˜Â§Ã™â€¦Ã™Å Ã˜Â©" },
        "rear-lights": { fr: "Feux arriÃƒÂ¨re", en: "Rear Lights", ar: "Ã˜Â§Ã™â€žÃ™â€¦Ã˜ÂµÃ˜Â§Ã˜Â¨Ã™Å Ã˜Â­ Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â©" },
        "car-mirror": { fr: "RÃƒÂ©troviseur", en: "Car Mirror", ar: "Ã™â€¦Ã˜Â±Ã˜Â¢Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â³Ã™Å Ã˜Â§Ã˜Â±Ã˜Â©" },
        "wiper-blades": { fr: "Balais d'essuie-glace", en: "Wiper Blades", ar: "Ã˜Â´Ã™ÂÃ˜Â±Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â³Ã˜Â§Ã˜Â­Ã˜Â§Ã˜Âª" },
        "bumper": { fr: "Pare-chocs", en: "Bumper", ar: "Ã˜Â§Ã™â€žÃ˜ÂµÃ˜Â¯Ã˜Â§Ã™â€¦" },
        "fenders": { fr: "Ailes", en: "Fenders", ar: "Ã˜Â§Ã™â€žÃ˜Â±Ã™ÂÃ˜Â§Ã˜Â±Ã™Â" }
    }},
    "exhaust-system": { fr: "SystÃƒÂ¨me d'ÃƒÂ©chappement", en: "Exhaust System", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â§Ã˜Â¯Ã™â€¦", icon: "fa-gas-pump", sub: {
        "muffler": { fr: "Silencieux", en: "Muffler", ar: "Ã™Æ’Ã˜Â§Ã˜ÂªÃ™â€¦ Ã˜Â§Ã™â€žÃ˜ÂµÃ™Ë†Ã˜Âª" },
        "catalytic-converter": { fr: "Catalyseur", en: "Catalytic Converter", ar: "Ã™â€¦Ã˜Â­Ã™Ë†Ã™â€ž Ã˜Â­Ã™ÂÃ˜Â§Ã˜Â²" },
        "lambda-sensor": { fr: "Sonde Lambda", en: "Lambda Sensor", ar: "Ã˜Â­Ã˜Â³Ã˜Â§Ã˜Â³ Ã˜Â§Ã™â€žÃ˜Â£Ã™Æ’Ã˜Â³Ã˜Â¬Ã™Å Ã™â€ " },
        "exhaust-pipe": { fr: "Tuyau d'ÃƒÂ©chappement", en: "Exhaust Pipe", ar: "Ã˜Â£Ã™â€ Ã˜Â¨Ã™Ë†Ã˜Â¨ Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â§Ã˜Â¯Ã™â€¦" },
        "gaskets-and-seals": { fr: "Joints et bagues", en: "Gaskets and Seals", ar: "Ã˜Â¬Ã™Ë†Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã™Ë†Ã˜Â­Ã™â€žÃ™â€šÃ˜Â§Ã˜Âª" }
    }},
    "cooling-system": { fr: "SystÃƒÂ¨me de Refroidissement", en: "Cooling System", ar: "Ã™â€ Ã˜Â¸Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¨Ã˜Â±Ã™Å Ã˜Â¯", icon: "fa-snowflake", sub: {
        "radiator": { fr: "Radiateur", en: "Radiator", ar: "Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¯Ã™Å Ã˜Â§Ã˜ÂªÃ™Å Ã˜Â±" },
        "coolant-thermostat": { fr: "Thermostat", en: "Coolant Thermostat", ar: "Ã™â€¦Ã™â€ Ã˜Â¸Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â­Ã˜Â±Ã˜Â§Ã˜Â±Ã˜Â©" },
        "radiator-hoses": { fr: "Durites de radiateur", en: "Radiator Hoses", ar: "Ã˜Â®Ã˜Â±Ã˜Â§Ã˜Â·Ã™Å Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¯Ã™Å Ã˜Â§Ã˜ÂªÃ™Å Ã˜Â±" },
        "fan": { fr: "Ventilateur de refroidissement", en: "Cooling Fan", ar: "Ã™â€¦Ã˜Â±Ã™Ë†Ã˜Â­Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â¨Ã˜Â±Ã™Å Ã˜Â¯" }
    }}
};
const wilayas = {
    "Adrar": ["Adrar", "Charouine", "Reggane", "Aoulef", "Timimoun", "Bordj Badji Mokhtar", "In Salah"], "Chlef": ["Chlef", "TÃƒÂ©nÃƒÂ¨s", "Ouled FarÃƒÂ¨s", "El Marsa", "Oued Fodda"], "Laghouat": ["Laghouat", "Aflou", "AÃƒÂ¯n Madhi", "Ksar El Hirane", "Hassi R'Mel"], "Oum El Bouaghi": ["Oum El Bouaghi", "AÃƒÂ¯n BeÃƒÂ¯da", "AÃƒÂ¯n M'lila", "F'kirina", "Souk Naamane"], "Batna": ["Batna", "Barika", "Arris", "Merouana", "Timgad"], "BÃƒÂ©jaÃƒÂ¯a": ["BÃƒÂ©jaÃƒÂ¯a", "Akbou", "El Kseur", "Sidi AÃƒÂ¯ch", "Aokas"], "Biskra": ["Biskra", "Tolga", "Sidi Okba", "El Kantara", "Ouled Djellal"], "BÃƒÂ©char": ["BÃƒÂ©char", "Kenadsa", "Beni Ounif", "Taghit", "Abadla"], "Blida": ["Blida", "Boufarik", "LarbaÃƒÂ¢", "Meftah", "Mouzaia"], "Bouira": ["Bouira", "Lakhdaria", "Sour El Ghozlane", "AÃƒÂ¯n Bessem", "M'chedallah"], "Tamanrasset": ["Tamanrasset", "In Salah", "In Guezzam", "Djanet"], "TÃƒÂ©bessa": ["TÃƒÂ©bessa", "Bir El Ater", "Cheria", "El Aouinet", "Ouenza"], "Tlemcen": ["Tlemcen", "Maghnia", "Ghazaouet", "Remchi", "Nedroma"], "Tiaret": ["Tiaret", "Frenda", "Sougueur", "Ksar Chellala", "Mahdia"], "Tizi Ouzou": ["Tizi Ouzou", "Azazga", "DraÃƒÂ¢ Ben Khedda", "Tigzirt", "LarbaÃƒÂ¢ Nath Irathen"], "Alger": ["Alger Centre", "Bab El Oued", "Hussein Dey", "Kouba", "El Harrach", "Dar El BeÃƒÂ¯da"], "Djelfa": ["Djelfa", "Messaad", "AÃƒÂ¯n Oussera", "Hassi Bahbah", "El Idrissia"], "Jijel": ["Jijel", "Taher", "El Milia", "Chekfa", "Ziama Mansouriah"], "SÃƒÂ©tif": ["SÃƒÂ©tif", "El Eulma", "AÃƒÂ¯n Oulmane", "BougaÃƒÂ¢", "Beni Ouartilane"], "SaÃƒÂ¯da": ["SaÃƒÂ¯da", "AÃƒÂ¯n El Hadjar", "Sidi Boubkeur", "Youb", "Ouled Brahim"], "Skikda": ["Skikda", "Azzaba", "Collo", "El Harrouch", "Ramdane Djamel"], "Sidi Bel AbbÃƒÂ¨s": ["Sidi Bel AbbÃƒÂ¨s", "Telagh", "Sfisef", "Ras El Ma", "Ben Badis"], "Annaba": ["Annaba", "El Bouni", "El Hadjar", "Sidi Amar", "Berrahal"], "Guelma": ["Guelma", "Oued Zenati", "HÃƒÂ©liopolis", "Bouchegouf", "Ain Reggada"], "Constantine": ["Constantine", "El Khroub", "Hamma Bouziane", "Didouche Mourad", "AÃƒÂ¯n Smara"], "MÃƒÂ©dÃƒÂ©a": ["MÃƒÂ©dÃƒÂ©a", "Berrouaghia", "Ksar Boukhari", "Tablat", "AÃƒÂ¯n Boucif"], "Mostaganem": ["Mostaganem", "Sidi Ali", "Achaacha", "Hassi Mameche", "AÃƒÂ¯n TÃƒÂ©delÃƒÂ¨s"], "M'Sila": ["M'Sila", "Bou SaÃƒÂ¢da", "Sidi AÃƒÂ¯ssa", "AÃƒÂ¯n El Melh", "Magra"], "Mascara": ["Mascara", "Tighennif", "Sig", "Ghriss", "Mohammadia"], "Ouargla": ["Ouargla", "Hassi Messaoud", "Touggourt", "Rouissat", "N'Goussa"], "Oran": ["Oran", "Es Senia", "Arzew", "Bir El Djir", "AÃƒÂ¯n El Turk"], "El Bayadh": ["El Bayadh", "Bougtob", "Brezina", "Rogassa", "El Abiodh Sidi Cheikh"], "Illizi": ["Illizi", "Djanet", "In Amenas", "Bordj Omar Driss"], "Bordj Bou ArrÃƒÂ©ridj": ["Bordj Bou ArrÃƒÂ©ridj", "Ras El Oued", "Mansoura", "Medjana", "El Achir"], "BoumerdÃƒÂ¨s": ["BoumerdÃƒÂ¨s", "Boudouaou", "Dellys", "RÃƒÂ©ghaÃƒÂ¯a", "Isser"], "El Tarf": ["El Tarf", "El Kala", "Ben M'Hidi", "Besbes", "DrÃƒÂ©an"], "Tindouf": ["Tindouf", "Oum El Assel"], "Tissemsilt": ["Tissemsilt", "ThÃƒÂ©niet El Had", "Lardjem", "Bordj Bounaama", "Ammi Moussa"], "El Oued": ["El Oued", "Guemar", "Debila", "Robbah", "El M'Ghair"], "Khenchela": ["Khenchela", "Kais", "Chechar", "Ouled Rechache", "El Hamma"], "Souk Ahras": ["Souk Ahras", "M'daourouch", "Sedrata", "Taoura", "Heddada"], "Tipaza": ["Tipaza", "Cherchell", "KolÃƒÂ©a", "Hadjout", "Fouka"], "Mila": ["Mila", "Ferdjioua", "Grarem Gouga", "Tadjenanet", "Chelghoum LaÃƒÂ¯d"], "AÃƒÂ¯n Defla": ["AÃƒÂ¯n Defla", "Khemis Miliana", "Miliana", "El Attaf", "Djelida"], "NaÃƒÂ¢ma": ["NaÃƒÂ¢ma", "MÃƒÂ©cheria", "AÃƒÂ¯n Sefra", "Sfissifa", "Moghrar"], "AÃƒÂ¯n TÃƒÂ©mouchent": ["AÃƒÂ¯n TÃƒÂ©mouchent", "BÃƒÂ©ni Saf", "Hammam Bou Hadjar", "El Malah", "Aghlal"], "GhardaÃƒÂ¯a": ["GhardaÃƒÂ¯a", "Metlili", "El Guerrara", "Berriane", "Bounoura"], "Relizane": ["Relizane", "Oued Rhiou", "Mazouna", "Ammi Moussa", "Zemmoura"], "El M'ghair": ["El M'ghair", "Djamaa", "Sidi Amrane", "Oum Toub"], "El Meniaa": ["El Meniaa", "Hassi Gara", "Mansourah"],
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
const brand_icons = {
    "Toyota": "icons/toyota.png", "Peugeot": "icons/peugeot.png", "Volkswagen": "icons/volkswagen.png", "Renault": "icons/renault.png", "Hyundai": "icons/hyundai.png", "Nissan": "icons/nissan.png", "Fiat": "icons/fiat.png", "CitroÃƒÂ«n": "icons/citroen.png", "Kia": "icons/kia.png", "Mercedes-Benz": "icons/mercedes.png", "Audi": "icons/audi.png", "BMW": "icons/bmw.png", "Ford": "icons/ford.png", "Chevrolet": "icons/chevrolet.png", "Dacia": "icons/dacia.png", "Skoda": "icons/skoda.png", "Seat": "icons/seat.png"
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
    searchSuggestions: document.getElementById('search-suggestions'),
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
    where(documentId(), "in", viewedProductIds));
  
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
        if (DOMElements.mobileMenu && !DOMElements.mobileMenu.classList.contains('-translate-x-full')) {
            closeMobileMenu();
        }
    }
    if (touchEndX > touchStartX + 50) {
        if (DOMElements.mobileMenu && DOMElements.mobileMenu.classList.contains('-translate-x-full')) {
            openMobileMenu();
        }
    }
};

// --- APP LOGIC ---
const setDarkMode = (isDark) => {
  DOMElements.html.classList.toggle('dark', !!isDark);
  localStorage.setItem('piecety_dark_mode', !!isDark);
  
  const desktopIcon = DOMElements.darkModeToggle?.querySelector('i');
  if (desktopIcon) desktopIcon.className = isDark ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
  
  const mobileDarkModeToggle = document.getElementById('mobile-dark-mode-toggle');
  if (mobileDarkModeToggle) {
    const mobileIcon = mobileDarkModeToggle.querySelector('i');
    if (mobileIcon) mobileIcon.className = isDark ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
  }
};

const setLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem("piecety_lang", lang);
    translatePage(lang);
    updateTitle(currentView);
    if (currentView) { renderView(currentView); }
};

const updateTitle = (view) => {
    const titleKeyMap = { cart: "cart_title", dashboard: "dashboard", inbox: "messages", chat: "messages", terms: "terms_title" };
    const titleKey = titleKeyMap[view] || "page_title";
    document.title = translations[currentLang][titleKey] || "Piecety";
    document.querySelector('meta[name="description"]').setAttribute("content", translations[currentLang]["meta_description"]);
};

const translatePage = (lang) => {
    const html = DOMElements.html;
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    html.setAttribute("lang", lang);

    const currentLangEl = document.getElementById("current-lang");
    if (currentLangEl) {
        currentLangEl.textContent = translations[lang]?.[`${lang}_short`] || lang.toUpperCase();
    }
    
    document.querySelectorAll("[data-i18n-key]").forEach(el => {
        const key = el.dataset.i18nKey;
        if (translations[lang]?.[key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[lang]?.[key]) el.placeholder = translations[lang][key];
    });
    
    const mobileDarkModeToggle = document.getElementById('mobile-dark-mode-toggle');
    if (mobileDarkModeToggle) {
        mobileDarkModeToggle.setAttribute('aria-label', lang === "ar" ? "Ã˜ÂªÃ˜ÂºÃ™Å Ã™Å Ã˜Â± Ã˜Â§Ã™â€žÃ™Ë†Ã˜Â¶Ã˜Â¹ Ã˜Â§Ã™â€žÃ™â€žÃ™Å Ã™â€žÃ™Å " : (lang === "fr" ? "Changer le mode sombre" : "Toggle dark mode"));
    }
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
    if (DOMElements.searchInput) {
      DOMElements.searchInput.value = params.get('search') || '';
    }
};

const trapModalFocus = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const focusableEls = modal.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (focusableEls.length === 0) return;
    
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) { // backward
                if (document.activeElement === firstEl) {
                    lastEl.focus();
                    e.preventDefault();
                }
            } else { // forward
                if (document.activeElement === lastEl) {
                    firstEl.focus();
                    e.preventDefault();
                }
            }
        }
        if (e.key === 'Escape') {
            toggleModal(modal, false);
        }
    });
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
    if (DOMElements.appContainer) {
      DOMElements.appContainer.innerHTML = '';
    }
    
    const route = viewName.split('/')[0];
    updateTitle(route, data);

    const templateId = `${route}-view-template`;
    const template = document.getElementById(templateId);

    if (template) {
      if (DOMElements.appContainer) {
        DOMElements.appContainer.appendChild(template.content.cloneNode(true));
      }
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
    const category = params.get('category');
    const sub_category = params.get('sub_category');
    const brand = params.get('brand');
    const model = params.get('model');

    if (model) renderYears(model, brand, category, sub_category);
    else if (brand) renderModels(brand, category, sub_category);
    else if (sub_category) renderBrands(sub_category);
    else if (category) renderSubCategories(category);
    else renderPartCategories();
    
    renderRecentlyViewed();
    renderRecommendations();

    const setupFilters = (container) => {
        if (!container) return;
        const template = document.getElementById('filters-template');
        if (template) {
            container.innerHTML = template.content.cloneNode(true).innerHTML;
            setupFilterListeners(container);
            applyFiltersFromURL(container);
        }
    };

    setupFilters(document.getElementById('filters-content'));
    setupFilters(DOMElements.mobileFiltersContent);

    document.getElementById('show-filters-btn')?.addEventListener('click', () => {
        DOMElements.mobileFiltersModal?.classList.remove('translate-x-full');
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
        ([key, cat]) => {
            const isImage = cat.icon.endsWith('.png') || cat.icon.endsWith('.jpg');
            const iconContent = isImage ? `<img src="${cat.icon}" alt="${cat[currentLang]}" class="h-10 w-10 object-contain">` : `<i class="fas ${cat.icon} text-3xl"></i>`;
            return `
                <div class="p-4 rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 mx-auto w-16 h-16 flex items-center justify-center mb-2 category-icon">
                    ${iconContent}
                </div>
                <h3 class="font-semibold text-sm md:text-base">${cat[currentLang]}</h3>
            `;
        },
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

const renderBrands = (subCategoryKey) => {
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

const renderModels = (brand, category, subCategory) => {
    const models = car_data[brand];
    if (!models) { renderBrands(subCategory); return; }

    renderDynamicGrid('models_title', models, 
        (model) => `<span class="font-semibold">${model}</span>`,
        (e, model) => {
            e.preventDefault();
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('model', model);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            renderHomePage();
        }
    );
};

const renderYears = (model, brand, category, subCategory) => {
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
        if (modelContainer && modelFilter) {
            if (selectedBrand && car_data[selectedBrand]) {
                populateSelect(modelFilter, car_data[selectedBrand], 'all_models', currentLang);
                modelContainer.classList.remove('hidden');
            } else {
                modelContainer.classList.add('hidden');
                modelFilter.value = '';
            }
        }
        debouncedApply();
    });
    
    const wilayaFilter = container.querySelector('#wilaya-filter');
    wilayaFilter?.addEventListener('change', () => {
        const communeContainer = container.querySelector('#commune-filter-container');
        const communeFilter = container.querySelector('#commune-filter');
        const selectedWilaya = wilayaFilter.value;
        if (communeContainer && communeFilter) {
            if (selectedWilaya && wilayas[selectedWilaya]) {
                populateSelect(communeFilter, wilayas[selectedWilaya], 'all_communes', currentLang);
                communeContainer.classList.remove('hidden');
            } else {
                communeContainer.classList.add('hidden');
                communeFilter.value = '';
            }
        }
        debouncedApply();
    });
    
    const priceFilter = container.querySelector('#price-range-filter');
    if (priceFilter) {
        const priceValueEl = container.querySelector('#price-range-value');
        priceFilter.addEventListener('input', () => {
            if (priceValueEl) {
              priceValueEl.textContent = `${Number(priceFilter.value).toLocaleString()} DA`;
            }
        });
        priceFilter.addEventListener('change', debouncedApply);
    }
    
    container.querySelectorAll('.filter:not(#brand-filter):not(#wilaya-filter):not(#price-range-filter)').forEach(el => {
        el.addEventListener('change', debouncedApply);
    });
    
    container.querySelector('#filter-reset-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
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
    
    let productsToShow = [];
    let fromCache = false;
    
    if (listingsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION && !loadMore && !searchQuery) {
        productsToShow = listingsCache;
        fromCache = true;
    } else {
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
            productsToShow = snapshot.docs.map(p => ({ id: p.id, ...p.data() }));

            if (searchQuery) {
                productsToShow = productsToShow.filter(doc => {
                    return doc.title.toLowerCase().includes(searchQuery) || 
                           (doc.description && doc.description.toLowerCase().includes(searchQuery));
                });
            }
            
            if (!loadMore && !searchQuery && productsToShow.length > 0) {
                listingsCache = productsToShow;
                cacheTimestamp = Date.now();
            }

            lastVisibleProduct = snapshot.docs[snapshot.docs.length - 1];
            if (snapshot.docs.length === PRODUCTS_PER_PAGE && loadMoreContainer) {
                loadMoreContainer.innerHTML = `<button id="load-more-btn" class="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors" data-i18n-key="load_more"></button>`;
                document.getElementById('load-more-btn').onclick = () => renderListings(true);
            }

        } catch (error) {
            console.error("Ã¢ÂÅ’ Error loading products:", error);
            listingsSection.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading products: ${error.message}</p>`;
            isFetching = false;
            return;
        }
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
        displayProducts(productsToShow, listingsSection);
    }
    translatePage(currentLang);
    isFetching = false;
};

const displayProducts = (docs, container) => {
  if (!container) return;
  if (docs.length === 0 && container.innerHTML === '') {
    container.innerHTML = `<p class="col-span-full text-center p-8 text-lg text-gray-500" data-i18n-key="no_listings"></p>`;
    return;
  }
  
  let htmlString = "";
  docs.forEach(product => {
    const id = product.id;
    const isMyProduct = currentUser && currentUser.uid === product.sellerId;
    const imageUrl = product.imageUrl || './assets/placeholder.png';
    const webpUrl = imageUrl.replace(/\.(png|jpe?g)$/i, '.webp');

    htmlString += `
      <div class="listing-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col" data-id="${id}">
        <picture>
          <source srcset="${webpUrl}" type="image/webp">
          <img loading="lazy" src="${imageUrl}" alt="${product.title || ''}" class="w-full h-40 object-cover cursor-pointer product-image">
        </picture>
        <div class="p-4 flex flex-col flex-grow">
          <h3 class="font-bold text-lg truncate product-title cursor-pointer">${product.title || ''}</h3>
          <p class="text-blue-600 dark:text-blue-400 font-semibold text-xl my-2">${(product.price||0).toLocaleString()} DA</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4"><i class="fas fa-map-marker-alt mr-1"></i> ${product.wilaya || ''}${product.commune ? `, ${product.commune}` : ''}</p>
          <div class="mt-auto">
            ${!isMyProduct ? `<button class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 chat-btn"><i class="fas fa-comments"></i> <span data-i18n-key="chat"></span></button>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML += htmlString;
  
  // Attach event listeners after rendering
  container.querySelectorAll('.listing-card').forEach(card => {
    const id = card.dataset.id;
    const product = docs.find(p => p.id === id);
    
    const imgEl = card.querySelector('.product-image');
    const titleEl = card.querySelector('.product-title');
    const chatBtn = card.querySelector('.chat-btn');
    
    if (imgEl) imgEl.onclick = () => renderView('product', product);
    if (titleEl) titleEl.onclick = () => renderView('product', product);
    if (chatBtn && product) chatBtn.onclick = () => startOrOpenChat(product.sellerId, product.sellerName, product.id);
  });
};

const renderRecentlyViewed = async () => {
    const section = document.getElementById('recently-viewed-section');
    const grid = document.getElementById('recently-viewed-grid');
    if (!section || !grid || recentlyViewed.length === 0) {
        if(section) section.classList.add('hidden');
        return;
    }
    
    try {
        const q = query(collection(db, "products"), where(documentId(), "in", recentlyViewed.slice(0, 4)));
        const snapshots = await getDocs(q);
        const products = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (products.length > 0) {
            section.classList.remove('hidden');
            grid.innerHTML = '';
            displayProducts(products, grid);
        } else {
            section.classList.add('hidden');
        }
    } catch(error) {
        console.error("Error fetching recently viewed products:", error);
    }
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
    const imageUrl = product.imageUrl || './assets/placeholder.png';
    document.getElementById('product-image-detail').src = imageUrl;
    document.getElementById('product-image-webp').srcset = imageUrl.replace(/\.(png|jpe?g)$/i, '.webp');
    document.getElementById('product-brand-detail').textContent = product.brand;
    document.getElementById('product-model-detail').textContent = product.model || 'N/A';
    document.getElementById('product-year-detail').textContent = product.year || 'N/A';
    document.getElementById('product-wilaya-detail').textContent = product.wilaya;
    document.getElementById('product-commune-detail').textContent = product.commune || 'N/A';
    document.getElementById('product-description-detail').textContent = product.description || 'No description available.';

    const sellerLink = document.getElementById('seller-profile-link');
    if (sellerLink) {
        sellerLink.textContent = product.sellerName || 'Anonymous';
        sellerLink.onclick = (e) => {
            e.preventDefault();
            renderView('profile', { userId: product.sellerId, userName: product.sellerName });
        };
    }

    const backBtn = document.getElementById('back-to-listings-btn');
    if (backBtn) backBtn.onclick = () => window.history.back();
    const cartBtn = document.getElementById('add-to-cart-btn');
    if (cartBtn) cartBtn.onclick = () => addToCart(product);
    const contactBtn = document.getElementById('contact-seller-btn');
    if (contactBtn) contactBtn.onclick = () => startOrOpenChat(product.sellerId, product.sellerName, product.id);

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

    if (starsContainer) {
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
    }

    if (submitBtn && reviewTextarea) {
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
    }
};

window.renderCartPage = async () => {
    if (!currentUser) {
        showMessage('login_required', 3000, 'error');
        renderView('home');
        return;
    }
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');
    if (!container || !summary) return;
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

    const backBtn = document.getElementById('back-from-cart-btn');
    if (backBtn) backBtn.onclick = () => window.history.back();
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) clearBtn.onclick = clearCart;
};

window.renderDashboardPage = async () => {
    if (!currentUser) { renderView('home'); return; }
    
    const becomeStoreCard = document.getElementById('become-store-card');
    if (userProfile?.role === "store") {
        if (becomeStoreCard) becomeStoreCard.classList.add('hidden');
    } else {
        if (becomeStoreCard) becomeStoreCard.classList.remove('hidden');
        const becomeStoreBtn = document.getElementById('becomeStoreBtn');
        if (becomeStoreBtn) {
            becomeStoreBtn.onclick = () => {
                 window.location.href = 'store-setup.html';
            };
        }
    }

    const grid = document.getElementById('my-listings-grid');
    if (!grid) return;
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
    
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.onclick = () => {
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
    }
};

window.renderProfilePage = async (data) => {
    if (!data?.userId) { renderView('home'); return; }
    
    const isCurrentUserProfile = currentUser && currentUser.uid === data.userId;
    const userSnap = await getDoc(doc(db, "users", data.userId));
    const profileData = userSnap.exists() ? userSnap.data() : { isStore: false };

    const profilePicEl = document.getElementById('profile-pic');
    if (profilePicEl) {
        profilePicEl.src = (isCurrentUserProfile ? currentUser?.photoURL : profileData.photoURL) || './assets/placeholder.png';
    }
    const profileNameEl = document.getElementById('profile-name');
    if (profileNameEl) {
        profileNameEl.textContent = isCurrentUserProfile ? currentUser?.displayName : data.userName || 'Seller Profile';
    }
    
    const storeNameDisplay = document.getElementById('store-name-display');
    const storeProfileLabel = document.getElementById('store-profile-label');
    const becomeStoreCard = document.getElementById('become-store-card');
    const editProfileSection = document.getElementById('profile-edit-section');
    
    if (isCurrentUserProfile) {
        if (editProfileSection) editProfileSection.classList.remove('hidden');
        const profileNameInput = document.getElementById('profile-name-input');
        if (profileNameInput) profileNameInput.value = currentUser?.displayName || '';
        if (profileData.role === 'store') {
            if (becomeStoreCard) becomeStoreCard.classList.add('hidden');
        } else {
            if (becomeStoreCard) becomeStoreCard.classList.remove('hidden');
            const becomeStoreBtn = document.getElementById('becomeStoreBtn');
            if (becomeStoreBtn) {
              becomeStoreBtn.onclick = () => {
                  window.location.href = 'store-setup.html';
              };
            }
        }
    } else {
        if (editProfileSection) editProfileSection.classList.add('hidden');
        if (becomeStoreCard) becomeStoreCard.classList.add('hidden');
    }
    
    const userStoreSnap = await getDoc(doc(db, "stores", data.userId));
    const userStoreData = userStoreSnap.exists() ? userStoreSnap.data() : null;

    if (userStoreData) {
        if (storeNameDisplay) {
            storeNameDisplay.textContent = userStoreData.name;
            storeNameDisplay.classList.remove('hidden');
        }
        if (storeProfileLabel) storeProfileLabel.classList.remove('hidden');
    } else {
        if (storeNameDisplay) storeNameDisplay.classList.add('hidden');
        if (storeProfileLabel) storeProfileLabel.classList.add('hidden');
    }
    
    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
      profileEditForm.addEventListener('submit', updateProfileData);
    }
    
    const grid = document.getElementById('user-products-grid');
    if (!grid) return;
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
    if (reviewsList) {
      reviewsList.innerHTML = `<p class="text-gray-500 dark:text-gray-400" data-i18n-key="reviews_soon_2"></p>`;
    }
};

const updateProfileData = async (e) => {
    e.preventDefault();
    if (!currentUser) { showMessage('login_required', 3000, 'error'); return; }

    const form = e.target;
    const displayName = form.elements['displayName']?.value.trim();
    const profilePicFile = form.elements['profilePic']?.files?.[0];

    if (!displayName) {
        showMessage('Please enter a name.', 3000, 'error');
        return;
    }
    
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

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
        renderView('profile', { userId: currentUser.uid, userName: currentUser.displayName });
    } catch (error) {
        console.error("Error updating profile:", error);
        showMessage("Failed to update profile.", 3000, "error");
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.renderInboxPage = () => {
    if (!currentUser) { renderView('home'); return; }
    const listContainer = document.getElementById('conversations-list');
    if (!listContainer) return;
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
                ${(chat.unreadCount?.[currentUser.uid] || 0) > 0 ? `<span class="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${chat.unreadCount[currentUser.uid]}</span>` : ''}`;
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

    const chatWithNameEl = document.getElementById('chat-with-name');
    if (chatWithNameEl) {
      chatWithNameEl.textContent = `${translations[currentLang].chat_with} ${otherUserName}`;
    }
    const backBtn = document.getElementById('back-to-inbox-btn');
    if (backBtn) backBtn.onclick = () => renderView('inbox');

    const messagesContainer = document.getElementById('messages-container');
    const messageForm = document.getElementById('send-message-form');
    const messageInput = document.getElementById('message-input');
    const chatActions = document.getElementById('chat-actions');
    
    if (productId && chatActions) {
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
    if(messagesContainer) {
      messagesListener = onSnapshot(q, (snapshot) => {
          messagesContainer.innerHTML = snapshot.empty ? '<p class="text-center text-gray-500">No messages yet. Say hi!</p>' : '';
          snapshot.docs.reverse().forEach(doc => {
              const msg = doc.data();
              const msgEl = document.createElement('div');
              msgEl.className = `p-3 rounded-lg max-w-xs ${msg.senderId === currentUser?.uid ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 dark:bg-gray-600 self-start'}`;
              msgEl.textContent = msg.text;
              messagesContainer.appendChild(msgEl);
          });
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, (error) => {
          console.error("Error listening to messages:", error);
          messagesContainer.innerHTML = `<p class="text-red-500">Could not load messages.</p>`;
      });
    }

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

    if (messageForm && messageInput) {
      messageForm.onsubmit = async (e) => {
          e.preventDefault();
          const text = messageInput.value.trim();
          messageInput.value = '';
          await sendMessage(text);
      };
    }
};

window.renderTermsPage = () => {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = "September 13, 2025";
    }
};

// REMOVED store setup function from here, it's now in store-setup.js
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
        
        // Also delete the store profile if it exists
        const storeRef = doc(db, "stores", currentUser.uid);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
            await deleteDoc(storeRef);
        }

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
        if(currentView === 'cart') renderView('cart');
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
        if (currentView === 'cart') renderView('cart');
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
        if (currentView === 'cart') renderView('cart');
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
             // File input doesn't have a value property in the same way, skip validation here.
             // It's better to validate if a file exists before upload.
             return;
        } else {
            isInvalid = !input?.value?.trim();
        }
        if (input) input.classList.toggle('border-red-500', isInvalid);
        if (errorEl) errorEl.classList.toggle('hidden', !isInvalid);
        if (isInvalid) isValid = false;
    });
    return isValid;
};

// --- AUTHENTICATION & UI UPDATES ---
const updateAuthUI = (user) => {
    const { authLinksContainer, mobileNavLinks } = DOMElements;
    if (!authLinksContainer || !mobileNavLinks) return;
    authLinksContainer.innerHTML = '';
    
    let mobileLinksHTML = `
        <a href="#" id="mobile-home-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="nav_home"></a>
        <a href="#" id="mobile-search-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="nav_search"></a>
        <a href="#" id="mobile-sell-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg" data-i18n-key="sell"></a>
        <a href="#" id="mobile-cart-link" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-lg relative"><span data-i18n-key="cart_title"></span><span id="mobile-cart-count" class="absolute top-0 ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full hidden">0</span></a>`;

    if (user) {
        authLinksContainer.innerHTML = `<div class="relative" id="user-menu"><button id="user-menu-btn" class="flex items-center"><img src="${user.photoURL || './assets/placeholder.png'}" alt="User" class="w-8 h-8 rounded-full border-2 border-transparent hover:border-blue-500 transition-colors"></button><div id="user-menu-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 hidden z-20"><a href="#" id="profile-link" class="block px-4 py-2 text-sm" data-i18n-key="nav_profile"></a><a href="#" id="dashboard-link" class="block px-4 py-2 text-sm" data-i18n-key="dashboard"></a><a href="#" id="messages-link" class="relative block px-4 py-2 text-sm" data-i18n-key="messages"><span id="unread-badge" class="hidden absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a><button id="logout-btn" class="w-full text-left px-4 py-2 text-sm" data-i18n-key="logout"></button></div></div>`;
        mobileLinksHTML += `<a href="#" id="mobile-profile-link" class="p-2 text-lg" data-i18n-key="nav_profile"></a><a href="#" id="mobile-dashboard-link" class="p-2 text-lg" data-i18n-key="dashboard"></a><a href="#" id="mobile-messages-link" class="p-2 text-lg relative"><span data-i18n-key="messages"></span><span id="mobile-unread-badge" class="hidden absolute top-0 ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"></span></a><button id="mobile-logout-btn" class="p-2 text-lg text-left" data-i18n-key="logout"></button>`;
        
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.onclick = (e) => { e.preventDefault(); document.getElementById('user-menu-dropdown')?.classList.toggle('hidden'); };
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.onclick = handleSignOut;
        const profileLink = document.getElementById('profile-link');
        if (profileLink) profileLink.onclick = (e) => { e.preventDefault(); renderView('profile', { userId: currentUser.uid, userName: currentUser.displayName }); };
        const dashboardLink = document.getElementById('dashboard-link');
        if (dashboardLink) dashboardLink.onclick = (e) => { e.preventDefault(); renderView('dashboard'); };
        const messagesLink = document.getElementById('messages-link');
        if (messagesLink) messagesLink.onclick = (e) => { e.preventDefault(); currentUser ? renderView('inbox') : toggleModal(DOMElements.authModal, true); };
    } else {
        authLinksContainer.innerHTML = `<button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" data-i18n-key="connect"></button>`;
        mobileLinksHTML += `<button id="mobile-login-btn" class="p-2 text-lg text-left" data-i18n-key="connect"></button>`;
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.onclick = () => toggleModal(DOMElements.authModal, true);
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
    
    // Desktop Dark Mode Toggle
    if (darkModeToggle) {
        darkModeToggle.onclick = () => setDarkMode(!DOMElements.html.classList.contains('dark'));
    }
    
    // Mobile Dark Mode Toggle (New)
    const mobileDarkModeToggle = document.getElementById('mobile-dark-mode-toggle');
    if (mobileDarkModeToggle) {
        mobileDarkModeToggle.onclick = () => {
            setDarkMode(!DOMElements.html.classList.contains('dark'));
        };
    }

    if (langDropdownBtn) {
        langDropdownBtn.onclick = (e) => { e.stopPropagation(); DOMElements.langDropdown?.classList.toggle('hidden'); };
    }
    langBtns.forEach(btn => {
        btn.onclick = (e) => { e.preventDefault(); setLanguage(btn.dataset.lang); DOMElements.langDropdown?.classList.add('hidden'); closeMobileMenu(); };
    });

    if (sellLink) {
        sellLink.onclick = (e) => { e.preventDefault(); toggleModal(currentUser ? DOMElements.postProductModal : DOMElements.authModal, true); if(currentUser && DOMElements.postProductModal) trapModalFocus('post-product-modal'); };
    }
    if (cartBtn) {
        cartBtn.onclick = (e) => { e.preventDefault(); renderView('cart'); };
    }
    if (homeLink) {
        homeLink.onclick = (e) => { e.preventDefault(); window.history.pushState({}, '', window.location.pathname); renderView('home'); };
    }

    if (mobileMenuBtn) mobileMenuBtn.onclick = openMobileMenu;
    if (mobileMenuCloseBtn) mobileMenuCloseBtn.onclick = closeMobileMenu;
    // CORRECTED: Fixed the typo from DOMEElements to DOMElements
    if (DOMElements.mobileMenuBackdrop) DOMElements.mobileMenuBackdrop.onclick = closeMobileMenu;

    document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

    const mobileNavLinksEl = document.getElementById('mobile-nav-links');
    if (mobileNavLinksEl) {
        mobileNavLinksEl.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (!target) return;
            e.preventDefault();
            
            const actions = {
                'mobile-home-link': () => { window.history.pushState({}, '', window.location.pathname); renderView('home'); },
                'mobile-search-link': () => DOMElements.searchInput?.focus(),
                'mobile-sell-link': () => sellLink?.click(),
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
    }

    if (authModalCloseBtn) authModalCloseBtn.onclick = () => toggleModal(DOMElements.authModal, false);
    if (modalCloseBtn) modalCloseBtn.onclick = () => toggleModal(DOMElements.postProductModal, false);
    if (googleLoginBtn) googleLoginBtn.onclick = () => signInWithPopup(auth, googleProvider).catch(error => console.error("Login error", error));
    if (facebookLoginBtn) facebookLoginBtn.onclick = () => signInWithPopup(auth, facebookProvider).catch(error => console.error("Login error", error));
    
    if (DOMElements.postProductModal) {
      DOMElements.postProductModal.addEventListener('transitionend', (e) => {
          if (!DOMElements.postProductModal.classList.contains('invisible')) {
              populateSelect(DOMElements.postProductBrandSelect, car_data, 'select_brand', currentLang);
              populateSelect(DOMElements.postProductYearSelect, years, 'select_year', currentLang);
              populateSelect(DOMElements.postProductWilayaSelect, wilayas, 'select_wilaya', currentLang);
              populateSelect(DOMElements.postProductCategorySelect, categories, 'select_category', currentLang, true);
              
              // Populate condition select dropdown
              const conditionSelect = DOMElements.postProductConditionSelect;
              if (conditionSelect) {
                  conditionSelect.innerHTML = `<option value="">${translations[currentLang]['any_condition']}</option>`;
                  conditionSelect.innerHTML += `<option value="new">${translations[currentLang]['new']}</option>`;
                  conditionSelect.innerHTML += `<option value="used">${translations[currentLang]['used']}</option>`;
              }
              trapModalFocus('post-product-modal');
          }
      });
    }
    
    if (DOMElements.postProductBrandSelect) {
      DOMElements.postProductBrandSelect.onchange = () => {
          const modelSelect = DOMElements.postProductModelSelect;
          const selectedBrand = DOMElements.postProductBrandSelect.value;
          if (modelSelect) {
            if (selectedBrand && car_data[selectedBrand]) {
                populateSelect(modelSelect, car_data[selectedBrand], 'select_model', currentLang);
                modelSelect.disabled = false;
            } else {
                modelSelect.disabled = true;
                modelSelect.innerHTML = `<option value="">${translations[currentLang].select_model}</option>`;
            }
          }
      };
    }
    
    if (DOMElements.postProductWilayaSelect) {
      DOMElements.postProductWilayaSelect.onchange = () => {
          const communeSelect = DOMElements.postProductCommuneSelect;
          const selectedWilaya = DOMElements.postProductWilayaSelect.value;
          if (communeSelect) {
            if (selectedWilaya && wilayas[selectedWilaya]) {
                populateSelect(communeSelect, wilayas[selectedWilaya], 'select_commune', currentLang);
                communeSelect.disabled = false;
            } else {
                communeSelect.disabled = true;
                communeSelect.innerHTML = `<option value="">${translations[currentLang].select_commune}</option>`;
            }
          }
      };
    }
    
    if (searchInput) {
      searchInput.oninput = debounce(applyAndRenderFilters, 500);
    }
    if (mobileFiltersCloseBtn) {
      mobileFiltersCloseBtn.onclick = () => DOMElements.mobileFiltersModal?.classList.add('translate-x-full');
    }
    if (mobileApplyFiltersBtn) {
      mobileApplyFiltersBtn.onclick = () => { applyAndRenderFilters(); DOMElements.mobileFiltersModal?.classList.add('translate-x-full'); };
    }

    document.onclick = (e) => {
        if (langDropdownBtn && !langDropdownBtn.contains(e.target)) DOMElements.langDropdown?.classList.add('hidden');
        const userMenu = document.getElementById('user-menu');
        if (userMenu && !userMenu.contains(e.target)) document.getElementById('user-menu-dropdown')?.classList.add('hidden');
        if (DOMElements.searchSuggestions && !DOMElements.searchInput?.contains(e.target)) DOMElements.searchSuggestions.classList.add('hidden');
    };

    if (DOMElements.searchInput) {
      DOMElements.searchInput.addEventListener('input', debounce(async (e) => {
        const queryText = e.target.value.trim();
        if (queryText.length < 2) {
          DOMElements.searchSuggestions?.classList.add('hidden');
          return;
        }
        
        const q = query(collection(db, "products"), 
          where("keywords", "array-contains", queryText.toLowerCase()),
          limit(5));
        
        const snapshot = await getDocs(q);
        const searchSuggestionsEl = DOMElements.searchSuggestions;
        if (searchSuggestionsEl) {
            if (!snapshot.empty) {
                searchSuggestionsEl.innerHTML = '';
                snapshot.forEach(doc => {
                    const product = doc.data();
                    const suggestion = document.createElement('div');
                    suggestion.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
                    suggestion.textContent = product.title;
                    suggestion.onclick = () => {
                        DOMElements.searchInput.value = product.title;
                        searchSuggestionsEl.classList.add('hidden');
                        applyAndRenderFilters();
                    };
                    searchSuggestionsEl.appendChild(suggestion);
                });
                searchSuggestionsEl.classList.remove('hidden');
            } else {
                searchSuggestionsEl.classList.add('hidden');
            }
        }
      }, 300));
    }

    const navHome = document.getElementById('nav-home');
    if (navHome) navHome.onclick = (e) => { 
        e.preventDefault(); 
        window.history.pushState({}, '', window.location.pathname);
        renderView('home'); 
    };
    const navSearch = document.getElementById('nav-search');
    if (navSearch) navSearch.onclick = (e) => { e.preventDefault(); DOMElements.searchInput?.focus(); updateBottomNav('search'); };
    const navSell = document.getElementById('nav-sell');
    if (navSell) navSell.onclick = (e) => { e.preventDefault(); DOMElements.sellLink?.click(); };
    const navMessages = document.getElementById('nav-messages');
    if (navMessages) navMessages.onclick = (e) => { e.preventDefault(); currentUser ? renderView('inbox') : toggleModal(DOMElements.authModal, true); };
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) navProfile.onclick = (e) => { e.preventDefault(); currentUser ? renderView('profile', { userId: currentUser.uid, userName: currentUser.displayName }) : toggleModal(DOMElements.authModal, true); };
    
    const termsLink = document.getElementById('terms-link');
    if (termsLink) {
        termsLink.onclick = (e) => {
            e.preventDefault();
            renderView('terms');
        };
    }
    
    const becomeStoreBtn = document.getElementById('becomeStoreBtn');
    if (becomeStoreBtn) {
      becomeStoreBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = 'store-setup.html';
      };
    }

    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    if (header) {
      window.addEventListener('scroll', () => {
          if (lastScrollY < window.scrollY && window.scrollY > 100) {
              header.classList.add('-translate-y-full');
          } else {
              header.classList.remove('-translate-y-full');
          }
          lastScrollY = window.scrollY;
      }, { passive: true });
    }
};

const bootApp = () => {
    setDarkMode(localStorage.getItem('piecety_dark_mode') === 'true');
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
      currentYearEl.textContent = new Date().getFullYear();
    }
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
            
            if (!userSnap.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    role: "user" // Default to user role on first login
                });
                userProfile = { role: "user" };
            } else {
                 userProfile = userSnap.data();
            }
        }
        updateCartDisplay();
    });
    
    // CORRECTED: Handle popstate to re-render based on URL state
    window.onpopstate = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('productId')) {
            // Re-render product page if a product ID is in the URL
            const productId = params.get('productId');
            const productRef = doc(db, "products", productId);
            getDoc(productRef).then(snap => {
                if (snap.exists()) {
                    renderView('product', { id: snap.id, ...snap.data() });
                } else {
                    renderView('home');
                }
            }).catch(() => renderView('home'));
        } else {
            // Re-render home page with current filters
            renderView('home');
        }
    };
    renderView('home');
    setLanguage(currentLang);
};

bootApp();

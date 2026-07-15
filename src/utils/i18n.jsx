import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({});

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

export const CURRENCIES = [
  { code: 'MAD', symbol: 'MAD', rate: 1.0 },
  { code: 'USD', symbol: '$', rate: 0.10 },
  { code: 'EUR', symbol: '€', rate: 0.092 },
  { code: 'SAR', symbol: 'SR', rate: 0.38 },
];

const translations = {
  en: {
    welcome: 'What do you need done today?',
    hero_desc: 'Name your price. A nearby runner bids, negotiates, and gets it done — fast.',
    post_task: 'Post a Task',
    explore_tasks: 'Explore Tasks',
    see_all: 'See all',
    nearby_tasks: 'Live Tasks Nearby',
    loading_tasks: 'Loading nearby tasks...',
    no_tasks: 'No open tasks right now',
    be_first: 'Be the first to post a task!',
    home: 'Home',
    explore: 'Explore',
    post: 'Post',
    messages: 'Messages',
    profile: 'Profile',
    language: 'Language',
    currency: 'Currency',
    settings: 'Settings',
    logout: 'Log Out',
    edit_profile: 'Edit Profile',
    full_name: 'Full Name',
    phone: 'Phone',
    bio: 'Bio',
    save_changes: 'Save Changes',
    client: 'Client',
    runner: 'Runner',
    completed: 'Completed',
    rating: 'Rating',
    earned: 'Earned',
    posted: 'Posted',
    active: 'Active',
    spent: 'Spent',
    verification: 'Verification',
    verified: 'Verified ✓',
    verify_identity: 'Verify your identity',
    support: 'Help & Support',
    admin_panel: 'Admin Panel',
    price: 'Price',
    tasks: 'tasks',
    waiting_bids: 'Waiting for bids',
    bids: 'Bids',
    place_bid: 'Place a Bid',
    your_offer: 'Your Offer',
    eta: 'ETA',
    note: 'Note',
    place_bid_btn: 'Place Bid',
    live_tracking: 'Live Tracking',
    runner_active: 'Runner is active',
    mark_picked: 'Mark as Picked Up',
    mark_route: 'Mark as En Route',
    mark_delivered: 'Mark as Delivered',
    confirm_release: 'Confirm & Release Payment',
    back_home: 'Back to Home',
    task_complete: 'Task Complete!',
  },
  fr: {
    welcome: 'Qu’avez-vous besoin de faire aujourd’hui ?',
    hero_desc: 'Fixez votre prix. Un coursier proche propose, négocie et exécute — rapidement.',
    post_task: 'Publier une tâche',
    explore_tasks: 'Explorer les tâches',
    see_all: 'Voir tout',
    nearby_tasks: 'Tâches en direct à proximité',
    loading_tasks: 'Chargement des tâches...',
    no_tasks: 'Aucune tâche ouverte actuellement',
    be_first: 'Soyez le premier à publier une tâche !',
    home: 'Accueil',
    explore: 'Explorer',
    post: 'Publier',
    messages: 'Messages',
    profile: 'Profil',
    language: 'Langue',
    currency: 'Devise',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    edit_profile: 'Modifier le profil',
    full_name: 'Nom complet',
    phone: 'Téléphone',
    bio: 'Biographie',
    save_changes: 'Enregistrer',
    client: 'Client',
    runner: 'Coursier',
    completed: 'Terminé',
    rating: 'Note',
    earned: 'Gagné',
    posted: 'Publié',
    active: 'Actif',
    spent: 'Dépensé',
    verification: 'Vérification',
    verified: 'Vérifié ✓',
    verify_identity: 'Vérifiez votre identité',
    support: 'Aide & Support',
    admin_panel: 'Tableau de bord',
    price: 'Prix',
    tasks: 'tâches',
    waiting_bids: 'En attente d’offres',
    bids: 'Offres',
    place_bid: 'Proposer une offre',
    your_offer: 'Votre offre',
    eta: 'Délai',
    note: 'Note',
    place_bid_btn: 'Soumettre l’offre',
    live_tracking: 'Suivi en direct',
    runner_active: 'Le coursier est actif',
    mark_picked: 'Marquer comme récupéré',
    mark_route: 'Marquer comme en route',
    mark_delivered: 'Marquer comme livré',
    confirm_release: 'Confirmer & Libérer le paiement',
    back_home: 'Retour à l’accueil',
    task_complete: 'Tâche terminée !',
  },
  ar: {
    welcome: 'ما الذي تريد إنجازه اليوم؟',
    hero_desc: 'حدد سعرك. مندوب قريب يقدم عرضاً، يتفاوض، وينجز العمل — بسرعة.',
    post_task: 'نشر مهمة',
    explore_tasks: 'استكشاف المهام',
    see_all: 'عرض الكل',
    nearby_tasks: 'مهام مباشرة قريبة',
    loading_tasks: 'جاري تحميل المهام القريبة...',
    no_tasks: 'لا توجد مهام مفتوحة حالياً',
    be_first: 'كن أول من ينشر مهمة!',
    home: 'الرئيسية',
    explore: 'استكشاف',
    post: 'نشر',
    messages: 'الرسائل',
    profile: 'الملف الشخصي',
    language: 'اللغة',
    currency: 'العملة',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    edit_profile: 'تعديل الملف',
    full_name: 'الاسم الكامل',
    phone: 'الهاتف',
    bio: 'نبذة شخصية',
    save_changes: 'حفظ التغييرات',
    client: 'عميل',
    runner: 'مندوب',
    completed: 'مكتملة',
    rating: 'التقييم',
    earned: 'الأرباح',
    posted: 'المنشورة',
    active: 'النشطة',
    spent: 'المصروفات',
    verification: 'التحقق من الهوية',
    verified: 'تم التحقق ✓',
    verify_identity: 'وثّق هويتك',
    support: 'المساعدة والدعم',
    admin_panel: 'لوحة التحكم',
    price: 'السعر',
    tasks: 'مهام',
    waiting_bids: 'بانتظار العروض',
    bids: 'العروض',
    place_bid: 'تقديم عرض سعر',
    your_offer: 'عرضك',
    eta: 'الوقت المتوقع',
    note: 'ملاحظة',
    place_bid_btn: 'تقديم العرض',
    live_tracking: 'التتبع المباشر',
    runner_active: 'المندوب نشط حالياً',
    mark_picked: 'تأكيد الاستلام',
    mark_route: 'تأكيد بدء التوصيل',
    mark_delivered: 'تأكيد الوصول والوصول',
    confirm_release: 'تأكيد التسليم وتحرير الدفع',
    back_home: 'العودة للرئيسية',
    task_complete: 'اكتملت المهمة بنجاح!',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('chrad_lang') || 'en';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('chrad_currency') || 'MAD';
  });

  useEffect(() => {
    localStorage.setItem('chrad_lang', lang);
    const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
    document.documentElement.dir = selectedLang.dir;
    document.documentElement.lang = selectedLang.code;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('chrad_currency', currency);
  }, [currency]);

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  const formatPrice = (madAmount) => {
    if (madAmount == null) return '';
    const selectedCur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const converted = (Number(madAmount) * selectedCur.rate).toFixed(1);
    
    // Clean trailing .0
    const cleanNum = converted.endsWith('.0') ? converted.slice(0, -2) : converted;
    
    if (lang === 'ar') {
      return `${cleanNum} ${selectedCur.symbol}`;
    }
    return `${cleanNum} ${selectedCur.symbol}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, currency, setCurrency, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);

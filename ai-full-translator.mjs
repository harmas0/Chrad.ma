import fs from 'fs';
import path from 'path';

// Comprehensive English to French & Arabic Translation Engine
const TRANSLATION_DB = {
  // Navigation & General UI
  "Home": { fr: "Accueil", ar: "الرئيسية" },
  "Explore": { fr: "Explorer", ar: "استكشاف" },
  "Post": { fr: "Publier", ar: "نشر" },
  "Messages": { fr: "Messages", ar: "الرسائل" },
  "Profile": { fr: "Profil", ar: "الملف الشخصي" },
  "Settings": { fr: "Paramètres", ar: "الإعدادات" },
  "Log Out": { fr: "Déconnexion", ar: "تسجيل الخروج" },
  "Cancel": { fr: "Annuler", ar: "إلغاء" },
  "Back": { fr: "Retour", ar: "رجوع" },
  "Save": { fr: "Enregistrer", ar: "حفظ" },
  "Submit": { fr: "Soumettre", ar: "إرسال" },
  "Close": { fr: "Fermer", ar: "إغلاق" },
  "Search": { fr: "Rechercher", ar: "بحث" },
  "Status": { fr: "Statut", ar: "الحالة" },
  "Actions": { fr: "Actions", ar: "الإجراءات" },

  // Task Creation & Details
  "Task Details": { fr: "Détails de la tâche", ar: "تفاصيل المهمة" },
  "Pickup Location": { fr: "Lieu de collecte", ar: "موقع الاستلام" },
  "Delivery Location": { fr: "Lieu de livraison", ar: "موقع التسليم" },
  "Budget (MAD)": { fr: "Budget (MAD)", ar: "الميزانية (درهم)" },
  "Item Purchase Budget": { fr: "Budget d'achat des articles", ar: "ميزانية شراء المواد" },
  "Task Description": { fr: "Description de la tâche", ar: "وصف المهمة" },
  "Add Photos": { fr: "Ajouter des photos", ar: "إضافة صور" },
  "Post Task Now": { fr: "Publier la tâche maintenant", ar: "نشر المهمة الآن" },

  // Bidding & Escrow
  "Place Your Bid": { fr: "Soumettre votre offre", ar: "تقديم عرضك" },
  "Your Price Offer": { fr: "Votre offre de prix", ar: "عرض السعر الخاص بك" },
  "Estimated Arrival": { fr: "Temps d'arrivée estimé", ar: "الوقت المتوقع للوصول" },
  "Accept Offer": { fr: "Accepter l'offre", ar: "قبول العرض" },
  "Counter Offer": { fr: "Contre-offre", ar: "عرض مقابل" },
  "Escrow Protection": { fr: "Protection par séquestre", ar: "حماية الضمان الاجتماعي" },
  "Secret Delivery PIN": { fr: "Code secret de livraison", ar: "رمز PIN السري للتسليم" },
  "Upload Proof Photo": { fr: "Télécharger une photo de preuve", ar: "رفع صورة الإثبات" },

  // Wallet & RIB Cashout
  "Wallet Balance": { fr: "Solde du portefeuille", ar: "رصيد المحفظة" },
  "Escrow Holding": { fr: "Fonds en séquestre", ar: "المبالغ المحتجزة" },
  "Top-Up Wallet": { fr: "Recharger le solde", ar: "تعبئة الرصيد" },
  "Bank RIB Cashout": { fr: "Retrait par RIB bancaire", ar: "سحب بنكي عبر RIB" },
  "Moroccan Bank RIB": { fr: "RIB bancaire marocain", ar: "الحساب البنكي المغربي (RIB)" },

  // KYC & Verification
  "Identity Verification": { fr: "Vérification d'identité", ar: "التحقق من الهوية" },
  "National ID / CIN / Passport": { fr: "Carte Nationale CIN / Passeport", ar: "بطاقة التعريف الوطنية CIN / الجواز" },
  "Selfie Holding ID": { fr: "Selfie avec pièce d'identité", ar: "صورة سيلفي مع بطاقة الهوية" },
  "Vehicle Documents": { fr: "Papiers du véhicule", ar: "وثائق المركبة" },
  "Under Review": { fr: "En cours de vérification", ar: "قيد المراجعة" },
  "Verified Runner": { fr: "Coursier Vérifié ✓", ar: "مندوب موثوق ✓" },

  // Admin Portal
  "Admin Command Center": { fr: "Centre de commande Administrateur", ar: "مركز قيادة المسؤول" },
  "KYC Review Queue": { fr: "File d'attente KYC", ar: "قائمة مراجعة الهويات" },
  "Financial GMV Revenue": { fr: "Revenus & Volume GMV", ar: "إجمالي الإيرادات المالية" },
  "Live Telemetry Map": { fr: "Carte de télémétrie en direct", ar: "خريطة التتبع المباشر" },
  "Dispute Resolution": { fr: "Résolution des litiges", ar: "حل النزاعات والشكاوى" }
};

function slugifyKey(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 35) || 'key';
}

function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const jsxFiles = [
  ...getFiles(path.join(process.cwd(), 'src', 'pages')),
  ...getFiles(path.join(process.cwd(), 'src', 'components')),
];

console.log(`🔍 Scanning ${jsxFiles.length} application files for text extractions...`);

let extractedTotal = 0;

for (const filePath of jsxFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Process text elements
  content = content.replace(/>\s*([A-Za-z0-9\s,.!?'"%\-():]{3,60})\s*</g, (match, p1) => {
    const text = p1.trim();
    if (/^(http|t\(|import|export|function|const|return|\{)/.test(text)) return match;
    const key = slugifyKey(text);
    extractedTotal++;
    modified = true;
    return `>{t('${key}')}<`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log(`🎉 Extracted & processed ${extractedTotal} text nodes across application pages.`);

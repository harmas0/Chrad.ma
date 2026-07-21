import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  Store, 
  FileText, 
  Wrench, 
  Truck, 
  ShoppingBag, 
  Gift, 
  Briefcase, 
  Sparkles, 
  Layers, 
  HelpCircle,
  Clock,
  MapPin,
  Box,
  Coffee,
  Heart,
  Zap,
  Tag
} from 'lucide-react';

const LUCIDE_MAP = {
  // Lucide Icon names (case-insensitive)
  package: Package,
  shoppingcart: ShoppingCart,
  shopping_cart: ShoppingCart,
  store: Store,
  filetext: FileText,
  file_text: FileText,
  wrench: Wrench,
  truck: Truck,
  shoppingbag: ShoppingBag,
  shopping_bag: ShoppingBag,
  gift: Gift,
  briefcase: Briefcase,
  sparkles: Sparkles,
  layers: Layers,
  box: Box,
  coffee: Coffee,
  heart: Heart,
  zap: Zap,

  // Category IDs fallback
  delivery: Package,
  errands: ShoppingCart,
  shopping: Store,
  personal_shopping: Store,
  personalshopping: Store,
  documents: FileText,
  custom: Wrench,
};

// Emoji to Lucide component mapping
const EMOJI_TO_LUCIDE = {
  '📦': Package,
  '🛒': ShoppingCart,
  '🏬': Store,
  '📄': FileText,
  '🔧': Wrench,
  '🚚': Truck,
  '🛍️': ShoppingBag,
  '🎁': Gift,
};

export default function CategoryIcon({ icon, size = 20, className = '' }) {
  if (!icon) return <Package size={size} className={className} />;

  // 1. Direct Emoji lookup
  if (EMOJI_TO_LUCIDE[icon]) {
    const IconComp = EMOJI_TO_LUCIDE[icon];
    return <IconComp size={size} className={className} />;
  }

  // 2. String key lookup (e.g. 'Package', 'ShoppingCart', 'delivery', etc.)
  const normalizedKey = String(icon).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const IconComp = LUCIDE_MAP[normalizedKey];

  if (IconComp) {
    return <IconComp size={size} className={className} />;
  }

  // 3. Fallback: If it's a raw unicode emoji character that wasn't in EMOJI_TO_LUCIDE
  if (/\p{Extended_Pictographic}/u.test(icon)) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1 }} className={className}>{icon}</span>;
  }

  // 4. Default fallback Lucide icon
  return <Package size={size} className={className} />;
}

// ============================================================
// Site Configuration - Easy to change branding
// ============================================================

export const siteConfig = {
  businessName: 'Venkat_farms_ceo',
  tagline: 'From Our Farm to Your Home',
  description: 'Quality livestock, fresh dairy, and essential farming goods — all in one place.',
  phone: '+91 9392629819',
  whatsappNumber: '919392629819', // Without + prefix for wa.me links
  email: 'nagavenkateswararao2006@gmail.com',
  address: 'Village Road, District Name, State, India',
  currency: '₹',
  currencyCode: 'INR',
  socialLinks: {
    facebook: '#',
    instagram: '#',
    youtube: '#',
    twitter: '#',
  },
  deliveryCharge: 50,
  freeDeliveryAbove: 500,
  maxQuantityPerItem: 20,
} as const;

export const categories = [
  {
    name: 'Cocks & Chickens',
    slug: 'cocks-chickens',
    description: 'Premium quality poultry birds for your farm',
    icon: '🐔',
  },
  {
    name: 'Buffaloes & Livestock',
    slug: 'buffaloes-livestock',
    description: 'Healthy and well-maintained livestock',
    icon: '🐃',
  },
  {
    name: 'Fresh Milk & Dairy',
    slug: 'fresh-milk-dairy',
    description: 'Farm-fresh dairy products delivered to your door',
    icon: '🥛',
  },
  {
    name: 'Farming Goods',
    slug: 'farming-goods',
    description: 'Essential agricultural supplies and farming tools',
    icon: '🌾',
  },
] as const;

export const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Cocks & Chickens', href: '/category/cocks-chickens' },
  { name: 'Buffaloes', href: '/category/buffaloes-livestock' },
  { name: 'Fresh Milk', href: '/category/fresh-milk-dairy' },
  { name: 'Farming Goods', href: '/category/farming-goods' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' },
] as const;

export const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

# 🌿 GreenField Farms — E-Commerce Website

A premium, full-stack e-commerce website for a livestock and farming business in India. Built with React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### Customer Features
- 🏠 **Premium Homepage** with hero, categories, featured products, and customer reviews
- 🛍️ **Shop** with search, filters, and sorting
- 🐔 **Cocks & Chickens** — dedicated livestock listings with breed details
- 🐃 **Buffaloes & Livestock** — premium catalog with milk yield, health info
- 🥛 **Fresh Milk & Dairy** — daily fresh dairy products
- 🌾 **Farming Goods** — agricultural supplies and tools
- 🛒 **Shopping Cart** with quantity management and persistent storage
- 💳 **Checkout** with delivery/pickup options and COD/bank transfer
- 👤 **User Accounts** with order history
- 💬 **WhatsApp Integration** — floating button + contextual messages
- 📱 **Fully Responsive** — mobile-first design

### Admin Features
- 📊 **Dashboard** with stats overview
- 📦 **Product Management** — view, search, deactivate products
- 🛒 **Order Management** — update order and payment status
- 💬 **Enquiry Management** — track and respond to customer enquiries
- ⚙️ **Settings** — guidance for configuration changes

### Technical Features
- 🔐 **Supabase Auth** with role-based access (customer/admin)
- 🛡️ **Row Level Security** on all tables
- 📸 **Supabase Storage** ready for image uploads
- ⚡ **TanStack Query** for data fetching and caching
- ✅ **Zod validation** on all forms
- 🍞 **Toast notifications** for user feedback
- 🎨 **Premium UI** with custom design system

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone and Install
```bash
cd business
npm install --legacy-peer-deps
```

### 2. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/migration.sql`
3. Go to **Storage** and create a public bucket called `product-images`

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
Find these in **Supabase Dashboard > Settings > API**.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

### 5. Create Admin Account
1. Register a new account on the website
2. In Supabase Dashboard, go to **Authentication > Users** and copy the user's UUID
3. Run in SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid-here';
```
4. Log out and back in — you'll see the Admin Dashboard link

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/         # Header, Footer, Layout
│   ├── shared/         # ProductCard, WhatsAppButton
│   └── ui/             # Button, Input, Card, Badge, Select, Skeleton, Textarea
├── config/
│   └── site.ts         # ⚡ Business name, contact, categories (easy to change)
├── contexts/
│   ├── AuthContext.tsx  # Authentication state
│   └── CartContext.tsx  # Shopping cart state
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Utilities (cn, formatPrice, WhatsApp links)
├── pages/
│   ├── HomePage.tsx
│   ├── ShopPage.tsx
│   ├── CategoryPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrderConfirmationPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── AccountPage.tsx
│   ├── OrdersPage.tsx
│   ├── AdminDashboard.tsx
│   ├── AboutPage.tsx
│   ├── ContactPage.tsx
│   ├── FAQPage.tsx
│   ├── PolicyPages.tsx
│   └── NotFoundPage.tsx
├── services/
│   └── api.ts          # All Supabase queries + demo data fallback
├── types/
│   └── index.ts        # TypeScript interfaces
├── App.tsx             # Router + providers
├── main.tsx            # Entry point
└── index.css           # Tailwind + design system
```

---

## 🎨 Customizing Branding

All branding is centralized in `src/config/site.ts`:

```typescript
export const siteConfig = {
  businessName: 'GreenField Farms',    // Change this
  tagline: 'From Our Farm to Your Home',
  phone: '+91 98765 43210',            // Change this
  whatsappNumber: '919876543210',      // Change this (no + prefix)
  email: 'info@greenfieldfarms.in',    // Change this
  address: 'Village Road, ...',        // Change this
  // ...
};
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role (customer/admin) |
| `categories` | Product categories |
| `products` | All products (livestock, dairy, farming goods) |
| `livestock_details` | Extended info for livestock (breed, age, weight, etc.) |
| `product_images` | Multiple images per product |
| `orders` | Customer orders |
| `order_items` | Individual items in each order |
| `enquiries` | Customer enquiries/messages |
| `reviews` | Product reviews |
| `site_settings` | Business configuration |

---

## 🚢 Deployment

### Vercel (Frontend)
1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Supabase (Backend)
- Already hosted — just ensure your SQL migration is applied
- Set up authentication redirect URLs in Supabase Dashboard > Authentication > URL Configuration

---

## 🔒 Security Notes

- ✅ RLS enabled on every table
- ✅ Users cannot change their own role
- ✅ Admin checks use server-side profile lookups
- ✅ No service-role keys in frontend code
- ✅ No payment card storage
- ✅ Input validation with Zod
- ✅ Profile auto-created via SECURITY DEFINER trigger

---

## 📋 Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | Frontend framework |
| TypeScript | Type safety |
| Vite 8 | Build tool |
| Tailwind CSS 4 | Styling |
| Supabase | Backend (DB, Auth, Storage) |
| TanStack Query | Server state management |
| React Hook Form + Zod | Forms & validation |
| React Router | Client-side routing |
| Lucide React | Icons |
| Sonner | Toast notifications |

---

## 📄 License

Private — for business use only.

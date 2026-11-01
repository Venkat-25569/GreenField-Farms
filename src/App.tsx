import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { CartProvider } from '@/contexts/CartContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Pages
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AccountPage } from '@/pages/AccountPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { FAQPage } from '@/pages/FAQPage';
import { PrivacyPolicyPage, TermsPage, ShippingPolicyPage, RefundPolicyPage } from '@/pages/PolicyPages';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                    <Route path="/refund-policy" element={<RefundPolicyPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                  {/* Login/Register without layout header/footer */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  {/* Admin without main layout */}
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                },
              }}
            />
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

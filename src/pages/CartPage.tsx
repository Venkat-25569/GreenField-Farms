import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ShieldCheck, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { validateCartStock } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export function CartPage() {
  const { items, itemCount, subtotal, deliveryCharge, total, updateQuantity, removeItem, clearCart } = useCart();
  const { isAdmin } = useAuth();
  const { settings } = useSiteSettings();

  const { data: stockCheck } = useQuery({
    queryKey: ['cart-stock-check', items],
    queryFn: () => validateCartStock(items),
    enabled: items.length > 0,
    staleTime: 5000,
  });

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-sm border border-forest-100">
          <div className="w-16 h-16 bg-forest-100 text-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-forest-950 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Admin Account Active
          </h2>
          <p className="text-earth-600 mb-6 text-sm leading-relaxed">
            Customer cart checkout is disabled for administrator accounts to prevent accidental orders through the storefront.
            You can manage all orders, products, and inventory from the Admin Dashboard.
          </p>
          <div className="space-y-2">
            <Link to="/admin" className="block">
              <Button size="lg" className="w-full bg-forest-800 hover:bg-forest-900 text-white">
                <Settings className="w-4 h-4 mr-2" /> Go to Admin Dashboard
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="ghost" className="w-full text-forest-700">
                Return to Storefront
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-earth-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-forest-800 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Your Cart is Empty
          </h2>
          <p className="text-earth-500 mb-6">Add some products to get started</p>
          <Link to="/shop"><Button size="lg">Browse Products</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 text-white py-10">
        <div className="container-custom">
          <h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Shopping Cart
          </h1>
          <p className="text-forest-200 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Availability Warning Banner */}
        {stockCheck && !stockCheck.valid && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-amber-950 mb-1">Items in your cart need attention before checkout:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800">
                  {stockCheck.unavailable.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-700 mt-2">
                  Please update the quantity or remove unavailable items to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl flex-shrink-0 overflow-hidden">
                  {item.product.product_images && item.product.product_images.length > 0 && item.product.product_images[0].image_url ? (
                    <img
                      src={item.product.product_images[0].image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cream-100 to-earth-100 flex items-center justify-center">
                      <span className="text-3xl md:text-4xl opacity-60">
                        {item.product.product_type === 'livestock' ? '🐄' : item.product.product_type === 'dairy' ? '🥛' : '🌾'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.slug}`} className="font-semibold text-forest-900 hover:text-forest-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-earth-500 mt-0.5">{item.product.category?.name}</p>
                  <p className="text-lg font-bold text-forest-700 mt-2">{formatPrice(item.product.price)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-earth-200 flex items-center justify-center hover:bg-forest-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-earth-200 flex items-center justify-center hover:bg-forest-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-forest-800">{formatPrice(item.product.price * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={clearCart}>
                <Trash2 className="w-4 h-4 mr-2" /> Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-forest-900 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Order Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-earth-500">Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-forest-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">Delivery Charge</span>
                  <span className="font-medium text-forest-800">
                    {deliveryCharge === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(deliveryCharge)
                    )}
                  </span>
                </div>
                {deliveryCharge > 0 && (
                  <p className="text-xs text-earth-400">
                    Free delivery on orders above {formatPrice(settings.free_delivery_above ?? siteConfig.freeDeliveryAbove)}
                  </p>
                )}
                <hr className="border-earth-100" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-forest-900">Total</span>
                  <span className="text-forest-700">{formatPrice(total)}</span>
                </div>
              </div>

              {stockCheck && !stockCheck.valid ? (
                <div className="mt-6">
                  <Button size="lg" className="w-full bg-earth-300 text-earth-600 cursor-not-allowed" disabled>
                    Update Cart to Checkout
                  </Button>
                </div>
              ) : (
                <Link to="/checkout" className="block mt-6">
                  <Button size="lg" className="w-full">
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}

              <Link to="/shop" className="block mt-3">
                <Button variant="ghost" className="w-full text-sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

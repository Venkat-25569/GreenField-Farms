import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder, validateCartStock } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import { siteConfig, indianStates } from '@/config/site';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, ChevronRight, Shield, Truck } from 'lucide-react';
import type { CheckoutFormData } from '@/types';

const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required').max(15),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  delivery_address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid PIN code required').max(6),
  order_notes: z.string().optional(),
  delivery_type: z.enum(['delivery', 'pickup']),
  payment_method: z.enum(['cod', 'bank_transfer']),
});

export function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items, subtotal, deliveryCharge, total, clearCart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      delivery_type: 'delivery',
      payment_method: 'cod',
    },
  });

  const deliveryType = watch('delivery_type');

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-sm border border-forest-100">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-forest-950 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Admin Access Detected
          </h2>
          <p className="text-earth-600 mb-6 text-sm leading-relaxed">
            Administrators cannot place orders through the customer checkout page. This ensures accurate sales reporting and prevents accidental customer order creation.
          </p>
          <Link to="/admin">
            <Button size="lg" className="w-full bg-forest-800 hover:bg-forest-900 text-white">
              Go to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-forest-800 mb-2">No Items to Checkout</h2>
          <p className="text-earth-500 mb-6">Add products to your cart first</p>
          <Link to="/shop"><Button>Browse Products</Button></Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured. Please set up environment variables to enable checkout.');
      return;
    }

    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      // Validate stock availability before placing order
      const stockCheck = await validateCartStock(items);
      if (!stockCheck.valid) {
        stockCheck.unavailable.forEach(msg => toast.error(msg));
        setIsSubmitting(false);
        return;
      }

      const order = await createOrder(data, items);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      navigate(`/order-confirmation/${order.id}`);
      toast.success('Order placed successfully! Inventory updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 text-white py-10">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-sm text-forest-300 mb-2">
            <Link to="/cart" className="hover:text-white">Cart</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Checkout</span>
          </div>
          <h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>Checkout</h1>
        </div>
      </div>

      <div className="container-custom py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-forest-900 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Contact Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Full Name *" id="customer_name" placeholder="Enter your name" {...register('customer_name')} error={errors.customer_name?.message} />
                  <Input label="Phone Number *" id="phone" placeholder="10-digit phone number" {...register('phone')} error={errors.phone?.message} />
                  <Input label="Email (Optional)" id="email" type="email" placeholder="your@email.com" {...register('email')} error={errors.email?.message} className="sm:col-span-2" />
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-forest-900 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Delivery Details
                </h3>

                <div className="flex gap-3 mb-6">
                  <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === 'delivery' ? 'border-forest-600 bg-forest-50' : 'border-earth-200'}`}>
                    <input type="radio" value="delivery" {...register('delivery_type')} className="sr-only" />
                    <Truck className="w-5 h-5 text-forest-600" />
                    <div>
                      <p className="font-medium text-forest-800">Home Delivery</p>
                      <p className="text-xs text-earth-500">We deliver to your address</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === 'pickup' ? 'border-forest-600 bg-forest-50' : 'border-earth-200'}`}>
                    <input type="radio" value="pickup" {...register('delivery_type')} className="sr-only" />
                    <span className="text-xl">🏪</span>
                    <div>
                      <p className="font-medium text-forest-800">Farm Pickup</p>
                      <p className="text-xs text-earth-500">Pick up from our farm</p>
                    </div>
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Textarea label="Delivery Address *" id="delivery_address" placeholder="Full address" {...register('delivery_address')} error={errors.delivery_address?.message} className="sm:col-span-2" />
                  <Input label="City *" id="city" placeholder="City" {...register('city')} error={errors.city?.message} />
                  <Select
                    label="State *"
                    id="state"
                    {...register('state')}
                    error={errors.state?.message}
                    options={[{ value: '', label: 'Select State' }, ...indianStates.map(s => ({ value: s, label: s }))]}
                  />
                  <Input label="PIN Code *" id="pincode" placeholder="6-digit PIN" {...register('pincode')} error={errors.pincode?.message} />
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-forest-900 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-earth-200 cursor-pointer hover:border-forest-300 transition-all">
                    <input type="radio" value="cod" {...register('payment_method')} defaultChecked />
                    <div>
                      <p className="font-medium text-forest-800">💵 Cash on Delivery</p>
                      <p className="text-xs text-earth-500">Pay when you receive your order</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-earth-200 cursor-pointer hover:border-forest-300 transition-all">
                    <input type="radio" value="bank_transfer" {...register('payment_method')} />
                    <div>
                      <p className="font-medium text-forest-800">🏦 Bank Transfer</p>
                      <p className="text-xs text-earth-500">Payment details will be shared after order confirmation</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <Textarea
                  label="Order Notes (Optional)"
                  id="order_notes"
                  placeholder="Any special instructions for your order..."
                  {...register('order_notes')}
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-forest-900 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Order Summary
                </h3>

                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-earth-600 truncate pr-2">{item.product.name} × {item.quantity}</span>
                      <span className="font-medium text-forest-800 whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-earth-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-earth-500">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-500">Delivery</span>
                    <span className="font-medium">{deliveryType === 'pickup' ? 'Free (Pickup)' : deliveryCharge === 0 ? <span className="text-green-600">Free</span> : formatPrice(deliveryCharge)}</span>
                  </div>
                  <hr className="border-earth-100" />
                  <div className="flex justify-between text-lg font-bold pt-1">
                    <span>Total</span>
                    <span className="text-forest-700">{formatPrice(deliveryType === 'pickup' ? subtotal : total)}</span>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...</>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <div className="flex items-center gap-2 justify-center mt-4 text-xs text-earth-400">
                  <Shield className="w-3 h-3" /> Your information is secure
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

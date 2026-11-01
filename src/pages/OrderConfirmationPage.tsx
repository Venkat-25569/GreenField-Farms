import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Package, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { getWhatsAppLink } from '@/lib/utils';

export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center py-16">
      <div className="container-custom max-w-lg text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-forest-900 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Order Placed Successfully!
          </h1>

          <p className="text-earth-500 mb-2">
            Thank you for your order. We've received it and will process it shortly.
          </p>

          {orderId && (
            <p className="text-sm text-earth-400 mb-6">
              Order ID: <span className="font-mono font-medium text-forest-700">{orderId.slice(0, 8)}...</span>
            </p>
          )}

          <div className="bg-cream-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex items-center gap-2 text-forest-700">
              <Package className="w-4 h-4" />
              <span>You will receive a confirmation on your phone.</span>
            </div>
            <div className="flex items-center gap-2 text-forest-700">
              <MessageCircle className="w-4 h-4" />
              <span>Contact us on WhatsApp for order updates.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/orders" className="flex-1">
              <Button variant="outline" className="w-full">View Orders</Button>
            </Link>
            <a
              href={getWhatsAppLink(settings.whatsapp_number, `Hello ${settings.business_name}, I just placed an order${orderId ? ` (ID: ${orderId.slice(0, 8)})` : ''}. Please confirm.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </a>
          </div>

          <Link to="/shop" className="block mt-4">
            <Button variant="link" className="text-sm">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

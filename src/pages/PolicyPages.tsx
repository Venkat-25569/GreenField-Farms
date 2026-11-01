import { useSiteSettings } from '@/contexts/SettingsContext';
import { siteConfig } from '@/config/site';

export function PrivacyPolicyPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen">
      <div className="bg-forest-800 text-white py-12"><div className="container-custom"><h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>Privacy Policy</h1></div></div>
      <div className="container-custom py-12 max-w-3xl prose prose-forest">
        <p className="text-earth-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        
        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Information We Collect</h2>
        <p className="text-earth-600 leading-relaxed mb-4">When you use {settings.business_name}, we may collect the following information:</p>
        <ul className="text-earth-600 space-y-2 mb-6 ml-6 list-disc">
          <li>Name, phone number, and email address when you create an account or place an order</li>
          <li>Delivery address for order fulfillment</li>
          <li>Order history and product preferences</li>
          <li>Messages and enquiries you send to us</li>
        </ul>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>How We Use Your Information</h2>
        <ul className="text-earth-600 space-y-2 mb-6 ml-6 list-disc">
          <li>To process and deliver your orders</li>
          <li>To communicate with you about orders and enquiries</li>
          <li>To improve our products and services</li>
          <li>To send important updates about your orders</li>
        </ul>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Data Security</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          We take reasonable measures to protect your personal information. We do not store payment card details. 
          Your data is stored securely using industry-standard practices.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Contact</h2>
        <p className="text-earth-600 leading-relaxed">
          For privacy-related questions, contact us at {settings.email} or {settings.phone}.
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen">
      <div className="bg-forest-800 text-white py-12"><div className="container-custom"><h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>Terms & Conditions</h1></div></div>
      <div className="container-custom py-12 max-w-3xl">
        <p className="text-earth-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>General</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          By using {settings.business_name}'s website, you agree to these terms and conditions. 
          These terms apply to all users, customers, and visitors.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Products & Pricing</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          All prices are listed in Indian Rupees (₹). Prices are subject to change without notice. 
          We make every effort to display accurate product information, but errors may occur.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Livestock Purchases</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Livestock purchases may require farm visits and inspections before final sale. 
          All livestock sales are subject to availability and health verification. 
          Transportation arrangements should be discussed with the seller.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Orders & Payment</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Orders are subject to confirmation and availability. We reserve the right to cancel orders 
          if products become unavailable or if there are pricing errors.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Contact</h2>
        <p className="text-earth-600 leading-relaxed">
          For questions about these terms, contact us at {settings.email} or {settings.phone}.
        </p>
      </div>
    </div>
  );
}

export function ShippingPolicyPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen">
      <div className="bg-forest-800 text-white py-12"><div className="container-custom"><h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>Shipping & Delivery Policy</h1></div></div>
      <div className="container-custom py-12 max-w-3xl">
        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Dairy Products</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Fresh dairy products are available for local delivery within our service area. 
          Delivery is available daily. Orders above ₹{settings.free_delivery_above ?? siteConfig.freeDeliveryAbove} qualify for free delivery.
          Standard delivery charge is ₹{settings.delivery_charge ?? siteConfig.deliveryCharge}.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Farming Goods</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Farming supplies are available for local delivery or farm pickup. 
          Delivery times depend on product availability and your location. 
          Contact us for estimated delivery times.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Livestock</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Livestock is available for farm pickup. We do not ship animals. 
          Transportation from our farm to your location must be arranged by the buyer 
          or discussed with us for possible arrangements. 
          Farm visits are encouraged before livestock purchases.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Delivery Area</h2>
        <p className="text-earth-600 leading-relaxed">
          Contact us to verify if delivery is available in your area. Our delivery service area 
          may expand over time. Call {settings.phone} or message us on WhatsApp.
        </p>
      </div>
    </div>
  );
}

export function RefundPolicyPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen">
      <div className="bg-forest-800 text-white py-12"><div className="container-custom"><h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>Cancellation & Refund Policy</h1></div></div>
      <div className="container-custom py-12 max-w-3xl">
        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Order Cancellation</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Orders can be cancelled before they are dispatched. Contact us immediately if you wish to cancel an order. 
          Once an order has been shipped or the product has been dispatched, cancellation may not be possible.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Dairy Products</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Due to the perishable nature of dairy products, refunds or replacements are only available 
          if there is a quality issue reported within 24 hours of delivery. 
          Please contact us immediately with details and photos if applicable.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Livestock</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          All livestock sales are final after the buyer has inspected the animal. 
          We encourage farm visits and thorough inspection before completing a purchase. 
          Pre-sale health information is provided for transparency.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Farming Goods</h2>
        <p className="text-earth-600 leading-relaxed mb-4">
          Farming goods can be returned within 7 days of delivery if they are unused, 
          in original packaging, and in resalable condition. Contact us to initiate a return.
        </p>

        <h2 className="heading-md text-forest-900 mt-8 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Refund Process</h2>
        <p className="text-earth-600 leading-relaxed">
          Approved refunds will be processed within 7-10 business days. Refunds will be issued 
          to the original payment method or as store credit, depending on the situation. 
          Contact {settings.phone} for refund inquiries.
        </p>
      </div>
    </div>
  );
}

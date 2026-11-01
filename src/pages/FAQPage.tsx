import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SettingsContext';

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { settings } = useSiteSettings();

  const faqs = [
    {
      q: 'How do I place an order?',
      a: 'Browse our products, add items to your cart, and proceed to checkout. For livestock purchases, you can also contact us directly via WhatsApp for enquiry-based orders.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We currently accept Cash on Delivery (COD) and Bank Transfer. Payment details for bank transfers will be shared after order confirmation.',
    },
    {
      q: 'Do you deliver to my area?',
      a: `We currently deliver dairy products locally within a 10-15km radius of our farm in ${settings.district || 'our district'}. Livestock purchases are for farm pickup. Farming supplies can be delivered locally or picked up.`,
    },
    {
      q: 'Can I visit the farm before buying livestock?',
      a: 'Yes, we encourage prospective buyers to visit our farm, inspect the animals, and meet our team. Please contact us in advance to schedule a visit.',
    },
    {
      q: 'How do I track my order?',
      a: 'After placing an order, you can view its status in the "My Orders" section of your account. We also send updates via WhatsApp.',
    },
    {
      q: 'Do you offer bulk discounts?',
      a: 'Yes, we offer special pricing for bulk orders. Please contact us via WhatsApp or phone to discuss bulk requirements.',
    },
    {
      q: 'Are your animals vaccinated?',
      a: 'Yes, all our livestock are properly vaccinated and maintained with regular health checkups. Vaccination and health details are provided in each listing.',
    },
    {
      q: 'How do I contact customer support?',
      a: `You can reach us via WhatsApp, phone (${settings.phone}), email (${settings.email}), or the contact form on our website. We typically respond within a few hours.`,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-forest-800 text-white py-16">
        <div className="container-custom text-center">
          <h1 className="heading-xl text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-forest-200 text-lg">Find answers to common questions about {settings.business_name}</p>
        </div>
      </div>

      <div className="container-custom py-16 max-w-3xl">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-earth-100">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-cream-50/50 transition-colors"
              >
                <span className="font-semibold text-forest-900 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                  {faq.q}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-forest-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-earth-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-earth-600 leading-relaxed border-t border-earth-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

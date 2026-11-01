import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { getWhatsAppLink } from '@/lib/utils';

export function WhatsAppButton() {
  const { settings } = useSiteSettings();

  return (
    <a
      href={getWhatsAppLink(settings.whatsapp_number, `Hello ${settings.business_name}, I would like to know more about your products and services.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      <span className="absolute right-full mr-3 bg-white text-forest-800 text-sm font-medium px-4 py-2 rounded-xl shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}

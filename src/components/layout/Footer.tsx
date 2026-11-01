import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle, PlayCircle, Heart } from 'lucide-react';
import { siteConfig, categories } from '@/config/site';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { getWhatsAppLink } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();

  const handleReplayIntro = () => {
    sessionStorage.removeItem('venkat_farms_intro_played');
    window.location.reload();
  };

  return (
    <footer className="bg-forest-950 text-white relative overflow-hidden border-t-4 border-harvest-400">
      {/* Decorative subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(#f5c542 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Main footer content */}
      <div className="container-custom py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              {settings.logo_url ? (
                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center p-1 border border-harvest-400/40 shadow-lg group-hover:border-harvest-400 transition-colors overflow-hidden">
                  <img src={settings.logo_url} alt={settings.business_name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-forest-800 to-forest-900 rounded-2xl flex items-center justify-center border border-harvest-400/40 shadow-lg group-hover:border-harvest-400 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-harvest-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3C4 7 4 12 7 15" />
                    <path d="M17 3C20 7 20 12 17 15" />
                    <path d="M12 9A5 5 0 0 0 7 14C7 18 10 21 12 21A5 5 0 0 0 17 14C17 10 14 9 12 9Z" />
                    <path d="M12 9V5" />
                  </svg>
                </div>
              )}
              <span className="text-2xl font-bold tracking-tight text-white group-hover:text-harvest-300 transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                {settings.business_name}
              </span>
            </Link>

            <p className="text-harvest-300 text-sm font-semibold tracking-wide">
              {settings.tagline}
            </p>

            <p className="text-forest-200 text-sm leading-relaxed">
              {settings.description || settings.about_content}
            </p>

            <div className="pt-2">
              <button
                onClick={handleReplayIntro}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/90 hover:bg-forest-800 text-xs text-harvest-300 border border-harvest-400/40 hover:border-harvest-400 transition-all cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5 text-harvest-400" />
                <span>Replay Cinematic Experience</span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-2">
              {Object.entries(siteConfig.socialLinks).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-forest-900 hover:bg-harvest-500 hover:text-forest-950 text-forest-200 rounded-xl flex items-center justify-center transition-all duration-300 text-xs font-bold uppercase border border-forest-800"
                  aria-label={name}
                >
                  {name[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="w-2 h-2 rounded-full bg-harvest-400" /> Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: 'Home', href: '/' },
                { name: 'Shop All Products', href: '/shop' },
                { name: 'About Our Farm', href: '/about' },
                { name: 'Contact & Enquiries', href: '/contact' },
                { name: 'Frequently Asked Questions', href: '/faq' },
                { name: 'Customer Account', href: '/account' },
                { name: 'Track Orders', href: '/orders' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-forest-300 hover:text-harvest-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="text-forest-500 text-xs">›</span> {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="w-2 h-2 rounded-full bg-harvest-400" /> Farm Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-forest-300 hover:text-harvest-300 transition-colors flex items-center gap-2"
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="w-2 h-2 rounded-full bg-harvest-400" /> Farm Contact
            </h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-harvest-400 flex-shrink-0" />
                <a href={`tel:${settings.phone}`} className="text-forest-200 hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <a
                  href={getWhatsAppLink(settings.whatsapp_number, `Hello ${settings.business_name}, I would like to enquire about your farm products.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-300 hover:text-green-200 transition-colors font-medium flex items-center gap-1"
                >
                  WhatsApp Chat (Instant Reply)
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-harvest-400 flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="text-forest-200 hover:text-white transition-colors break-all">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-harvest-400 flex-shrink-0" />
                <span className="text-forest-200">{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-forest-900 bg-forest-950/80">
        <div className="container-custom py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-forest-400 flex items-center gap-1.5">
            © {currentYear} <span className="text-cream-100 font-semibold">{settings.business_name}</span>. Built with{' '}
            <Heart className="w-3.5 h-3.5 text-sunset-500 fill-sunset-500" /> for Indian farming.
          </p>
          <div className="flex flex-wrap justify-center gap-5 text-forest-300">
            <Link to="/privacy-policy" className="hover:text-harvest-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-harvest-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/shipping-policy" className="hover:text-harvest-300 transition-colors">
              Delivery Policy
            </Link>
            <Link to="/refund-policy" className="hover:text-harvest-300 transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

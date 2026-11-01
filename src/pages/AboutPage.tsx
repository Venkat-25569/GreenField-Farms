import { useState } from 'react';
import { Leaf, Users, Award, MapPin, Phone, MessageCircle, Heart, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { getWhatsAppLink } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function AboutPage() {
  const { settings } = useSiteSettings();

  // Primary realistic farm photograph showing green agricultural fields
  const [mainImgSrc, setMainImgSrc] = useState<string>('/images/greenfield-farm-landscape.jpg');
  // Secondary livestock photograph showing healthy livestock / buffaloes / bulls
  const [livestockImgSrc, setLivestockImgSrc] = useState<string>('/images/bulls-sunset.jpg');

  const businessName = settings.business_name || 'venkat_farms_ceo';
  const officialPhone = settings.phone || '+91 9392629819';
  const officialWhatsApp = settings.whatsapp_number || '919392629819';

  const handleMainImgError = () => {
    // If local image fails, fallback to high-quality unsplash farm landscape
    if (mainImgSrc !== 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80') {
      setMainImgSrc('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80');
    }
  };

  const handleLivestockImgError = () => {
    // Fallback for livestock image
    if (livestockImgSrc !== 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1000&q=80') {
      setLivestockImgSrc('https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1000&q=80');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50/40">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 text-white py-20 px-4">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700/60 text-forest-200 text-xs font-semibold mb-4 border border-forest-600/40">
            <Sparkles className="w-3.5 h-3.5 text-harvest-400" />
            Pure, Ethical & Sustainable Farming
          </div>
          <h1 className="heading-xl text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            About {businessName}
          </h1>
          <p className="text-forest-200 text-lg sm:text-xl leading-relaxed">
            {settings.tagline || 'From Our Farm to Your Home'} — Dedicated to raising healthy livestock,
            producing pure organic milk, and cultivating sustainable agricultural supplies.
          </p>
        </div>
      </div>

      {/* Our Story & Realistic Farm Image Section */}
      <section className="section-padding px-4">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Visual Farm Photograph Showcase */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-forest-100 group bg-forest-900/10">
                <img
                  src={mainImgSrc}
                  alt={`${businessName} - Green agricultural fields and natural farm environment`}
                  onError={handleMainImgError}
                  className="w-full h-full object-cover rounded-2xl md:rounded-3xl transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />

                {/* Gradient overlay for contrast on badges */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Top Badge: Verified Authentic Farm */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-forest-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-white/50">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Authentic Working Farm
                </div>

                {/* Bottom Overlay Pill: Agricultural & Pasture Highlight */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-forest-100/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-forest-900 truncate">Lush Green Pastures & Crop Fields</p>
                    <p className="text-[11px] text-earth-500 truncate">Natural grazing, clean open-air environment</p>
                  </div>
                </div>
              </div>

              {/* Secondary Supporting Livestock Highlight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md border border-forest-100 group">
                  <img
                    src={livestockImgSrc}
                    alt="Healthy buffaloes and livestock in pasture"
                    onError={handleLivestockImgError}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold">
                    🐃 Healthy Buffaloes & Livestock
                  </p>
                </div>

                <div className="bg-forest-50 border border-forest-100 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-forest-700 uppercase tracking-wider mb-1">Our Commitment</p>
                  <p className="text-xs text-forest-950 font-medium leading-relaxed">
                    100% pasture-raised cattle, pure breed cocks, and zero chemical adulteration in dairy.
                  </p>
                </div>
              </div>
            </div>

            {/* Our Story Details */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold">
                <Heart className="w-3.5 h-3.5 text-forest-600" />
                Rooted in Passion & Tradition
              </div>

              <h2 className="heading-lg text-forest-900" style={{ fontFamily: 'var(--font-heading)' }}>
                Our Story & Vision
              </h2>

              <p className="text-earth-600 leading-relaxed text-base">
                What began as a dedicated family farm in Andhra Pradesh has grown into a trusted agricultural destination.
                At <strong>{businessName}</strong>, we believe in ethical farming practices, transparent business dealings,
                and nurturing every animal in a clean, natural habitat with lush open pastures.
              </p>

              <p className="text-earth-600 leading-relaxed text-base">
                Our farm is home to high-yielding, healthy breeds of buffaloes, robust country cocks and chickens,
                daily fresh organic milk, and quality farming tools. We take deep pride in the health and vitality of our animals,
                ensuring every customer receives genuine livestock and wholesome produce.
              </p>

              {/* Four Pillars */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  { title: 'Healthy Buffaloes', desc: 'Vaccinated & well-nourished dairy breeds' },
                  { title: 'Pure Country Cocks', desc: 'Traditional breeds raised free-range' },
                  { title: 'Fresh Pure Milk', desc: 'Raw, unadulterated farm milk daily' },
                  { title: 'Farming Goods', desc: 'Dependable tools & agricultural supplies' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-forest-100/80 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-forest-900">{item.title}</p>
                      <p className="text-[11px] text-earth-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/contact">
                  <Button size="lg" className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-md">
                    Contact Farm Office
                  </Button>
                </Link>
                <a
                  href={getWhatsAppLink(officialWhatsApp, `Hello ${businessName}, I would like to visit the farm or enquire about products.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="border-forest-600 text-forest-700 hover:bg-forest-50 rounded-xl">
                    <MessageCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Chat on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section-padding bg-white border-y border-forest-100 px-4">
        <div className="container-custom max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="heading-lg text-forest-900 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Core Farming Principles
            </h2>
            <p className="text-earth-500 text-sm sm:text-base">
              Every practice at {businessName} is centered on animal well-being, customer trust, and organic sustainability.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: 'Quality First',
                desc: 'Uncompromising hygiene, healthy feed, and attentive veterinary care for every animal.',
              },
              {
                icon: Users,
                title: 'Customer Trust',
                desc: 'Transparent pricing, live video inspection of livestock, and honest relationships.',
              },
              {
                icon: Award,
                title: 'Ethical Practices',
                desc: 'Cage-free poultry, stress-free dairy cattle handling, and responsible stewardship.',
              },
              {
                icon: MapPin,
                title: 'Direct From Farm',
                desc: 'No middleman markups. Direct delivery or pickup straight from our pastures.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-cream-50/70 border border-forest-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-13 h-13 bg-forest-100 text-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-4 w-12 h-12">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-forest-900 mb-2">{title}</h3>
                <p className="text-xs sm:text-sm text-earth-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-forest-900 text-white text-center px-4">
        <div className="container-custom max-w-2xl mx-auto">
          <h2 className="heading-lg text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Plan a Farm Visit or Enquire Today
          </h2>
          <p className="text-forest-200 mb-8 text-base">
            Looking for a specific breed of buffalo, healthy roosters, or daily pure milk subscription? We welcome direct customer enquiries anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${officialPhone.replace(/[^0-9+]/g, '')}`}>
              <Button size="lg" className="bg-white text-forest-900 hover:bg-cream-100 font-semibold rounded-xl shadow-md">
                <Phone className="w-4 h-4 mr-2 text-forest-700" />
                {officialPhone}
              </Button>
            </a>
            <a
              href={getWhatsAppLink(officialWhatsApp, `Hello ${businessName}, I would like to know more about your farm and livestock.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white rounded-xl">
                <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

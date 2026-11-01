import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Truck, ShieldCheck, Leaf, Phone, Star,
  MessageCircle, Milk, ChevronRight, Send, CheckCircle2,
  Sparkles, Award, Users, Clock, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { CinematicIntro } from '@/components/home/CinematicIntro';
import { fetchProducts, fetchReviews, createEnquiry } from '@/services/api';
import { siteConfig, categories as defaultCategories } from '@/config/site';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { getWhatsAppLink } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

// Number count-up component on scroll
function AnimatedCounter({ target, suffix = '', duration = 1.6 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, target, duration]);

  return (
    <div ref={elementRef} className="font-extrabold text-3xl sm:text-4xl text-harvest-400" style={{ fontFamily: 'var(--font-heading)' }}>
      {count}{suffix}
    </div>
  );
}

export function HomePage() {
  const { settings } = useSiteSettings();
  const [introFinished, setIntroFinished] = useState(() => {
    return sessionStorage.getItem('venkat_farms_intro_played') === 'true';
  });

  // Parallax scroll effect for Hero
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  // Queries
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchProducts({ featured: true, limit: 8 }),
  });

  const { data: dairyProducts } = useQuery({
    queryKey: ['products', 'dairy'],
    queryFn: () => fetchProducts({ categorySlug: 'fresh-milk-dairy', limit: 6 }),
  });

  const { data: livestockProducts } = useQuery({
    queryKey: ['products', 'livestock-featured'],
    queryFn: () => fetchProducts({ categorySlug: 'cocks-chickens', limit: 4 }),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => fetchReviews(),
  });

  // Home Contact / Quick Enquiry State
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryType, setEnquiryType] = useState('Fresh Dairy Milk');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);

  const handleQuickEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setEnquirySubmitting(true);
    try {
      if (isSupabaseConfigured()) {
        await createEnquiry({
          customer_name: enquiryName,
          phone: enquiryPhone,
          message: `[Interest: ${enquiryType}] ${enquiryMessage || 'Requested details and availability.'}`,
        });
        toast.success('Enquiry sent successfully! Our farm team will call you shortly.');
      } else {
        // Fallback open WhatsApp with prefilled message
        const waText = `Hello ${settings.business_name}! My name is ${enquiryName}. I am interested in ${enquiryType}. ${enquiryMessage ? `Note: ${enquiryMessage}` : ''}`;
        window.open(getWhatsAppLink(settings.whatsapp_number, waText), '_blank');
        toast.success('Opening WhatsApp to send your enquiry...');
      }
      setEnquiryName('');
      setEnquiryPhone('');
      setEnquiryMessage('');
    } catch {
      toast.error('Unable to send enquiry. Please contact us directly on WhatsApp.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream">
      {/* Cinematic Intro Animation */}
      <CinematicIntro onComplete={() => setIntroFinished(true)} />

      {/* Hero Section with Parallax Bulls at Sunset & Green Overlay */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] flex items-center overflow-hidden bg-forest-950 text-white"
      >
        {/* Parallax Background Image with Ken Burns touch */}
        <motion.div
          style={{ y: heroBgY, opacity: heroOpacity }}
          className="absolute inset-0 w-full h-[120%] -top-[10%] bg-cover bg-center"
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('/images/bulls-sunset.jpg')`,
            }}
          />
        </motion.div>

        {/* Cinematic Green-to-Transparent & Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-900/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-transparent to-forest-950/60 pointer-events-none" />

        {/* Floating atmospheric amber dust particles */}
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-harvest-400/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/6 w-96 h-96 rounded-full bg-forest-500/15 blur-3xl" />
        </div>

        {/* Hero Content Container */}
        <div className="container-custom relative z-10 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: introFinished ? 0.1 : 0.4 }}
            className="max-w-3xl"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2.5 bg-forest-900/80 hover:bg-forest-800/80 backdrop-blur-md border border-harvest-400/40 rounded-full px-4 py-2 mb-6 shadow-lg shadow-forest-950/50">
              <span className="w-2.5 h-2.5 rounded-full bg-fresh-green animate-ping" />
              <Leaf className="w-4 h-4 text-harvest-400" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-cream-100">
                {settings.business_name} • Pure Indigenous Farm Care
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-md"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              From Our Farm <br className="hidden sm:inline" />
              <span className="text-gold-gradient drop-shadow-[0_2px_12px_rgba(245,197,66,0.3)]">
                to Your Home
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl text-cream-100/90 mb-10 leading-relaxed font-light max-w-2xl drop-shadow">
              Nurturing premium quality livestock, 100% farm-fresh natural dairy, and essential agricultural goods. Straight from our pastures with honesty, heritage, and care.
            </p>

            {/* CTAs: Primary, Secondary, and Aligned Livestock Link */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5 mb-14">
              {/* Primary CTA */}
              <Link to="/shop" className="sm:w-auto">
                <Button
                  size="xl"
                  className="w-full sm:w-auto bg-gradient-to-r from-harvest-400 to-harvest-500 hover:from-harvest-500 hover:to-harvest-600 text-forest-950 font-bold shadow-xl shadow-harvest-500/20 rounded-2xl h-14 px-8 border border-harvest-300/60 hover:scale-[1.02] active:scale-98 transition-all"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              {/* Secondary CTA */}
              <Link to="/category/fresh-milk-dairy" className="sm:w-auto">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md rounded-2xl h-14 px-7 font-semibold hover:border-harvest-400/80 transition-all"
                >
                  <Milk className="w-5 h-5 mr-2 text-harvest-300" />
                  <span>Shop Fresh Milk</span>
                </Button>
              </Link>

              {/* Clean Third Button / Link */}
              <Link to="/category/buffaloes-livestock" className="sm:w-auto">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto bg-forest-900/60 hover:bg-forest-900/90 text-cream-200 border-forest-600/60 backdrop-blur-md rounded-2xl h-14 px-6 font-semibold hover:border-harvest-400/60 transition-all"
                >
                  <span className="mr-2 text-lg">🐃</span>
                  <span>Browse Livestock</span>
                </Button>
              </Link>
            </div>

            {/* Key Trust Highlights */}
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-forest-200 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fresh-green" />
                <span>100% Authentic Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-harvest-400" />
                <span>Safe Doorstep Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span>Instant WhatsApp Support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip with Count-Up Animation on Scroll */}
      <section className="relative z-20 -mt-10 sm:-mt-12 container-custom">
        <div className="bg-forest-900/95 backdrop-blur-xl border border-harvest-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-forest-950/40 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-forest-800">
            {/* Stat 1 */}
            <div className="text-center sm:text-left sm:pl-4">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Users className="w-4 h-4 text-harvest-400" />
                <span className="text-xs uppercase tracking-wider text-forest-300 font-semibold">Customers</span>
              </div>
              <AnimatedCounter target={500} suffix="+" />
              <p className="text-xs text-forest-300 mt-1">Happy Farming Families</p>
            </div>

            {/* Stat 2 */}
            <div className="text-center sm:text-left pt-4 sm:pt-0 sm:pl-8">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Award className="w-4 h-4 text-harvest-400" />
                <span className="text-xs uppercase tracking-wider text-forest-300 font-semibold">Catalog</span>
              </div>
              <AnimatedCounter target={100} suffix="+" />
              <p className="text-xs text-forest-300 mt-1">Verified Farm Products</p>
            </div>

            {/* Stat 3 */}
            <div className="text-center sm:text-left pt-4 sm:pt-0 sm:pl-8">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Clock className="w-4 h-4 text-harvest-400" />
                <span className="text-xs uppercase tracking-wider text-forest-300 font-semibold">Legacy</span>
              </div>
              <AnimatedCounter target={10} suffix="+" />
              <p className="text-xs text-forest-300 mt-1">Years of Rural Trust</p>
            </div>

            {/* Stat 4 */}
            <div className="text-center sm:text-left pt-4 sm:pt-0 sm:pl-8">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Truck className="w-4 h-4 text-harvest-400" />
                <span className="text-xs uppercase tracking-wider text-forest-300 font-semibold">Distribution</span>
              </div>
              <div className="font-extrabold text-3xl sm:text-4xl text-harvest-400" style={{ fontFamily: 'var(--font-heading)' }}>
                Daily
              </div>
              <p className="text-xs text-forest-300 mt-1">Fresh Farm Deliveries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories with Hover Lift and Zoom */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full">
              Explore Our Farm
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 mt-3 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Featured Farm Categories
            </h2>
            <p className="text-earth-600 text-sm sm:text-base leading-relaxed">
              Explore our wholesome selections of healthy livestock, pure farm milk, and agricultural supplies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultCategories.map((cat, idx) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className="group block relative rounded-3xl overflow-hidden bg-white border border-earth-200/90 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-cream-100 via-forest-50 to-harvest-50 flex items-center justify-center relative overflow-hidden">
                    <span className="text-7xl group-hover:scale-125 transition-transform duration-700 ease-out select-none drop-shadow">
                      {cat.icon}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-xl font-bold text-white mb-1 drop-shadow" style={{ fontFamily: 'var(--font-heading)' }}>
                        {cat.name}
                      </h3>
                      <p className="text-forest-200 text-xs line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white flex items-center justify-between mt-auto border-t border-earth-100">
                    <span className="text-xs font-bold text-forest-800 group-hover:text-forest-600 transition-colors">
                      Browse Collection
                    </span>
                    <div className="w-7 h-7 rounded-full bg-forest-50 group-hover:bg-harvest-400 group-hover:text-forest-950 flex items-center justify-center transition-all duration-300">
                      <ChevronRight className="w-4 h-4 text-forest-700 group-hover:text-forest-950 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="section-padding bg-earth-50/70 border-y border-earth-200/60">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full">
                Hand-Picked Quality
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 mt-3 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Featured Products
              </h2>
              <p className="text-earth-600 text-sm sm:text-base">
                Fresh daily dairy, live poultry, livestock, and agriculture essentials
              </p>
            </div>
            <Link to="/shop">
              <Button
                variant="outline"
                className="rounded-xl border-earth-300 hover:border-forest-600 hover:bg-forest-50 text-forest-900 font-semibold"
              >
                View Full Catalog <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts && featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-earth-200 p-8">
                  <p className="text-earth-600 font-medium">No featured products currently available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Fresh Milk & Dairy Showcase Banner */}
      {dairyProducts && dairyProducts.length > 0 && (
        <section className="section-padding">
          <div className="container-custom">
            <div className="bg-gradient-to-br from-forest-900 to-forest-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl mb-12">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none hidden md:block">
                <div className="text-[180px] leading-none text-right pr-12 select-none">🥛</div>
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-harvest-300 bg-forest-800 px-3 py-1 rounded-full mb-4 border border-harvest-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-harvest-400" /> Pure & Unadulterated
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Farm Fresh Dairy & Milk
                </h2>
                <p className="text-forest-200 text-sm sm:text-base leading-relaxed mb-6">
                  Collected every morning and evening directly from our grass-fed cows and buffaloes. No chemicals, no preservatives — just pure, nutritious rural milk.
                </p>
                <Link to="/category/fresh-milk-dairy">
                  <Button className="bg-harvest-400 hover:bg-harvest-500 text-forest-950 font-bold rounded-xl h-11 px-6 shadow-lg">
                    Order Fresh Milk Today <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dairyProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Livestock Poultry (Cocks & Chickens) */}
      {livestockProducts && livestockProducts.length > 0 && (
        <section className="section-padding bg-warm-cream border-t border-earth-200/50">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-sunset-600 bg-sunset-50 px-3.5 py-1 rounded-full border border-sunset-200">
                  🐔 Indigenous Poultry
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 mt-3 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Healthy Cocks & Chickens
                </h2>
                <p className="text-earth-600 text-sm sm:text-base">
                  Strong, disease-resistant country breeds for farming and breeding
                </p>
              </div>
              <Link to="/category/cocks-chickens">
                <Button variant="outline" className="rounded-xl border-earth-300 hover:bg-forest-50 text-forest-900 font-semibold">
                  Browse All Poultry <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {livestockProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="section-padding bg-forest-900 text-white relative overflow-hidden">
        <div className="container-custom relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-harvest-400 bg-forest-800/80 px-3.5 py-1 rounded-full border border-harvest-400/30">
              The Venkat_farms_ceo Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Why Indian Farmers & Families Trust Us
            </h2>
            <p className="text-forest-200 text-sm sm:text-base leading-relaxed">
              We stand behind every litre of milk, every bird, and every agricultural product we deliver.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-forest-800/60 border border-forest-700/60 backdrop-blur-sm hover:border-harvest-400/50 hover:bg-forest-800/90 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-forest-700 flex items-center justify-center mb-6 text-harvest-400 border border-forest-600">
                <Leaf className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Direct Farm Sourced
              </h3>
              <p className="text-forest-200 text-sm leading-relaxed">
                Zero middle-men. Every item comes straight from our own pasture and verified rural farming partners.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-forest-800/60 border border-forest-700/60 backdrop-blur-sm hover:border-harvest-400/50 hover:bg-forest-800/90 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-forest-700 flex items-center justify-center mb-6 text-fresh-green border border-forest-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Transparent & Genuine
              </h3>
              <p className="text-forest-200 text-sm leading-relaxed">
                Real photos, accurate livestock ages, health records, and genuine pricing without hidden surprises.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-forest-800/60 border border-forest-700/60 backdrop-blur-sm hover:border-harvest-400/50 hover:bg-forest-800/90 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-forest-700 flex items-center justify-center mb-6 text-sunset-500 border border-forest-600">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Reliable Local Delivery
              </h3>
              <p className="text-forest-200 text-sm leading-relaxed">
                Carefully scheduled dairy deliveries and seamless farm pickup coordination for livestock and bulk orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="section-padding bg-cream-50">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full">
              Real Experiences
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 mt-3 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              What Our Customers Say
            </h2>
            <p className="text-earth-600 text-sm sm:text-base">
              Voices of our valued community of dairy consumers, livestock breeders, and farmers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews && reviews.length > 0 ? (
              reviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-3xl p-7 border border-earth-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-harvest-400 fill-harvest-400' : 'text-earth-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-forest-900 text-sm sm:text-base italic leading-relaxed mb-6">
                      "{review.comment || 'Outstanding quality and very friendly service. Will definitely recommend Venkat_farms_ceo to everyone!'}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-earth-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-950 text-sm">
                        {review.profile?.full_name || 'Verified Customer'}
                      </p>
                      <span className="text-[11px] text-earth-500">Farm Customer</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-fresh-green" />
                  </div>
                </div>
              ))
            ) : (
              /* Fallback rich customer reviews */
              <>
                <div className="bg-white rounded-3xl p-7 border border-earth-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-4 text-harvest-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-harvest-400 text-harvest-400" />
                      ))}
                    </div>
                    <p className="text-forest-900 text-sm sm:text-base italic leading-relaxed mb-6">
                      "The morning buffalo milk from Venkat_farms_ceo is the thickest and sweetest we've had in years. Pure nostalgic taste of village milk delivered right to our door."
                    </p>
                  </div>
                  <div className="pt-4 border-t border-earth-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-950 text-sm">Ramesh K.</p>
                      <span className="text-[11px] text-earth-500">Dairy Subscriber • 8 Months</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-fresh-green" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-7 border border-earth-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-4 text-harvest-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-harvest-400 text-harvest-400" />
                      ))}
                    </div>
                    <p className="text-forest-900 text-sm sm:text-base italic leading-relaxed mb-6">
                      "Purchased healthy country breed chicks for our home farm. The communication on WhatsApp was immediate and all birds arrived in great health."
                    </p>
                  </div>
                  <div className="pt-4 border-t border-earth-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-950 text-sm">Suresh Babu</p>
                      <span className="text-[11px] text-earth-500">Poultry Farmer</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-fresh-green" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-7 border border-earth-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-4 text-harvest-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-harvest-400 text-harvest-400" />
                      ))}
                    </div>
                    <p className="text-forest-900 text-sm sm:text-base italic leading-relaxed mb-6">
                      "Honest livestock dealing is rare today. The team at Venkat_farms_ceo gave clear details about the buffalo's milking yield and lineage. Highly recommended!"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-earth-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-950 text-sm">Venkatesh Rao</p>
                      <span className="text-[11px] text-earth-500">Livestock Buyer</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-fresh-green" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Contact & Enquiry Form Section */}
      <section className="section-padding bg-white border-t border-earth-200">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            {/* Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full">
                Direct Farm Desk
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Have Questions or Need a Custom Order?
              </h2>
              <p className="text-earth-600 text-sm sm:text-base leading-relaxed">
                Whether you need fresh dairy subscriptions, live buffalo queries, or bulk agricultural supplies, our farm managers respond swiftly.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-cream-50 border border-earth-200">
                  <div className="w-10 h-10 rounded-xl bg-forest-800 text-harvest-400 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-earth-500">Call Us Anytime</p>
                    <a href={`tel:${settings.phone}`} className="text-sm font-bold text-forest-900 hover:text-forest-700">
                      {settings.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-green-50/60 border border-green-200/60">
                  <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium">WhatsApp Hotline</p>
                    <a
                      href={getWhatsAppLink(settings.whatsapp_number, `Hello ${settings.business_name}, I want to inquire about your farm products.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-green-900 hover:underline"
                    >
                      Chat with us on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-cream-50/90 rounded-3xl p-8 sm:p-10 border border-earth-200 shadow-lg">
                <h3 className="text-xl font-bold text-forest-950 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  Send an Enquiry
                </h3>
                <p className="text-xs sm:text-sm text-earth-500 mb-6">
                  Fill in your details and we'll get back to you promptly.
                </p>

                <form onSubmit={handleQuickEnquiry} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-forest-900 mb-1.5">
                        Your Full Name *
                      </label>
                      <Input
                        required
                        placeholder="e.g. Anand Sharma"
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(e.target.value)}
                        className="rounded-xl bg-white border-earth-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-forest-900 mb-1.5">
                        Phone Number *
                      </label>
                      <Input
                        required
                        type="tel"
                        placeholder="e.g. 9392629819"
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        className="rounded-xl bg-white border-earth-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-forest-900 mb-1.5">
                      Interested In
                    </label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-earth-300 bg-white text-sm text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium"
                    >
                      <option value="Fresh Dairy Milk">Fresh Dairy Milk (Daily Subscription)</option>
                      <option value="Livestock - Buffaloes">Livestock (Buffaloes & Cattle)</option>
                      <option value="Cocks & Chickens">Poultry (Cocks & Chickens)</option>
                      <option value="Farming Goods">Farming Supplies & Tools</option>
                      <option value="General Inquiry">General Inquiry / Farm Visit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-forest-900 mb-1.5">
                      Message / Requirement
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Tell us what you are looking for (quantity, location, etc.)..."
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      className="rounded-xl bg-white border-earth-300 text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="w-full h-12 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl shadow-md transition-all gap-2 text-sm"
                  >
                    {enquirySubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Farm Enquiry
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 bg-forest-950 text-white relative overflow-hidden border-t border-forest-900">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container-custom relative z-10 text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-harvest-400 bg-forest-900 px-3.5 py-1 rounded-full border border-harvest-400/30">
            Welcome to Venkat_farms_ceo
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4 mb-5" style={{ fontFamily: 'var(--font-heading)' }}>
            Experience Farm Purity at Its Finest
          </h2>
          <p className="text-forest-200 text-base sm:text-lg mb-8 leading-relaxed">
            Order online today or start a WhatsApp conversation with our farm representative for quick assistance and doorstep service.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop">
              <Button size="xl" className="bg-harvest-400 hover:bg-harvest-500 text-forest-950 font-bold rounded-2xl h-13 px-8 shadow-xl">
                Shop All Products <ArrowRight className="w-5 h-5 ml-1.5" />
              </Button>
            </Link>
            <a
              href={getWhatsAppLink(settings.whatsapp_number, `Hello ${settings.business_name}! I would like to order from your farm.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="xl"
                variant="outline"
                className="bg-green-700/30 hover:bg-green-700/50 text-white border-green-500/50 rounded-2xl h-13 px-7 backdrop-blur-md"
              >
                <MessageCircle className="w-5 h-5 mr-2 text-green-400" /> WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

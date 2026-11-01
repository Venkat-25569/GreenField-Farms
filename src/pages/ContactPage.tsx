import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, MapPin, MessageCircle, Send, Loader2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { getWhatsAppLink } from '@/lib/utils';
import { createEnquiry } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

const contactSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'Please enter your name (at least 2 characters)')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .min(10, 'Please enter a valid 10-digit phone number')
    .refine((val) => {
      const clean = val.replace(/[^0-9]/g, '');
      return clean.length >= 10 && clean.length <= 15;
    }, 'Please enter a valid 10-digit mobile number'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters')
    .max(1500, 'Message cannot exceed 1500 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const { settings } = useSiteSettings();

  const officialPhone = settings.phone || '+91 9392629819';
  const officialEmail = settings.email || 'nagavenkateswararao2006@gmail.com';
  const officialWhatsApp = settings.whatsapp_number || '919392629819';
  const businessName = settings.business_name || 'venkat_farms_ceo';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      customer_name: '',
      phone: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (loading) return; // Prevent duplicate submissions

    if (!isSupabaseConfigured()) {
      toast.error('Database connection not ready. Please reach us via WhatsApp or Phone.');
      return;
    }

    setLoading(true);
    try {
      await createEnquiry({
        customer_name: data.customer_name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        message: data.message.trim(),
      });

      toast.success('Your message has been submitted successfully! We will contact you soon.', {
        duration: 5000,
      });

      setSubmittedSuccessfully(true);
      reset();

      // Reset success banner after 8 seconds
      setTimeout(() => {
        setSubmittedSuccessfully(false);
      }, 8000);
    } catch (err: any) {
      console.error('Contact form submission error:', err);
      const errorMsg = err?.message || 'Failed to send message. Please try WhatsApp or phone.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const prefilledWhatsAppUrl = getWhatsAppLink(
    officialWhatsApp,
    `Hello ${businessName}, I would like to enquire about your farm products and livestock availability.`
  );

  return (
    <div className="min-h-screen bg-cream-50/50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 text-white py-16 px-4">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700/60 text-forest-200 text-xs font-semibold mb-4 border border-forest-600/40">
            <Sparkles className="w-3.5 h-3.5 text-harvest-400" />
            Direct Farm Enquiries & Support
          </div>
          <h1 className="heading-xl text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Contact {businessName}
          </h1>
          <p className="text-forest-200 text-lg leading-relaxed">
            Have questions about our livestock, fresh dairy, or organic farming goods? We are here to help you directly from our farm.
          </p>
        </div>
      </div>

      <div className="container-custom py-12 px-4">
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* Left Column: Contact Details & Instant WhatsApp Card */}
          <div className="lg:col-span-5 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-forest-100">
              <h2 className="heading-sm text-forest-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Get in Touch
              </h2>
              <p className="text-sm text-earth-500 mb-6 leading-relaxed">
                Connect with our farm team for bulk bookings, live video viewings of livestock, or delivery updates.
              </p>

              <div className="space-y-4">
                {/* Phone */}
                <a
                  href={`tel:${officialPhone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-forest-50/80 transition-all border border-transparent hover:border-forest-100 group"
                >
                  <div className="w-11 h-11 bg-forest-100 text-forest-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-forest-600 group-hover:text-white transition-all">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-earth-400">Phone Call</p>
                    <p className="text-sm font-semibold text-forest-900 group-hover:text-forest-700 transition-colors">
                      {officialPhone}
                    </p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href={prefilledWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-emerald-50/80 transition-all border border-transparent hover:border-emerald-100 group"
                >
                  <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-earth-400">WhatsApp Chat</p>
                    <p className="text-sm font-semibold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                      +91 9392629819 (Instant Reply)
                    </p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${officialEmail}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-forest-50/80 transition-all border border-transparent hover:border-forest-100 group"
                >
                  <div className="w-11 h-11 bg-forest-100 text-forest-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-forest-600 group-hover:text-white transition-all">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-earth-400">Farm Email</p>
                    <p className="text-sm font-semibold text-forest-900 break-all group-hover:text-forest-700 transition-colors">
                      {officialEmail}
                    </p>
                  </div>
                </a>

                {/* Address */}
                <div className="flex items-start gap-4 p-3.5 rounded-2xl border border-transparent">
                  <div className="w-11 h-11 bg-forest-100 text-forest-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-earth-400">Farm Location</p>
                    <p className="text-sm text-forest-900 leading-snug">
                      {settings.address || 'Village Road, Andhra Pradesh, India'}
                    </p>
                    {settings.google_maps_link && (
                      <a
                        href={settings.google_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-xs font-medium text-forest-600 hover:text-forest-700 underline"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick WhatsApp Highlight Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-forest-800 rounded-3xl p-6 text-white shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Direct WhatsApp Connect</h3>
                  <p className="text-xs text-emerald-100">Live livestock videos & instant quotes</p>
                </div>
              </div>
              <p className="text-xs text-emerald-100 mb-4 leading-relaxed">
                Need to see live video of buffaloes or roosters before booking? Message directly on WhatsApp: <strong>+91 9392629819</strong>.
              </p>
              <a
                href={prefilledWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Open WhatsApp Chat
              </a>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-forest-100">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-earth-100">
                <div>
                  <h3 className="heading-sm text-forest-900" style={{ fontFamily: 'var(--font-heading)' }}>
                    Send us a Message
                  </h3>
                  <p className="text-xs text-earth-500 mt-0.5">
                    Fill in your details and our farm team will contact you directly.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full border border-forest-100">
                  <Clock className="w-3.5 h-3.5" />
                  Fast Response
                </div>
              </div>

              {/* Success Notification Banner */}
              {submittedSuccessfully && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-emerald-900">
                      Your message has been submitted successfully! We will contact you soon.
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Our manager will review your enquiry and respond to your phone or WhatsApp shortly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Customer Name */}
                <Input
                  label="Customer Name *"
                  id="contact-name"
                  placeholder="Enter your full name"
                  {...register('customer_name')}
                  error={errors.customer_name?.message}
                  disabled={loading}
                />

                {/* Phone Number */}
                <Input
                  label="Phone Number *"
                  id="contact-phone"
                  type="tel"
                  placeholder="10-digit mobile number (e.g. 9392629819)"
                  {...register('phone')}
                  error={errors.phone?.message}
                  disabled={loading}
                />

                {/* Optional Email */}
                <Input
                  label="Email (Optional)"
                  id="contact-email"
                  type="email"
                  placeholder="your.email@example.com (optional)"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={loading}
                />

                {/* Message */}
                <Textarea
                  label="Message *"
                  id="contact-message"
                  placeholder="Please describe what product, livestock, or information you are looking for..."
                  rows={4}
                  {...register('message')}
                  error={errors.message?.message}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Message...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-earth-400 pt-1">
                  🔒 Your contact information is stored safely and used strictly to assist with your farm enquiry.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

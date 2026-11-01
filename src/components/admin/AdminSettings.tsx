import { useState, useEffect, useRef } from 'react';
import {
  Building2, MapPin, Truck, Store, Package, Bell,
  Shield, Key, LogOut, Upload, Check, RefreshCw,
  ExternalLink, Clock, AlertTriangle, Loader2, Sparkles,
  DollarSign, CheckCircle2, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { uploadSiteLogo } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { indianStates } from '@/config/site';
import { toast } from 'sonner';
import type { SiteSettings } from '@/types';

export function AdminSettings() {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const { user, profile, signOut } = useAuth();

  // Local form state
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync formData when settings load from DB
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetSection = (sectionFields: (keyof SiteSettings)[]) => {
    setFormData((prev) => {
      const resetObj = { ...prev };
      for (const field of sectionFields) {
        (resetObj as any)[field] = (settings as any)[field];
      }
      return resetObj;
    });
    toast.info('Section fields reset to saved values');
  };

  const handleSave = async (sectionName: string, fieldsToSave?: Partial<SiteSettings>) => {
    setSavingSection(sectionName);
    try {
      const payload: Partial<SiteSettings> = fieldsToSave || formData;

      // Auto-compile composite address if address components are being saved
      if ('village' in payload || 'street_address' in payload || 'district' in payload || 'state' in payload || 'pincode' in payload) {
        const parts = [
          formData.village?.trim(),
          formData.street_address?.trim(),
          formData.district?.trim(),
          formData.state?.trim(),
          formData.pincode?.trim() ? `PIN: ${formData.pincode.trim()}` : '',
          formData.country?.trim() || 'India',
        ].filter(Boolean);
        if (parts.length > 0) {
          payload.address = parts.join(', ');
          setFormData((prev) => ({ ...prev, address: payload.address! }));
        }
      }

      await updateSettings(payload);
      toast.success(`${sectionName} saved successfully! Changes are live across the website.`);
    } catch (err: any) {
      console.error(`Error saving ${sectionName}:`, err);
      toast.error(err.message || `Failed to save ${sectionName}`);
    } finally {
      setSavingSection(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setLogoUploading(true);
    try {
      const publicUrl = await uploadSiteLogo(file);
      handleChange('logo_url', publicUrl);
      await updateSettings({ logo_url: publicUrl });
      toast.success('Logo uploaded and applied across the website!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error(err.message || 'Failed to upload logo to Supabase storage');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    handleChange('logo_url', null);
    await updateSettings({ logo_url: null });
    toast.success('Logo removed. Default farm emblem will be displayed.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Admin password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
        <span className="ml-3 text-forest-800 font-medium">Loading settings from Supabase...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner Alert / Status */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-900 text-white rounded-2xl p-6 shadow-md border border-forest-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700/60 border border-forest-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Live Supabase Settings System
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Admin Settings & Business Management
          </h2>
          <p className="text-forest-200 text-sm mt-1">
            Updates made here automatically synchronize and reflect immediately across all customer-facing pages.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            Connected to Database
          </Badge>
        </div>
      </div>

      {/* 1. BUSINESS PROFILE SETTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                1. Business Profile Settings
              </h3>
              <p className="text-xs text-earth-500">Core business branding, logos, contact numbers, and messaging</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-forest-100 text-forest-800">
            Brand Identity
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Logo Upload Section */}
          <div className="p-4 rounded-xl bg-cream-50/60 border border-earth-200/70 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-forest-200 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Business Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="w-9 h-9 text-forest-400" />
              )}
              {logoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-sm text-forest-950">Business Brand Logo</p>
              <p className="text-xs text-earth-600 mt-0.5">
                Upload your official farm logo. Replaces the default farm icon in the website header and footer.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={logoUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs font-medium border-forest-300 text-forest-800 hover:bg-forest-50"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {formData.logo_url && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveLogo}
                    className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Remove Logo
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Business Name *"
              value={formData.business_name}
              onChange={(e) => handleChange('business_name', e.target.value)}
              placeholder="e.g. GreenField Farms"
              helperText="Appears in page headers, titles, invoices, and brand copy."
            />
            <Input
              label="Farm Tagline"
              value={formData.tagline || ''}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="e.g. From Our Farm to Your Home"
              helperText="Displayed under business name in header and footer."
            />
          </div>

          <Textarea
            label="Business Description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            placeholder="A short summary of your farm's mission, values, and offerings."
            helperText="Appears in website footers, about sections, and social previews."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Business Email *"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="nagavenkateswararao2006@gmail.com"
              helperText="Used for customer contact and enquiries."
            />
            <Input
              label="Contact Phone Number *"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 9392629819"
              helperText="Direct voice call contact number."
            />
            <Input
              label="WhatsApp Number *"
              value={formData.whatsapp_number || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              placeholder="919392629819"
              helperText="Include country code without '+' for direct wa.me links."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResetSection(['business_name', 'tagline', 'description', 'email', 'phone', 'whatsapp_number'])}
              className="text-earth-600 border-earth-300"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSection === 'Business Profile'}
              onClick={() => handleSave('Business Profile', {
                business_name: formData.business_name,
                tagline: formData.tagline,
                description: formData.description,
                email: formData.email,
                phone: formData.phone,
                whatsapp_number: formData.whatsapp_number,
              })}
              className="bg-forest-700 hover:bg-forest-800 text-white min-w-[130px]"
            >
              {savingSection === 'Business Profile' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. ADDRESS SETTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                2. Farm Address & Location Settings
              </h3>
              <p className="text-xs text-earth-500">Physical farm location, Google Maps navigation, and postal details</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-forest-100 text-forest-800">
            Physical Farm
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Input
              label="Village / Town"
              value={formData.village || ''}
              onChange={(e) => handleChange('village', e.target.value)}
              placeholder="e.g. Village Road"
            />
            <Input
              label="Street Address / Survey No."
              value={formData.street_address || ''}
              onChange={(e) => handleChange('street_address', e.target.value)}
              placeholder="e.g. Near Panchayat Office"
            />
            <Input
              label="District"
              value={formData.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder="e.g. Krishna District"
            />
            <Select
              label="State"
              value={formData.state || 'Andhra Pradesh'}
              onChange={(e) => handleChange('state', e.target.value)}
              options={indianStates.map((s) => ({ value: s, label: s }))}
            />
            <Input
              label="Country"
              value={formData.country || 'India'}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="India"
            />
            <Input
              label="PIN Code"
              value={formData.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="e.g. 520001"
            />
          </div>

          <Input
            label="Google Maps Location Link"
            value={formData.google_maps_link || ''}
            onChange={(e) => handleChange('google_maps_link', e.target.value)}
            placeholder="https://maps.google.com/?q=..."
            helperText="Allows customers to navigate directly to your farm gate via Google Maps."
          />

          {/* Formatted Address Preview */}
          <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-200/80">
            <p className="text-xs font-semibold text-forest-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-forest-600" /> Current Customer-Facing Full Address:
            </p>
            <p className="text-xs text-forest-800 font-mono">
              {formData.address || 'Village Road, District Name, State, India'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResetSection(['village', 'street_address', 'district', 'state', 'country', 'pincode', 'google_maps_link'])}
              className="text-earth-600 border-earth-300"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSection === 'Address Settings'}
              onClick={() => handleSave('Address Settings', {
                village: formData.village,
                street_address: formData.street_address,
                district: formData.district,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                google_maps_link: formData.google_maps_link,
              })}
              className="bg-forest-700 hover:bg-forest-800 text-white min-w-[130px]"
            >
              {savingSection === 'Address Settings' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. DELIVERY SETTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                3. Delivery & Dispatch Settings
              </h3>
              <p className="text-xs text-earth-500">Shipping costs, free delivery thresholds, service areas, and ETA</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-forest-100 text-forest-800">
            Logistics
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-cream-50 border border-earth-200">
            <div>
              <p className="text-sm font-semibold text-forest-950">Enable Home Delivery</p>
              <p className="text-xs text-earth-600">Turn on or off local doorstep delivery service for dairy and farming goods.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enable_home_delivery ?? true}
                onChange={(e) => handleChange('enable_home_delivery', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-earth-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Standard Delivery Charge (₹)"
              type="number"
              min="0"
              value={formData.delivery_charge ?? 50}
              onChange={(e) => handleChange('delivery_charge', Number(e.target.value))}
              helperText="Applied to checkout when subtotal is below the free threshold."
            />
            <Input
              label="Free Delivery Above (₹)"
              type="number"
              min="0"
              value={formData.free_delivery_above ?? 500}
              onChange={(e) => handleChange('free_delivery_above', Number(e.target.value))}
              helperText="Orders matching or exceeding this amount receive ₹0 shipping."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Available Delivery Locations"
              value={formData.delivery_locations || ''}
              onChange={(e) => handleChange('delivery_locations', e.target.value)}
              placeholder="Local delivery within 15km radius"
              helperText="Visible on product pages and checkout."
            />
            <Input
              label="Estimated Delivery Time"
              value={formData.estimated_delivery_time || ''}
              onChange={(e) => handleChange('estimated_delivery_time', e.target.value)}
              placeholder="Same-day delivery (within 3-5 hours)"
              helperText="Customer expectation for order arrival."
            />
          </div>

          <Textarea
            label="Detailed Delivery Information Note"
            value={formData.delivery_information || ''}
            onChange={(e) => handleChange('delivery_information', e.target.value)}
            rows={2}
            placeholder="Special policies regarding livestock pickup vs dairy delivery."
            helperText="Appears on the Checkout and Shipping Policy pages."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResetSection(['enable_home_delivery', 'delivery_charge', 'free_delivery_above', 'delivery_locations', 'estimated_delivery_time', 'delivery_information'])}
              className="text-earth-600 border-earth-300"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSection === 'Delivery Settings'}
              onClick={() => handleSave('Delivery Settings', {
                enable_home_delivery: formData.enable_home_delivery,
                delivery_charge: formData.delivery_charge,
                free_delivery_above: formData.free_delivery_above,
                delivery_locations: formData.delivery_locations,
                estimated_delivery_time: formData.estimated_delivery_time,
                delivery_information: formData.delivery_information,
              })}
              className="bg-forest-700 hover:bg-forest-800 text-white min-w-[130px]"
            >
              {savingSection === 'Delivery Settings' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. STORE SETTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                4. Store Operations & Currency
              </h3>
              <p className="text-xs text-earth-500">Business hours, operational status, customer accounts, and order acceptance</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-forest-100 text-forest-800">
            Operations
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Currency Symbol"
              value={formData.currency || '₹'}
              onChange={(e) => handleChange('currency', e.target.value)}
              placeholder="₹"
              helperText="e.g. ₹ for Indian Rupees"
            />
            <Input
              label="Store Opening Time"
              value={formData.store_open_time || '06:00 AM'}
              onChange={(e) => handleChange('store_open_time', e.target.value)}
              placeholder="06:00 AM"
              helperText="Time when daily farm shop opens."
            />
            <Input
              label="Store Closing Time"
              value={formData.store_close_time || '08:00 PM'}
              onChange={(e) => handleChange('store_close_time', e.target.value)}
              placeholder="08:00 PM"
              helperText="Time when farm dispatch closes."
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-sm font-semibold text-forest-950">Store Open Status</p>
                <p className="text-xs text-earth-600">Toggle whether the online store is actively receiving orders or taking a seasonal break.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_store_open ?? true}
                  onChange={(e) => handleChange('is_store_open', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-earth-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-sm font-semibold text-forest-950">Enable Online Customer Orders</p>
                <p className="text-xs text-earth-600">Permit checkout and order placement on the storefront.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_online_orders ?? true}
                  onChange={(e) => handleChange('enable_online_orders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-earth-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-sm font-semibold text-forest-950">Enable Customer Self-Registration</p>
                <p className="text-xs text-earth-600">Allow new visitors to register their own customer accounts.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_customer_registration ?? true}
                  onChange={(e) => handleChange('enable_customer_registration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-earth-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResetSection(['currency', 'currency_code', 'store_open_time', 'store_close_time', 'is_store_open', 'enable_customer_registration', 'enable_online_orders'])}
              className="text-earth-600 border-earth-300"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSection === 'Store Settings'}
              onClick={() => handleSave('Store Settings', {
                currency: formData.currency,
                currency_code: formData.currency_code,
                store_open_time: formData.store_open_time,
                store_close_time: formData.store_close_time,
                is_store_open: formData.is_store_open,
                enable_customer_registration: formData.enable_customer_registration,
                enable_online_orders: formData.enable_online_orders,
              })}
              className="bg-forest-700 hover:bg-forest-800 text-white min-w-[130px]"
            >
              {savingSection === 'Store Settings' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 5. PRODUCT & INVENTORY SETTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                5. Product & Inventory Defaults
              </h3>
              <p className="text-xs text-earth-500">Low stock alert thresholds, default availability, and category shortcuts</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-forest-100 text-forest-800">
            Catalog & Stock
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Low Stock Alert Threshold (Units)"
              type="number"
              min="1"
              value={formData.low_stock_threshold ?? 5}
              onChange={(e) => handleChange('low_stock_threshold', Number(e.target.value))}
              helperText="Items with inventory at or below this count will trigger admin low-stock warnings."
            />
            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-earth-200">
                <div>
                  <p className="text-xs font-semibold text-forest-950">Default New Product Availability</p>
                  <p className="text-[11px] text-earth-500">Auto-mark newly created items as in stock</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.default_product_availability ?? true}
                    onChange={(e) => handleChange('default_product_availability', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-earth-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Category Shortcuts */}
          <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-200/80">
            <p className="text-xs font-semibold text-forest-900 mb-2">Manage Store Categories:</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-forest-200 text-xs font-medium text-forest-800">
                🐔 Cocks & Chickens (Poultry)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-forest-200 text-xs font-medium text-forest-800">
                🐃 Buffaloes & Livestock
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-forest-200 text-xs font-medium text-forest-800">
                🥛 Fresh Milk & Dairy
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-forest-200 text-xs font-medium text-forest-800">
                🌾 Farming Goods
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResetSection(['low_stock_threshold', 'default_product_availability'])}
              className="text-earth-600 border-earth-300"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSection === 'Product Settings'}
              onClick={() => handleSave('Product Settings', {
                low_stock_threshold: formData.low_stock_threshold,
                default_product_availability: formData.default_product_availability,
              })}
              className="bg-forest-700 hover:bg-forest-800 text-white min-w-[130px]"
            >
              {savingSection === 'Product Settings' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 6. NOTIFICATION PREFERENCES */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                6. Admin Notification Preferences
              </h3>
              <p className="text-xs text-earth-500">Alert triggers for incoming customer orders, enquiries, and inventory levels</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-forest-100 text-forest-800">
            Alerts
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-xs font-semibold text-forest-950">New Order Notifications</p>
                <p className="text-[11px] text-earth-500">Notify admin when a customer submits an order</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notify_new_orders ?? true}
                onChange={(e) => handleChange('notify_new_orders', e.target.checked)}
                className="w-4 h-4 text-forest-700 rounded border-earth-300 focus:ring-forest-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-xs font-semibold text-forest-950">Customer Registration Alerts</p>
                <p className="text-[11px] text-earth-500">Notify admin when a new user signs up</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notify_new_customers ?? true}
                onChange={(e) => handleChange('notify_new_customers', e.target.checked)}
                className="w-4 h-4 text-forest-700 rounded border-earth-300 focus:ring-forest-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-xs font-semibold text-forest-950">New Enquiry Alerts</p>
                <p className="text-[11px] text-earth-500">Notify admin upon livestock contact queries</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notify_new_enquiries ?? true}
                onChange={(e) => handleChange('notify_new_enquiries', e.target.checked)}
                className="w-4 h-4 text-forest-700 rounded border-earth-300 focus:ring-forest-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream-50 border border-earth-200">
              <div>
                <p className="text-xs font-semibold text-forest-950">Low Stock Warnings</p>
                <p className="text-[11px] text-earth-500">Notify admin when stock hits threshold</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notify_low_stock ?? true}
                onChange={(e) => handleChange('notify_low_stock', e.target.checked)}
                className="w-4 h-4 text-forest-700 rounded border-earth-300 focus:ring-forest-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Notification Email Destination"
              value={formData.notification_email || ''}
              onChange={(e) => handleChange('notification_email', e.target.value)}
              placeholder="nagavenkateswararao2006@gmail.com"
              helperText="Destination email address for system alerts."
            />
            <Input
              label="Notification WhatsApp Number"
              value={formData.notification_whatsapp || ''}
              onChange={(e) => handleChange('notification_whatsapp', e.target.value)}
              placeholder="919392629819"
              helperText="WhatsApp number for instant notifications."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResetSection(['notify_new_orders', 'notify_new_customers', 'notify_new_enquiries', 'notify_low_stock', 'notification_email', 'notification_whatsapp'])}
              className="text-earth-600 border-earth-300"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSection === 'Notification Settings'}
              onClick={() => handleSave('Notification Settings', {
                notify_new_orders: formData.notify_new_orders,
                notify_new_customers: formData.notify_new_customers,
                notify_new_enquiries: formData.notify_new_enquiries,
                notify_low_stock: formData.notify_low_stock,
                notification_email: formData.notification_email,
                notification_whatsapp: formData.notification_whatsapp,
              })}
              className="bg-forest-700 hover:bg-forest-800 text-white min-w-[130px]"
            >
              {savingSection === 'Notification Settings' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 7. ADMIN ACCOUNT SETTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-earth-200/80 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-forest-50/60 via-cream-50/40 to-white border-b border-earth-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-forest-950" style={{ fontFamily: 'var(--font-heading)' }}>
                7. Admin Account & Security
              </h3>
              <p className="text-xs text-earth-500">Your administrator identity credentials and account security controls</p>
            </div>
          </div>
          <Badge className="bg-forest-800 text-white text-xs px-2.5 py-1">
            Super Administrator
          </Badge>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Identity Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-cream-50/80 border border-earth-200">
              <p className="text-xs text-earth-500 font-medium">Admin Full Name</p>
              <p className="text-sm font-bold text-forest-950 mt-1">
                {profile?.full_name || user?.user_metadata?.full_name || 'Nagavenkateswararao'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-cream-50/80 border border-earth-200">
              <p className="text-xs text-earth-500 font-medium">Admin Login Email</p>
              <p className="text-sm font-bold text-forest-950 mt-1 break-all">
                {user?.email || 'nagavenkateswararao2006@gmail.com'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-cream-50/80 border border-earth-200">
              <p className="text-xs text-earth-500 font-medium">Access Permission Role</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-forest-900 capitalize">{profile?.role || 'admin'}</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="p-5 rounded-2xl bg-forest-50/50 border border-forest-100">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-forest-700" />
              <h4 className="text-sm font-bold text-forest-950">Update Administrator Password</h4>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-earth-400 hover:text-earth-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-earth-500">
                  Password changes take effect immediately on your Supabase session.
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={passwordLoading || !newPassword}
                  className="bg-forest-700 hover:bg-forest-800 text-white min-w-[140px]"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Logout Action */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/60 border border-red-100">
            <div>
              <p className="text-sm font-semibold text-red-950">Sign Out of Admin Dashboard</p>
              <p className="text-xs text-red-700 mt-0.5">End your current administrator session on this device.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="border-red-300 text-red-700 hover:bg-red-100/60 hover:text-red-900"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


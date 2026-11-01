import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSiteSettings, adminUpdateSiteSettings } from '@/services/api';
import { siteConfig } from '@/config/site';
import type { SiteSettings } from '@/types';

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  refetchSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: dbSettings, isLoading, refetch } = useQuery({
    queryKey: ['site_settings'],
    queryFn: fetchSiteSettings,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  const settings: SiteSettings = useMemo(() => {
    return {
      id: dbSettings?.id || 'default',
      // Business Profile
      business_name: dbSettings?.business_name || siteConfig.businessName,
      logo_url: dbSettings?.logo_url || null,
      tagline: dbSettings?.tagline || siteConfig.tagline,
      description: dbSettings?.description || siteConfig.description,
      about_content: dbSettings?.about_content || siteConfig.description,
      email: dbSettings?.email || siteConfig.email,
      phone: dbSettings?.phone || siteConfig.phone,
      whatsapp_number: dbSettings?.whatsapp_number || siteConfig.whatsappNumber,
      banner_image_url: dbSettings?.banner_image_url || null,
      announcement: dbSettings?.announcement || null,

      // Address Settings
      address: dbSettings?.address || siteConfig.address,
      village: dbSettings?.village || '',
      street_address: dbSettings?.street_address || '',
      district: dbSettings?.district || '',
      state: dbSettings?.state || 'Andhra Pradesh',
      country: dbSettings?.country || 'India',
      pincode: dbSettings?.pincode || '',
      google_maps_link: dbSettings?.google_maps_link || '',

      // Delivery Settings
      enable_home_delivery: dbSettings?.enable_home_delivery ?? true,
      delivery_charge: Number(dbSettings?.delivery_charge ?? siteConfig.deliveryCharge),
      free_delivery_above: Number(dbSettings?.free_delivery_above ?? siteConfig.freeDeliveryAbove),
      delivery_locations: dbSettings?.delivery_locations || 'Local delivery within 15km radius',
      estimated_delivery_time: dbSettings?.estimated_delivery_time || 'Same-day delivery (within 3-5 hours)',
      delivery_information: dbSettings?.delivery_information || 'We deliver dairy products locally within 10km radius. Livestock pickup from farm location.',

      // Store Settings
      currency: dbSettings?.currency || siteConfig.currency,
      currency_code: dbSettings?.currency_code || siteConfig.currencyCode,
      store_open_time: dbSettings?.store_open_time || '06:00 AM',
      store_close_time: dbSettings?.store_close_time || '08:00 PM',
      is_store_open: dbSettings?.is_store_open ?? true,
      enable_customer_registration: dbSettings?.enable_customer_registration ?? true,
      enable_online_orders: dbSettings?.enable_online_orders ?? true,

      // Product Settings
      enable_product_availability: dbSettings?.enable_product_availability ?? true,
      low_stock_threshold: Number(dbSettings?.low_stock_threshold ?? 5),
      default_product_availability: dbSettings?.default_product_availability ?? true,

      // Notification Preferences
      notify_new_orders: dbSettings?.notify_new_orders ?? true,
      notify_new_customers: dbSettings?.notify_new_customers ?? true,
      notify_new_enquiries: dbSettings?.notify_new_enquiries ?? true,
      notify_low_stock: dbSettings?.notify_low_stock ?? true,
      notification_email: dbSettings?.notification_email || dbSettings?.email || siteConfig.email,
      notification_whatsapp: dbSettings?.notification_whatsapp || dbSettings?.whatsapp_number || siteConfig.whatsappNumber,

      extra_settings: dbSettings?.extra_settings || {},
      updated_at: dbSettings?.updated_at || new Date().toISOString(),
    };
  }, [dbSettings]);

  const updateMutation = useMutation({
    mutationFn: adminUpdateSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
  });

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    await updateMutation.mutateAsync(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings, refetchSettings: refetch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SettingsProvider');
  }
  return context;
}


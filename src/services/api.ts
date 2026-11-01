import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';
import type { Product, Category, Order, Enquiry, Review, SiteSettings, EnquiryFormData, CheckoutFormData, CartItem, StockLog, CustomerProfile, ProductVideo } from '@/types';


// ============================================================
// No demo data — all data is fetched from Supabase
// ============================================================

// ============================================================
// API Functions
// ============================================================

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function fetchProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  search?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  includeSold?: boolean;
}): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      livestock_details(*),
      product_images(*)
    `)
    .eq('is_active', true);

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (options?.featured) query = query.eq('is_featured', true);
  if (options?.search) query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);

  if (options?.sortBy === 'price_asc') query = query.order('price', { ascending: true });
  else if (options?.sortBy === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 12) - 1);

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  // Safely attach product videos if table exists
  try {
    const { data: allVideos } = await supabase
      .from('product_videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (allVideos && allVideos.length > 0) {
      const videosByProduct: Record<string, ProductVideo[]> = {};
      for (const v of allVideos) {
        if (!videosByProduct[v.product_id]) videosByProduct[v.product_id] = [];
        videosByProduct[v.product_id].push(v);
      }
      for (const prod of data) {
        prod.product_videos = videosByProduct[prod.id] || [];
      }
    } else {
      for (const prod of data) {
        prod.product_videos = [];
      }
    }
  } catch {
    for (const prod of data) {
      prod.product_videos = [];
    }
  }

  // Filter sold items from customer-facing listings unless requested
  const visibleProducts = data.filter((p) => {
    if (options?.includeSold) return true;
    if (p.availability_status === 'sold') return false;
    if (p.product_type === 'livestock' && p.stock_quantity <= 0) return false;
    return true;
  });

  return visibleProducts;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      livestock_details(*),
      product_images(*)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
  if (!data) return null;

  // Safely fetch product videos
  try {
    const { data: videos } = await supabase
      .from('product_videos')
      .select('*')
      .eq('product_id', data.id)
      .order('display_order', { ascending: true });
    data.product_videos = videos || [];
  } catch {
    data.product_videos = [];
  }

  return data;
}

const fallbackSettings: SiteSettings = {
  id: '1',
  business_name: 'venkat_farms_ceo',
  logo_url: null,
  phone: '+91 9392629819',
  whatsapp_number: '919392629819',
  email: 'nagavenkateswararao2006@gmail.com',
  address: 'Village Road, District Name, State, India',
  tagline: 'From Our Farm to Your Home',
  description: 'Quality livestock, fresh dairy, and essential farming goods — all in one place.',
  about_content: 'GreenField Farms is dedicated to raising pure-breed healthy livestock, producing farm-fresh organic dairy, and providing dependable farming goods directly from our pastures to your family and farm.',
  banner_image_url: null,
  announcement: null,
  village: 'Village Road',
  street_address: 'Main Farm Road',
  district: 'District Name',
  state: 'Andhra Pradesh',
  country: 'India',
  pincode: '520001',
  google_maps_link: '',
  enable_home_delivery: true,
  delivery_charge: 50,
  free_delivery_above: 500,
  delivery_locations: 'Local delivery within 15km radius',
  estimated_delivery_time: 'Same-day delivery (within 3-5 hours)',
  delivery_information: 'We deliver dairy products locally within 10km radius. Livestock pickup from farm location.',
  currency: '₹',
  currency_code: 'INR',
  store_open_time: '06:00 AM',
  store_close_time: '08:00 PM',
  is_store_open: true,
  enable_customer_registration: true,
  enable_online_orders: true,
  enable_product_availability: true,
  low_stock_threshold: 5,
  default_product_availability: true,
  notify_new_orders: true,
  notify_new_customers: true,
  notify_new_enquiries: true,
  notify_low_stock: true,
  notification_email: 'nagavenkateswararao2006@gmail.com',
  notification_whatsapp: '9392629819',
  extra_settings: {},
  updated_at: new Date().toISOString(),
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return fallbackSettings;

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) return fallbackSettings;
    const extra = data.extra_settings || {};
    return {
      ...fallbackSettings,
      ...extra,
      ...data,
    };
  } catch {
    return fallbackSettings;
  }
}

export async function fetchReviews(productId?: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('reviews')
    .select('*, profile:profiles(full_name)')
    .order('created_at', { ascending: false });

  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query.limit(10);
  if (error) throw error;
  return data || [];
}

export async function createOrder(
  formData: CheckoutFormData,
  items: CartItem[]
): Promise<Order> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set up your environment variables to enable ordering.');
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = formData.delivery_type === 'delivery' ? (subtotal >= 500 ? 0 : 50) : 0;
  const totalAmount = subtotal + deliveryCharge;

  const { data: { user } } = await supabase.auth.getUser();

  const formattedItems = items.map((item) => ({
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.price,
    line_total: item.product.price * item.quantity,
  }));

  // 1. Attempt atomic database-level validation & placement via PostgreSQL RPC function
  try {
    const { data: rpcRes, error: rpcError } = await supabase.rpc('place_order_with_inventory_check', {
      p_user_id: user?.id || null,
      p_customer_name: formData.customer_name,
      p_phone: formData.phone,
      p_email: formData.email || null,
      p_delivery_address: formData.delivery_address,
      p_city: formData.city,
      p_state: formData.state,
      p_pincode: formData.pincode,
      p_order_notes: formData.order_notes || null,
      p_delivery_type: formData.delivery_type,
      p_payment_method: formData.payment_method,
      p_subtotal: subtotal,
      p_delivery_charge: deliveryCharge,
      p_total_amount: totalAmount,
      p_items: formattedItems,
    });

    if (rpcError) {
      const msg = rpcError.message || '';
      // If it's a stock or availability rejection, throw it directly to alert the user
      if (
        msg.toLowerCase().includes('sold') ||
        msg.toLowerCase().includes('stock') ||
        msg.toLowerCase().includes('not available') ||
        msg.toLowerCase().includes('insufficient')
      ) {
        throw new Error(msg);
      }
      console.warn('RPC place_order_with_inventory_check error, checking fallback:', msg);
      throw rpcError;
    }

    if (rpcRes && rpcRes.order_id) {
      // Fetch the created order with order_items
      const { data: createdOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', rpcRes.order_id)
        .single();

      if (createdOrder) return createdOrder;
      return { id: rpcRes.order_id } as any;
    }
  } catch (err: any) {
    const errMsg = err.message || '';
    if (
      errMsg.toLowerCase().includes('sold') ||
      errMsg.toLowerCase().includes('stock') ||
      errMsg.toLowerCase().includes('not available') ||
      errMsg.toLowerCase().includes('insufficient')
    ) {
      throw err;
    }
    console.warn('Proceeding with fallback order insertion:', errMsg);
  }

  // 2. Fallback: Pre-flight stock check + order placement + inventory deduction
  const stockCheck = await validateCartStock(items);
  if (!stockCheck.valid) {
    throw new Error(stockCheck.unavailable.join(', '));
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id || null,
      customer_name: formData.customer_name,
      phone: formData.phone,
      email: formData.email || null,
      delivery_address: formData.delivery_address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      order_notes: formData.order_notes || null,
      delivery_type: formData.delivery_type,
      subtotal,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      order_status: 'pending',
      payment_status: 'pending',
      payment_method: formData.payment_method,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.price,
    line_total: item.product.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Deduct inventory and update status
  for (const item of items) {
    try {
      const { data: curr } = await supabase
        .from('products')
        .select('stock_quantity, product_type')
        .eq('id', item.product.id)
        .single();

      if (curr) {
        const newStock = Math.max(0, curr.stock_quantity - item.quantity);
        const isLivestock = curr.product_type === 'livestock';
        const isSold = isLivestock && newStock <= 0;
        const isOut = !isLivestock && newStock <= 0;

        await supabase
          .from('products')
          .update({
            stock_quantity: newStock,
            is_available: newStock > 0,
            availability_status: isSold ? 'sold' : isOut ? 'out_of_stock' : 'available',
            ...(isSold ? { sold_at: new Date().toISOString() } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.product.id);
      }
    } catch (e) {
      console.warn('Inventory decrement fallback notice:', e);
    }
  }

  return order;
}

export async function createEnquiry(data: EnquiryFormData): Promise<Enquiry> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set up your environment variables to enable enquiries.');
  }

  const row = {
    customer_name: (data.customer_name || '').trim(),
    phone: (data.phone || '').trim(),
    email: data.email?.trim() || null,
    product_id: data.product_id || null,
    message: (data.message || '').trim(),
    status: 'pending' as const,
  };

  // Insert enquiry without chaining .select().single()
  // Because public/customer users are allowed to INSERT but not SELECT (RLS policy)
  const { error } = await supabase
    .from('enquiries')
    .insert([row]);

  if (error) {
    console.error('Failed to save enquiry in Supabase:', error);
    throw error;
  }

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'enq_' + Date.now(),
    ...row,
    created_at: new Date().toISOString(),
  } as Enquiry;
}

export async function fetchOrders(userId?: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function submitReview(productId: string, rating: number, comment: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to submit a review.');

  const { error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      product_id: productId,
      rating,
      comment,
    });

  if (error) throw error;
}

// ============================================================
// Admin API Functions
// ============================================================

export type AdminProductFilter = 'all' | 'available' | 'sold' | 'out_of_stock' | 'low_stock' | 'active' | 'inactive';

export async function adminFetchProducts(filter: AdminProductFilter = 'all'): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      livestock_details(*),
      product_images(*)
    `);

  if (filter === 'active') query = query.eq('is_active', true);
  else if (filter === 'inactive') query = query.eq('is_active', false);
  // 'all' — no filter

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  // Safely attach product videos if table exists
  try {
    const { data: allVideos } = await supabase
      .from('product_videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (allVideos && allVideos.length > 0) {
      const videosByProduct: Record<string, ProductVideo[]> = {};
      for (const v of allVideos) {
        if (!videosByProduct[v.product_id]) videosByProduct[v.product_id] = [];
        videosByProduct[v.product_id].push(v);
      }
      for (const prod of data) {
        prod.product_videos = videosByProduct[prod.id] || [];
      }
    } else {
      for (const prod of data) {
        prod.product_videos = [];
      }
    }
  } catch {
    for (const prod of data) {
      prod.product_videos = [];
    }
  }

  // Filter based on inventory status
  if (filter === 'available') {
    return data.filter(p => p.is_active && p.stock_quantity > 0 && p.availability_status !== 'sold');
  }
  if (filter === 'sold') {
    return data.filter(p => p.availability_status === 'sold' || (p.product_type === 'livestock' && p.stock_quantity <= 0));
  }
  if (filter === 'out_of_stock') {
    return data.filter(p => p.stock_quantity <= 0 && p.availability_status !== 'sold' && p.product_type !== 'livestock');
  }
  if (filter === 'low_stock') {
    return data.filter(p => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= 5);
  }

  return data;
}

export async function adminCreateProduct(productData: any): Promise<Product> {
  const { livestock_details, ...product } = productData;

  // 1. Generate clean base slug
  let baseSlug = (product.slug || generateSlug(product.name || 'product'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!baseSlug) baseSlug = 'product';

  // 2. Ensure slug is unique against existing records in products table
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', uniqueSlug)
      .maybeSingle();

    if (!existing) {
      break;
    }

    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
    if (counter > 25) {
      uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      break;
    }
  }

  product.slug = uniqueSlug;

  let insertRes = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  // If a race condition still hit the unique constraint, retry once with timestamp suffix
  if (insertRes.error && insertRes.error.message?.includes('products_slug_key')) {
    product.slug = `${baseSlug}-${Date.now().toString(36)}`;
    insertRes = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
  }

  if (insertRes.error) throw insertRes.error;
  const data = insertRes.data;

  if (livestock_details && (product.product_type === 'livestock')) {
    const { error: ldError } = await supabase
      .from('livestock_details')
      .insert({ ...livestock_details, product_id: data.id });
    if (ldError) console.error('Livestock details error:', ldError);
  }

  return data;
}

export async function adminUpdateProduct(id: string, productData: any): Promise<Product> {
  const { livestock_details, ...product } = productData;

  // Ensure slug uniqueness on update
  if (product.slug) {
    let baseSlug = product.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', uniqueSlug)
        .neq('id', id)
        .maybeSingle();

      if (!existing) break;

      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
      if (counter > 25) {
        uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        break;
      }
    }
    product.slug = uniqueSlug;
  }

  const { data, error } = await supabase
    .from('products')
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (livestock_details) {
    const { error: ldError } = await supabase
      .from('livestock_details')
      .upsert({ ...livestock_details, product_id: id }, { onConflict: 'product_id' });
    if (ldError) console.error('Livestock details update error:', ldError);
  }

  return data;
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function adminPermanentlyDeleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to permanently delete product:', error);
    throw error;
  }
}

export async function adminPurgeDemoProducts(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  // 1. Fetch all products whose name starts with [Demo] or Demo or sample slug/description
  const { data, error: fetchErr } = await supabase
    .from('products')
    .select('id, name')
    .or('name.ilike.[Demo]%,name.ilike.Demo%,description.ilike.Sample%');

  if (fetchErr) {
    console.error('Failed to query demo products:', fetchErr);
    throw fetchErr;
  }

  if (!data || data.length === 0) return 0;

  const ids = data.map((p) => p.id);
  const { error: delErr } = await supabase
    .from('products')
    .delete()
    .in('id', ids);

  if (delErr) {
    console.error('Failed to purge demo products:', delErr);
    throw delErr;
  }

  return ids.length;
}

export async function adminFetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function adminUpdateOrderStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', id);

  if (error) throw error;
}

export async function adminUpdatePaymentStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: status })
    .eq('id', id);

  if (error) throw error;
}

export async function adminFetchEnquiries(): Promise<Enquiry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('enquiries')
    .select('*, product:products(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function adminUpdateEnquiryStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('enquiries')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function adminDeleteEnquiry(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from('enquiries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete enquiry from Supabase:', error);
    throw error;
  }
}

export async function uploadSiteLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `branding/logo_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function adminUpdateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { data: existing } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  const now = new Date().toISOString();
  const payload: Record<string, any> = { ...settings, updated_at: now };
  delete payload.id;

  // Try saving all columns directly
  let opError: any = null;
  if (existing?.id) {
    const { error } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', existing.id);
    opError = error;
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert(payload);
    opError = error;
  }

  // If a column is missing from remote DB (e.g., migration not executed yet), fallback safely:
  if (opError) {
    console.warn('Direct column update failed, applying resilient fallback:', opError.message);
    const coreKeys = [
      'business_name', 'logo_url', 'phone', 'whatsapp_number',
      'email', 'address', 'delivery_information', 'banner_image_url',
      'about_content', 'announcement', 'updated_at'
    ];

    const corePayload: Record<string, any> = {};
    const extraPayload: Record<string, any> = { ...(existing?.extra_settings || {}) };

    for (const [key, value] of Object.entries(payload)) {
      if (coreKeys.includes(key)) {
        corePayload[key] = value;
      } else {
        extraPayload[key] = value;
      }
    }
    corePayload.extra_settings = extraPayload;

    if (existing?.id) {
      const fallbackRes = await supabase
        .from('site_settings')
        .update(corePayload)
        .eq('id', existing.id);

      if (fallbackRes.error) {
        // Ultimate fallback: update just core columns without extra_settings
        delete corePayload.extra_settings;
        const minimalRes = await supabase
          .from('site_settings')
          .update(corePayload)
          .eq('id', existing.id);
        if (minimalRes.error) throw minimalRes.error;
      }
    } else {
      const fallbackInsert = await supabase
        .from('site_settings')
        .insert(corePayload);
      if (fallbackInsert.error) throw fallbackInsert.error;
    }
  }
}

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function adminGetDashboardStats() {
  if (!isSupabaseConfigured()) {
    return {
      totalProducts: 0,
      totalLivestock: 0,
      totalBuffaloes: 0,
      totalChickens: 0,
      totalMilk: 0,
      totalFarmingGoods: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      totalEnquiries: 0,
      newEnquiries: 0,
      lowStockProducts: 0,
      recentOrders: [] as Order[],
      recentEnquiries: [] as Enquiry[],
      recentProducts: [] as Product[],
      lowStockList: [] as Product[],
    };
  }

  const [productsRes, ordersRes, enquiriesRes, profilesRes, recentOrdersRes, recentEnquiriesRes, recentProductsRes] = await Promise.all([
    supabase.from('products').select('*, category:categories(slug, name)').order('created_at', { ascending: false }),
    supabase.from('orders').select('id, total_amount, order_status, created_at'),
    supabase.from('enquiries').select('id, status, created_at'),
    supabase.from('profiles').select('id, role', { count: 'exact' }).eq('role', 'customer'),
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(5),
    supabase.from('enquiries').select('*, product:products(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('*, category:categories(*), product_images(*)').order('created_at', { ascending: false }).limit(5),
  ]);

  const allProducts = (productsRes.data as Product[]) || [];
  const activeProducts = allProducts.filter(p => p.is_active);
  const allOrders = ordersRes.data || [];
  const allEnquiries = enquiriesRes.data || [];

  const totalRevenue = allOrders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const totalLivestock = activeProducts.filter(p => p.product_type === 'livestock').length;
  
  const totalBuffaloes = activeProducts.filter(p => 
    p.product_type === 'livestock' && 
    (p.category?.slug === 'buffaloes-livestock' || p.name.toLowerCase().includes('buffalo') || p.description?.toLowerCase().includes('buffalo'))
  ).length;

  const totalChickens = activeProducts.filter(p => 
    p.product_type === 'livestock' && 
    (p.category?.slug === 'cocks-chickens' || p.name.toLowerCase().includes('cock') || p.name.toLowerCase().includes('chicken') || p.name.toLowerCase().includes('rooster'))
  ).length;

  const totalMilk = activeProducts.filter(p => p.product_type === 'dairy').length;
  const totalFarmingGoods = activeProducts.filter(p => p.product_type === 'farming_goods').length;

  const lowStockList = activeProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);
  const availableProducts = activeProducts.filter(p => p.stock_quantity > 0 && p.availability_status !== 'sold').length;
  const soldProducts = allProducts.filter(p => p.availability_status === 'sold' || (p.product_type === 'livestock' && p.stock_quantity === 0)).length;
  const outOfStockProducts = activeProducts.filter(p => p.stock_quantity === 0 && p.availability_status !== 'sold' && p.product_type !== 'livestock').length;

  return {
    totalProducts: allProducts.length,
    availableProducts,
    soldProducts,
    outOfStockProducts,
    totalLivestock,
    totalBuffaloes,
    totalChickens,
    totalMilk,
    totalFarmingGoods,
    totalOrders: allOrders.length,
    pendingOrders: allOrders.filter(o => o.order_status === 'pending').length,
    totalCustomers: profilesRes.count || 0,
    totalRevenue,
    totalEnquiries: allEnquiries.length,
    newEnquiries: allEnquiries.filter(e => e.status === 'new' || e.status === 'pending').length,
    lowStockProducts: lowStockList.length,
    recentOrders: (recentOrdersRes.data as Order[]) || [],
    recentEnquiries: (recentEnquiriesRes.data as Enquiry[]) || [],
    recentProducts: (recentProductsRes.data as Product[]) || [],
    lowStockList,
  };
}

export async function adminQuickUpdateStock(productId: string, newStock: number, reason: string = 'manual_adjustment'): Promise<void> {
  const { data: current } = await supabase.from('products').select('stock_quantity, product_type').eq('id', productId).single();
  const prevStock = current?.stock_quantity ?? 0;
  const isLivestock = current?.product_type === 'livestock';
  const isSold = isLivestock && newStock <= 0;
  const isOut = !isLivestock && newStock <= 0;
  const availStatus = isSold ? 'sold' : isOut ? 'out_of_stock' : 'available';

  const { error } = await supabase
    .from('products')
    .update({
      stock_quantity: newStock,
      is_available: newStock > 0,
      availability_status: availStatus,
      sold_at: isSold ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) throw error;

  try {
    await supabase.from('stock_logs').insert({
      product_id: productId,
      change_amount: newStock - prevStock,
      previous_stock: prevStock,
      new_stock: newStock,
      reason,
    });
  } catch {
    // Ignore if stock_logs table is not yet created
  }
}

export async function adminRestoreProductStock(productId: string, newStock: number = 1): Promise<void> {
  // 1. Try atomic RPC first
  try {
    const { error: rpcError } = await supabase.rpc('admin_restore_product_stock', {
      p_product_id: productId,
      p_new_stock: newStock,
    });
    if (!rpcError) return;
  } catch {}

  // 2. Fallback direct update
  await adminQuickUpdateStock(productId, newStock, 'admin_restore');
}

export async function adminQuickUpdatePrice(productId: string, newPrice: number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ price: newPrice, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;
}

export async function adminToggleFeatured(productId: string, isFeatured: boolean): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;
}

export async function adminHardDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function adminFetchCustomers(): Promise<CustomerProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: orders } = await supabase
    .from('orders')
    .select('id, user_id, customer_name, phone, email, total_amount, order_status, created_at');

  return (profiles || []).map((p: any) => {
    const userOrders = (orders || []).filter((o: any) => o.user_id === p.id || (o.phone && p.phone && o.phone === p.phone));
    const totalSpent = userOrders
      .filter((o: any) => o.order_status !== 'cancelled')
      .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

    return {
      ...p,
      total_orders: userOrders.length,
      total_spent: totalSpent,
      orders: userOrders,
    };
  });
}

export async function adminFetchStockLogs(): Promise<StockLog[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('stock_logs')
      .select('*, product:products(name, slug, product_type)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function adminFetchAllReviews(): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(full_name), product:products(name, slug)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function adminDeleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function adminSaveProductImage(
  productId: string,
  imageUrl: string,
  altText: string,
  displayOrder: number
): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: imageUrl,
      alt_text: altText,
      display_order: displayOrder,
    });

  if (error) throw error;
}

export async function adminDeleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

export async function adminReactivateProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function validateCartStock(
  items: CartItem[]
): Promise<{ valid: boolean; unavailable: string[] }> {
  if (!isSupabaseConfigured()) {
    return { valid: true, unavailable: [] };
  }

  const productIds = items.map(item => item.product.id);
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock_quantity, is_active, product_type, availability_status')
    .in('id', productIds);

  if (error) throw error;

  const unavailable: string[] = [];
  for (const item of items) {
    const dbProduct = products?.find(p => p.id === item.product.id);
    if (!dbProduct || !dbProduct.is_active) {
      unavailable.push(`${item.product.name} is no longer available`);
    } else if (
      dbProduct.availability_status === 'sold' ||
      (dbProduct.product_type === 'livestock' && dbProduct.stock_quantity <= 0)
    ) {
      unavailable.push(`Livestock "${item.product.name}" has already been sold and is no longer available`);
    } else if (dbProduct.stock_quantity < item.quantity) {
      if (dbProduct.stock_quantity === 0) {
        unavailable.push(`${item.product.name} is out of stock`);
      } else {
        unavailable.push(`${item.product.name}: only ${dbProduct.stock_quantity} available (you have ${item.quantity})`);
      }
    }
  }

  return { valid: unavailable.length === 0, unavailable };
}

// ============================================================
// Product Videos API Functions
// ============================================================

export async function uploadProductVideo(
  file: File,
  productId: string
): Promise<{ videoUrl: string; fileName: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const fileExt = file.name.split('.').pop() || 'mp4';
  const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${productId}/${Date.now()}_${cleanBase}.${fileExt}`;

  // Try uploading to 'product-videos' bucket first
  let targetBucket = 'product-videos';
  let uploadPath = fileName;
  let { error: uploadError } = await supabase.storage
    .from(targetBucket)
    .upload(uploadPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'video/mp4',
    });

  // If 'product-videos' bucket does not exist, gracefully fallback to 'product-images' under 'videos/'
  if (uploadError && (uploadError.message?.toLowerCase().includes('bucket not found') || (uploadError as any).statusCode === '404')) {
    console.warn("Storage bucket 'product-videos' not found, falling back to 'product-images/videos/'");
    targetBucket = 'product-images';
    uploadPath = `videos/${fileName}`;
    const fallbackRes = await supabase.storage
      .from(targetBucket)
      .upload(uploadPath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'video/mp4',
      });
    uploadError = fallbackRes.error;
  }

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(uploadPath);

  return { videoUrl: data.publicUrl, fileName: file.name };
}

export async function adminSaveProductVideo(
  productId: string,
  videoUrl: string,
  title?: string,
  fileName?: string,
  displayOrder: number = 0,
  thumbnailUrl?: string | null
): Promise<ProductVideo | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('product_videos')
      .insert({
        product_id: productId,
        video_url: videoUrl,
        title: title || fileName || 'Product Video',
        file_name: fileName || 'video.mp4',
        display_order: displayOrder,
        thumbnail_url: thumbnailUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.warn('Could not insert into product_videos table:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('adminSaveProductVideo error:', err);
    return null;
  }
}

export async function adminDeleteProductVideo(videoId: string, videoUrl?: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('product_videos')
    .delete()
    .eq('id', videoId);

  if (error) throw error;

  // Attempt to remove file from Supabase storage
  if (videoUrl) {
    try {
      if (videoUrl.includes('/product-videos/')) {
        const path = videoUrl.split('/product-videos/')[1]?.split('?')[0];
        if (path) await supabase.storage.from('product-videos').remove([decodeURIComponent(path)]);
      } else if (videoUrl.includes('/product-images/')) {
        const path = videoUrl.split('/product-images/')[1]?.split('?')[0];
        if (path) await supabase.storage.from('product-images').remove([decodeURIComponent(path)]);
      }
    } catch (e) {
      console.warn('Could not delete video file from storage:', e);
    }
  }
}

export async function adminUpdateProductVideo(
  videoId: string,
  updates: Partial<ProductVideo>
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('product_videos')
    .update(updates)
    .eq('id', videoId);

  if (error) throw error;
}

export async function fetchProductVideos(productId: string): Promise<ProductVideo[]> {
  if (!isSupabaseConfigured() || !productId) return [];

  try {
    const { data, error } = await supabase
      .from('product_videos')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

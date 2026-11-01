// ============================================================
// Database & Application Types for GreenField Farms
// ============================================================

export interface Profile {
  id: string;
  email?: string | null;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type AvailabilityStatus = 'available' | 'sold' | 'out_of_stock' | 'reserved';

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: 'livestock' | 'dairy' | 'farming_goods';
  price: number;
  stock_quantity: number;
  unit: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_available?: boolean;
  availability_status?: AvailabilityStatus;
  sold_at?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  livestock_details?: LivestockDetails;
  product_images?: ProductImage[];
  product_videos?: ProductVideo[];
  reviews?: Review[];
}

export interface LivestockDetails {
  id: string;
  product_id: string;
  breed: string | null;
  age: string | null;
  gender: 'male' | 'female' | null;
  weight: string | null;
  location: string | null;
  health_information: string | null;
  vaccination_information: string | null;
  milk_yield: string | null;
  lactation_information: string | null;
  listing_type: 'direct' | 'enquiry';
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  video_url: string;
  thumbnail_url?: string | null;
  title?: string | null;
  file_name?: string | null;
  display_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  delivery_address: string;
  city: string;
  state: string;
  pincode: string;
  order_notes: string | null;
  delivery_type: 'delivery' | 'pickup';
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  order_status: 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cod' | 'online' | 'bank_transfer';
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Enquiry {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  product_id: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'resolved' | 'pending' | 'contacted';
  created_at: string;
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface SiteSettings {
  id: string;
  // 1. Business Profile Settings
  business_name: string;
  logo_url: string | null;
  tagline?: string | null;
  description?: string | null;
  about_content?: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  banner_image_url?: string | null;
  announcement?: string | null;

  // 2. Address Settings
  address: string | null;
  village?: string | null;
  street_address?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  google_maps_link?: string | null;

  // 3. Delivery Settings
  enable_home_delivery?: boolean;
  delivery_charge?: number;
  free_delivery_above?: number;
  delivery_locations?: string | null;
  estimated_delivery_time?: string | null;
  delivery_information: string | null;

  // 4. Store Settings
  currency?: string;
  currency_code?: string;
  store_open_time?: string;
  store_close_time?: string;
  is_store_open?: boolean;
  enable_customer_registration?: boolean;
  enable_online_orders?: boolean;

  // 5. Product Settings
  enable_product_availability?: boolean;
  low_stock_threshold?: number;
  default_product_availability?: boolean;

  // 6. Notification Settings
  notify_new_orders?: boolean;
  notify_new_customers?: boolean;
  notify_new_enquiries?: boolean;
  notify_low_stock?: boolean;
  notification_email?: string | null;
  notification_whatsapp?: string | null;

  // Extra JSON store for flexible compatibility
  extra_settings?: Record<string, any>;
  updated_at: string;
}

export interface StockLog {
  id: string;
  product_id: string;
  change_amount: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
  product?: {
    name: string;
    slug: string;
    product_type: string;
  };
}

export interface CustomerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  role: string;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
  orders?: Order[];
}

// Cart types (client-side)
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
}

// Form types
export interface CheckoutFormData {
  customer_name: string;
  phone: string;
  email?: string;
  delivery_address: string;
  city: string;
  state: string;
  pincode: string;
  order_notes?: string;
  delivery_type: 'delivery' | 'pickup';
  payment_method: 'cod' | 'bank_transfer';
}

export interface EnquiryFormData {
  customer_name: string;
  phone: string;
  email?: string;
  message: string;
  product_id?: string;
}

export interface ProductFormData {
  name: string;
  category_id: string;
  description?: string;
  product_type: 'livestock' | 'dairy' | 'farming_goods';
  price: number;
  stock_quantity: number;
  unit?: string;
  is_active: boolean;
  is_featured: boolean;
  // Livestock fields
  breed?: string;
  age?: string;
  gender?: 'male' | 'female';
  weight?: string;
  location?: string;
  health_information?: string;
  vaccination_information?: string;
  milk_yield?: string;
  lactation_information?: string;
  listing_type?: 'direct' | 'enquiry';
}

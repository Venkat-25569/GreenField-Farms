import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, ShoppingCart, MessageCircle, MapPin,
  Heart, Share2, Star, Shield, Truck, ArrowLeft,
  Plus, Minus, Info, Edit, Trash2, Settings, ShieldCheck,
  RefreshCw, LayoutDashboard, Check, Image as ImageIcon, Film, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { ProductVideoPlayer } from '@/components/shared/ProductVideoPlayer';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProductBySlug, fetchReviews, adminQuickUpdateStock,
  adminDeleteProduct, adminReactivateProduct, adminRestoreProductStock,
} from '@/services/api';
import { formatPrice, getWhatsAppLink, getProductWhatsAppMessage } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [stockInput, setStockInput] = useState<number | ''>('');
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'videos'>('photos');
  const { addItem, isInCart } = useCart();
  const { isAdmin } = useAuth();
  const { settings } = useSiteSettings();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (product) {
      setStockInput(product.stock_quantity);
      const images = product.product_images?.filter(img => img.image_url) || [];
      const videos = product.product_videos || [];
      if (images.length === 0 && videos.length > 0) {
        setActiveMediaTab('videos');
      } else {
        setActiveMediaTab('photos');
      }
    }
  }, [product]);

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => fetchReviews(product?.id),
    enabled: !!product?.id,
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      adminQuickUpdateStock(id, stock, 'detail_page_adjustment'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Stock quantity updated');
    },
    onError: () => toast.error('Failed to update stock'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Product deactivated');
    },
    onError: () => toast.error('Failed to deactivate product'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminReactivateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Product reactivated');
    },
    onError: () => toast.error('Failed to reactivate product'),
  });

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h2 className="text-2xl font-semibold text-forest-800 mb-2">Product Not Found</h2>
        <p className="text-earth-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        {error && <p className="text-red-500 text-sm mb-4">Error: {(error as Error).message}</p>}
        <Link to="/shop"><Button>Back to Shop</Button></Link>
      </div>
    );
  }

  const isLivestock = product.product_type === 'livestock';
  const isEnquiryOnly = product.livestock_details?.listing_type === 'enquiry';
  const isSold = product.availability_status === 'sold' || (isLivestock && product.stock_quantity <= 0);
  const isOutOfStock = !isSold && (product.stock_quantity <= 0 || product.availability_status === 'out_of_stock');
  const inStock = product.stock_quantity > 0 && !isSold && !isOutOfStock && product.is_available !== false;
  const ld = product.livestock_details;
  const images = product.product_images?.filter(img => img.image_url) || [];
  const hasImages = images.length > 0;
  const videos = product.product_videos || [];
  const hasVideos = videos.length > 0;

  const productEmojis: Record<string, string> = {
    'livestock': '🐄',
    'dairy': '🥛',
    'farming_goods': '🌾',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-cream-50 py-4">
        <div className="container-custom flex items-center gap-2 text-sm text-earth-500">
          <Link to="/" className="hover:text-forest-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop" className="hover:text-forest-600 transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link to={`/category/${product.category.slug}`} className="hover:text-forest-600 transition-colors">
                {product.category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-forest-800 font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="container-custom py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Media Column (Photos / Videos) */}
          <div className="space-y-4">
            {hasVideos && (
              <div className="flex items-center gap-2 bg-cream-100/80 p-1.5 rounded-2xl w-fit border border-earth-200">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeMediaTab === 'photos'
                      ? 'bg-white text-forest-900 shadow-sm border border-earth-200/80'
                      : 'text-earth-600 hover:text-forest-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-forest-600" />
                  Photos ({images.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('videos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                    activeMediaTab === 'videos'
                      ? 'bg-white text-forest-900 shadow-sm border border-earth-200/80'
                      : 'text-earth-600 hover:text-forest-900'
                  }`}
                >
                  <Film className="w-4 h-4 text-harvest-600" />
                  Videos ({videos.length})
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-harvest-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-harvest-500"></span>
                  </span>
                </button>
              </div>
            )}

            {activeMediaTab === 'videos' && hasVideos ? (
              <ProductVideoPlayer videos={videos} productName={product.name} />
            ) : (
              <ImageGallery images={images} productName={product.name} productType={product.product_type} />
            )}

            {/* Quick Switch Callout when viewing Photos if Videos exist */}
            {hasVideos && activeMediaTab === 'photos' && (
              <button
                type="button"
                onClick={() => setActiveMediaTab('videos')}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-cream-100 via-harvest-50 to-cream-100 hover:from-harvest-100/60 hover:to-harvest-100/60 border border-harvest-200 rounded-2xl transition-all text-forest-900 group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-forest-900 text-harvest-300 flex items-center justify-center font-bold shadow group-hover:scale-105 transition-transform">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-forest-900">Watch Product Video ({videos.length})</p>
                    <p className="text-[11px] text-earth-600">See live condition, milk yield, or demonstration</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-forest-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Play Video &rarr;
                </span>
              </button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category & Status */}
            <div className="flex items-center gap-2">
              {isSold ? (
                <span className="bg-red-600 text-white font-extrabold text-xs uppercase px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" /> SOLD OUT
                </span>
              ) : isOutOfStock ? (
                <span className="bg-earth-100 text-earth-700 font-semibold text-xs px-3 py-1 rounded-full border border-earth-300">
                  Out of Stock
                </span>
              ) : (
                <Badge variant={product.stock_quantity <= 5 ? 'warning' : 'success'}>
                  {product.stock_quantity <= 5 ? `⚠️ Only ${product.stock_quantity} Left` : `${product.stock_quantity} Available`}
                </Badge>
              )}
              {product.is_featured && <Badge variant="default">⭐ Featured</Badge>}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-forest-900" style={{ fontFamily: 'var(--font-heading)' }}>
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-forest-700">{formatPrice(product.price)}</span>
              {product.unit && <span className="text-earth-400">/ {product.unit}</span>}
            </div>

            {product.description && (
              <p className="text-earth-600 leading-relaxed">{product.description}</p>
            )}

            {/* Livestock Details */}
            {isLivestock && ld && (
              <div className="bg-cream-50 rounded-2xl p-6 space-y-3">
                <h3 className="font-semibold text-forest-800 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Animal Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {ld.breed && <div><span className="text-earth-500">Breed:</span> <span className="font-medium text-forest-800">{ld.breed}</span></div>}
                  {ld.age && <div><span className="text-earth-500">Age:</span> <span className="font-medium text-forest-800">{ld.age}</span></div>}
                  {ld.gender && <div><span className="text-earth-500">Gender:</span> <span className="font-medium text-forest-800 capitalize">{ld.gender}</span></div>}
                  {ld.weight && <div><span className="text-earth-500">Weight:</span> <span className="font-medium text-forest-800">{ld.weight}</span></div>}
                  {ld.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-earth-400" /><span className="text-earth-500">Location:</span> <span className="font-medium text-forest-800">{ld.location}</span></div>}
                  {ld.milk_yield && <div><span className="text-earth-500">Milk Yield:</span> <span className="font-medium text-forest-800">{ld.milk_yield}</span></div>}
                  {ld.lactation_information && <div><span className="text-earth-500">Lactation:</span> <span className="font-medium text-forest-800">{ld.lactation_information}</span></div>}
                </div>
                {ld.health_information && (
                  <div className="pt-2 border-t border-earth-200 text-sm">
                    <span className="text-earth-500">Health:</span> <span className="font-medium text-forest-800">{ld.health_information}</span>
                  </div>
                )}
                {ld.vaccination_information && (
                  <div className="text-sm">
                    <span className="text-earth-500">Vaccination:</span> <span className="font-medium text-forest-800">{ld.vaccination_information}</span>
                  </div>
                )}
              </div>
            )}

            {/* Role-Based Action Area: Admin vs Customer */}
            {isAdmin ? (
              /* Admin Management Controls: Add to Cart and purchasing are completely hidden */
              <div className="bg-forest-900 text-white rounded-2xl p-6 shadow-lg border border-forest-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-forest-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-harvest-400" />
                    <span className="font-bold text-sm tracking-wide text-harvest-300">ADMINISTRATOR PRODUCT CONTROLS</span>
                  </div>
                  <Badge variant={product.is_active ? 'success' : 'danger'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="text-xs text-forest-200">
                  Customer purchasing options and Add to Cart are hidden for admin accounts. Manage inventory, pricing, and details below:
                </p>

                {/* Manage Stock Fast Updater */}
                <div className="bg-forest-950/70 rounded-xl p-4 border border-forest-800">
                  <div className="flex items-center justify-between text-xs text-forest-200 mb-2">
                    <span>Current Inventory: <strong className="text-white text-sm">{product.stock_quantity}</strong> {product.unit || 'units'}</span>
                    {product.stock_quantity <= 5 && (
                      <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded">⚠️ Low Stock Alert</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className="w-28 h-9 px-3 rounded-lg bg-forest-900 border border-forest-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-harvest-400"
                      placeholder="New stock"
                    />
                    <Button
                      size="sm"
                      className="bg-harvest-500 hover:bg-harvest-600 text-forest-950 font-bold h-9 text-xs px-4"
                      onClick={() => {
                        if (typeof stockInput === 'number' && stockInput >= 0) {
                          stockMutation.mutate({ id: product.id, stock: stockInput });
                        }
                      }}
                      disabled={stockMutation.isPending}
                    >
                      {stockMutation.isPending ? 'Updating...' : 'Update Stock'}
                    </Button>
                  </div>

                  {/* Quick Restore Button if Sold or Out of Stock */}
                  {(isSold || isOutOfStock) && (
                    <div className="pt-2 border-t border-forest-800/80 mt-3">
                      <Button
                        size="sm"
                        className="w-full bg-harvest-400 hover:bg-harvest-500 text-forest-950 font-bold text-xs h-8"
                        onClick={async () => {
                          try {
                            await adminRestoreProductStock(product.id, 1);
                            queryClient.invalidateQueries({ queryKey: ['product', slug] });
                            queryClient.invalidateQueries({ queryKey: ['admin'] });
                            toast.success('Listing restored as Available (Stock: 1)');
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to restore listing');
                          }
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Restore Listing as Available (Stock: 1)
                      </Button>
                    </div>
                  )}
                </div>

                {/* Admin Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link to={`/admin?tab=products&search=${encodeURIComponent(product.name)}`}>
                    <Button variant="default" className="w-full bg-forest-700 hover:bg-forest-600 text-white text-xs h-10">
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Full Product
                    </Button>
                  </Link>
                  <Link to="/admin">
                    <Button variant="outline" className="w-full border-forest-600 text-cream-100 hover:bg-forest-800 text-xs h-10">
                      <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Admin Dashboard
                    </Button>
                  </Link>
                </div>

                {/* Deactivate / Reactivate Toggle */}
                {product.is_active ? (
                  <Button
                    variant="ghost"
                    className="w-full text-red-300 hover:text-red-200 hover:bg-red-950/40 text-xs h-8"
                    onClick={() => deactivateMutation.mutate(product.id)}
                    disabled={deactivateMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Deactivate Product
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full text-green-300 hover:text-green-200 hover:bg-green-950/40 text-xs h-8"
                    onClick={() => reactivateMutation.mutate(product.id)}
                    disabled={reactivateMutation.isPending}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reactivate Product
                  </Button>
                )}
              </div>
            ) : (
              /* Customer Actions */
              <>
                {/* Sold Out Notice for Livestock / Unique Listings */}
                {isSold && (
                  <div className="bg-red-50/90 border border-red-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-red-900 font-bold text-base">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                      This livestock listing has been SOLD
                    </div>
                    <p className="text-sm text-red-700 leading-relaxed">
                      This animal was purchased by another customer and is no longer available. Reach out to us on WhatsApp to enquire about similar breeds or upcoming arrivals.
                    </p>
                    <div className="pt-2">
                      <a
                        href={getWhatsAppLink(settings.whatsapp_number, `Hello, I saw that ${product.name} is sold. Do you have similar livestock available?`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="lg" className="w-full bg-forest-800 hover:bg-forest-900 text-white font-semibold">
                          <MessageCircle className="w-5 h-5 mr-2 text-green-400" /> Enquire About Similar Livestock
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {/* Out of Stock Notice for Regular Goods */}
                {isOutOfStock && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                      ⚠️ Currently Out of Stock
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      This item is temporarily out of stock. We are preparing fresh supplies from our farm. Message us to receive restock notifications.
                    </p>
                    <div className="pt-2">
                      <a
                        href={getWhatsAppLink(settings.whatsapp_number, `Hello, when will ${product.name} be back in stock?`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="lg" className="w-full bg-forest-800 hover:bg-forest-900 text-white font-semibold">
                          <MessageCircle className="w-5 h-5 mr-2 text-green-400" /> Restock Alert on WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart (Available Products Only) */}
                {!isEnquiryOnly && inStock && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-forest-800">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-9 h-9 rounded-lg border border-earth-200 flex items-center justify-center hover:bg-forest-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold text-forest-900">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                          className="w-9 h-9 rounded-lg border border-earth-200 flex items-center justify-center hover:bg-forest-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {product.stock_quantity <= 5 && (
                        <span className="text-xs text-amber-600 font-medium">
                          (Only {product.stock_quantity} left in stock)
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        className="flex-1"
                        onClick={() => addItem(product, quantity)}
                        disabled={isInCart(product.id)}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isInCart(product.id) ? 'Already in Cart' : 'Add to Cart'}
                      </Button>
                      <a
                        href={getWhatsAppLink(settings.whatsapp_number, getProductWhatsAppMessage(product.name))}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="lg">
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {/* Enquiry-only */}
                {isEnquiryOnly && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800">
                        This listing is available for enquiry only. Please contact us via WhatsApp or phone to discuss pricing and availability.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={getWhatsAppLink(settings.whatsapp_number, getProductWhatsAppMessage(product.name))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                          <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp Enquiry
                        </Button>
                      </a>
                      <a href={`tel:${settings.phone}`}>
                        <Button variant="outline" size="lg">📞 Call</Button>
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Info badges */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-earth-100">
              <div className="flex items-center gap-2 text-sm text-earth-500">
                <Truck className="w-4 h-4" /> Local delivery available
              </div>
              <div className="flex items-center gap-2 text-sm text-earth-500">
                <Shield className="w-4 h-4" /> Quality guaranteed
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="mt-16 pt-12 border-t border-earth-100">
            <h2 className="heading-md text-forest-900 mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-cream-50 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-earth-200'}`} />
                    ))}
                  </div>
                  {review.comment && <p className="text-forest-800 text-sm mb-3">"{review.comment}"</p>}
                  <p className="text-xs text-earth-500">— {review.profile?.full_name || 'Customer'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

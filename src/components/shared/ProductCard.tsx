import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, MapPin, MessageCircle, Check, Edit, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { formatPrice, getWhatsAppLink, getProductWhatsAppMessage } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const { isAdmin } = useAuth();
  const { settings } = useSiteSettings();
  const isLivestock = product.product_type === 'livestock';
  const isEnquiryOnly = product.livestock_details?.listing_type === 'enquiry';
  const isSold = product.availability_status === 'sold' || (isLivestock && product.stock_quantity <= 0);
  const isOutOfStock = !isSold && (product.stock_quantity <= 0 || product.availability_status === 'out_of_stock');
  const inStock = product.stock_quantity > 0 && !isSold && !isOutOfStock && product.is_available !== false;
  const isLowStock = inStock && product.stock_quantity <= 5;
  const inCart = isInCart(product.id);

  const categoryBadges: Record<string, { bg: string; text: string }> = {
    livestock: { bg: 'bg-harvest-100', text: 'text-harvest-800' },
    dairy: { bg: 'bg-blue-50', text: 'text-blue-700' },
    farming_goods: { bg: 'bg-forest-100', text: 'text-forest-800' },
  };

  const productEmojis: Record<string, string> = {
    livestock: '🐃',
    dairy: '🥛',
    farming_goods: '🌾',
  };

  const badgeStyle = categoryBadges[product.product_type] || { bg: 'bg-earth-100', text: 'text-earth-700' };

  return (
    <div className="group rounded-2xl border border-earth-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Product Image & Badges */}
      <Link to={`/product/${product.slug}`} className="relative overflow-hidden aspect-[4/3] bg-cream-50 block">
        {product.product_images && product.product_images.length > 0 && product.product_images[0].image_url ? (
          <img
            src={product.product_images[0].image_url}
            alt={product.product_images[0].alt_text || product.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cream-100 via-earth-100 to-forest-50 flex items-center justify-center">
            <span className="text-6xl group-hover:scale-115 transition-transform duration-500 ease-out">
              {productEmojis[product.product_type] || '📦'}
            </span>
          </div>
        )}

        {/* Featured Tag */}
        {product.is_featured && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-forest-800 to-forest-900 text-harvest-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md border border-harvest-400/30">
            ★ Featured
          </span>
        )}

        {/* SOLD Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-red-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <span className="bg-red-600 text-white font-extrabold text-sm uppercase tracking-wider px-4 py-1.5 rounded-full shadow-xl border border-red-400 animate-scale-in">
              SOLD
            </span>
            <span className="text-white/80 text-[10px] mt-1 font-medium">No longer available</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-forest-950 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Subtle hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>

      {/* Card Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Category & Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
            {product.category?.name || product.product_type}
          </span>
          {isSold ? (
            <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> SOLD
            </span>
          ) : isOutOfStock ? (
            <span className="text-[11px] text-earth-500 font-medium">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Only {product.stock_quantity} left
            </span>
          ) : (
            <span className="text-[11px] text-forest-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-500" /> In Stock ({product.stock_quantity})
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/product/${product.slug}`} className="group/title">
          <h3
            className="font-bold text-forest-950 text-base leading-snug group-hover/title:text-forest-700 transition-colors line-clamp-2 mb-1.5"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Description snippet */}
        {product.description && (
          <p className="text-xs text-earth-600 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Livestock Details if applicable */}
        {isLivestock && product.livestock_details && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.livestock_details.breed && (
              <Badge variant="outline" className="text-[10px] bg-cream-50/50 border-earth-200">
                {product.livestock_details.breed}
              </Badge>
            )}
            {product.livestock_details.age && (
              <Badge variant="outline" className="text-[10px] bg-cream-50/50 border-earth-200">
                {product.livestock_details.age}
              </Badge>
            )}
            {product.livestock_details.location && (
              <Badge variant="outline" className="text-[10px] bg-cream-50/50 border-earth-200 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-forest-600" /> {product.livestock_details.location}
              </Badge>
            )}
          </div>
        )}

        {/* Price & Actions Area */}
        <div className="mt-auto pt-3 border-t border-earth-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xl font-extrabold text-forest-900 tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.unit && (
                <span className="text-xs text-earth-500 font-medium ml-1">/{product.unit}</span>
              )}
            </div>
            {isEnquiryOnly && (
              <span className="text-[11px] font-semibold text-harvest-700 bg-harvest-50 px-2 py-0.5 rounded-md border border-harvest-200">
                Enquiry Only
              </span>
            )}
          </div>

          {/* Action Buttons: Role-Based Admin vs Customer */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              /* Admin Controls: Never show Add to Cart for Admin */
              <Link to={`/admin?tab=products&search=${encodeURIComponent(product.name)}`} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold gap-1.5 rounded-xl h-9 border-forest-600 text-forest-800 hover:bg-forest-50"
                  size="sm"
                  title="Edit product in admin dashboard"
                >
                  <Edit className="w-3.5 h-3.5 text-forest-600" /> Edit & Stock
                </Button>
              </Link>
            ) : isEnquiryOnly ? (
              <a
                href={getWhatsAppLink(settings.whatsapp_number, getProductWhatsAppMessage(product.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
                aria-label={`Enquire via WhatsApp for ${product.name}`}
              >
                <Button
                  variant="default"
                  className="w-full text-xs font-semibold gap-1.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl h-9"
                  size="sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-green-400" /> Enquire Now
                </Button>
              </a>
            ) : isSold ? (
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold gap-1 rounded-xl h-9 bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
                size="sm"
                disabled
              >
                Sold Out
              </Button>
            ) : isOutOfStock ? (
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold gap-1 rounded-xl h-9 bg-earth-100 text-earth-500 border-earth-200 cursor-not-allowed"
                size="sm"
                disabled
              >
                Out of Stock
              </Button>
            ) : (
              <Button
                variant={inCart ? 'outline' : 'default'}
                className={`flex-1 text-xs font-semibold gap-1.5 rounded-xl h-9 transition-all ${
                  inCart
                    ? 'border-forest-600 text-forest-700 bg-forest-50'
                    : 'bg-forest-800 hover:bg-forest-900 text-white shadow-sm'
                }`}
                size="sm"
                onClick={() => addItem(product)}
              >
                {inCart ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-forest-600" /> Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </>
                )}
              </Button>
            )}

            {/* Quick WhatsApp Button (shown for customer or enquiry) */}
            {!isAdmin && (
              <a
                href={getWhatsAppLink(settings.whatsapp_number, getProductWhatsAppMessage(product.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200 flex-shrink-0"
                title="Quick WhatsApp Enquiry"
                aria-label={`WhatsApp Enquiry for ${product.name}`}
              >
                <MessageCircle className="w-4 h-4 fill-green-500/20" />
              </a>
            )}

            {/* View Details */}
            <Link to={`/product/${product.slug}`} className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 rounded-xl border-earth-200 hover:bg-cream-100 text-forest-800"
                aria-label={`View details for ${product.name}`}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductImage } from '@/types';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  productType?: string;
  autoPlayInterval?: number;
}

export function ImageGallery({
  images,
  productName,
  productType = 'livestock',
  autoPlayInterval = 3000,
}: ImageGalleryProps) {
  // Filter valid images with actual URLs
  const validImages = images.filter(
    (img) => img.image_url && img.image_url.trim() !== ''
  );

  // Sort by display_order — lowest first (primary image = display_order 0)
  const sortedImages = [...validImages].sort(
    (a, b) => a.display_order - b.display_order
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filter out broken/errored images
  const displayImages = sortedImages.filter(
    (img) => !imageErrors.has(img.id)
  );
  const hasMultiple = displayImages.length > 1;

  // Product type emoji fallbacks
  const productEmojis: Record<string, string> = {
    livestock: '🐄',
    dairy: '🥛',
    farming_goods: '🌾',
  };

  // Navigate to a specific slide
  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || displayImages.length === 0) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning, displayImages.length]
  );

  // Next / Previous
  const goNext = useCallback(() => {
    if (displayImages.length === 0) return;
    goTo((currentIndex + 1) % displayImages.length);
  }, [currentIndex, displayImages.length, goTo]);

  const goPrev = useCallback(() => {
    if (displayImages.length === 0) return;
    goTo(
      (currentIndex - 1 + displayImages.length) % displayImages.length
    );
  }, [currentIndex, displayImages.length, goTo]);

  // Auto-play: rotate every N seconds, pause on hover
  useEffect(() => {
    if (!hasMultiple || isHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(goNext, autoPlayInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultiple, isHovered, goNext, autoPlayInterval]);

  // Handle broken image gracefully
  const handleImageError = (imageId: string) => {
    setImageErrors((prev) => new Set(prev).add(imageId));
  };

  // Clamp current index if images change
  useEffect(() => {
    if (currentIndex >= displayImages.length && displayImages.length > 0) {
      setCurrentIndex(0);
    }
  }, [displayImages.length, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!hasMultiple || !isHovered) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasMultiple, isHovered, goNext, goPrev]);

  // No valid images — show emoji placeholder
  if (displayImages.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gradient-to-br from-cream-100 to-earth-100 flex items-center justify-center shadow-sm border border-earth-100">
        <span className="text-[120px] opacity-60">
          {productEmojis[productType] || '📦'}
        </span>
      </div>
    );
  }

  // Single image — simple static display
  if (displayImages.length === 1) {
    return (
      <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-cream-50 to-earth-50 shadow-sm border border-earth-100">
        <img
          src={displayImages[0].image_url}
          alt={displayImages[0].alt_text || productName}
          className="w-full h-full object-contain p-2"
          onError={() => handleImageError(displayImages[0].id)}
          draggable={false}
        />
      </div>
    );
  }

  // Multiple images — full carousel
  return (
    <div className="space-y-3">
      {/* Main image area */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-cream-50 to-earth-50 shadow-sm border border-earth-100 group cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Images with crossfade */}
        {displayImages.map((img, idx) => (
          <img
            key={img.id}
            src={img.image_url}
            alt={img.alt_text || productName}
            className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-500 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            onError={() => handleImageError(img.id)}
            loading={idx === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}

        {/* Left arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-forest-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-forest-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1.5">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>

        {/* Image counter badge */}
        <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {currentIndex + 1} / {displayImages.length}
        </div>

        {/* Pause indicator on hover */}
        {isHovered && (
          <div className="absolute top-3 left-3 z-20 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            Paused
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {displayImages.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => goTo(idx)}
            className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              idx === currentIndex
                ? 'border-forest-600 shadow-md ring-2 ring-forest-200'
                : 'border-earth-200 hover:border-forest-400 opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={img.image_url}
              alt={img.alt_text || ''}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              loading="lazy"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { siteConfig } from '@/config/site';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  const num = typeof price === 'number' ? price : Number(price) || 0;
  return `${siteConfig.currency}${num.toLocaleString('en-IN')}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getWhatsAppLink(number?: string | null, message: string = ''): string {
  let clean = (number || siteConfig.whatsappNumber || '919392629819').replace(/[^0-9]/g, '');
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  }
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  if (!clean) {
    clean = '919392629819';
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function getProductWhatsAppMessage(productName: string): string {
  return `Hello, I am interested in ${productName}. Please share the current availability, price, and delivery details.`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getImageUrl(path: string | null | undefined, fallback: string = '/placeholder-product.jpg'): string {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return path;
}

export function calculateDeliveryCharge(subtotal: number): number {
  if (subtotal >= siteConfig.freeDeliveryAbove) return 0;
  return siteConfig.deliveryCharge;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    contacted: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, (video.duration || 1) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 640);
          canvas.height = Math.min(video.videoHeight || 360, 360);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
    } catch {
      resolve('');
    }
  });
}

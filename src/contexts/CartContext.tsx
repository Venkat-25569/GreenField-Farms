import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '@/types';
import { siteConfig } from '@/config/site';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'greenfield-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeThreshold = Number(settings.free_delivery_above ?? siteConfig.freeDeliveryAbove);
  const baseCharge = Number(settings.delivery_charge ?? siteConfig.deliveryCharge);
  const deliveryCharge = !settings.enable_home_delivery ? 0 : subtotal >= freeThreshold ? 0 : baseCharge;
  const total = subtotal + deliveryCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    const isLivestock = product.product_type === 'livestock';
    const isSold = product.availability_status === 'sold' || (isLivestock && product.stock_quantity <= 0);
    const isOutOfStock = !isSold && (product.stock_quantity <= 0 || product.availability_status === 'out_of_stock');

    if (isSold) {
      toast.error(`${product.name} has been sold and cannot be added to cart.`);
      return;
    }
    if (isOutOfStock) {
      toast.error(`${product.name} is currently out of stock.`);
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const maxAvailable = Math.max(1, product.stock_quantity || siteConfig.maxQuantityPerItem);

      if (existing) {
        if (isLivestock && existing.quantity >= 1) {
          toast.info(`${product.name} is a unique livestock listing. Only 1 can be purchased.`);
          return prev;
        }
        if (existing.quantity >= maxAvailable) {
          toast.error(`Cannot add more. Only ${maxAvailable} available in stock.`);
          return prev;
        }
        const newQty = Math.min(existing.quantity + quantity, maxAvailable);
        toast.success(`Updated ${product.name} quantity to ${newQty}`);
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      }

      const initialQty = Math.min(quantity, maxAvailable);
      toast.success(`${product.name} added to cart`);
      return [...prev, { product, quantity: initialQty }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (item) {
        toast.info(`${item.product.name} removed from cart`);
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const maxAvailable = Math.max(1, item.product.stock_quantity || siteConfig.maxQuantityPerItem);
        if (quantity > maxAvailable) {
          toast.error(`Only ${maxAvailable} available in stock.`);
          return { ...item, quantity: maxAvailable };
        }
        return { ...item, quantity };
      })
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.info('Cart cleared');
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some((item) => item.product.id === productId);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      deliveryCharge,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

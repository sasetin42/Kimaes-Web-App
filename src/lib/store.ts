// Firebase-backed Central Store for Orders, Favorites, Cart & Notifications
import type { CartItem, User, Order, Product, Notification } from '@/types';
import {
  subscribeToOrders,
  placeOrder,
  updateOrderStatus as updateOrderStatusInFirestore,
  mapDocToOrder,
} from '@/services/orderService';
import { formatPrice as formatPriceUtil } from '@/lib/utils';

import { SAMPLE_ORDERS } from '@/constants/data';

const KEYS = {
  CART: 'kpb_cart',
  FAVORITES: 'kpb_favorites',
};

// In-memory reactive cache of orders maintained by Firestore live listener
let cachedOrders: Order[] = SAMPLE_ORDERS;
let ordersUnsub: (() => void) | null = null;

const setupOrdersListener = () => {
  if (typeof window === 'undefined') return;
  if (ordersUnsub) {
    ordersUnsub();
    ordersUnsub = null;
  }
  ordersUnsub = subscribeToOrders((orders) => {
    cachedOrders = orders;
    window.dispatchEvent(new Event('kimae_orders_sync'));
  });
};

// Initialize order listener
setupOrdersListener();

if (typeof window !== 'undefined') {
  window.addEventListener('kimae_auth_change', () => {
    setupOrdersListener();
  });
}

// -------------------------------------------------------------
// Cart (Client-side Session with Firestore compatibility)
// -------------------------------------------------------------
export const getCart = (): CartItem[] => {
  try {
    const data = localStorage.getItem(KEYS.CART);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveCart = (cart: CartItem[]) => {
  localStorage.setItem(KEYS.CART, JSON.stringify(cart));
};

export const clearCart = () => {
  localStorage.removeItem(KEYS.CART);
};

// -------------------------------------------------------------
// Orders (100% Cloud Firestore with live onSnapshot listener)
// -------------------------------------------------------------
export const getOrders = (): Order[] => {
  return cachedOrders;
};

export const saveOrders = (orders: Order[]) => {
  // Direct updates performed via Firestore orderService
};

export const getOrderById = (id: string): Order | undefined => {
  return cachedOrders.find((o) => o.id === id || o.orderNumber === id);
};

export const addOrder = async (order: Order) => {
  await placeOrder(order);
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
  note?: string,
  actor = 'Staff'
) => {
  await updateOrderStatusInFirestore(orderId, status, note, actor);
};

export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 900000) + 100000);
  return `KPB-${year}-${num}`;
};

// -------------------------------------------------------------
// Notifications
// -------------------------------------------------------------
let inMemoryNotifications: Notification[] = [
  {
    id: 'n-1',
    userId: 'all',
    title: 'Cloud Firestore Realtime Connected 🚀',
    message: 'System is running live synchronized Firestore data and Firebase Authentication.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export const getNotifications = (): Notification[] => {
  return inMemoryNotifications;
};

export const markNotificationRead = (id: string) => {
  inMemoryNotifications = inMemoryNotifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
};

// -------------------------------------------------------------
// Favorites
// -------------------------------------------------------------
export const getFavorites = (): string[] => {
  try {
    const data = localStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const toggleFavorite = (productId: string): boolean => {
  const favs = getFavorites();
  const idx = favs.indexOf(productId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(productId);
  }
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
  return idx < 0;
};

export const formatPrice = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const calculateCartTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => {
    const basePrice = item.product.promoPrice || item.product.price;
    return sum + (basePrice + item.optionPriceAdd) * item.quantity;
  }, 0);
};

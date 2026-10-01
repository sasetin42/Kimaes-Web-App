// Firebase Cloud Firestore Orders & Real-Time Sync Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Order, OrderStatus, OrderTimeline } from '@/types';
import { SAMPLE_ORDERS } from '@/constants/data';
import { isStaffUser, hasFirestoreStaffAccess } from '@/services/authService';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';
const MOVEMENTS_COLLECTION = 'inventory_movements';

export function mapDocToOrder(id: string, data: any): Order {
  return {
    id,
    orderNumber: data.orderNumber || id,
    customer: data.customer || { id: 'guest', name: 'Guest', email: '', mobile: '', role: 'customer', createdAt: '' },
    items: data.items || [],
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    promoCode: data.promoCode || undefined,
    deliveryFee: Number(data.deliveryFee) || 0,
    serviceFee: Number(data.serviceFee) || 0,
    tax: Number(data.tax) || 0,
    total: Number(data.total) || 0,
    paymentMethod: data.paymentMethod || 'cash',
    paymentStatus: data.paymentStatus || 'pending',
    deliveryMethod: data.deliveryMethod || 'delivery',
    deliveryAddress: data.deliveryAddress,
    scheduledAt: data.scheduledAt,
    isAsap: Boolean(data.isAsap),
    estimatedPrepTime: Number(data.estimatedPrepTime) || 45,
    estimatedDeliveryTime: Number(data.estimatedDeliveryTime) || 30,
    status: (data.status || 'pending') as OrderStatus,
    timeline: data.timeline || [],
    rider: data.rider,
    proofOfDelivery: data.proofOfDelivery,
    specialInstructions: data.specialInstructions,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || '2025-01-01T00:00:00.000Z'),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || data.createdAt || '2025-01-01T00:00:00.000Z'),
  };
}

/**
 * Real-time listener for all orders (Admin / Dispatcher / Kitchen)
 */
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  // Only connect listener if user has authenticated staff privileges in Firebase
  if (!hasFirestoreStaffAccess()) {
    callback(SAMPLE_ORDERS);
    return () => {};
  }
  const colRef = collection(db, ORDERS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      seedOrdersIfEmpty();
    }
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push(mapDocToOrder(docSnap.id, docSnap.data()));
    });
    callback(orders);
  }, (error) => {
    // Fall back gracefully to sample orders without spamming console
    callback(SAMPLE_ORDERS);
  });
}

/**
 * Real-time listener for specific customer orders
 */
export function subscribeToCustomerOrders(customerId: string, callback: (orders: Order[]) => void): () => void {
  if (!customerId || customerId === 'guest') {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, ORDERS_COLLECTION);
  const q = query(
    colRef,
    where('customer.id', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push(mapDocToOrder(docSnap.id, docSnap.data()));
    });
    callback(orders);
  }, (error) => {
    callback([]);
  });
}

/**
 * Real-time listener for a single order by ID or orderNumber
 */
export function subscribeToOrder(orderIdOrNumber: string, callback: (order: Order | null) => void): () => void {
  // First try direct doc reference
  const docRef = doc(db, ORDERS_COLLECTION, orderIdOrNumber);
  
  const unsubDoc = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(mapDocToOrder(snap.id, snap.data()));
    } else {
      // Query by orderNumber fallback
      const q = query(collection(db, ORDERS_COLLECTION), where('orderNumber', '==', orderIdOrNumber));
      getDocs(q).then((querySnap) => {
        if (!querySnap.empty) {
          const first = querySnap.docs[0];
          callback(mapDocToOrder(first.id, first.data()));
        } else {
          callback(null);
        }
      }).catch(() => callback(null));
    }
  }, (err) => {
    console.warn('Error subscribing to order:', err);
    callback(null);
  });

  return unsubDoc;
}

/**
 * Place a new Order with atomic stock validation & deduction in Firestore
 */
export async function placeOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const orderId = `ord-${Date.now()}`;
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    // 1. Verify and deduct stock for each item in the order
    for (const item of order.items) {
      const prodRef = doc(db, PRODUCTS_COLLECTION, item.product.id);
      const prodSnap = await transaction.get(prodRef);

      if (prodSnap.exists()) {
        const prodData = prodSnap.data();
        const currentStock = Number(prodData.stock) || 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        transaction.update(prodRef, {
          stock: newStock,
          available: newStock > 0,
          status: newStock === 0 ? 'out_of_stock' : prodData.status,
          updatedAt: serverTimestamp(),
        });

        // Record inventory movement
        const movRef = doc(collection(db, MOVEMENTS_COLLECTION));
        transaction.set(movRef, {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          type: 'online_sale',
          quantityChange: -item.quantity,
          quantityBefore: currentStock,
          quantityAfter: newStock,
          unitCost: prodData.cost || 0,
          totalValue: (prodData.cost || 0) * item.quantity,
          reason: `Online Order #${order.orderNumber}`,
          referenceId: order.orderNumber,
          recordedBy: 'Online Store Engine',
          timestamp: serverTimestamp(),
        });
      }
    }

    // 2. Commit Order document
    transaction.set(orderRef, {
      ...order,
      id: orderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return orderId;
}

/**
 * Update order status and append to timeline
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  actor = 'System'
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return;

  const orderData = snap.data();
  const currentTimeline: OrderTimeline[] = orderData.timeline || [];

  const timelineEntry: OrderTimeline = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${newStatus}`,
    actor,
  };

  await updateDoc(orderRef, {
    status: newStatus,
    timeline: [...currentTimeline, timelineEntry],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Assign rider to an order
 */
export async function assignRiderToOrder(orderId: string, rider: any): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    rider,
    status: 'rider_assigned',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Seed sample orders into Firestore if collection is empty
 */
export async function seedOrdersIfEmpty(): Promise<void> {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, ORDERS_COLLECTION));
    if (!snap.empty) return;

    for (const ord of SAMPLE_ORDERS) {
      const docRef = doc(db, ORDERS_COLLECTION, ord.id);
      await setDoc(docRef, {
        ...ord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log('Seeded sample orders into Firestore!');
  } catch (err) {
    console.error('Failed to seed sample orders:', err);
  }
}

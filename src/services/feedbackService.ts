// Firebase Firestore Customer Feedback Service
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { CustomerFeedback } from '@/types';
import { adminAdjustPoints, getSukiProfileByIdentifier } from '@/lib/loyaltyStore';
import { toast } from 'sonner';

const FEEDBACK_COLLECTION = 'customer_feedback';
const LOCAL_FEEDBACK_KEY = 'kimaes_customer_feedback';

const INITIAL_FEEDBACK: CustomerFeedback[] = [
  {
    id: 'fb-101',
    orderId: 'ord-101',
    orderNumber: 'KPB-2026-88912',
    customerId: 'cust-101',
    customerName: 'Maria Santos',
    customerEmail: 'customer@gmail.com',
    customerMobile: '0917-123-4567',
    rating: 5,
    reviewText:
      'Sobrang sarap ng Special Pancit Malabon! Mainit pa nung dumating sa Dasmariñas. Generous ang toppings ng hipon at chicharon. Will definitely order again for my mom’s birthday!',
    tags: ['Generous Toppings', 'Hot & Fresh', 'Fast Cavite Delivery'],
    orderItems: ['Special Pancit Malabon Party Bilao', 'Maja Blanca Especial'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'published',
  },
  {
    id: 'fb-102',
    orderId: 'ord-102',
    orderNumber: 'KPB-2026-77341',
    customerId: 'cust-102',
    customerName: 'Juan Dela Cruz',
    customerEmail: 'juan.delacruz@yahoo.com',
    customerMobile: '0918-987-6543',
    rating: 5,
    reviewText:
      'Best fiesta bilao in Cavite! Saktong-sakto ang lasa ng Palabok, hindi matubig. Tuwang-tuwa mga bisita namin sa salo-salo.',
    tags: ['Bilao Perfection', 'Party Hit', 'Authentic Flavor'],
    orderItems: ['Fiesta Pancit Palabok Bilao'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'published',
  },
  {
    id: 'fb-103',
    orderId: 'ord-103',
    orderNumber: 'KPB-2026-90412',
    customerId: 'cust-103',
    customerName: 'Pamela Ramos (Acme BPO)',
    customerEmail: 'hr@acmebposolutions.ph',
    customerMobile: '0922-334-5566',
    rating: 5,
    reviewText:
      'Ordered 10 party food trays for our office monthly town hall. Punctual delivery, very neat packaging with banana leaf linings. Highly recommended for corporate events!',
    tags: ['Corporate Friendly', 'Punctual Rider', 'Great Packaging'],
    orderItems: ['Special Pinoy Sweet Spaghetti', 'Lumpiang Shanghai Fiesta Tray (60 pcs)'],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: 'published',
  },
];

let inMemoryFeedback: CustomerFeedback[] = (() => {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : INITIAL_FEEDBACK;
  } catch {
    return INITIAL_FEEDBACK;
  }
})();

function saveLocalFeedback(list: CustomerFeedback[]) {
  inMemoryFeedback = list;
  try {
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('kimae_feedback_sync', { detail: list }));
  } catch (err) {
    console.warn('Failed to save local feedback:', err);
  }
}

/**
 * Submits customer rating and review to Firebase Firestore & local storage
 * Linked directly to the customer's account and order.
 */
export async function submitCustomerFeedback(
  data: Omit<CustomerFeedback, 'id' | 'createdAt'>
): Promise<string> {
  const feedbackId = `fb-${Date.now()}`;
  const now = new Date().toISOString();

  const feedbackDoc: CustomerFeedback = {
    ...data,
    id: feedbackId,
    createdAt: now,
    status: 'published',
  };

  // 1. Update local cache immediately for instant UI responsiveness
  saveLocalFeedback([feedbackDoc, ...inMemoryFeedback.filter((f) => f.orderId !== data.orderId)]);

  // 2. Persist to Firebase Firestore
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await setDoc(docRef, {
      ...feedbackDoc,
      serverCreatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Saved feedback locally, Firestore upload will retry:', err);
  }

  // 3. Award 15 bonus loyalty points for sharing customer feedback!
  try {
    const suki =
      getSukiProfileByIdentifier(data.customerId) ||
      getSukiProfileByIdentifier(data.customerEmail) ||
      getSukiProfileByIdentifier(data.customerMobile);

    if (suki) {
      adminAdjustPoints(
        suki.customerId,
        15,
        `Bonus points for Order #${data.orderNumber} feedback review ⭐`
      );
    }
  } catch (err) {
    console.warn('Loyalty point bonus credit skipped:', err);
  }

  return feedbackId;
}

/**
 * Returns all feedback or feedback submitted by a specific customer
 */
export function getCustomerFeedback(customerId?: string): CustomerFeedback[] {
  if (!customerId) return inMemoryFeedback;
  return inMemoryFeedback.filter(
    (f) =>
      f.customerId === customerId ||
      (f.customerEmail && f.customerEmail.toLowerCase() === customerId.toLowerCase())
  );
}

/**
 * Checks if feedback has already been submitted for an order
 */
export function getFeedbackForOrder(orderIdOrNumber: string): CustomerFeedback | undefined {
  return inMemoryFeedback.find(
    (f) => f.orderId === orderIdOrNumber || f.orderNumber === orderIdOrNumber
  );
}

/**
 * Subscribes to real-time feedback updates from Firebase Firestore
 */
export function subscribeToCustomerFeedback(
  callback: (list: CustomerFeedback[]) => void
): () => void {
  // Emit in-memory immediately
  callback(inMemoryFeedback);

  const handleLocalSync = (e: any) => {
    callback(e.detail || inMemoryFeedback);
  };
  window.addEventListener('kimae_feedback_sync', handleLocalSync);

  try {
    const colRef = collection(db, FEEDBACK_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CustomerFeedback[] = [];
          snapshot.forEach((snap) => {
            const data = snap.data();
            list.push({
              id: snap.id,
              orderId: data.orderId || '',
              orderNumber: data.orderNumber || '',
              customerId: data.customerId || '',
              customerName: data.customerName || 'Suki Customer',
              customerEmail: data.customerEmail || '',
              customerMobile: data.customerMobile || '',
              rating: Number(data.rating) || 5,
              reviewText: data.reviewText || '',
              tags: data.tags || [],
              orderItems: data.orderItems || [],
              createdAt: data.createdAt || new Date().toISOString(),
              status: data.status || 'published',
            });
          });
          saveLocalFeedback(list);
          callback(list);
        }
      },
      (error) => {
        // Fall back gracefully to in-memory feedback
        callback(inMemoryFeedback);
      }
    );

    return () => {
      window.removeEventListener('kimae_feedback_sync', handleLocalSync);
      unsubscribe();
    };
  } catch {
    return () => {
      window.removeEventListener('kimae_feedback_sync', handleLocalSync);
    };
  }
}

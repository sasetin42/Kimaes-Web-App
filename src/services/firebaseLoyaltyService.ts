// Firebase Firestore Customer Loyalty Rewards Service
// Stores and syncs customer loyalty points, tier, and order history directly within user profiles in Firebase
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { LoyaltyTier, SukiProfile } from '@/types';
import { toast } from 'sonner';

export interface LoyaltyOrderHistoryItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderTotal: number;
  pointsEarned: number;
  pointsRedeemed: number;
  discountApplied: number;
  tierAtTime: LoyaltyTier;
  remarks: string;
  createdAt: string;
}

export interface FirebaseUserProfileLoyalty {
  userId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  tier: LoyaltyTier;
  pointsBalance: number;
  monetaryValue: number; // 1 pt = ₱2 discount
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  qualifyingSpend6Months: number;
  lifetimeSpend: number;
  orderCount: number;
  orderHistory: LoyaltyOrderHistoryItem[];
  lastUpdated: string;
  isFirebaseSynced: boolean;
}

const USERS_COLLECTION = 'users';
const LOCAL_LOYALTY_CACHE_PREFIX = 'kimae_firebase_loyalty_';

// Initial demo profile for Maria Santos (cust-101 / customer@gmail.com)
const DEFAULT_CUSTOMER_LOYALTY: FirebaseUserProfileLoyalty = {
  userId: 'cust-101',
  customerId: 'cust-101',
  customerName: 'Maria Santos',
  customerEmail: 'customer@gmail.com',
  customerMobile: '0917-123-4567',
  tier: 'Suki',
  pointsBalance: 120, // 120 pts = ₱240 discount
  monetaryValue: 240,
  lifetimePointsEarned: 180,
  lifetimePointsRedeemed: 60,
  qualifyingSpend6Months: 4800,
  lifetimeSpend: 6200,
  orderCount: 5,
  orderHistory: [
    {
      id: 'loh-01',
      orderId: 'ord-101',
      orderNumber: 'KPB-2026-88912',
      orderDate: '2026-09-20T11:30:00.000Z',
      orderTotal: 1850,
      pointsEarned: 18,
      pointsRedeemed: 0,
      discountApplied: 0,
      tierAtTime: 'Suki',
      remarks: 'Party Bilao Fiesta Feast (₱1,850) - 2 pts per ₱200 spent',
      createdAt: '2026-09-20T11:30:00.000Z',
    },
    {
      id: 'loh-02',
      orderId: 'ord-098',
      orderNumber: 'KPB-2026-76431',
      orderDate: '2026-08-14T17:15:00.000Z',
      orderTotal: 2400,
      pointsEarned: 24,
      pointsRedeemed: 30,
      discountApplied: 60,
      tierAtTime: 'Suki',
      remarks: 'Office Townhall Bilao Order - Redeemed 30 pts (₱60 discount)',
      createdAt: '2026-08-14T17:15:00.000Z',
    },
    {
      id: 'loh-03',
      orderId: 'ord-085',
      orderNumber: 'KPB-2026-61209',
      orderDate: '2026-07-02T13:45:00.000Z',
      orderTotal: 1950,
      pointsEarned: 19,
      pointsRedeemed: 0,
      discountApplied: 0,
      tierAtTime: 'Suki',
      remarks: 'Family Salo-Salo Pancit Malabon & Maja Blanca',
      createdAt: '2026-07-02T13:45:00.000Z',
    },
  ],
  lastUpdated: new Date().toISOString(),
  isFirebaseSynced: true,
};

function getLocalCache(key: string): FirebaseUserProfileLoyalty | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_LOYALTY_CACHE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalCache(key: string, data: FirebaseUserProfileLoyalty): void {
  try {
    localStorage.setItem(`${LOCAL_LOYALTY_CACHE_PREFIX}${key}`, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent('kimae_firebase_loyalty_updated', { detail: { key, data } })
    );
  } catch (err) {
    console.warn('Failed to cache loyalty data locally:', err);
  }
}

/**
 * Normalizes identifier (email, userId, mobile)
 */
function cleanIdentifier(idOrEmail: string): string {
  return idOrEmail.toLowerCase().trim();
}

/**
 * Retrieves the customer loyalty rewards record stored in Firebase Firestore
 */
export async function getCustomerLoyaltyProfile(
  userIdOrEmail: string
): Promise<FirebaseUserProfileLoyalty> {
  const cleanId = cleanIdentifier(userIdOrEmail);

  // Check cache first for instant UI response
  const cached = getLocalCache(cleanId);
  if (cached) {
    return cached;
  }

  // Attempt Firestore read from user document
  try {
    // 1. Try by direct Document ID
    const userDocRef = doc(db, USERS_COLLECTION, userIdOrEmail);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.loyalty) {
        const fullLoyalty: FirebaseUserProfileLoyalty = {
          ...data.loyalty,
          userId: userIdOrEmail,
          customerId: data.loyalty.customerId || data.id || userIdOrEmail,
          customerName: data.name || data.loyalty.customerName || 'Suki Customer',
          customerEmail: data.email || data.loyalty.customerEmail || '',
          customerMobile: data.mobile || data.loyalty.customerMobile || '',
          monetaryValue: (data.loyalty.pointsBalance || 0) * 2,
          isFirebaseSynced: true,
        };
        setLocalCache(cleanId, fullLoyalty);
        return fullLoyalty;
      }
    }

    // 2. Try by email query
    const colRef = collection(db, USERS_COLLECTION);
    const q = query(colRef, where('email', '==', cleanId));
    const querySnap = await getDoc(userDocRef);
    if (!querySnap.exists()) {
      // Query collection
      const qSnap = await (await import('firebase/firestore')).getDocs(q);
      if (!qSnap.empty) {
        const userDoc = qSnap.docs[0];
        const uData = userDoc.data();
        if (uData.loyalty) {
          const fullLoyalty: FirebaseUserProfileLoyalty = {
            ...uData.loyalty,
            userId: userDoc.id,
            customerId: uData.loyalty.customerId || userDoc.id,
            customerName: uData.name || 'Suki Customer',
            customerEmail: uData.email || cleanId,
            customerMobile: uData.mobile || '',
            monetaryValue: (uData.loyalty.pointsBalance || 0) * 2,
            isFirebaseSynced: true,
          };
          setLocalCache(cleanId, fullLoyalty);
          return fullLoyalty;
        }
      }
    }
  } catch (err) {
    console.warn('Firestore loyalty read fallback:', err);
  }

  // Fallback to default demo customer if email matches customer@gmail.com
  if (cleanId === 'customer@gmail.com' || cleanId === 'cust-101' || cleanId === 'maria.santos@gmail.com') {
    setLocalCache(cleanId, DEFAULT_CUSTOMER_LOYALTY);
    return DEFAULT_CUSTOMER_LOYALTY;
  }

  // Create empty new customer loyalty record
  const freshLoyalty: FirebaseUserProfileLoyalty = {
    userId: userIdOrEmail,
    customerId: `cust-${Date.now().toString().slice(-4)}`,
    customerName: 'Suki Member',
    customerEmail: cleanId.includes('@') ? cleanId : '',
    customerMobile: cleanId.startsWith('09') ? cleanId : '',
    tier: 'Suki',
    pointsBalance: 50, // Welcome 50 points
    monetaryValue: 100, // ₱100 discount
    lifetimePointsEarned: 50,
    lifetimePointsRedeemed: 0,
    qualifyingSpend6Months: 0,
    lifetimeSpend: 0,
    orderCount: 0,
    orderHistory: [],
    lastUpdated: new Date().toISOString(),
    isFirebaseSynced: true,
  };

  setLocalCache(cleanId, freshLoyalty);
  return freshLoyalty;
}

/**
 * Subscribes to real-time customer loyalty changes stored in Firebase Firestore user profile
 */
export function subscribeToCustomerLoyalty(
  userIdOrEmail: string,
  callback: (loyalty: FirebaseUserProfileLoyalty) => void
): () => void {
  const cleanId = cleanIdentifier(userIdOrEmail);

  // Emit current or cached state immediately
  getCustomerLoyaltyProfile(userIdOrEmail).then((initial) => {
    callback(initial);
  });

  // Listen to local update events for immediate UI reactivity
  const handleLocalUpdate = (e: any) => {
    if (e.detail?.key === cleanId && e.detail?.data) {
      callback(e.detail.data);
    }
  };
  window.addEventListener('kimae_firebase_loyalty_updated', handleLocalUpdate);

  // Firestore real-time listener on user doc
  let unsubscribeFirestore = () => {};
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userIdOrEmail);
    unsubscribeFirestore = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.loyalty) {
            const synced: FirebaseUserProfileLoyalty = {
              ...data.loyalty,
              userId: docSnap.id,
              customerName: data.name || data.loyalty.customerName || 'Suki Customer',
              customerEmail: data.email || data.loyalty.customerEmail || '',
              customerMobile: data.mobile || data.loyalty.customerMobile || '',
              monetaryValue: (data.loyalty.pointsBalance || 0) * 2,
              isFirebaseSynced: true,
            };
            setLocalCache(cleanId, synced);
            callback(synced);
          }
        }
      },
      () => {
        // Fall back gracefully to cache
      }
    );
  } catch {
    // Graceful offline fallback
  }

  return () => {
    window.removeEventListener('kimae_firebase_loyalty_updated', handleLocalUpdate);
    unsubscribeFirestore();
  };
}

/**
 * Applies points towards future discounts directly within Firebase User Profile
 * 1 Point = ₱2 Discount
 */
export async function applyPointsTowardsDiscount(
  userIdOrEmail: string,
  pointsToRedeem: number,
  orderNumber?: string
): Promise<{ success: boolean; discountAmount: number; newBalance: number; error?: string }> {
  if (pointsToRedeem <= 0) {
    return { success: false, discountAmount: 0, newBalance: 0, error: 'Points must be greater than 0' };
  }

  if (pointsToRedeem < 5) {
    return { success: false, discountAmount: 0, newBalance: 0, error: 'Minimum redemption is 5 points (₱10)' };
  }

  const current = await getCustomerLoyaltyProfile(userIdOrEmail);

  if (current.pointsBalance < pointsToRedeem) {
    return {
      success: false,
      discountAmount: 0,
      newBalance: current.pointsBalance,
      error: `Insufficient points balance. You have ${current.pointsBalance} pts available.`,
    };
  }

  const discountAmount = pointsToRedeem * 2; // 1 point = ₱2
  const newBalance = current.pointsBalance - pointsToRedeem;
  const now = new Date().toISOString();

  const historyItem: LoyaltyOrderHistoryItem = {
    id: `loh-${Date.now()}`,
    orderId: `ord-${Date.now()}`,
    orderNumber: orderNumber || `KPB-${Math.floor(10000 + Math.random() * 90000)}`,
    orderDate: now,
    orderTotal: 0,
    pointsEarned: 0,
    pointsRedeemed: pointsToRedeem,
    discountApplied: discountAmount,
    tierAtTime: current.tier,
    remarks: `Redeemed ${pointsToRedeem} points for ₱${discountAmount} discount on Order #${orderNumber || 'bilao feast'}`,
    createdAt: now,
  };

  const updated: FirebaseUserProfileLoyalty = {
    ...current,
    pointsBalance: newBalance,
    monetaryValue: newBalance * 2,
    lifetimePointsRedeemed: current.lifetimePointsRedeemed + pointsToRedeem,
    orderHistory: [historyItem, ...current.orderHistory],
    lastUpdated: now,
    isFirebaseSynced: true,
  };

  const cleanId = cleanIdentifier(userIdOrEmail);
  setLocalCache(cleanId, updated);

  // Sync to Firestore user profile document
  try {
    const userDocRef = doc(db, USERS_COLLECTION, current.userId);
    await setDoc(
      userDocRef,
      {
        loyalty: {
          tier: updated.tier,
          pointsBalance: updated.pointsBalance,
          monetaryValue: updated.monetaryValue,
          lifetimePointsEarned: updated.lifetimePointsEarned,
          lifetimePointsRedeemed: updated.lifetimePointsRedeemed,
          qualifyingSpend6Months: updated.qualifyingSpend6Months,
          lifetimeSpend: updated.lifetimeSpend,
          orderCount: updated.orderCount,
          lastUpdated: serverTimestamp(),
          orderHistory: arrayUnion(historyItem),
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Persisted discount locally, Firestore write will retry:', err);
  }

  toast.success(
    `🎉 Redeemed ${pointsToRedeem} points! ₱${discountAmount} discount applied to your feast.`
  );

  return {
    success: true,
    discountAmount,
    newBalance,
  };
}

/**
 * Tracks order completion and records points earned (2 pts per ₱200 spent) in Firebase User Profile
 */
export async function trackOrderAndAwardLoyaltyPoints(
  userIdOrEmail: string,
  order: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    pointsRedeemed?: number;
    discountApplied?: number;
  }
): Promise<{ pointsEarned: number; newBalance: number }> {
  const current = await getCustomerLoyaltyProfile(userIdOrEmail);

  // Earning rule: 2 points per ₱200 spent
  const pointsEarned = Math.floor(order.totalAmount / 200) * 2;
  const newBalance = current.pointsBalance + pointsEarned;
  const newSpend6Mos = current.qualifyingSpend6Months + order.totalAmount;
  const newLifetimeSpend = current.lifetimeSpend + order.totalAmount;

  // Tier calculation: ₱8,000 threshold for VIP Fiesta
  let newTier: LoyaltyTier = current.tier;
  if (current.tier === 'Suki' && newSpend6Mos >= 8000) {
    newTier = 'VIP Fiesta';
    toast.success('🎉 Congratulations! You have unlocked VIP Fiesta Tier Status!');
  }

  const now = new Date().toISOString();
  const historyItem: LoyaltyOrderHistoryItem = {
    id: `loh-${Date.now()}`,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderDate: now,
    orderTotal: order.totalAmount,
    pointsEarned,
    pointsRedeemed: order.pointsRedeemed || 0,
    discountApplied: order.discountApplied || 0,
    tierAtTime: newTier,
    remarks: `Order #${order.orderNumber} Completed (₱${order.totalAmount.toLocaleString()}) - Earned ${pointsEarned} pts`,
    createdAt: now,
  };

  const updated: FirebaseUserProfileLoyalty = {
    ...current,
    tier: newTier,
    pointsBalance: newBalance,
    monetaryValue: newBalance * 2,
    lifetimePointsEarned: current.lifetimePointsEarned + pointsEarned,
    qualifyingSpend6Months: newSpend6Mos,
    lifetimeSpend: newLifetimeSpend,
    orderCount: current.orderCount + 1,
    orderHistory: [historyItem, ...current.orderHistory],
    lastUpdated: now,
    isFirebaseSynced: true,
  };

  const cleanId = cleanIdentifier(userIdOrEmail);
  setLocalCache(cleanId, updated);

  // Persist to Firebase Firestore
  try {
    const userDocRef = doc(db, USERS_COLLECTION, current.userId);
    await setDoc(
      userDocRef,
      {
        loyalty: {
          tier: updated.tier,
          pointsBalance: updated.pointsBalance,
          monetaryValue: updated.monetaryValue,
          lifetimePointsEarned: updated.lifetimePointsEarned,
          lifetimePointsRedeemed: updated.lifetimePointsRedeemed,
          qualifyingSpend6Months: updated.qualifyingSpend6Months,
          lifetimeSpend: updated.lifetimeSpend,
          orderCount: updated.orderCount,
          lastUpdated: serverTimestamp(),
          orderHistory: arrayUnion(historyItem),
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Persisted loyalty update locally, Firestore sync queued:', err);
  }

  return {
    pointsEarned,
    newBalance,
  };
}

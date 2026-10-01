// Firebase Cloud Firestore Inventory, Suppliers & Purchase Orders Service
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type {
  Supplier,
  PurchaseOrder,
  InventoryMovement,
  CustomerProfile,
  User,
  Product
} from '@/types';
import {
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_MOVEMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_STAFF
} from '@/constants/seedData';
import { isStaffUser, isAdminUser, hasFirestoreStaffAccess, hasFirestoreAdminAccess } from '@/services/authService';

const SUPPLIERS_COL = 'suppliers';
const PURCHASE_ORDERS_COL = 'purchase_orders';
const MOVEMENTS_COL = 'inventory_movements';
const CUSTOMERS_COL = 'customer_profiles';
const USERS_COL = 'users';
const PRODUCTS_COL = 'products';

// -----------------------------------------------------------------
// Suppliers
// -----------------------------------------------------------------
export function subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_SUPPLIERS);
    return () => {};
  }
  const q = query(collection(db, SUPPLIERS_COL), orderBy('name', 'asc'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedSuppliersIfEmpty();
    const list: Supplier[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Supplier));
    callback(list);
  }, (err) => {
    // Graceful fallback to initial seed without uncaught errors
    callback(INITIAL_SUPPLIERS);
  });
}

export async function saveSupplier(supplier: Supplier): Promise<void> {
  const docRef = doc(db, SUPPLIERS_COL, supplier.id);
  await setDoc(docRef, { ...supplier, updatedAt: serverTimestamp() }, { merge: true });
}

// -----------------------------------------------------------------
// Purchase Orders
// -----------------------------------------------------------------
export function subscribeToPurchaseOrders(callback: (pos: PurchaseOrder[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_PURCHASE_ORDERS);
    return () => {};
  }
  const q = query(collection(db, PURCHASE_ORDERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedPurchaseOrdersIfEmpty();
    const list: PurchaseOrder[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PurchaseOrder));
    callback(list);
  }, (err) => {
    // Graceful fallback to initial seed without uncaught errors
    callback(INITIAL_PURCHASE_ORDERS);
  });
}

export async function savePurchaseOrder(po: PurchaseOrder): Promise<void> {
  const docRef = doc(db, PURCHASE_ORDERS_COL, po.id);
  await setDoc(docRef, { ...po, updatedAt: serverTimestamp() }, { merge: true });
}

export async function receivePurchaseOrderInFirestore(
  poId: string,
  receivedItems: { productId: string; receivedQuantity: number }[],
  receiverName: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const poRef = doc(db, PURCHASE_ORDERS_COL, poId);
    const poSnap = await transaction.get(poRef);
    if (!poSnap.exists()) return;

    const poData = poSnap.data() as PurchaseOrder;

    for (const recv of receivedItems) {
      if (recv.receivedQuantity <= 0) continue;

      const prodRef = doc(db, PRODUCTS_COL, recv.productId);
      const prodSnap = await transaction.get(prodRef);
      if (prodSnap.exists()) {
        const p = prodSnap.data() as Product;
        const before = p.stock || 0;
        const after = before + recv.receivedQuantity;

        transaction.update(prodRef, {
          stock: after,
          status: after > 0 ? 'active' : p.status,
          available: true,
          updatedAt: serverTimestamp(),
        });

        // Record movement
        const movRef = doc(collection(db, MOVEMENTS_COL));
        transaction.set(movRef, {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          type: 'purchase_received',
          quantityChange: recv.receivedQuantity,
          quantityBefore: before,
          quantityAfter: after,
          unitCost: p.cost,
          totalValue: recv.receivedQuantity * p.cost,
          reason: `Goods receipt for Purchase Order #${poData.poNumber}`,
          referenceId: poData.poNumber,
          recordedBy: receiverName,
          timestamp: serverTimestamp(),
        });
      }

      const itm = poData.items.find((i) => i.productId === recv.productId);
      if (itm) {
        itm.receivedQuantity = (itm.receivedQuantity || 0) + recv.receivedQuantity;
      }
    }

    const allDone = poData.items.every((i) => i.receivedQuantity >= i.orderQuantity);
    poData.status = allDone ? 'received' : 'partially_received';
    poData.receivedDate = new Date().toISOString();

    transaction.update(poRef, {
      items: poData.items,
      status: poData.status,
      receivedDate: poData.receivedDate,
      updatedAt: serverTimestamp(),
    });
  });
}

// -----------------------------------------------------------------
// Inventory Audit Movements
// -----------------------------------------------------------------
export function subscribeToInventoryMovements(callback: (movs: InventoryMovement[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_MOVEMENTS);
    return () => {};
  }
  const q = query(collection(db, MOVEMENTS_COL), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedMovementsIfEmpty();
    const list: InventoryMovement[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || '2025-01-01T00:00:00.000Z'
      } as InventoryMovement);
    });
    callback(list);
  }, (err) => {
    callback(INITIAL_MOVEMENTS);
  });
}

export async function adjustStockInFirestore(
  productId: string,
  newStock: number,
  type: 'adjustment' | 'waste_damaged' | 'physical_count' | 'stock_in' | 'stock_out',
  reason: string,
  recordedBy: string = 'Staff'
): Promise<void> {
  const prodRef = doc(db, PRODUCTS_COL, productId);
  const movRef = doc(collection(db, MOVEMENTS_COL));

  await runTransaction(db, async (transaction) => {
    const prodDoc = await transaction.get(prodRef);
    if (!prodDoc.exists()) throw new Error('Product not found in Firestore');

    const target = prodDoc.data() as Product;
    const qtyBefore = target.stock || 0;
    const qtyChange = newStock - qtyBefore;

    transaction.update(prodRef, {
      stock: newStock,
      available: newStock > 0,
      updatedAt: serverTimestamp(),
    });

    transaction.set(movRef, {
      productId,
      productName: target.name,
      sku: target.sku || '',
      type,
      quantityChange: qtyChange,
      quantityBefore: qtyBefore,
      quantityAfter: newStock,
      unitCost: target.cost || 0,
      totalValue: Math.abs(qtyChange) * (target.cost || 0),
      reason,
      recordedBy,
      timestamp: serverTimestamp(),
    });
  });
}

// -----------------------------------------------------------------
// Customers & CRM
// -----------------------------------------------------------------
export function subscribeToCustomers(callback: (custs: CustomerProfile[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_CUSTOMERS);
    return () => {};
  }
  const q = query(collection(db, CUSTOMERS_COL), orderBy('totalSpent', 'desc'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedCustomersIfEmpty();
    const list: CustomerProfile[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CustomerProfile));
    callback(list);
  }, (err) => {
    callback(INITIAL_CUSTOMERS);
  });
}

export async function updateCustomerSpendingInFirestore(
  customerId: string,
  amount: number,
  pointsEarned: number
): Promise<void> {
  const custRef = doc(db, CUSTOMERS_COL, customerId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(custRef);
    if (!snap.exists()) return;
    const c = snap.data() as CustomerProfile;
    const totalSpent = (c.totalSpent || 0) + amount;
    let memberTier: CustomerProfile['memberTier'] = 'Regular';
    if (totalSpent > 25000) memberTier = 'VIP';
    else if (totalSpent > 10000) memberTier = 'Gold';
    else if (totalSpent > 4000) memberTier = 'Silver';
    else memberTier = 'Bronze';

    transaction.update(custRef, {
      totalSpent,
      orderCount: (c.orderCount || 0) + 1,
      loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned,
      lastVisit: new Date().toISOString(),
      memberTier,
      updatedAt: serverTimestamp(),
    });
  });
}

// -----------------------------------------------------------------
// Staff Management
// -----------------------------------------------------------------
export function subscribeToStaff(callback: (staff: User[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_STAFF);
    return () => {};
  }
  const q = query(collection(db, USERS_COL));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedStaffIfEmpty();
    const staffList: User[] = [];
    snap.forEach((d) => {
      const u = d.data() as User;
      if (['super_admin', 'admin', 'manager', 'cashier', 'inventory_staff', 'kitchen', 'rider'].includes(u.role)) {
        staffList.push({ id: d.id, ...u });
      }
    });
    callback(staffList);
  }, (err) => {
    callback(INITIAL_STAFF);
  });
}

export async function saveStaffMember(user: User): Promise<void> {
  const docRef = doc(db, USERS_COL, user.id);
  await setDoc(docRef, { ...user, updatedAt: serverTimestamp() }, { merge: true });
}

// -----------------------------------------------------------------
// Database Seeders
// -----------------------------------------------------------------
export async function seedSuppliersIfEmpty() {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, SUPPLIERS_COL));
    if (!snap.empty) return;
    for (const s of INITIAL_SUPPLIERS) {
      await setDoc(doc(db, SUPPLIERS_COL, s.id), { ...s, createdAt: serverTimestamp() });
    }
  } catch {}
}

export async function seedPurchaseOrdersIfEmpty() {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, PURCHASE_ORDERS_COL));
    if (!snap.empty) return;
    for (const po of INITIAL_PURCHASE_ORDERS) {
      await setDoc(doc(db, PURCHASE_ORDERS_COL, po.id), { ...po, createdAt: serverTimestamp() });
    }
  } catch {}
}

export async function seedMovementsIfEmpty() {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, MOVEMENTS_COL));
    if (!snap.empty) return;
    for (const m of INITIAL_MOVEMENTS) {
      await setDoc(doc(db, MOVEMENTS_COL, m.id), { ...m, timestamp: serverTimestamp() });
    }
  } catch {}
}

export async function seedCustomersIfEmpty() {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, CUSTOMERS_COL));
    if (!snap.empty) return;
    for (const c of INITIAL_CUSTOMERS) {
      await setDoc(doc(db, CUSTOMERS_COL, c.id), { ...c, createdAt: serverTimestamp() });
    }
  } catch {}
}

export async function seedStaffIfEmpty() {
  if (!hasFirestoreAdminAccess()) return;
  try {
    for (const s of INITIAL_STAFF) {
      const docRef = doc(db, USERS_COL, s.id);
      await setDoc(docRef, { ...s, createdAt: serverTimestamp() }, { merge: true });
    }
  } catch {}
}

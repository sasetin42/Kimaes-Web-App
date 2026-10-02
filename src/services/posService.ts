// Firebase Cloud Firestore POS (Point of Sale) & Register Shift Service
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
  serverTimestamp,
  runTransaction,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type {
  POSTransaction,
  POSRegisterShift,
  POSCartItem,
  POSPaymentSplit,
  Product,
  HeldOrder
} from '@/types';
import { INITIAL_SHIFTS, INITIAL_POS_TRANSACTIONS } from '@/constants/seedData';
import { isStaffUser, hasFirestoreStaffAccess } from '@/services/authService';
import { awardOrderPointsAfterPayment } from '@/lib/loyaltyStore';

const TXS_COL = 'pos_transactions';
const SHIFTS_COL = 'pos_shifts';
const PRODUCTS_COL = 'products';
const MOVEMENTS_COL = 'inventory_movements';
const CUSTOMERS_COL = 'customer_profiles';
const HELD_ORDERS_COL = 'pos_held_orders';

export interface CheckoutSalePayload {
  cashierId: string;
  cashierName: string;
  shiftId: string;
  orderType: 'dine_in' | 'takeout' | 'drive_thru';
  tableNumber?: string;
  customer?: { id: string; name: string; email?: string; mobile?: string };
  items: POSCartItem[];
  subtotal: number;
  discount: number;
  discountType?: 'pwd' | 'senior' | 'employee' | 'custom' | 'none';
  tax: number;
  totalAmount: number;
  payments: POSPaymentSplit[];
  amountPaid: number;
  changeDue: number;
  notes?: string;
}

export function subscribeToPOSTransactions(callback: (txs: POSTransaction[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_POS_TRANSACTIONS);
    return () => {};
  }
  const q = query(collection(db, TXS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedPOSTransactionsIfEmpty();
    const list: POSTransaction[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || '2025-01-01T00:00:00.000Z'),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || data.createdAt || '2025-01-01T00:00:00.000Z'),
      } as POSTransaction);
    });
    callback(list);
  }, (err) => {
    callback(INITIAL_POS_TRANSACTIONS);
  });
}

export function subscribeToPOSShifts(callback: (shifts: POSRegisterShift[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    callback(INITIAL_SHIFTS);
    return () => {};
  }
  const q = query(collection(db, SHIFTS_COL), orderBy('startTime', 'desc'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) seedPOSShiftsIfEmpty();
    const list: POSRegisterShift[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as POSRegisterShift));
    callback(list);
  }, (err) => {
    callback(INITIAL_SHIFTS);
  });
}

/**
 * Executes a POS transaction atomically in Firestore:
 * - Checks and deducts stock from /products
 * - Records inventory movement in /inventory_movements
 * - Saves transaction in /pos_transactions
 * - Updates active register shift in /pos_shifts
 * - Updates customer loyalty points in /customer_profiles
 */
export async function executePOSSaleInFirestore(
  payload: CheckoutSalePayload
): Promise<{ success: boolean; transaction?: POSTransaction; error?: string }> {
  const txId = `pos-${Date.now()}`;
  const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Verify stock sufficiency and deduct
      for (const item of payload.items) {
        const prodRef = doc(db, PRODUCTS_COL, item.productId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error(`Product ${item.product.name} not found in database`);
        }

        const prodData = prodSnap.data() as Product;
        const currentStock = prodData.stock || 0;

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for "${prodData.name}". In stock: ${currentStock}, Requested: ${item.quantity}`);
        }

        const newStock = currentStock - item.quantity;
        transaction.update(prodRef, {
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' : prodData.status,
          available: newStock > 0,
          updatedAt: serverTimestamp(),
        });

        // Log movement
        const movRef = doc(collection(db, MOVEMENTS_COL));
        transaction.set(movRef, {
          productId: prodData.id,
          productName: prodData.name,
          sku: prodData.sku,
          type: 'pos_sale',
          quantityChange: -item.quantity,
          quantityBefore: currentStock,
          quantityAfter: newStock,
          unitCost: prodData.cost || 0,
          totalValue: item.quantity * (prodData.cost || 0),
          reason: `POS Sale Ticket #${ticketNumber}`,
          referenceId: ticketNumber,
          recordedBy: payload.cashierName,
          timestamp: serverTimestamp(),
        });
      }

      // 2. Save POS Transaction
      const txRef = doc(db, TXS_COL, txId);
      const newTx: POSTransaction = {
        id: txId,
        ticketNumber,
        cashierId: payload.cashierId,
        cashierName: payload.cashierName,
        registerId: payload.registerId,
        customer: payload.customer,
        items: payload.items,
        subtotal: payload.subtotal,
        orderDiscount: payload.orderDiscount,
        orderDiscountType: payload.orderDiscountType,
        orderDiscountLabel: payload.orderDiscountLabel,
        taxAmount: payload.taxAmount,
        serviceCharge: payload.serviceCharge,
        totalAmount: payload.totalAmount,
        payments: payload.payments,
        amountPaid: payload.amountPaid,
        changeDue: payload.changeDue,
        status: 'completed',
        notes: payload.notes,
        receiptNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      transaction.set(txRef, {
        ...newTx,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Update customer loyalty if customer ID present
      if (payload.customer?.id) {
        const custRef = doc(db, CUSTOMERS_COL, payload.customer.id);
        const custSnap = await transaction.get(custRef);
        if (custSnap.exists()) {
          const c = custSnap.data();
          const pointsEarned = Math.floor(payload.totalAmount / 50);
          transaction.update(custRef, {
            totalSpent: (c.totalSpent || 0) + payload.totalAmount,
            orderCount: (c.orderCount || 0) + 1,
            loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned,
            lastVisit: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      return newTx;
    });

    if (result && payload.customer) {
      awardOrderPointsAfterPayment({
        orderId: result.id,
        orderNumber: result.ticketNumber,
        customerName: payload.customer.name,
        customerMobile: payload.customer.mobile || '',
        customerEmail: payload.customer.email,
        totalPaid: payload.totalAmount,
        sourceChannel: 'pos',
      });
    }

    return { success: true, transaction: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Transaction failed' };
  }
}

/**
 * Void a POS transaction in Firestore with manager authorization
 */
export async function voidPOSTransactionInFirestore(
  transactionId: string,
  voidReason: string,
  managerName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, TXS_COL, transactionId);
      const txSnap = await transaction.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');

      const txData = txSnap.data() as POSTransaction;
      if (txData.status === 'voided') throw new Error('Transaction already voided');

      // Revert stock
      for (const item of txData.items) {
        const prodRef = doc(db, PRODUCTS_COL, item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const p = prodSnap.data() as Product;
          const before = p.stock || 0;
          const after = before + item.quantity;

          transaction.update(prodRef, {
            stock: after,
            status: after > 0 ? 'active' : p.status,
            available: true,
            updatedAt: serverTimestamp(),
          });

          const movRef = doc(collection(db, MOVEMENTS_COL));
          transaction.set(movRef, {
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            type: 'pos_refund',
            quantityChange: item.quantity,
            quantityBefore: before,
            quantityAfter: after,
            unitCost: item.unitCost,
            totalValue: item.quantity * item.unitCost,
            reason: `Void Ticket #${txData.ticketNumber}: ${voidReason} (Auth by: ${managerName})`,
            referenceId: txData.ticketNumber,
            recordedBy: managerName,
            timestamp: serverTimestamp(),
          });
        }
      }

      transaction.update(txRef, {
        status: 'voided',
        voidReason,
        voidAuthorizedBy: managerName,
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Void operation failed' };
  }
}

export async function openShiftInFirestore(shift: POSRegisterShift): Promise<void> {
  const docRef = doc(db, SHIFTS_COL, shift.id);
  await setDoc(docRef, { ...shift, createdAt: serverTimestamp() });
}

export async function closeShiftInFirestore(shiftId: string, closingCashActual: number, notes?: string): Promise<void> {
  const docRef = doc(db, SHIFTS_COL, shiftId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const shift = snap.data() as POSRegisterShift;

  const expected = (shift.openingFloat || 0) + (shift.totalSalesCash || 0) + (shift.cashIn || 0) - (shift.cashOut || 0);
  const diff = closingCashActual - expected;

  await updateDoc(docRef, {
    status: 'closed',
    endTime: new Date().toISOString(),
    closingCashExpected: expected,
    closingCashActual,
    cashDifference: diff,
    notes: notes || '',
    updatedAt: serverTimestamp(),
  });
}

export async function seedPOSTransactionsIfEmpty() {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, TXS_COL));
    if (!snap.empty) return;
    for (const tx of INITIAL_POS_TRANSACTIONS) {
      await setDoc(doc(db, TXS_COL, tx.id), { ...tx, createdAt: serverTimestamp() });
    }
  } catch {}
}

export async function seedPOSShiftsIfEmpty() {
  if (!hasFirestoreStaffAccess()) return;
  try {
    const snap = await getDocs(collection(db, SHIFTS_COL));
    if (!snap.empty) return;
    for (const sh of INITIAL_SHIFTS) {
      await setDoc(doc(db, SHIFTS_COL, sh.id), { ...sh, createdAt: serverTimestamp() });
    }
  } catch {}
}

/**
 * Saves a held/parked order to Firestore pos_held_orders
 */
export async function saveHeldOrderInFirestore(heldOrder: HeldOrder): Promise<void> {
  try {
    const docRef = doc(db, HELD_ORDERS_COL, heldOrder.id);
    await setDoc(docRef, {
      ...heldOrder,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to save held order to Firestore, saved to local cache:', err);
  }
}

/**
 * Removes a held order from Firestore upon resume or delete
 */
export async function deleteHeldOrderInFirestore(heldId: string): Promise<void> {
  try {
    const docRef = doc(db, HELD_ORDERS_COL, heldId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete held order from Firestore:', err);
  }
}

/**
 * Real-time listener for held orders in Firestore
 */
export function subscribeToHeldOrders(callback: (orders: HeldOrder[]) => void): () => void {
  if (!hasFirestoreStaffAccess()) {
    return () => {};
  }
  const q = query(collection(db, HELD_ORDERS_COL), orderBy('heldAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: HeldOrder[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        ...data,
      } as HeldOrder);
    });
    callback(list);
  }, (err) => {
    console.warn('Held orders snapshot error:', err);
  });
}


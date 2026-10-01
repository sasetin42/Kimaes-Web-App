// Firebase-backed POS Store
import type {
  POSTransaction,
  POSRegisterShift,
  POSCartItem,
  POSPaymentSplit,
  POSTicketStatus,
  Product,
} from '@/types';
import {
  subscribeToPOSTransactions,
  subscribeToPOSShifts,
  executePOSSaleInFirestore,
  voidPOSTransactionInFirestore,
  openShiftInFirestore,
  closeShiftInFirestore,
  CheckoutSalePayload,
} from '@/services/posService';
import { getCentralProducts } from './inventoryStore';

export const INITIAL_SHIFTS: POSRegisterShift[] = [
  {
    id: 'shift-seed-1',
    registerId: 'reg-01',
    registerName: 'Main Terminal Counter 1',
    cashierId: 'staff-admin-1',
    cashierName: 'Kimae Super Admin',
    startTime: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    status: 'open',
    openingFloat: 5000,
    totalSalesCash: 12450,
    totalSalesDigital: 8300,
    totalTransactions: 14,
    cashIn: 0,
    cashOut: 0,
  },
];

export const INITIAL_POS_TRANSACTIONS: POSTransaction[] = [];

let cachedTransactions: POSTransaction[] = [];
let cachedShifts: POSRegisterShift[] = INITIAL_SHIFTS;
let heldOrdersInMemory: HeldOrder[] = [];

let unsubPosTx: (() => void) | null = null;
let unsubPosShifts: (() => void) | null = null;

const setupPOSListeners = () => {
  if (typeof window === 'undefined') return;
  if (unsubPosTx) {
    unsubPosTx();
    unsubPosTx = null;
  }
  if (unsubPosShifts) {
    unsubPosShifts();
    unsubPosShifts = null;
  }

  unsubPosTx = subscribeToPOSTransactions((txs) => {
    cachedTransactions = txs;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kimae_pos_tx_sync'));
    }
  });

  unsubPosShifts = subscribeToPOSShifts((shifts) => {
    cachedShifts = shifts;
  });
};

setupPOSListeners();

if (typeof window !== 'undefined') {
  window.addEventListener('kimae_auth_change', () => {
    setupPOSListeners();
  });
}

export const getPOSTransactions = (): POSTransaction[] => {
  return cachedTransactions;
};

export const savePOSTransactions = (txs: POSTransaction[]) => {
  // Directly saved via Firestore services
};

export const generateTicketNumber = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `TKT-${year}-${num}`;
};

export const generateReceiptNumber = (): string => {
  const num = Math.floor(10000 + Math.random() * 90000);
  const year = new Date().getFullYear();
  return `REC-${year}-${num}`;
};

export const executePOSSale = async (
  payload: CheckoutSalePayload
): Promise<{ success: boolean; transaction?: POSTransaction; error?: string }> => {
  return await executePOSSaleInFirestore(payload);
};

export const voidPOSTransaction = async (
  transactionId: string,
  voidReason: string,
  managerName: string
): Promise<{ success: boolean; error?: string }> => {
  return await voidPOSTransactionInFirestore(transactionId, voidReason, managerName);
};

export interface HeldOrder {
  id: string;
  holdName: string;
  cart: POSCartItem[];
  customer?: any;
  discount: { type: 'fixed' | 'percentage'; value: number; label?: string };
  heldAt: string;
}

export const getHeldOrders = (): HeldOrder[] => {
  return heldOrdersInMemory;
};

export const saveHeldOrders = (orders: HeldOrder[]) => {
  heldOrdersInMemory = orders;
};

export const holdCurrentOrder = (
  holdName: string,
  cart: POSCartItem[],
  customer: any,
  discount: any
) => {
  const entry: HeldOrder = {
    id: `hold-${Date.now()}`,
    holdName: holdName || `Table / Customer ${heldOrdersInMemory.length + 1}`,
    cart,
    customer,
    discount,
    heldAt: new Date().toISOString(),
  };
  heldOrdersInMemory.push(entry);
  return entry;
};

export const removeHeldOrder = (holdId: string): HeldOrder | undefined => {
  const idx = heldOrdersInMemory.findIndex((h) => h.id === holdId);
  if (idx >= 0) {
    const [removed] = heldOrdersInMemory.splice(idx, 1);
    return removed;
  }
  return undefined;
};

export const getPOSShifts = (): POSRegisterShift[] => {
  return cachedShifts;
};

export const getActiveShift = (): POSRegisterShift | undefined => {
  return cachedShifts.find((s) => s.status === 'open');
};

export const closeRegisterShift = async (closingCashActual: number, notes?: string) => {
  const active = getActiveShift();
  if (!active) return null;
  await closeShiftInFirestore(active.id, closingCashActual, notes);
  return active;
};

export const openRegisterShift = async (
  registerId: string,
  registerName: string,
  cashierId: string,
  cashierName: string,
  openingFloat: number
) => {
  const newShift: POSRegisterShift = {
    id: `shift-${Date.now()}`,
    registerId,
    registerName,
    cashierId,
    cashierName,
    startTime: new Date().toISOString(),
    status: 'open',
    openingFloat,
    totalSalesCash: 0,
    totalSalesDigital: 0,
    totalTransactions: 0,
    cashIn: 0,
    cashOut: 0,
  };
  await openShiftInFirestore(newShift);
  return newShift;
};

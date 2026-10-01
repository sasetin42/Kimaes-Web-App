// Firebase-backed Central Inventory & Purchasing Store
import type {
  Product,
  Supplier,
  PurchaseOrder,
  InventoryMovement,
  CustomerProfile,
  User,
} from '@/types';
import {
  subscribeToProducts,
  saveProductToFirestore,
  updateProductStock,
  archiveProduct,
  seedProductsIfEmpty
} from '@/services/productService';
import {
  subscribeToSuppliers,
  saveSupplier,
  subscribeToPurchaseOrders,
  savePurchaseOrder,
  receivePurchaseOrderInFirestore,
  subscribeToInventoryMovements,
  adjustStockInFirestore,
  subscribeToCustomers,
  updateCustomerSpendingInFirestore,
  subscribeToStaff,
  saveStaffMember
} from '@/services/inventoryService';

import { INITIAL_CENTRAL_PRODUCTS } from '@/constants/seedData';

// In-memory reactive caches updated by real-time Firestore listeners
let cachedProducts: Product[] = INITIAL_CENTRAL_PRODUCTS;
let cachedMovements: InventoryMovement[] = [];
let cachedSuppliers: Supplier[] = [];
let cachedPurchaseOrders: PurchaseOrder[] = [];
let cachedCustomers: CustomerProfile[] = [];
let cachedStaff: User[] = [];

// Helper to compare products deeply enough to detect meaningful changes without flickering on timestamp strings
export const areProductsEqual = (a: Product[], b: Product[]): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (
      pa.id !== pb.id ||
      pa.stock !== pb.stock ||
      pa.price !== pb.price ||
      pa.promoPrice !== pb.promoPrice ||
      pa.available !== pb.available ||
      pa.featured !== pb.featured ||
      pa.bestSeller !== pb.bestSeller ||
      pa.isNew !== pb.isNew ||
      pa.status !== pb.status ||
      pa.name !== pb.name ||
      pa.category !== pb.category ||
      pa.images?.[0] !== pb.images?.[0]
    ) {
      return false;
    }
  }
  return true;
};

// Event constants
export const PRODUCTS_EVENT = 'kimae_products_sync';
export const INVENTORY_EVENT = 'kimae_inventory_sync';

let productSyncTimeout: ReturnType<typeof setTimeout> | null = null;
let inventorySyncTimeout: ReturnType<typeof setTimeout> | null = null;

export const broadcastProductsSync = () => {
  if (typeof window === 'undefined') return;
  if (productSyncTimeout) clearTimeout(productSyncTimeout);
  productSyncTimeout = setTimeout(() => {
    window.dispatchEvent(new Event(PRODUCTS_EVENT));
  }, 40);
};

export const broadcastSync = () => {
  if (typeof window === 'undefined') return;
  if (inventorySyncTimeout) clearTimeout(inventorySyncTimeout);
  inventorySyncTimeout = setTimeout(() => {
    window.dispatchEvent(new Event(INVENTORY_EVENT));
  }, 40);
};

import { isStaffUser } from '@/services/authService';

// Initialize real-time listeners on startup
subscribeToProducts((products) => {
  if (!areProductsEqual(cachedProducts, products)) {
    cachedProducts = products;
    broadcastProductsSync();
    broadcastSync();
  }
});

// Privileged listeners: only activate for staff/admin users to avoid unauthorized permission errors
let unsubStaffListeners: (() => void)[] = [];

const setupStaffListeners = () => {
  unsubStaffListeners.forEach(unsub => unsub());
  unsubStaffListeners = [];

  if (typeof window === 'undefined') return;
  if (!isStaffUser()) return;

  unsubStaffListeners.push(
    subscribeToInventoryMovements((movs) => {
      cachedMovements = movs;
      broadcastSync();
    })
  );

  unsubStaffListeners.push(
    subscribeToSuppliers((sups) => {
      cachedSuppliers = sups;
      broadcastSync();
    })
  );

  unsubStaffListeners.push(
    subscribeToPurchaseOrders((pos) => {
      cachedPurchaseOrders = pos;
      broadcastSync();
    })
  );

  unsubStaffListeners.push(
    subscribeToCustomers((custs) => {
      cachedCustomers = custs;
      broadcastSync();
    })
  );

  unsubStaffListeners.push(
    subscribeToStaff((staff) => {
      cachedStaff = staff;
      broadcastSync();
    })
  );
};

setupStaffListeners();
if (typeof window !== 'undefined') {
  window.addEventListener('kimae_auth_change', () => {
    setupStaffListeners();
  });
}

/**
 * Subscribe specifically to product catalog updates (Storefront, Menu, POS product grid)
 */
export const subscribeToProductUpdates = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(PRODUCTS_EVENT, callback);
  return () => {
    window.removeEventListener(PRODUCTS_EVENT, callback);
  };
};

/**
 * General inventory update subscription (Movements, Audits, Admin tables)
 */
export const subscribeToInventoryUpdates = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(INVENTORY_EVENT, callback);
  return () => {
    window.removeEventListener(INVENTORY_EVENT, callback);
  };
};

// -------------------------------------------------------------
// Products
// -------------------------------------------------------------
export const getCentralProducts = (): Product[] => {
  return cachedProducts;
};

export const saveCentralProducts = async (products: Product[]) => {
  for (const p of products) {
    await saveProductToFirestore(p);
  }
};

export const getProductById = (id: string): Product | undefined => {
  return cachedProducts.find((p) => p.id === id);
};

export const getProductBySkuOrBarcode = (query: string): Product | undefined => {
  const clean = query.trim().toLowerCase();
  return cachedProducts.find(
    (p) =>
      p.sku.toLowerCase() === clean ||
      (p.barcode && p.barcode.toLowerCase() === clean) ||
      p.id.toLowerCase() === clean
  );
};

// -------------------------------------------------------------
// Movements
// -------------------------------------------------------------
export const getInventoryMovements = (): InventoryMovement[] => {
  return cachedMovements;
};

export const recordInventoryMovement = async (movement: Omit<InventoryMovement, 'id' | 'timestamp'>) => {
  // Movement recording delegated to Firestore atomic operations
};

export interface StockDeductionItem {
  productId: string;
  quantity: number;
}

export const deductStockForSale = (
  items: StockDeductionItem[],
  saleType: 'pos_sale' | 'online_sale',
  referenceId: string,
  recordedBy: string = 'System'
): { success: boolean; error?: string } => {
  for (const item of items) {
    const p = cachedProducts.find((prod) => prod.id === item.productId);
    if (p && p.stock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${p.name}". In stock: ${p.stock}, Requested: ${item.quantity}`,
      };
    }
  }
  return { success: true };
};

export const adjustStockManual = async (
  productId: string,
  newStock: number,
  type: 'adjustment' | 'waste_damaged' | 'physical_count' | 'stock_in' | 'stock_out',
  reason: string,
  recordedBy: string
) => {
  await adjustStockInFirestore(productId, newStock, type, reason, recordedBy);
};

// -------------------------------------------------------------
// Suppliers
// -------------------------------------------------------------
export const getSuppliers = (): Supplier[] => {
  return cachedSuppliers;
};

export const saveSuppliers = async (suppliers: Supplier[]) => {
  for (const s of suppliers) {
    await saveSupplier(s);
  }
};

export const addOrUpdateSupplier = async (supplier: Supplier) => {
  await saveSupplier(supplier);
};

// -------------------------------------------------------------
// Purchase Orders
// -------------------------------------------------------------
export const getPurchaseOrders = (): PurchaseOrder[] => {
  return cachedPurchaseOrders;
};

export const savePurchaseOrders = async (orders: PurchaseOrder[]) => {
  for (const o of orders) {
    await savePurchaseOrder(o);
  }
};

export const receivePurchaseOrder = async (
  poId: string,
  receivedItems: { productId: string; receivedQuantity: number }[],
  receiverName: string
) => {
  await receivePurchaseOrderInFirestore(poId, receivedItems, receiverName);
};

// -------------------------------------------------------------
// Customers
// -------------------------------------------------------------
export const getCustomerProfiles = (): CustomerProfile[] => {
  return cachedCustomers;
};

export const saveCustomerProfiles = (customers: CustomerProfile[]) => {
  // Handled directly via Firestore updates
};

export const updateCustomerSpending = async (
  customerId: string,
  amount: number,
  pointsEarned: number
) => {
  await updateCustomerSpendingInFirestore(customerId, amount, pointsEarned);
};

// -------------------------------------------------------------
// Staff
// -------------------------------------------------------------
export const getStaffMembers = (): User[] => {
  return cachedStaff;
};

export const saveStaffMembers = async (staff: User[]) => {
  for (const s of staff) {
    await saveStaffMember(s);
  }
};

// Initial Seeds for Firebase Cloud Firestore
import type { Supplier, PurchaseOrder, InventoryMovement, CustomerProfile, User, Product } from '@/types';
import { PRODUCTS } from '@/constants/data';

export const INITIAL_CENTRAL_PRODUCTS: Product[] = PRODUCTS.map((p, idx) => ({
  ...p,
  barcode: `480651${(100000 + idx * 17).toString()}`,
  brand: "Kimae's Kitchen",
  supplierId: idx % 2 === 0 ? 'sup-1' : 'sup-2',
  cost: p.cost || Math.round(p.price * 0.55),
  reorderLevel: 15,
  unit: p.servingSize?.toLowerCase().includes('bilao') ? 'bilao' : 'tray',
  taxConfig: 'standard_vat',
  expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (idx + 3)).toISOString().split('T')[0],
  batchNumber: `LOT-2026-B${(101 + idx).toString()}`,
}));

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'San Miguel Meat & Poultry Supply',
    code: 'SUP-SMP',
    contactPerson: 'Roberto Carlos',
    email: 'orders@sanmiguelmeat.ph',
    phone: '0917-888-2341',
    address: 'Balintawak Commercial Center, Quezon City',
    paymentTerms: 'Net 30',
    leadTimeDays: 2,
    taxId: '204-551-890-000',
    active: true,
    createdAt: '2025-01-10',
  },
  {
    id: 'sup-2',
    name: 'Divisoria Fresh Harvest & Noodle Corp',
    code: 'SUP-DFH',
    contactPerson: 'Corazon Lim',
    email: 'supply@divisoriafresh.ph',
    phone: '0922-456-7890',
    address: 'Binondo Wholesale Market, Manila',
    paymentTerms: 'COD',
    leadTimeDays: 1,
    taxId: '109-883-221-000',
    active: true,
    createdAt: '2025-01-15',
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1001',
    poNumber: 'PO-2026-0089',
    supplierId: 'sup-1',
    supplierName: 'San Miguel Meat & Poultry Supply',
    status: 'received',
    items: [
      {
        productId: 'prod-1',
        productName: "Kimae's Special Party Bilao Ingredients",
        sku: 'KPB-001',
        unit: 'bilao',
        orderQuantity: 30,
        receivedQuantity: 30,
        costPrice: 800,
        totalCost: 24000,
      },
    ],
    subtotal: 24000,
    tax: 2880,
    shippingCost: 500,
    totalCost: 27380,
    notes: 'Routine replenishment',
    expectedDate: '2026-08-28',
    receivedDate: '2026-08-28',
    createdBy: 'Theresa Cruz',
    createdAt: '2026-08-26T10:00:00Z',
    updatedAt: '2026-08-28T14:30:00Z',
  },
];

export const INITIAL_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: "Kimae's Special Party Bilao",
    sku: 'KPB-001',
    type: 'purchase_received',
    quantityChange: 30,
    quantityBefore: 20,
    quantityAfter: 50,
    unitCost: 800,
    totalValue: 24000,
    reason: 'Received PO-2026-0089 from San Miguel Meat',
    referenceId: 'PO-2026-0089',
    batchNumber: 'LOT-2026-B101',
    recordedBy: 'Mark Bautista',
    timestamp: '2026-08-28T14:30:00Z',
  },
];

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust-101',
    name: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    mobile: '0917-123-4567',
    loyaltyPoints: 340,
    storeCredit: 250,
    totalSpent: 12500,
    orderCount: 8,
    memberTier: 'Gold',
    notes: 'Regular customer for Sunday family dinners.',
    lastVisit: new Date().toISOString(),
    createdAt: '2025-03-12',
  },
];

export const INITIAL_STAFF: User[] = [
  {
    id: 'staff-admin-1',
    name: 'Kimae Super Admin',
    email: 'admin@gmail.com',
    mobile: '0917-000-0001',
    role: 'super_admin',
    pin: '9999',
    status: 'active',
    permissions: ['all'],
    createdAt: '2025-01-01',
  },
];

export const INITIAL_SHIFTS: any[] = [
  {
    id: 'shift-1',
    registerId: 'REG-01',
    registerName: 'Main Cash Register #1',
    cashierId: 'staff-admin-1',
    cashierName: 'Kimae Super Admin',
    startTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'open',
    openingFloat: 5000,
    totalSalesCash: 12450,
    totalSalesDigital: 8900,
    totalTransactions: 14,
    cashIn: 0,
    cashOut: 0,
    notes: 'Morning shift operational',
  },
];

export const INITIAL_POS_TRANSACTIONS: any[] = [
  {
    id: 'pos-tx-101',
    ticketNumber: 'TKT-2026-0042',
    cashierId: 'staff-admin-1',
    cashierName: 'Kimae Super Admin',
    registerId: 'REG-01',
    customer: {
      id: 'cust-101',
      name: 'Maria Santos',
      mobile: '0917-123-4567',
      loyaltyPoints: 340,
    },
    items: [],
    subtotal: 1500,
    orderDiscount: 100,
    orderDiscountLabel: 'Senior / PWD 10%',
    taxAmount: 0,
    serviceCharge: 0,
    totalAmount: 1400,
    payments: [
      {
        id: 'pay-1',
        method: 'cash',
        methodLabel: 'Cash',
        amount: 1400,
        tendered: 1500,
        change: 100,
      },
    ],
    amountPaid: 1500,
    changeDue: 100,
    status: 'completed',
    receiptNumber: 'REC-2026-0042',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

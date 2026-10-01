// Core types for Kimae's Party Bilao Platform

export type UserRole = 'customer' | 'admin' | 'rider' | 'kitchen' | 'manager' | 'cashier' | 'inventory_staff' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  avatar?: string;
  pin?: string;
  status?: 'active' | 'inactive';
  permissions?: string[];
  createdAt: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  house: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  landmark?: string;
  notes?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

export interface ProductOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'quantity';
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  values: OptionValue[];
}

export interface OptionValue {
  id: string;
  label: string;
  additionalPrice: number;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  supplierId?: string;
  description: string;
  shortDescription: string;
  images: string[];
  price: number;
  promoPrice?: number;
  cost: number;
  stock: number;
  minOrder: number;
  maxOrder: number;
  reorderLevel?: number;
  unit?: string; // pcs, kg, tray, bilao, pack, liter, box
  servingSize: string;
  personsServed: number;
  prepTime: number; // minutes
  available: boolean;
  featured: boolean;
  bestSeller: boolean;
  isNew: boolean;
  recommended: boolean;
  taxConfig?: 'standard_vat' | 'zero_rated' | 'vat_exempt';
  expirationDate?: string;
  batchNumber?: string;
  status: 'active' | 'archived' | 'out_of_stock';
  options: ProductOption[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  sortOrder: number;
  active: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string | string[]>;
  optionPriceAdd: number;
  specialInstructions?: string;
  savedForLater?: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'payment_verification'
  | 'confirmed'
  | 'queued'
  | 'preparing'
  | 'ready'
  | 'rider_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'arriving'
  | 'delivered'
  | 'completed'
  | 'cancel_requested'
  | 'cancelled'
  | 'payment_failed'
  | 'refund_requested'
  | 'refunded'
  | 'delivery_failed'
  | 'returned'
  | 'customer_pickup';

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  actor?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: User;
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod';
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: Address;
  scheduledAt?: string;
  isAsap: boolean;
  estimatedPrepTime: number;
  estimatedDeliveryTime: number;
  status: OrderStatus;
  timeline: OrderTimeline[];
  rider?: Rider;
  proofOfDelivery?: ProofOfDelivery;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProofOfDelivery {
  customerName: string;
  otp?: string;
  photoUrl?: string;
  signature?: string;
  timestamp: string;
  coordinates?: { lat: number; lng: number };
  notes?: string;
  amountCollected?: number;
}

export interface Rider {
  id: string;
  user: User;
  vehicleType: 'motorcycle' | 'bicycle' | 'car';
  plateNumber: string;
  status: 'online' | 'offline' | 'available' | 'busy' | 'break' | 'inactive';
  currentLocation?: { lat: number; lng: number };
  currentOrder?: string;
  todayDeliveries: number;
  totalDeliveries: number;
  rating: number;
  earnings: number;
  activeZone?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minSpend: number;
  maxDiscount?: number;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
  firstOrderOnly: boolean;
  startDate: string;
  endDate: string;
  usageLimit: number;
  perCustomerLimit: number;
  usedCount: number;
  active: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  barangay: string;
  city: string;
  province: string;
  deliveryFee: number;
  minOrder: number;
  maxDistance: number;
  estimatedTime: number;
  freeDeliveryThreshold?: number;
  active: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStock: number;
  reorderThreshold: number;
  supplier: string;
  cost: number;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'delivery' | 'promo' | 'system' | 'alert';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  orderCutoff: string;
  isOpen: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cod' | 'cop' | 'online' | 'bank' | 'ewallet' | 'other';
  enabled: boolean;
  instructions?: string;
  icon?: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  productId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// ---------------------------------------------
// Centralized Inventory & Purchasing Types
// ---------------------------------------------

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string; // e.g. "Net 30", "COD", "7 Days"
  leadTimeDays: number;
  taxId?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  orderQuantity: number;
  receivedQuantity: number;
  costPrice: number;
  totalCost: number;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalCost: number;
  notes?: string;
  expectedDate?: string;
  receivedDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType =
  | 'stock_in'
  | 'stock_out'
  | 'pos_sale'
  | 'online_sale'
  | 'pos_refund'
  | 'online_refund'
  | 'purchase_received'
  | 'supplier_return'
  | 'adjustment'
  | 'waste_damaged'
  | 'physical_count'
  | 'transfer';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: InventoryMovementType;
  quantityChange: number; // positive for additions, negative for deductions
  quantityBefore: number;
  quantityAfter: number;
  unitCost: number;
  totalValue: number;
  reason: string;
  referenceId?: string; // Order #, PO #, Ticket #
  batchNumber?: string;
  expirationDate?: string;
  recordedBy: string; // User/Cashier Name
  timestamp: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  expirationDate: string;
  receivedDate: string;
  supplierId?: string;
  notes?: string;
}

// ---------------------------------------------
// POS (Point of Sale) Types
// ---------------------------------------------

export interface POSCartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  itemDiscount: number; // in PHP
  itemDiscountPercent?: number;
  selectedOptions: Record<string, string | string[]>;
  optionPriceAdd: number;
  notes?: string;
  lineTotal: number;
}

export type POSPaymentMethodType = 'cash' | 'card' | 'gcash' | 'maya' | 'bank_transfer' | 'custom';

export interface POSPaymentSplit {
  id: string;
  method: POSPaymentMethodType;
  methodLabel: string;
  amount: number;
  referenceNumber?: string;
  tendered?: number; // for cash
  change?: number; // for cash
}

export type POSTicketStatus = 'completed' | 'on_hold' | 'voided' | 'refunded';

export interface POSTransaction {
  id: string;
  ticketNumber: string;
  cashierId: string;
  cashierName: string;
  registerId: string;
  customer?: {
    id?: string;
    name: string;
    mobile?: string;
    email?: string;
    loyaltyPoints?: number;
  };
  items: POSCartItem[];
  subtotal: number;
  orderDiscount: number;
  orderDiscountType?: 'fixed' | 'percentage';
  orderDiscountLabel?: string;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  payments: POSPaymentSplit[];
  amountPaid: number;
  changeDue: number;
  status: POSTicketStatus;
  notes?: string;
  holdName?: string;
  voidReason?: string;
  voidAuthorizedBy?: string;
  receiptNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSRegisterShift {
  id: string;
  registerId: string;
  registerName: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingFloat: number;
  closingCashExpected?: number;
  closingCashActual?: number;
  cashDifference?: number;
  totalSalesCash: number;
  totalSalesDigital: number;
  totalTransactions: number;
  cashIn: number;
  cashOut: number;
  notes?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  avatar?: string;
  loyaltyPoints: number;
  storeCredit: number;
  totalSpent: number;
  orderCount: number;
  memberTier: 'Regular' | 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  notes?: string;
  lastVisit: string;
  createdAt: string;
}


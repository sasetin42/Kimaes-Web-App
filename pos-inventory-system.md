# Kimae's POS & Centralized Inventory System Integration Plan

## Goal
Seamlessly integrate a full-featured, production-ready, real-time synchronized Point of Sale (POS) and Centralized Inventory Management System into Kimae's Online Food Market web app without disrupting existing online store, kitchen display, or rider dispatch features.

## Tasks
- [x] Task 1: Expand Type Models (`src/types/index.ts`) → Add schemas for POS transactions, inventory movements, batches/lots, suppliers, purchase orders, customers, and staff permissions. Verify: TypeScript compiles without errors.
- [x] Task 2: Centralized Inventory & POS Engine (`src/lib/inventoryStore.ts`, `src/lib/posStore.ts`) → Implement unified store handling atomic stock deduction, audit movement recording, batch management, low-stock triggers, supplier PO lifecycle, and shift registers. Verify: Mock state updates and persists in localStorage.
- [x] Task 3: Online Store & Checkout Integration (`src/pages/CheckoutPage.tsx`) → Hook checkout flow into the centralized inventory deduction engine to automatically deduct stock and record online order audit logs. Verify: Placing online order decrements inventory.
- [x] Task 4: Complete POS Register Interface (`src/pages/pos/POSRegister.tsx`, `src/pages/pos/POSReceiptModal.tsx`) → Build touch-first/barcode-ready cashier screen with variants, discounts, split/multi-tender payments, hold/resume orders, manager PIN voiding, and 80mm printable receipts. Verify: Complete a transaction and generate receipt.
- [x] Task 5: Centralized Inventory Dashboard (`src/pages/admin/AdminInventory.tsx`) → Build real-time stock monitor, stock adjustment/waste logging, expiration/batch tracking, reorder alerts, and chronological audit ledger. Verify: Stock adjustment reflects immediately.
- [x] Task 6: Supplier & Purchase Management (`src/pages/admin/AdminSuppliers.tsx`, `src/pages/admin/AdminPurchasing.tsx`) → Build supplier directory and purchase order goods receiving flow that automatically increases product inventory. Verify: Receiving PO updates stock.
- [x] Task 7: Customer & Employee Management (`src/pages/admin/AdminCustomers.tsx`, `src/pages/admin/AdminStaff.tsx`) → Add customer loyalty & spending history, plus staff roles (Super Admin, Admin, Manager, Cashier, Inventory Staff) with activity logs. Verify: Role switching and customer lookup work.
- [x] Task 8: Business Reports & Analytics (`src/pages/admin/AdminReports.tsx`) → Build date-filtered sales reports (gross, net, profit margin, tax, payment breakdown) and inventory valuation with CSV/Print export. Verify: Metrics aggregate correctly.
- [x] Task 9: Route Integration & Admin Navigation (`src/App.tsx`, `src/pages/admin/AdminLayout.tsx`) → Wire all POS and Inventory routes into the application router and sidebar navigation. Verify: All routes navigate smoothly.
- [x] Task 10: Verification & Quality Gate → Run TypeScript typecheck, linting, and build verification. Verify: `npm run build` succeeds cleanly.

## Done When
- [x] All 10 requirements from the user request are implemented and fully interactive.
- [x] POS sales, online store orders, stock adjustments, and purchase receiving synchronize to the same inventory in real-time.
- [x] No dummy buttons or placeholder dialogs remain.
- [x] Application builds with zero compile or syntax errors.

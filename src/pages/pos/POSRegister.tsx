import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Barcode, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, QrCode, PauseCircle, PlayCircle, RotateCcw,
  User, Tag, Layers, ArrowLeft, X, ShieldAlert, Sparkles, Check,
  Clock, FileText, Printer, AlertTriangle, ChevronRight, Utensils
} from 'lucide-react';
import {
  getCentralProducts,
  getProductBySkuOrBarcode,
  getCustomerProfiles,
  subscribeToProductUpdates,
  areProductsEqual,
} from '@/lib/inventoryStore';
import {
  executePOSSale,
  getHeldOrders,
  holdCurrentOrder,
  removeHeldOrder,
  deleteHeldOrder,
  voidPOSTransaction,
  getPOSTransactions,
  getActiveShift,
} from '@/lib/posStore';
import { CATEGORIES } from '@/constants/data';
import { formatPrice } from '@/lib/store';
import type {
  Product,
  POSCartItem,
  POSPaymentSplit,
  POSPaymentMethodType,
  CustomerProfile,
  POSTransaction,
  HeldOrder,
} from '@/types';
import POSReceiptModal from './POSReceiptModal';
import { toast } from 'sonner';

export default function POSRegister() {
  const [products, setProducts] = useState<Product[]>(getCentralProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [orderDiscountType, setOrderDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [orderDiscountValue, setOrderDiscountValue] = useState<number>(0);
  const [orderDiscountLabel, setOrderDiscountLabel] = useState('');

  const [heldOrdersList, setHeldOrdersList] = useState<HeldOrder[]>(getHeldOrders());
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdLabelInput, setHoldLabelInput] = useState('');
  const [holdNotesInput, setHoldNotesInput] = useState('');
  const [holdOrderType, setHoldOrderType] = useState<'dine_in' | 'takeout' | 'drive_thru'>('takeout');
  const [heldSearchQuery, setHeldSearchQuery] = useState('');
  const [isSubmittingHold, setIsSubmittingHold] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [variantSelections, setVariantSelections] = useState<Record<string, string | string[]>>({});

  const [completedTx, setCompletedTx] = useState<POSTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [payments, setPayments] = useState<POSPaymentSplit[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<POSPaymentMethodType>('cash');
  const [tenderAmount, setTenderAmount] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');

  const [voidTargetTx, setVoidTargetTx] = useState<POSTransaction | null>(null);
  const [managerPin, setManagerPin] = useState('');
  const [voidReason, setVoidReason] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const activeShift = getActiveShift();
  const cashierName = activeShift?.cashierName || 'Bea Alonzo';

  useEffect(() => {
    const handleHeldSync = () => {
      setHeldOrdersList([...getHeldOrders()]);
    };
    window.addEventListener('kimae_pos_held_sync', handleHeldSync);
    return () => {
      window.removeEventListener('kimae_pos_held_sync', handleHeldSync);
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToProductUpdates(() => {
      setProducts((prev) => {
        const next = getCentralProducts();
        return areProductsEqual(prev, next) ? prev : next;
      });
    });
    return unsub;
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.lineTotal, 0), [cart]);

  const discountAmount = useMemo(() => {
    if (orderDiscountValue <= 0) return 0;
    if (orderDiscountType === 'percentage') {
      return Math.round((subtotal * orderDiscountValue) / 100);
    }
    return Math.min(subtotal, orderDiscountValue);
  }, [subtotal, orderDiscountType, orderDiscountValue]);

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const matched = getProductBySkuOrBarcode(barcodeInput);
    if (matched) {
      handleProductSelect(matched);
      setBarcodeInput('');
    } else {
      toast.error(`Barcode / SKU "${barcodeInput}" not recognized!`);
    }
  };

  const handleProductSelect = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }
    if (product.options && product.options.length > 0) {
      setSelectedProductForVariant(product);
      setVariantSelections({});
      setShowVariantModal(true);
      return;
    }
    addToCart(product, {}, 0);
  };

  const addToCart = (
    product: Product,
    selectedOptions: Record<string, string | string[]>,
    optionPriceAdd: number
  ) => {
    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === product.id &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );
    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    if (currentQtyInCart + 1 > product.stock) {
      toast.error(`Cannot add more. Only ${product.stock} in stock!`);
      return;
    }
    const unitPrice = (product.promoPrice || product.price) + optionPriceAdd;
    if (existingIndex >= 0) {
      const updated = [...cart];
      const itm = updated[existingIndex];
      itm.quantity += 1;
      itm.lineTotal = itm.quantity * (itm.unitPrice - itm.itemDiscount);
      setCart(updated);
    } else {
      const newItem: POSCartItem = {
        cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: product.id,
        product,
        quantity: 1,
        unitPrice,
        unitCost: product.cost,
        itemDiscount: 0,
        selectedOptions,
        optionPriceAdd,
        lineTotal: unitPrice,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateItemQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) {
              toast.error(`Maximum available stock is ${item.product.stock}`);
              return item;
            }
            return {
              ...item,
              quantity: nextQty,
              lineTotal: nextQty * (item.unitPrice - item.itemDiscount),
            };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const updateItemDiscount = (cartItemId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const validDiscount = Math.min(item.unitPrice, Math.max(0, discount));
          return {
            ...item,
            itemDiscount: validDiscount,
            lineTotal: item.quantity * (item.unitPrice - validDiscount),
          };
        }
        return item;
      })
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const clearCurrentCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear entire cart?')) {
      setCart([]);
      setSelectedCustomer(null);
      setOrderDiscountValue(0);
    }
  };

  const applyPresetDiscount = (type: 'fixed' | 'percentage', value: number, label: string) => {
    setOrderDiscountType(type);
    setOrderDiscountValue(value);
    setOrderDiscountLabel(label);
    toast.success(`Applied ${label}`);
  };

  const handleOpenHoldDialog = () => {
    if (cart.length === 0) {
      toast.error('Cannot hold an empty cart! Please add items to hold.');
      return;
    }
    const defaultLabel = selectedCustomer?.name
      ? `${selectedCustomer.name}`
      : `Table ${heldOrdersList.length + 1}`;
    setHoldLabelInput(defaultLabel);
    setHoldNotesInput('');
    setHoldOrderType('takeout');
    setShowHoldDialog(true);
  };

  const handleConfirmHoldOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdLabelInput.trim()) {
      toast.error('Please enter a ticket label or customer/table identifier.');
      return;
    }
    setIsSubmittingHold(true);
    try {
      const held = await holdCurrentOrder(
        holdLabelInput.trim(),
        cart,
        selectedCustomer,
        {
          type: orderDiscountType,
          value: orderDiscountValue,
          label: orderDiscountLabel,
        },
        {
          notes: holdNotesInput.trim(),
          orderType: holdOrderType,
          cashierId: activeShift?.cashierId,
          cashierName,
          registerId: activeShift?.registerId,
        }
      );
      setHeldOrdersList([...getHeldOrders()]);
      setCart([]);
      setSelectedCustomer(null);
      setOrderDiscountValue(0);
      setShowHoldDialog(false);
      toast.success(`Order held successfully as "${held.holdName}" (#${held.ticketNumber})`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to hold order');
    } finally {
      setIsSubmittingHold(false);
    }
  };

  const handleResumeOrder = async (heldId: string) => {
    if (cart.length > 0) {
      const confirmReplace = confirm(
        'The active cart already has items! Overwrite active cart with this held order?'
      );
      if (!confirmReplace) return;
    }

    const resumed = await removeHeldOrder(heldId);
    if (resumed) {
      setHeldOrdersList([...getHeldOrders()]);
      setCart(resumed.cart);
      setSelectedCustomer(resumed.customer || null);
      if (resumed.discount) {
        setOrderDiscountType(resumed.discount.type);
        setOrderDiscountValue(resumed.discount.value);
        setOrderDiscountLabel(resumed.discount.label || '');
      }
      setShowHeldOrdersModal(false);
      toast.success(`Restored order: "${resumed.holdName}" (${resumed.cart.length} items)`);
    } else {
      toast.error('Could not find held order.');
    }
  };

  const handleDeleteHeldOrder = async (heldId: string, holdName: string) => {
    if (confirm(`Are you sure you want to discard held order "${holdName}"?`)) {
      await deleteHeldOrder(heldId);
      setHeldOrdersList([...getHeldOrders()]);
      toast.info(`Held order "${holdName}" discarded.`);
    }
  };

  const filteredHeldOrders = useMemo(() => {
    if (!heldSearchQuery.trim()) return heldOrdersList;
    const q = heldSearchQuery.toLowerCase();
    return heldOrdersList.filter(
      (h) =>
        h.holdName.toLowerCase().includes(q) ||
        (h.ticketNumber && h.ticketNumber.toLowerCase().includes(q)) ||
        (h.customer?.name && h.customer.name.toLowerCase().includes(q)) ||
        (h.notes && h.notes.toLowerCase().includes(q))
    );
  }, [heldOrdersList, heldSearchQuery]);

  const openPaymentScreen = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    setPayments([]);
    setActivePaymentMethod('cash');
    setTenderAmount(totalAmount.toString());
    setRefNumber('');
    setShowPaymentModal(true);
  };

  const handleAddPaymentSplit = (customAmount?: number) => {
    const amt = customAmount !== undefined ? customAmount : parseFloat(tenderAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount!');
      return;
    }
    const methodLabels: Record<POSPaymentMethodType, string> = {
      cash: 'Cash',
      card: 'Credit/Debit Card',
      gcash: 'GCash QR',
      maya: 'Maya QR',
      bank_transfer: 'Bank Transfer',
      custom: 'Store Credit',
    };
    const isCash = activePaymentMethod === 'cash';
    const amountToApply = Math.min(amt, remainingBalance);
    const tendered = isCash ? amt : amountToApply;
    const change = isCash ? Math.max(0, amt - remainingBalance) : 0;

    const newSplit: POSPaymentSplit = {
      id: `split-${Date.now()}`,
      method: activePaymentMethod,
      methodLabel: methodLabels[activePaymentMethod],
      amount: amountToApply,
      tendered,
      change,
      referenceNumber: refNumber || undefined,
    };
    const nextPayments = [...payments, newSplit];
    setPayments(nextPayments);
    const nextTotalPaid = nextPayments.reduce((s, p) => s + p.amount, 0);
    const nextRem = Math.max(0, totalAmount - nextTotalPaid);
    setTenderAmount(nextRem.toString());
    setRefNumber('');
  };

  const handleCompleteSale = () => {
    if (remainingBalance > 0) {
      toast.error(`Unpaid balance remaining: ${formatPrice(remainingBalance)}`);
      return;
    }
    const totalTendered = payments.reduce((s, p) => s + (p.tendered || p.amount), 0);
    const changeDue = Math.max(0, totalTendered - totalAmount);

    const result = executePOSSale({
      cashierId: activeShift?.cashierId || 'cashier-1',
      cashierName,
      registerId: activeShift?.registerId || 'REG-01',
      customer: selectedCustomer
        ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            mobile: selectedCustomer.mobile,
            email: selectedCustomer.email,
            loyaltyPoints: selectedCustomer.loyaltyPoints,
          }
        : undefined,
      items: cart,
      subtotal,
      orderDiscount: discountAmount,
      orderDiscountType,
      orderDiscountLabel,
      taxAmount: 0,
      serviceCharge: 0,
      totalAmount,
      payments,
      amountPaid: totalTendered,
      changeDue,
    });

    if (!result.success) {
      toast.error(result.error || 'Sale failed!');
      return;
    }

    setShowPaymentModal(false);
    setCart([]);
    setSelectedCustomer(null);
    setOrderDiscountValue(0);
    setCompletedTx(result.transaction || null);
    setShowReceiptModal(true);
    toast.success(`Transaction Completed! Ticket #${result.transaction?.ticketNumber}`);
  };

  const handleAuthorizeVoid = () => {
    if (managerPin !== '1234' && managerPin !== '9999') {
      toast.error('Invalid Manager PIN authorization!');
      return;
    }
    if (!voidReason.trim()) {
      toast.error('Please provide a reason for voiding this ticket.');
      return;
    }
    if (!voidTargetTx) return;

    const res = voidPOSTransaction(voidTargetTx.id, voidReason, 'Theresa Cruz (Manager)');
    if (res.success) {
      toast.success(`Ticket #${voidTargetTx.ticketNumber} voided and stock restored.`);
      setShowVoidModal(false);
      setVoidTargetTx(null);
      setManagerPin('');
      setVoidReason('');
    } else {
      toast.error(res.error || 'Failed to void transaction');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/40 overflow-hidden select-none">
      <header className="bg-secondary text-secondary-foreground px-4 py-2.5 flex items-center justify-between border-b border-sidebar-border shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-1.5 rounded-lg bg-secondary-foreground/10 hover:bg-secondary-foreground/20 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base text-primary tracking-tight" style={{ fontFamily: 'Nunito' }}>
                Kimae's POS Register
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold border border-green-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Live Sync
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Register: <strong className="text-secondary-foreground">{activeShift?.registerName || 'REG-01'}</strong> | Cashier: <strong className="text-secondary-foreground">{cashierName}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="hidden md:flex items-center relative w-72">
          <Barcode size={18} className="absolute left-3 text-muted-foreground" />
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode / SKU [Enter]"
            className="w-full bg-secondary-foreground/10 text-secondary-foreground placeholder:text-secondary-foreground/40 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono border border-secondary-foreground/20 focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            className="relative px-3 py-1.5 rounded-xl bg-secondary-foreground/10 hover:bg-secondary-foreground/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PauseCircle size={15} className={heldOrdersList.length > 0 ? "text-amber-400 animate-pulse" : "text-amber-400"} />
            <span>Held Orders</span>
            {heldOrdersList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center animate-bounce">
                {heldOrdersList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowRecentSalesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-secondary-foreground/10 hover:bg-secondary-foreground/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={15} />
            <span>Past Sales</span>
          </button>

          <Link
            to="/admin/inventory"
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-yellow-dark transition-colors flex items-center gap-1.5"
          >
            <Layers size={15} />
            <span>Inventory</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-w-0">
        <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-card">
          <div className="p-3 border-b border-border bg-card flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, bilao, trays, drinks..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-muted/60 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                All Items
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= (product.reorderLevel || 10);
                const displayPrice = product.promoPrice || product.price;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => handleProductSelect(product)}
                    className={`group relative text-left bg-card rounded-2xl border transition-all duration-150 p-2.5 flex flex-col justify-between overflow-hidden ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed border-dashed border-border'
                        : 'hover:border-primary hover:shadow-md active:scale-95 border-border'
                    }`}
                  >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-muted">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {isOutOfStock ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase text-white bg-destructive px-2 py-0.5 rounded-md">Out of Stock</span>
                        </div>
                      ) : (
                        <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${
                          isLowStock ? 'bg-amber-500 text-black' : 'bg-black/60 text-white'
                        }`}>
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                      <p className="text-[10px] font-mono text-muted-foreground">{product.sku}</p>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="font-black text-xs text-primary" style={{ fontFamily: 'Nunito' }}>{formatPrice(displayPrice)}</span>
                      <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">+</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full md:w-96 lg:w-[400px] flex flex-col bg-card flex-shrink-0 shadow-lg">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {selectedCustomer ? selectedCustomer.name[0] : <User size={14} />}
              </div>
              <div className="text-left">
                <p className="font-bold line-clamp-1">{selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedCustomer ? `${selectedCustomer.memberTier} • ${selectedCustomer.loyaltyPoints} pts` : 'Click to select or register'}
                </p>
              </div>
            </button>
            {selectedCustomer && (
              <button onClick={() => setSelectedCustomer(null)} className="text-[10px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded border border-border">
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map((item) => (
              <div key={item.cartItemId} className="p-2.5 rounded-xl border border-border bg-card flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatPrice(item.unitPrice)} each</p>
                  </div>
                  <span className="font-black text-xs text-primary" style={{ fontFamily: 'Nunito' }}>{formatPrice(item.lineTotal)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateItemQty(item.cartItemId, -1)} className="w-6 h-6 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground">
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => updateItemQty(item.cartItemId, 1)} className="w-6 h-6 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground">
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const val = prompt('Item discount in ₱:', item.itemDiscount.toString());
                        if (val !== null) updateItemDiscount(item.cartItemId, parseFloat(val) || 0);
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-primary flex items-center gap-0.5"
                    >
                      <Tag size={10} /> {item.itemDiscount > 0 ? `₱${item.itemDiscount} off` : 'Discount'}
                    </button>
                    <button onClick={() => removeCartItem(item.cartItemId)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                <ShoppingCart size={40} className="opacity-20 mb-2" />
                <p className="font-bold text-sm">Register Cart Empty</p>
                <p className="text-xs text-center max-w-[200px]">Click products on the left or scan barcodes to begin sale</p>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-border bg-muted/20 flex flex-wrap gap-1.5">
            <button onClick={() => applyPresetDiscount('percentage', 10, 'Senior 10%')} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-border bg-card">
              👴 Senior 10%
            </button>
            <button onClick={() => applyPresetDiscount('percentage', 5, 'Loyalty 5%')} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-border bg-card">
              ⭐ Loyalty 5%
            </button>
            <button onClick={() => applyPresetDiscount('fixed', 100, '₱100 Voucher')} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-border bg-card">
              🎟️ ₱100 Off
            </button>
            {orderDiscountValue > 0 && (
              <button onClick={() => setOrderDiscountValue(0)} className="px-2 py-1 rounded-lg text-[10px] font-bold text-destructive">
                ✕ Remove
              </button>
            )}
          </div>

          <div className="p-3 border-t border-border bg-card space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Discount ({orderDiscountLabel}):</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-foreground pt-1 border-t border-border">
              <span>Total Due:</span>
              <span className="text-primary text-xl" style={{ fontFamily: 'Nunito' }}>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="p-3 border-t border-border bg-muted/40 grid grid-cols-3 gap-2">
            <button
              disabled={cart.length === 0}
              onClick={handleOpenHoldDialog}
              title="Park / Hold current cart to serve another customer"
              className="py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors shadow-sm"
            >
              <PauseCircle size={15} className="text-amber-500" /> Hold Cart
            </button>
            <button disabled={cart.length === 0} onClick={clearCurrentCart} className="py-2.5 rounded-xl border border-destructive/30 font-bold text-xs text-destructive flex items-center justify-center gap-1 disabled:opacity-40">
              <Trash2 size={14} /> Clear
            </button>
            <button disabled={cart.length === 0} onClick={openPaymentScreen} className="py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-brand-yellow-dark flex items-center justify-center gap-1.5 disabled:opacity-40">
              <Banknote size={16} /> Charge
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary text-secondary-foreground flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-primary" style={{ fontFamily: 'Nunito' }}>Checkout & Payment</h3>
                <p className="text-xs text-muted-foreground">Ticket Total: {formatPrice(totalAmount)}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Credit / Debit', icon: CreditCard },
                    { id: 'gcash', label: 'GCash QR', icon: QrCode },
                    { id: 'maya', label: 'Maya QR', icon: QrCode },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActivePaymentMethod(m.id as POSPaymentMethodType)}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 ${
                        activePaymentMethod === m.id ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-muted/40'
                      }`}
                    >
                      <m.icon size={16} />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Tendered / Paid Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₱</span>
                    <input
                      type="number"
                      value={tenderAmount}
                      onChange={(e) => setTenderAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border text-lg font-black bg-card"
                    />
                  </div>
                </div>

                {activePaymentMethod === 'cash' && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[100, 200, 500, 1000].map((bill) => (
                      <button key={bill} onClick={() => setTenderAmount(bill.toString())} className="py-1.5 rounded-lg border border-border bg-muted text-xs font-bold">
                        ₱{bill}
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={() => handleAddPaymentSplit()} className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs">
                  + Add Payment ({activePaymentMethod.toUpperCase()})
                </button>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase text-muted-foreground mb-3">Payment Breakdown</h4>
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-card border border-border text-xs">
                        <span>{p.methodLabel}</span>
                        <span className="font-black text-primary">{formatPrice(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Remaining Balance:</span>
                    <span className={remainingBalance > 0 ? 'text-destructive font-black' : 'text-green-600 font-bold'}>
                      {formatPrice(remainingBalance)}
                    </span>
                  </div>
                  {payments.some((p) => (p.change || 0) > 0) && (
                    <div className="flex justify-between font-black text-sm text-green-700 pt-1 border-t border-border">
                      <span>Change to Return:</span>
                      <span>{formatPrice(payments.reduce((s, p) => s + (p.change || 0), 0))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold">
                Back to Cart
              </button>
              <button
                disabled={remainingBalance > 0}
                onClick={handleCompleteSale}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:bg-brand-yellow-dark disabled:opacity-40"
              >
                Complete Sale & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>Attach Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {getCustomerProfiles().map((cust) => (
                <button
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setShowCustomerModal(false);
                    toast.success(`Attached ${cust.name}`);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-primary flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs">{cust.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cust.mobile}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600">
                    {cust.memberTier}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hold Current Cart */}
      {showHoldDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <PauseCircle size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground" style={{ fontFamily: 'Nunito' }}>
                    Hold Order (Park Cart)
                  </h3>
                  <p className="text-xs text-muted-foreground">Save cart state to database and retrieve anytime</p>
                </div>
              </div>
              <button
                onClick={() => setShowHoldDialog(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmHoldOrder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Table / Customer / Ticket Label *
                </label>
                <input
                  type="text"
                  required
                  value={holdLabelInput}
                  onChange={(e) => setHoldLabelInput(e.target.value)}
                  placeholder="e.g. Table 4, Takeout #12, Maria Santos"
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Order Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dine_in', label: 'Dine In' },
                    { id: 'takeout', label: 'Takeout' },
                    { id: 'drive_thru', label: 'Drive-Thru' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setHoldOrderType(t.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        holdOrderType === t.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Cashier Note / Remarks (Optional)
                </label>
                <textarea
                  value={holdNotesInput}
                  onChange={(e) => setHoldNotesInput(e.target.value)}
                  placeholder="e.g. Customer withdrawing cash, will add drinks upon return"
                  rows={2}
                  className="input-field text-xs resize-none"
                />
              </div>

              {/* Cart Summary Box */}
              <div className="bg-muted/40 rounded-xl p-3 border border-border text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items to park:</span>
                  <span className="font-semibold text-foreground">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items ({cart.length} unique)
                  </span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Customer:</span>
                    <span className="font-semibold text-foreground">{selectedCustomer.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground border-t border-border pt-1">
                  <span>Total Amount:</span>
                  <span className="font-black text-primary text-sm">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHoldDialog(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHold}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black shadow-md flex items-center justify-center gap-1.5"
                >
                  <PauseCircle size={15} />
                  {isSubmittingHold ? 'Saving...' : 'Confirm Hold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Resume Held Orders */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-5 flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <PauseCircle className="text-amber-500" size={20} />
                <div>
                  <h3 className="font-black text-base text-foreground" style={{ fontFamily: 'Nunito' }}>
                    Parked / Held Orders ({heldOrdersList.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Retrieve active tickets for waiting customers or tables
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHeldOrdersModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search filter */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={heldSearchQuery}
                onChange={(e) => setHeldSearchQuery(e.target.value)}
                placeholder="Search held orders by ticket, table name, customer..."
                className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredHeldOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <PauseCircle size={36} className="mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-semibold">No held orders found</p>
                  <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                    When customers need time or step aside, use "Hold Cart" in the register to park their order here.
                  </p>
                </div>
              ) : (
                filteredHeldOrders.map((held) => {
                  const heldDate = new Date(held.heldAt);
                  const minutesAgo = Math.max(0, Math.floor((Date.now() - heldDate.getTime()) / 60000));
                  const timeLabel = minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`;

                  return (
                    <div
                      key={held.id}
                      className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-foreground">{held.holdName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              {held.orderType || 'takeout'}
                            </span>
                            {held.ticketNumber && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                #{held.ticketNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> Held {timeLabel} ({heldDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                            {held.customer?.name && (
                              <span className="flex items-center gap-1 font-semibold text-foreground">
                                <User size={12} /> {held.customer.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className="font-black text-base text-primary block"
                            style={{ fontFamily: 'Nunito' }}
                          >
                            {formatPrice(held.totalAmount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {held.itemCount || held.cart.reduce((s, i) => s + i.quantity, 0)} items
                          </span>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="bg-muted/30 rounded-xl p-2.5 text-xs border border-border/50">
                        <div className="flex flex-wrap gap-1.5">
                          {held.cart.map((itm, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[11px]"
                            >
                              <strong className="text-primary">{itm.quantity}x</strong> {itm.product.name}
                            </span>
                          ))}
                        </div>
                        {held.notes && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium italic mt-2 border-t border-border/50 pt-1.5">
                            Note: {held.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleDeleteHeldOrder(held.id, held.holdName)}
                          className="px-3 py-1.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Discard
                        </button>

                        <button
                          onClick={() => handleResumeOrder(held.id)}
                          className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-brand-yellow-dark shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <PlayCircle size={14} /> Resume Cart
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showRecentSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>Recent POS Transactions</h3>
              <button onClick={() => setShowRecentSalesModal(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {getPOSTransactions().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No past transactions found for this session.
                </div>
              ) : (
                getPOSTransactions().map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{tx.ticketNumber}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({tx.receiptNumber})
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Cashier: {tx.cashierName}
                      </p>
                      {tx.customer?.name && (
                        <p className="text-[11px] font-semibold text-foreground">
                          Customer: {tx.customer.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                          {formatPrice(tx.totalAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.items.length} items
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setCompletedTx(tx);
                            setShowReceiptModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Printer size={13} /> Print
                        </button>
                        {tx.status === 'completed' && (
                          <button
                            onClick={() => {
                              setVoidTargetTx(tx);
                              setShowVoidModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-colors"
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showVoidModal && voidTargetTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-destructive/40 w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <h3 className="font-black text-base text-destructive mb-2">Authorize Void Ticket</h3>
            <p className="text-xs text-muted-foreground mb-4">Ticket: {voidTargetTx.ticketNumber}</p>
            <div className="space-y-3">
              <input
                type="password"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="Manager PIN (1234)"
                className="w-full px-3 py-2 rounded-xl border text-center font-mono"
              />
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason for Void"
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowVoidModal(false)} className="px-3 py-1.5 rounded-xl border text-xs">Cancel</button>
                <button onClick={handleAuthorizeVoid} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">Confirm Void</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVariantModal && selectedProductForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-5">
            <h3 className="font-black text-base mb-3">{selectedProductForVariant.name}</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedProductForVariant.options.map((opt) => (
                <div key={opt.id} className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="font-bold text-xs mb-2">{opt.name}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {opt.values.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVariantSelections({ ...variantSelections, [opt.id]: v.id })}
                        className={`p-2 rounded-lg border text-xs ${variantSelections[opt.id] === v.id ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border'}`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-border mt-4 flex justify-end gap-2">
              <button onClick={() => setShowVariantModal(false)} className="px-4 py-2 rounded-xl border text-xs">Cancel</button>
              <button onClick={() => { addToCart(selectedProductForVariant, variantSelections, 0); setShowVariantModal(false); }} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <POSReceiptModal isOpen={showReceiptModal} transaction={completedTx} onClose={() => setShowReceiptModal(false)} />
    </div>
  );
}

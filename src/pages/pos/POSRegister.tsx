import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Barcode, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, QrCode, PauseCircle, PlayCircle, RotateCcw,
  User, Tag, Layers, ArrowLeft, X, ShieldAlert, Sparkles, Check
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

  const handleHoldOrder = () => {
    if (cart.length === 0) {
      toast.error('Cannot park an empty cart!');
      return;
    }
    const name = prompt('Enter a label for this held ticket (e.g. Table 4 / Juan):');
    if (name !== null) {
      holdCurrentOrder(name, cart, selectedCustomer, {
        type: orderDiscountType,
        value: orderDiscountValue,
        label: orderDiscountLabel,
      });
      setCart([]);
      setSelectedCustomer(null);
      setOrderDiscountValue(0);
      toast.info(`Order parked as "${name || 'Unnamed'}"`);
    }
  };

  const handleResumeOrder = (heldId: string) => {
    const resumed = removeHeldOrder(heldId);
    if (resumed) {
      setCart(resumed.cart);
      setSelectedCustomer(resumed.customer || null);
      if (resumed.discount) {
        setOrderDiscountType(resumed.discount.type);
        setOrderDiscountValue(resumed.discount.value);
        setOrderDiscountLabel(resumed.discount.label || '');
      }
      setShowHeldOrdersModal(false);
      toast.success(`Resumed order: ${resumed.holdName}`);
    }
  };

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
            <PauseCircle size={15} className="text-amber-400" />
            <span>Held Orders</span>
            {getHeldOrders().length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                {getHeldOrders().length}
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
            <button disabled={cart.length === 0} onClick={handleHoldOrder} className="py-2.5 rounded-xl border border-border bg-card font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-40">
              <PauseCircle size={14} className="text-amber-500" /> Hold
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

      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>Parked / Held Orders</h3>
              <button onClick={() => setShowHeldOrdersModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {getHeldOrders().map((held) => (
                <div key={held.id} className="p-3.5 rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs">{held.holdName}</p>
                    <p className="text-[10px] text-muted-foreground">{held.cart.length} items</p>
                  </div>
                  <button onClick={() => handleResumeOrder(held.id)} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                    Resume
                  </button>
                </div>
              ))}
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
              {getPOSTransactions().map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs">{tx.ticketNumber}</span>
                    <p className="text-xs font-black text-primary">{formatPrice(tx.totalAmount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCompletedTx(tx); setShowReceiptModal(true); }} className="px-2.5 py-1.5 rounded-lg border text-xs font-bold">
                      Receipt
                    </button>
                    {tx.status === 'completed' && (
                      <button onClick={() => { setVoidTargetTx(tx); setShowVoidModal(true); }} className="px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">
                        Void
                      </button>
                    )}
                  </div>
                </div>
              ))}
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

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import {
  Search, Filter, Plus, ArrowUpRight, ArrowDownRight, AlertTriangle,
  Layers, Package, CheckCircle2, RefreshCw, FileSpreadsheet, Calendar,
  ShieldAlert, History, Edit, AlertCircle, X, ChevronRight, BarChart3
} from 'lucide-react';
import {
  getCentralProducts,
  getInventoryMovements,
  adjustStockManual,
  subscribeToInventoryUpdates,
} from '@/lib/inventoryStore';
import { formatPrice } from '@/lib/store';
import { CATEGORIES } from '@/constants/data';
import type { Product, InventoryMovement, InventoryMovementType } from '@/types';
import { toast } from 'sonner';

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>(getCentralProducts());
  const [movements, setMovements] = useState<InventoryMovement[]>(getInventoryMovements());
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'batches'>('overview');

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'adjustment' | 'waste_damaged' | 'physical_count' | 'stock_in' | 'stock_out'>('physical_count');
  const [adjustReason, setAdjustReason] = useState('');

  // Subscribe to real-time inventory updates across POS, store checkout, and goods receiving
  useEffect(() => {
    const unsub = subscribeToInventoryUpdates(() => {
      setProducts(getCentralProducts());
      setMovements(getInventoryMovements());
    });
    return unsub;
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchCat = catFilter === 'all' || p.category === catFilter;

      const isOut = p.stock <= 0;
      const isLow = p.stock > 0 && p.stock <= (p.reorderLevel || 10);
      const isHealthy = p.stock > (p.reorderLevel || 10);

      const matchStatus =
        stockStatusFilter === 'all' ||
        (stockStatusFilter === 'out' && isOut) ||
        (stockStatusFilter === 'low' && isLow) ||
        (stockStatusFilter === 'healthy' && isHealthy);

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, catFilter, stockStatusFilter]);

  // Inventory Metrics & Valuation
  const metrics = useMemo(() => {
    const totalItems = products.reduce((s, p) => s + p.stock, 0);
    const totalCostValuation = products.reduce((s, p) => s + p.stock * p.cost, 0);
    const totalRetailValuation = products.reduce((s, p) => s + p.stock * (p.promoPrice || p.price), 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.reorderLevel || 10)).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;

    return {
      totalItems,
      totalCostValuation,
      totalRetailValuation,
      projectedMargin: totalRetailValuation > 0 ? Math.round(((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100) : 0,
      lowStockCount,
      outOfStockCount,
      totalSKUs: products.length,
    };
  }, [products]);

  // Handle Adjustment Submit
  const handlePerformAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const nextQty = parseInt(newStockInput, 10);
    if (isNaN(nextQty) || nextQty < 0) {
      toast.error('Please enter a valid non-negative quantity');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Reason / audit explanation is required');
      return;
    }

    adjustStockManual(
      selectedProduct.id,
      nextQty,
      adjustType,
      adjustReason,
      'Mark Bautista (Inventory Staff)'
    );

    toast.success(`Inventory updated for ${selectedProduct.name} to ${nextQty} ${selectedProduct.unit || 'pcs'}`);
    setShowAdjustModal(false);
    setSelectedProduct(null);
    setNewStockInput('');
    setAdjustReason('');
  };

  const openAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setNewStockInput(prod.stock.toString());
    setAdjustType('physical_count');
    setAdjustReason('Physical shelf count reconciliation');
    setShowAdjustModal(true);
  };

  return (
    <AdminLayout title="Centralized Inventory Management">
      <div className="space-y-6">
        {/* Top Valuation & Alert Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Stock Valuation (Cost)</p>
            <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
              {formatPrice(metrics.totalCostValuation)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Retail Value: {formatPrice(metrics.totalRetailValuation)}</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Units in Stock</p>
            <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
              {metrics.totalItems.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">units</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.totalSKUs} Tracked SKUs</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={14} /> Low-Stock Warnings
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1" style={{ fontFamily: 'Nunito' }}>
              {metrics.lowStockCount} <span className="text-sm font-semibold text-muted-foreground">items</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Below reorder point (≤15)</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-destructive font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertCircle size={14} /> Out of Stock
            </p>
            <p className="text-2xl font-black text-destructive mt-1" style={{ fontFamily: 'Nunito' }}>
              {metrics.outOfStockCount} <span className="text-sm font-semibold text-muted-foreground">items</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Auto-hidden on Online Store</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={16} /> Real-Time Stock Catalog
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History size={16} /> Audit Trail & Stock Movements ({movements.length})
          </button>
        </div>

        {/* TAB 1: Real-Time Stock Catalog */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKU, barcode, name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="healthy">In Stock (Healthy)</option>
                  <option value="low">Low Stock Alert</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,SKU,Barcode,Product Name,Stock,Unit,Cost,Price,Valuation\n' +
                      products
                        .map(
                          (p) =>
                            `"${p.sku}","${p.barcode || ''}","${p.name}",${p.stock},"${p.unit || 'pcs'}",${p.cost},${p.price},${p.stock * p.cost}`
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `inventory_valuation_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Inventory valuation CSV downloaded!');
                  }}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={15} /> Export CSV
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Product / SKU</th>
                      <th className="table-header text-left hidden md:table-cell">Barcode</th>
                      <th className="table-header text-center">Unit</th>
                      <th className="table-header text-right">Cost Price</th>
                      <th className="table-header text-right">Selling Price</th>
                      <th className="table-header text-center">Current Stock</th>
                      <th className="table-header text-right hidden lg:table-cell">Stock Value</th>
                      <th className="table-header text-center">Status</th>
                      <th className="table-header text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLowStock = p.stock > 0 && p.stock <= (p.reorderLevel || 15);

                      return (
                        <tr key={p.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-xs truncate max-w-[200px]">{p.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">{p.sku}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-muted-foreground">
                            {p.barcode || 'N/A'}
                          </td>

                          <td className="px-4 py-3 text-center text-xs capitalize text-muted-foreground">
                            {p.unit || 'bilao'}
                          </td>

                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {formatPrice(p.cost)}
                          </td>

                          <td className="px-4 py-3 text-right text-xs font-semibold text-foreground">
                            {formatPrice(p.promoPrice || p.price)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                                isOutOfStock
                                  ? 'bg-destructive/10 text-destructive'
                                  : isLowStock
                                  ? 'bg-amber-500/10 text-amber-600 font-bold'
                                  : 'text-foreground'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <p className="text-[9px] text-muted-foreground">Reorder: {p.reorderLevel || 15}</p>
                          </td>

                          <td className="px-4 py-3 text-right hidden lg:table-cell font-bold text-xs text-primary">
                            {formatPrice(p.stock * p.cost)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {isOutOfStock ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-destructive/15 text-destructive border border-destructive/30">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                Low Stock
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/15 text-green-700 border border-green-500/30">
                                In Stock
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openAdjust(p)}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:border-primary hover:text-primary transition-colors text-xs font-bold"
                            >
                              Adjust / Count
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No matching inventory products found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Audit Trail & Movements */}
        {activeTab === 'movements' && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Chronological Inventory Movement Ledger</h3>
                <p className="text-xs text-muted-foreground">Every stock deduction, POS ring-up, online sale, adjustment, and supplier delivery is recorded here.</p>
              </div>
              <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-lg">Total Entries: {movements.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="table-header text-left">Timestamp</th>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-center">Activity Type</th>
                    <th className="table-header text-center">Change</th>
                    <th className="table-header text-center">Balance</th>
                    <th className="table-header text-left">Reason / Ref #</th>
                    <th className="table-header text-left">Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m.id} className="table-row">
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleString()}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{m.productName}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{m.sku}</p>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                              m.type === 'pos_sale'
                                ? 'bg-blue-100 text-blue-700'
                                : m.type === 'online_sale'
                                ? 'bg-purple-100 text-purple-700'
                                : m.type === 'purchase_received'
                                ? 'bg-green-100 text-green-700'
                                : m.type === 'waste_damaged'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {m.type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-black ${
                              isPositive ? 'text-green-600' : 'text-destructive'
                            }`}
                          >
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-foreground">
                          {m.quantityBefore} → {m.quantityAfter}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          <p className="line-clamp-1">{m.reason}</p>
                          {m.referenceId && (
                            <span className="text-[10px] font-mono text-primary font-bold">Ref: {m.referenceId}</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {m.recordedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {movements.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No stock movements recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ADJUSTMENT & WRITE-OFF MODAL */}
        {showAdjustModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div>
                  <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>
                    Adjust Stock: {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">SKU: {selectedProduct.sku} • Current Stock: {selectedProduct.stock}</p>
                </div>
                <button onClick={() => setShowAdjustModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePerformAdjustment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Adjustment Action Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="physical_count">Physical Count Reconciliation</option>
                    <option value="waste_damaged">Damage / Kitchen Waste Write-off</option>
                    <option value="adjustment">Internal Transfer / Adjustment</option>
                    <option value="stock_in">Manual Stock In (Add to Inventory)</option>
                    <option value="stock_out">Manual Stock Out (Deduct from Inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    New Ending Quantity ({selectedProduct.unit || 'pcs'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStockInput}
                    onChange={(e) => setNewStockInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-base font-black focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Delta: {parseInt(newStockInput || '0', 10) - selectedProduct.stock > 0 ? '+' : ''}
                    {parseInt(newStockInput || '0', 10) - selectedProduct.stock} units
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Audit Explanation / Reason</label>
                  <textarea
                    rows={2}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. End of day physical count tally / Spoiled vegetable tray"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-brand-yellow-dark transition-colors shadow-sm"
                  >
                    Save & Record Movement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


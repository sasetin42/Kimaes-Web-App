import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getPurchaseOrders,
  savePurchaseOrders,
  receivePurchaseOrder,
  getSuppliers,
  getCentralProducts,
} from '@/lib/inventoryStore';
import { formatPrice } from '@/lib/store';
import {
  Plus, Search, ShoppingCart, CheckCircle2, Clock, AlertTriangle,
  X, Check, ArrowDownToLine, FileText
} from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { toast } from 'sonner';

export default function AdminPurchasing() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(getPurchaseOrders());
  const [suppliers] = useState(getSuppliers());
  const [products] = useState(getCentralProducts());
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [targetPO, setTargetPO] = useState<PurchaseOrder | null>(null);

  // Receive quantities state: { [productId]: number }
  const [receivingInputs, setReceivingInputs] = useState<Record<string, number>>({});

  // New PO State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; qty: number; cost: number }[]>([
    { productId: products[0]?.id || '', qty: 20, cost: products[0]?.cost || 500 },
  ]);
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');

  const filtered = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const items: PurchaseOrderItem[] = selectedItems.map((si) => {
      const p = products.find((prod) => prod.id === si.productId)!;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unit: p.unit || 'tray',
        orderQuantity: si.qty,
        receivedQuantity: 0,
        costPrice: si.cost,
        totalCost: si.qty * si.cost,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.totalCost, 0);
    const tax = Math.round(subtotal * 0.12);
    const shippingCost = 350;
    const totalCost = subtotal + tax + shippingCost;

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: sup.id,
      supplierName: sup.name,
      status: 'ordered',
      items,
      subtotal,
      tax,
      shippingCost,
      totalCost,
      notes: poNotes,
      expectedDate: expectedDate || new Date(Date.now() + 86400000 * sup.leadTimeDays).toISOString().split('T')[0],
      createdBy: 'Theresa Cruz (Manager)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = [newPO, ...orders];
    savePurchaseOrders(next);
    setOrders(next);
    setShowCreateModal(false);
    toast.success(`Purchase Order #${poNumber} issued to ${sup.name}`);
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    setTargetPO(po);
    const initialInputs: Record<string, number> = {};
    po.items.forEach((item) => {
      const remaining = Math.max(0, item.orderQuantity - (item.receivedQuantity || 0));
      initialInputs[item.productId] = remaining;
    });
    setReceivingInputs(initialInputs);
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = () => {
    if (!targetPO) return;
    const recvList = Object.entries(receivingInputs).map(([productId, receivedQuantity]) => ({
      productId,
      receivedQuantity: Number(receivedQuantity) || 0,
    }));

    receivePurchaseOrder(targetPO.id, recvList, 'Mark Bautista (Warehouse Staff)');
    setOrders(getPurchaseOrders());
    setShowReceiveModal(false);
    setTargetPO(null);
    toast.success(`Goods received for ${targetPO.poNumber}! Central inventory updated.`);
  };

  return (
    <AdminLayout title="Purchasing & Goods Receiving">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO #, supplier name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-brand-yellow-dark transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Create Purchase Order
          </button>
        </div>

        {/* PO Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left">PO #</th>
                  <th className="table-header text-left">Supplier</th>
                  <th className="table-header text-center">Items</th>
                  <th className="table-header text-right">Total Cost</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-left hidden md:table-cell">Expected Date</th>
                  <th className="table-header text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((po) => {
                  const isReceived = po.status === 'received';
                  const isPartial = po.status === 'partially_received';

                  return (
                    <tr key={po.id} className="table-row">
                      <td className="px-4 py-3 font-mono font-bold text-xs">{po.poNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs text-foreground">{po.supplierName}</p>
                        <p className="text-[10px] text-muted-foreground">Issued: {new Date(po.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {po.items.length} product(s)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary text-xs">
                        {formatPrice(po.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isReceived
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : isPartial
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground font-mono">
                        {po.expectedDate || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!isReceived ? (
                          <button
                            onClick={() => openReceiveModal(po)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-yellow-dark transition-colors flex items-center gap-1 mx-auto"
                          >
                            <ArrowDownToLine size={13} /> Receive Goods
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE PO MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>Issue New Purchase Order</h3>
                <button onClick={() => setShowCreateModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleCreatePO} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Select Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.paymentTerms}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Item to Replenish</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={selectedItems[0].productId}
                      onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        setSelectedItems([{ productId: e.target.value, qty: selectedItems[0].qty, cost: prod?.cost || 500 }]);
                      }}
                      className="col-span-2 px-3 py-2 rounded-xl border border-border bg-card"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={selectedItems[0].qty}
                      onChange={(e) => setSelectedItems([{ ...selectedItems[0], qty: parseInt(e.target.value, 10) || 1 }])}
                      placeholder="Qty"
                      className="px-3 py-2 rounded-xl border border-border bg-card font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Unit Cost Price</label>
                    <input
                      type="number"
                      value={selectedItems[0].cost}
                      onChange={(e) => setSelectedItems([{ ...selectedItems[0], cost: parseFloat(e.target.value) || 0 }])}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">PO Notes / Special Instructions</label>
                  <textarea
                    rows={2}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Deliver between 7:00 AM - 10:00 AM via loading dock"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black hover:bg-brand-yellow-dark"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* GOODS RECEIVING MODAL */}
        {showReceiveModal && targetPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div>
                  <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>Receive Inventory: {targetPO.poNumber}</h3>
                  <p className="text-xs text-muted-foreground">Supplier: {targetPO.supplierName}</p>
                </div>
                <button onClick={() => setShowReceiveModal(false)}><X size={18} /></button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Verify quantities received in the warehouse. Stock will automatically increment in the centralized database and record a movement audit entry.
                </p>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {targetPO.items.map((item) => (
                    <div key={item.productId} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{item.productName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Ordered: {item.orderQuantity} {item.unit} | Already Received: {item.receivedQuantity || 0}
                        </p>
                      </div>
                      <div className="w-24 text-right">
                        <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Receive Qty</label>
                        <input
                          type="number"
                          min="0"
                          max={item.orderQuantity - (item.receivedQuantity || 0)}
                          value={receivingInputs[item.productId] ?? 0}
                          onChange={(e) =>
                            setReceivingInputs({
                              ...receivingInputs,
                              [item.productId]: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-center font-bold text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    onClick={() => setShowReceiveModal(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReceive}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black hover:bg-brand-yellow-dark flex items-center gap-1.5"
                  >
                    <Check size={16} /> Confirm Receipt & Update Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


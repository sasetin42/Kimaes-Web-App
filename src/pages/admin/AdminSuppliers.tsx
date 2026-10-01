import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getSuppliers,
  addOrUpdateSupplier,
} from '@/lib/inventoryStore';
import {
  Plus, Search, Building2, Phone, Mail, MapPin, Clock, FileText,
  Edit2, Check, X, ExternalLink
} from 'lucide-react';
import type { Supplier } from '@/types';
import { toast } from 'sonner';

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliers());
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [leadTimeDays, setLeadTimeDays] = useState(2);
  const [taxId, setTaxId] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingSupplier(null);
    setName('');
    setCode(`SUP-${Math.floor(100 + Math.random() * 900)}`);
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPaymentTerms('Net 30');
    setLeadTimeDays(2);
    setTaxId('');
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setCode(s.code);
    setContactPerson(s.contactPerson);
    setEmail(s.email);
    setPhone(s.phone);
    setAddress(s.address);
    setPaymentTerms(s.paymentTerms);
    setLeadTimeDays(s.leadTimeDays);
    setTaxId(s.taxId || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const supplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      name,
      code,
      contactPerson,
      email,
      phone,
      address,
      paymentTerms,
      leadTimeDays: Number(leadTimeDays),
      taxId,
      active: true,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
    };

    addOrUpdateSupplier(supplier);
    setSuppliers(getSuppliers());
    setShowModal(false);
    toast.success(editingSupplier ? 'Supplier updated' : 'Supplier registered successfully');
  };

  return (
    <AdminLayout title="Supplier Directory & Vendors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor, code, contact person..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-brand-yellow-dark transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Register New Supplier
          </button>
        </div>

        {/* Suppliers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-card rounded-2xl border border-border p-5 hover:border-primary transition-all shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{s.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-bold">
                      {s.code}
                    </span>
                  </div>
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mt-3">
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <Building2 size={13} className="text-primary" /> {s.contactPerson}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={13} /> {s.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={13} /> {s.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={13} /> <span className="truncate">{s.address}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Terms: <strong className="text-foreground">{s.paymentTerms}</strong>
                </span>
                <span className="text-muted-foreground">
                  Lead Time: <strong className="text-foreground">{s.leadTimeDays} days</strong>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SUPPLIER MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>
                  {editingSupplier ? 'Edit Supplier' : 'Register New Vendor / Supplier'}
                </h3>
                <button onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Company / Supplier Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. San Miguel Meat Corp"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Supplier Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Juan Perez"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0917-XXX-XXXX"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="orders@vendor.com"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Tax ID / TIN</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="000-000-000-000"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Office / Warehouse Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Complete address"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Payment Terms</label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                    >
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="7 Days">7 Days</option>
                      <option value="15 Days">15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Lead Time (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black hover:bg-brand-yellow-dark transition-colors"
                  >
                    Save Supplier
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


import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getCustomerProfiles,
  saveCustomerProfiles,
} from '@/lib/inventoryStore';
import { formatPrice } from '@/lib/store';
import {
  Plus, Search, User, Phone, Mail, Award, DollarSign, ShoppingBag,
  Calendar, Edit3, X, Star, HeartHandshake
} from 'lucide-react';
import type { CustomerProfile } from '@/types';
import { toast } from 'sonner';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>(getCustomerProfiles());
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingCust, setEditingCust] = useState<CustomerProfile | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [memberTier, setMemberTier] = useState<CustomerProfile['memberTier']>('Bronze');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [storeCredit, setStoreCredit] = useState(0);
  const [notes, setNotes] = useState('');

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || c.memberTier.toLowerCase() === tierFilter.toLowerCase();
    return matchSearch && matchTier;
  });

  const openAdd = () => {
    setEditingCust(null);
    setName('');
    setEmail('');
    setMobile('');
    setMemberTier('Bronze');
    setLoyaltyPoints(50);
    setStoreCredit(0);
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (c: CustomerProfile) => {
    setEditingCust(c);
    setName(c.name);
    setEmail(c.email);
    setMobile(c.mobile);
    setMemberTier(c.memberTier);
    setLoyaltyPoints(c.loyaltyPoints);
    setStoreCredit(c.storeCredit);
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updated: CustomerProfile[];
    if (editingCust) {
      updated = customers.map((c) =>
        c.id === editingCust.id
          ? {
              ...c,
              name,
              email,
              mobile,
              memberTier,
              loyaltyPoints: Number(loyaltyPoints),
              storeCredit: Number(storeCredit),
              notes,
            }
          : c
      );
      toast.success(`Updated customer ${name}`);
    } else {
      const newCust: CustomerProfile = {
        id: `cust-${Date.now()}`,
        name,
        email,
        mobile,
        memberTier,
        loyaltyPoints: Number(loyaltyPoints),
        storeCredit: Number(storeCredit),
        totalSpent: 0,
        orderCount: 0,
        notes,
        lastVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      updated = [newCust, ...customers];
      toast.success(`Registered new customer ${name}`);
    }

    saveCustomerProfiles(updated);
    setCustomers(updated);
    setShowModal(false);
  };

  return (
    <AdminLayout title="Customer Database & Loyalty CRM">
      <div className="space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
              {customers.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Active registered profiles</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">VIP & Gold Members</p>
            <p className="text-2xl font-black text-amber-600 mt-1" style={{ fontFamily: 'Nunito' }}>
              {customers.filter((c) => ['Gold', 'VIP'].includes(c.memberTier)).length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">High-value recurring clients</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Customer Spending</p>
            <p className="text-2xl font-black text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
              {formatPrice(customers.reduce((s, c) => s + c.totalSpent, 0))}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Combined lifetime spend</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Loyalty Points</p>
            <p className="text-2xl font-black text-purple-600 mt-1" style={{ fontFamily: 'Nunito' }}>
              {customers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">pts</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Redeemable on next order</p>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Tiers</option>
              <option value="regular">Regular</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <button
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-brand-yellow-dark transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Register Customer
          </button>
        </div>

        {/* Customers Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left">Customer</th>
                  <th className="table-header text-left hidden md:table-cell">Contact Info</th>
                  <th className="table-header text-center">Tier</th>
                  <th className="table-header text-right">Loyalty Points</th>
                  <th className="table-header text-right">Lifetime Spend</th>
                  <th className="table-header text-center hidden sm:table-cell">Orders</th>
                  <th className="table-header text-left hidden lg:table-cell">Notes</th>
                  <th className="table-header text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">Joined {new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{c.mobile}</p>
                      <p className="text-[10px]">{c.email}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          c.memberTier === 'VIP'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : c.memberTier === 'Gold'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : c.memberTier === 'Silver'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {c.memberTier}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-xs font-bold text-foreground">
                      ⭐ {c.loyaltyPoints}
                    </td>

                    <td className="px-4 py-3 text-right text-xs font-bold text-primary">
                      {formatPrice(c.totalSpent)}
                    </td>

                    <td className="px-4 py-3 text-center text-xs hidden sm:table-cell text-muted-foreground">
                      {c.orderCount} orders
                    </td>

                    <td className="px-4 py-3 text-xs hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                      {c.notes || '—'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors mx-auto"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CUSTOMER MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>
                  {editingCust ? 'Edit Customer Profile' : 'Register Customer Profile'}
                </h3>
                <button onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="0917-XXX-XXXX"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@email.com"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Membership Tier</label>
                    <select
                      value={memberTier}
                      onChange={(e) => setMemberTier(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                    >
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Loyalty Points</label>
                    <input
                      type="number"
                      min="0"
                      value={loyaltyPoints}
                      onChange={(e) => setLoyaltyPoints(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Dietary Preferences / Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Likes extra calamansi, allergic to shrimp"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs"
                  />
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
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black hover:bg-brand-yellow-dark"
                  >
                    Save Customer
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


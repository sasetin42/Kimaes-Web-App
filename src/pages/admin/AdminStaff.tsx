import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getStaffMembers,
  saveStaffMembers,
} from '@/lib/inventoryStore';
import {
  Plus, Search, Shield, Key, UserCheck, AlertCircle, Edit2, Check, X,
  Briefcase
} from 'lucide-react';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';

export default function AdminStaff() {
  const [staff, setStaff] = useState<User[]>(getStaffMembers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('1111');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const filtered = staff.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openAdd = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setMobile('');
    setRole('cashier');
    setPin('1111');
    setStatus('active');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingStaff(u);
    setName(u.name);
    setEmail(u.email);
    setMobile(u.mobile);
    setRole(u.role);
    setPin(u.pin || '1234');
    setStatus(u.status || 'active');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updated: User[];
    if (editingStaff) {
      updated = staff.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name,
              email,
              mobile,
              role,
              pin,
              status,
            }
          : s
      );
      toast.success(`Updated profile for ${name}`);
    } else {
      const newUser: User = {
        id: `staff-${Date.now()}`,
        name,
        email,
        mobile,
        role,
        pin,
        status,
        permissions: role === 'super_admin' ? ['all'] : [role],
        createdAt: new Date().toISOString(),
      };
      updated = [newUser, ...staff];
      toast.success(`Registered new employee ${name}`);
    }

    saveStaffMembers(updated);
    setStaff(updated);
    setShowModal(false);
  };

  return (
    <AdminLayout title="Employee & Role-Based Access Control">
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff name, email, role..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="manager">Store Manager</option>
              <option value="cashier">POS Cashier</option>
              <option value="inventory_staff">Inventory Staff</option>
              <option value="kitchen">Kitchen Staff</option>
            </select>
          </div>

          <button
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-brand-yellow-dark transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Register Employee
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left">Employee</th>
                  <th className="table-header text-left">Role</th>
                  <th className="table-header text-center">POS PIN</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-left hidden md:table-cell">Contact</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                          u.role === 'super_admin'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : u.role === 'manager'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : u.role === 'cashier'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground font-bold">
                      •••• ({u.pin || '1234'})
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          u.status === 'active' || !u.status
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {u.status || 'active'}
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {u.mobile}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors mx-auto"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* STAFF MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>
                  {editingStaff ? 'Edit Employee Record' : 'Register New Employee'}
                </h3>
                <button onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Employee Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Juanita Gomez"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@kimae.com"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="0918-XXX-XXXX"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Assigned Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                    >
                      <option value="cashier">POS Cashier</option>
                      <option value="manager">Store Manager</option>
                      <option value="inventory_staff">Inventory Staff</option>
                      <option value="kitchen">Kitchen Staff</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">POS Override PIN (4-digit)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="1111"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card text-center font-mono font-bold tracking-widest"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card font-semibold"
                  >
                    <option value="active">Active & Operational</option>
                    <option value="inactive">Suspended / Inactive</option>
                  </select>
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
                    Save Employee
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


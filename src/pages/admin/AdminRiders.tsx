import { useState } from 'react';
import AdminLayout from './AdminLayout';
import { MOCK_RIDERS } from '@/constants/data';
import { Bike, Star, MapPin, Phone, Toggle, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/store';
import type { Rider } from '@/types';

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  online: { bg: 'bg-green-100', text: 'text-green-700' },
  offline: { bg: 'bg-gray-100', text: 'text-gray-600' },
  available: { bg: 'bg-blue-100', text: 'text-blue-700' },
  busy: { bg: 'bg-amber-100', text: 'text-amber-700' },
  break: { bg: 'bg-purple-100', text: 'text-purple-700' },
  inactive: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function AdminRiders() {
  const [riders, setRiders] = useState<Rider[]>(MOCK_RIDERS);

  const toggleStatus = (riderId: string) => {
    setRiders(prev => prev.map(r =>
      r.id === riderId
        ? { ...r, status: r.status === 'offline' ? 'available' : 'offline' }
        : r
    ));
  };

  return (
    <AdminLayout title="Riders">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {riders.map(rider => {
          const badge = STATUS_BADGE[rider.status] || STATUS_BADGE.offline;
          return (
            <div key={rider.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-warm transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                    {rider.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>{rider.user.name}</h3>
                    <p className="text-xs text-muted-foreground">{rider.vehicleType === 'motorcycle' ? '🏍️' : '🚲'} {rider.plateNumber}</p>
                  </div>
                </div>
                <span className={`badge-status ${badge.bg} ${badge.text} capitalize`}>{rider.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{rider.todayDeliveries}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{rider.totalDeliveries}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={12} className="fill-primary text-primary" />
                    <p className="font-black text-foreground">{rider.rating}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="font-black text-primary">{formatPrice(rider.earnings)}</p>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Phone size={13} className="text-primary" />
                <span>{rider.user.mobile}</span>
              </div>

              {rider.currentOrder && (
                <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 rounded-lg p-2 mb-4">
                  <Bike size={12} />
                  Active delivery in progress
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(rider.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                    rider.status !== 'offline'
                      ? 'border-destructive text-destructive hover:bg-destructive hover:text-white'
                      : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white'
                  }`}
                >
                  {rider.status !== 'offline' ? 'Set Offline' : 'Set Online'}
                </button>
                <button className="flex-1 btn-outline py-2 text-xs">View Details</button>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

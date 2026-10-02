import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  FileSpreadsheet,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  Layers,
  Sparkles,
  Package,
} from 'lucide-react';
import { formatPrice } from '@/lib/store';
import type { Supplier } from '@/types';
import { toast } from 'sonner';

export interface SupplierDeliveryRecord {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  promisedDate: string;
  actualDeliveryDate: string;
  promisedLeadTimeDays: number;
  actualLeadTimeDays: number;
  orderedUnits: number;
  receivedUnits: number;
  fulfillmentRate: number; // percentage e.g. 98.5
  totalAmount: number;
  status: 'on_time_full' | 'minor_delay' | 'partial_delivery' | 'critical_delay';
  qualityScore: number; // percentage e.g. 99
  notes: string;
}

// Rich historical delivery records over time (2026)
export const HISTORICAL_SUPPLIER_DELIVERIES: SupplierDeliveryRecord[] = [
  {
    id: 'del-1',
    poNumber: 'PO-2026-0041',
    supplierId: 'sup-1',
    supplierName: 'San Miguel Meat & Poultry Supply',
    orderDate: '2026-04-05',
    promisedDate: '2026-04-07',
    actualDeliveryDate: '2026-04-07',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 2,
    orderedUnits: 150,
    receivedUnits: 150,
    fulfillmentRate: 100,
    totalAmount: 48500,
    status: 'on_time_full',
    qualityScore: 100,
    notes: 'Pork belly & liver inspection passed fresh.',
  },
  {
    id: 'del-2',
    poNumber: 'PO-2026-0052',
    supplierId: 'sup-2',
    supplierName: 'Divisoria Fresh Harvest & Noodle Corp',
    orderDate: '2026-04-18',
    promisedDate: '2026-04-19',
    actualDeliveryDate: '2026-04-19',
    promisedLeadTimeDays: 1,
    actualLeadTimeDays: 1,
    orderedUnits: 200,
    receivedUnits: 195,
    fulfillmentRate: 97.5,
    totalAmount: 22000,
    status: 'on_time_full',
    qualityScore: 98,
    notes: 'Thick Malabon & Palabok noodles pristine condition.',
  },
  {
    id: 'del-3',
    poNumber: 'PO-2026-0063',
    supplierId: 'sup-3',
    supplierName: 'Navotas Port Fresh Seafoods',
    orderDate: '2026-05-02',
    promisedDate: '2026-05-03',
    actualDeliveryDate: '2026-05-03',
    promisedLeadTimeDays: 1,
    actualLeadTimeDays: 1,
    orderedUnits: 80,
    receivedUnits: 80,
    fulfillmentRate: 100,
    totalAmount: 36000,
    status: 'on_time_full',
    qualityScore: 99,
    notes: 'Fresh native shrimp morning catch.',
  },
  {
    id: 'del-4',
    poNumber: 'PO-2026-0074',
    supplierId: 'sup-1',
    supplierName: 'San Miguel Meat & Poultry Supply',
    orderDate: '2026-05-15',
    promisedDate: '2026-05-17',
    actualDeliveryDate: '2026-05-18',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 3,
    orderedUnits: 180,
    receivedUnits: 172,
    fulfillmentRate: 95.5,
    totalAmount: 58000,
    status: 'minor_delay',
    qualityScore: 96,
    notes: '1 day transport delay due to EDSA logistics truck restriction.',
  },
  {
    id: 'del-5',
    poNumber: 'PO-2026-0081',
    supplierId: 'sup-4',
    supplierName: 'Bulacan Farm Fresh Eggs & Calamansi',
    orderDate: '2026-05-28',
    promisedDate: '2026-05-30',
    actualDeliveryDate: '2026-05-30',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 2,
    orderedUnits: 500,
    receivedUnits: 495,
    fulfillmentRate: 99,
    totalAmount: 18500,
    status: 'on_time_full',
    qualityScore: 98,
    notes: 'Grade A native eggs, zero crack breakage.',
  },
  {
    id: 'del-6',
    poNumber: 'PO-2026-0092',
    supplierId: 'sup-5',
    supplierName: 'Golden Malabon Packaging & Bilaos',
    orderDate: '2026-06-10',
    promisedDate: '2026-06-13',
    actualDeliveryDate: '2026-06-13',
    promisedLeadTimeDays: 3,
    actualLeadTimeDays: 3,
    orderedUnits: 250,
    receivedUnits: 250,
    fulfillmentRate: 100,
    totalAmount: 21500,
    status: 'on_time_full',
    qualityScore: 100,
    notes: '16" bamboo party bilaos with clean woven finish.',
  },
  {
    id: 'del-7',
    poNumber: 'PO-2026-0105',
    supplierId: 'sup-2',
    supplierName: 'Divisoria Fresh Harvest & Noodle Corp',
    orderDate: '2026-06-25',
    promisedDate: '2026-06-26',
    actualDeliveryDate: '2026-06-26',
    promisedLeadTimeDays: 1,
    actualLeadTimeDays: 1,
    orderedUnits: 220,
    receivedUnits: 215,
    fulfillmentRate: 97.7,
    totalAmount: 25300,
    status: 'on_time_full',
    qualityScore: 97,
    notes: 'Spices, garlic, and special chicharon supplies.',
  },
  {
    id: 'del-8',
    poNumber: 'PO-2026-0118',
    supplierId: 'sup-1',
    supplierName: 'San Miguel Meat & Poultry Supply',
    orderDate: '2026-07-08',
    promisedDate: '2026-07-10',
    actualDeliveryDate: '2026-07-10',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 2,
    orderedUnits: 210,
    receivedUnits: 208,
    fulfillmentRate: 99.0,
    totalAmount: 67200,
    status: 'on_time_full',
    qualityScore: 99,
    notes: 'Fabulous batch of lean ground pork for fiesta shanghai.',
  },
  {
    id: 'del-9',
    poNumber: 'PO-2026-0129',
    supplierId: 'sup-3',
    supplierName: 'Navotas Port Fresh Seafoods',
    orderDate: '2026-07-22',
    promisedDate: '2026-07-23',
    actualDeliveryDate: '2026-07-24',
    promisedLeadTimeDays: 1,
    actualLeadTimeDays: 2,
    orderedUnits: 120,
    receivedUnits: 110,
    fulfillmentRate: 91.6,
    totalAmount: 49500,
    status: 'minor_delay',
    qualityScore: 94,
    notes: 'Monsoon typhoon delayed fishing vessel by 1 day.',
  },
  {
    id: 'del-10',
    poNumber: 'PO-2026-0142',
    supplierId: 'sup-4',
    supplierName: 'Bulacan Farm Fresh Eggs & Calamansi',
    orderDate: '2026-08-05',
    promisedDate: '2026-08-07',
    actualDeliveryDate: '2026-08-07',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 2,
    orderedUnits: 600,
    receivedUnits: 595,
    fulfillmentRate: 99.1,
    totalAmount: 22400,
    status: 'on_time_full',
    qualityScore: 99,
    notes: 'Juicy native calamansi and medium poultry eggs.',
  },
  {
    id: 'del-11',
    poNumber: 'PO-2026-0155',
    supplierId: 'sup-5',
    supplierName: 'Golden Malabon Packaging & Bilaos',
    orderDate: '2026-08-19',
    promisedDate: '2026-08-22',
    actualDeliveryDate: '2026-08-22',
    promisedLeadTimeDays: 3,
    actualLeadTimeDays: 3,
    orderedUnits: 300,
    receivedUnits: 300,
    fulfillmentRate: 100,
    totalAmount: 25800,
    status: 'on_time_full',
    qualityScore: 100,
    notes: 'Extra festive aluminum party trays & banana leaf liners.',
  },
  {
    id: 'del-12',
    poNumber: 'PO-2026-0168',
    supplierId: 'sup-1',
    supplierName: 'San Miguel Meat & Poultry Supply',
    orderDate: '2026-09-02',
    promisedDate: '2026-09-04',
    actualDeliveryDate: '2026-09-04',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 2,
    orderedUnits: 240,
    receivedUnits: 238,
    fulfillmentRate: 99.2,
    totalAmount: 76800,
    status: 'on_time_full',
    qualityScore: 98,
    notes: 'September fiesta season bulk pork meat arrival.',
  },
  {
    id: 'del-13',
    poNumber: 'PO-2026-0179',
    supplierId: 'sup-2',
    supplierName: 'Divisoria Fresh Harvest & Noodle Corp',
    orderDate: '2026-09-16',
    promisedDate: '2026-09-17',
    actualDeliveryDate: '2026-09-17',
    promisedLeadTimeDays: 1,
    actualLeadTimeDays: 1,
    orderedUnits: 260,
    receivedUnits: 256,
    fulfillmentRate: 98.4,
    totalAmount: 31200,
    status: 'on_time_full',
    qualityScore: 99,
    notes: 'Achuete sauce base and premium tinapa flakes.',
  },
  {
    id: 'del-14',
    poNumber: 'PO-2026-0190',
    supplierId: 'sup-3',
    supplierName: 'Navotas Port Fresh Seafoods',
    orderDate: '2026-09-28',
    promisedDate: '2026-09-29',
    actualDeliveryDate: '2026-09-29',
    promisedLeadTimeDays: 1,
    actualLeadTimeDays: 1,
    orderedUnits: 140,
    receivedUnits: 140,
    fulfillmentRate: 100,
    totalAmount: 63000,
    status: 'on_time_full',
    qualityScore: 100,
    notes: 'Peeled & deveined party shrimps for catering orders.',
  },
  {
    id: 'del-15',
    poNumber: 'PO-2026-0202',
    supplierId: 'sup-4',
    supplierName: 'Bulacan Farm Fresh Eggs & Calamansi',
    orderDate: '2026-10-01',
    promisedDate: '2026-10-03',
    actualDeliveryDate: '2026-10-03',
    promisedLeadTimeDays: 2,
    actualLeadTimeDays: 2,
    orderedUnits: 450,
    receivedUnits: 448,
    fulfillmentRate: 99.5,
    totalAmount: 17200,
    status: 'on_time_full',
    qualityScore: 100,
    notes: 'Early morning October delivery complete.',
  },
];

// Monthly aggregated performance data for the timeline charts
export const MONTHLY_PERFORMANCE_TRENDS = [
  {
    month: 'Apr 2026',
    avgPromisedLeadTime: 1.5,
    avgActualLeadTime: 1.5,
    fulfillmentRate: 98.8,
    onTimeRate: 100,
    deliveriesCount: 2,
    totalSpend: 70500,
  },
  {
    month: 'May 2026',
    avgPromisedLeadTime: 1.7,
    avgActualLeadTime: 2.0,
    fulfillmentRate: 98.2,
    onTimeRate: 92.5,
    deliveriesCount: 3,
    totalSpend: 112500,
  },
  {
    month: 'Jun 2026',
    avgPromisedLeadTime: 2.0,
    avgActualLeadTime: 2.0,
    fulfillmentRate: 98.9,
    onTimeRate: 100,
    deliveriesCount: 2,
    totalSpend: 46800,
  },
  {
    month: 'Jul 2026',
    avgPromisedLeadTime: 1.5,
    avgActualLeadTime: 2.0,
    fulfillmentRate: 95.3,
    onTimeRate: 85.0,
    deliveriesCount: 2,
    totalSpend: 116700,
  },
  {
    month: 'Aug 2026',
    avgPromisedLeadTime: 2.5,
    avgActualLeadTime: 2.5,
    fulfillmentRate: 99.6,
    onTimeRate: 100,
    deliveriesCount: 2,
    totalSpend: 48200,
  },
  {
    month: 'Sep 2026',
    avgPromisedLeadTime: 1.3,
    avgActualLeadTime: 1.3,
    fulfillmentRate: 99.2,
    onTimeRate: 100,
    deliveriesCount: 3,
    totalSpend: 171000,
  },
  {
    month: 'Oct 2026',
    avgPromisedLeadTime: 2.0,
    avgActualLeadTime: 2.0,
    fulfillmentRate: 99.5,
    onTimeRate: 100,
    deliveriesCount: 1,
    totalSpend: 17200,
  },
];

interface SupplierPerformanceDashboardProps {
  suppliers: Supplier[];
  onSelectSupplierForEdit?: (supplier: Supplier) => void;
  className?: string;
}

export default function SupplierPerformanceDashboard({
  suppliers,
  onSelectSupplierForEdit,
  className = '',
}: SupplierPerformanceDashboardProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '6m' | 'ytd'>('ytd');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter deliveries based on supplier and timeframe
  const filteredDeliveries = useMemo(() => {
    return HISTORICAL_SUPPLIER_DELIVERIES.filter((d) => {
      const matchSup = selectedSupplierId === 'all' || d.supplierId === selectedSupplierId;
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSup && matchStatus;
    });
  }, [selectedSupplierId, statusFilter]);

  // Dynamic monthly chart data based on active filters
  const chartTrends = useMemo(() => {
    if (selectedSupplierId === 'all') {
      return MONTHLY_PERFORMANCE_TRENDS;
    }
    // Calculate monthly trends specific to selected supplier
    const grouped: Record<string, { totalLead: number; promisedLead: number; totalOrdered: number; totalReceived: number; count: number; spend: number }> = {};

    HISTORICAL_SUPPLIER_DELIVERIES.filter((d) => d.supplierId === selectedSupplierId).forEach((d) => {
      const monthKey = d.actualDeliveryDate.slice(0, 7); // YYYY-MM
      const dateObj = new Date(d.actualDeliveryDate);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!grouped[label]) {
        grouped[label] = { totalLead: 0, promisedLead: 0, totalOrdered: 0, totalReceived: 0, count: 0, spend: 0 };
      }
      grouped[label].totalLead += d.actualLeadTimeDays;
      grouped[label].promisedLead += d.promisedLeadTimeDays;
      grouped[label].totalOrdered += d.orderedUnits;
      grouped[label].totalReceived += d.receivedUnits;
      grouped[label].spend += d.totalAmount;
      grouped[label].count += 1;
    });

    const result = Object.entries(grouped).map(([month, data]) => ({
      month,
      avgPromisedLeadTime: Number((data.promisedLead / data.count).toFixed(1)),
      avgActualLeadTime: Number((data.totalLead / data.count).toFixed(1)),
      fulfillmentRate: Number(((data.totalReceived / data.totalOrdered) * 100).toFixed(1)),
      onTimeRate: data.totalLead <= data.promisedLead ? 100 : 85,
      deliveriesCount: data.count,
      totalSpend: data.spend,
    }));

    return result.length > 0 ? result : MONTHLY_PERFORMANCE_TRENDS;
  }, [selectedSupplierId]);

  // Aggregate KPI Calculations
  const metrics = useMemo(() => {
    const totalDeliveries = filteredDeliveries.length;
    if (totalDeliveries === 0) {
      return {
        avgLeadTime: 0,
        avgPromisedLeadTime: 0,
        leadTimeVariance: 0,
        overallFulfillmentRate: 0,
        onTimeDeliveryRate: 0,
        totalSpend: 0,
        totalUnitsReceived: 0,
      };
    }

    const totalActualLead = filteredDeliveries.reduce((sum, d) => sum + d.actualLeadTimeDays, 0);
    const totalPromisedLead = filteredDeliveries.reduce((sum, d) => sum + d.promisedLeadTimeDays, 0);
    const totalOrdered = filteredDeliveries.reduce((sum, d) => sum + d.orderedUnits, 0);
    const totalReceived = filteredDeliveries.reduce((sum, d) => sum + d.receivedUnits, 0);
    const onTimeCount = filteredDeliveries.filter((d) => d.actualLeadTimeDays <= d.promisedLeadTimeDays).length;
    const totalSpend = filteredDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

    const avgLeadTime = Number((totalActualLead / totalDeliveries).toFixed(1));
    const avgPromisedLeadTime = Number((totalPromisedLead / totalDeliveries).toFixed(1));
    const overallFulfillmentRate = Number(((totalReceived / totalOrdered) * 100).toFixed(1));
    const onTimeDeliveryRate = Number(((onTimeCount / totalDeliveries) * 100).toFixed(1));
    const leadTimeVariance = Number((avgLeadTime - avgPromisedLeadTime).toFixed(1));

    return {
      avgLeadTime,
      avgPromisedLeadTime,
      leadTimeVariance,
      overallFulfillmentRate,
      onTimeDeliveryRate,
      totalSpend,
      totalUnitsReceived: totalReceived,
    };
  }, [filteredDeliveries]);

  // Comparative supplier performance bar chart data
  const supplierRankingData = useMemo(() => {
    const vendorMap: Record<string, { name: string; totalOrdered: number; totalReceived: number; totalLead: number; count: number }> = {};

    HISTORICAL_SUPPLIER_DELIVERIES.forEach((d) => {
      const shortName = d.supplierName.split(' ')[0] + ' ' + (d.supplierName.split(' ')[1] || '');
      if (!vendorMap[shortName]) {
        vendorMap[shortName] = { name: shortName, totalOrdered: 0, totalReceived: 0, totalLead: 0, count: 0 };
      }
      vendorMap[shortName].totalOrdered += d.orderedUnits;
      vendorMap[shortName].totalReceived += d.receivedUnits;
      vendorMap[shortName].totalLead += d.actualLeadTimeDays;
      vendorMap[shortName].count += 1;
    });

    return Object.values(vendorMap).map((v) => ({
      name: v.name,
      fulfillmentRate: Number(((v.totalReceived / v.totalOrdered) * 100).toFixed(1)),
      avgLeadDays: Number((v.totalLead / v.count).toFixed(1)),
    }));
  }, []);

  const handleExportCSV = () => {
    if (filteredDeliveries.length === 0) {
      toast.info('No delivery records to export');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,PO Number,Supplier,Order Date,Promised Date,Delivery Date,Promised Lead Days,Actual Lead Days,Ordered Units,Received Units,Fulfillment Rate %,Status,Spend\n' +
      filteredDeliveries
        .map(
          (d) =>
            `"${d.poNumber}","${d.supplierName}","${d.orderDate}","${d.promisedDate}","${d.actualDeliveryDate}",${d.promisedLeadTimeDays},${d.actualLeadTimeDays},${d.orderedUnits},${d.receivedUnits},${d.fulfillmentRate}%,"${d.status}",${d.totalAmount}`
        )
        .join('\n');

    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute(
      'download',
      `supplier_performance_analytics_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Supplier performance report CSV exported!');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control & Filter Header */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <span className="text-xs font-bold text-foreground">Vendor:</span>
          </div>

          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary min-w-[220px]"
          >
            <option value="all">All Suppliers (Ecosystem Benchmark)</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Delivery Outcomes</option>
            <option value="on_time_full">On-Time & Full (100%)</option>
            <option value="minor_delay">Delays / Weather (Minor)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet size={15} /> Export Audit Report (CSV)
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Order Fulfillment Rate */}
        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Order Fulfillment Rate
            </p>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
            {metrics.overallFulfillmentRate}%
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
            <ArrowUpRight size={13} />
            <span>+2.4% vs Target SLA (95%)</span>
          </div>
        </div>

        {/* Card 2: Average Lead Time */}
        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Average Lead Time
            </p>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Clock size={15} />
            </span>
          </div>
          <p className="text-2xl font-black text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
            {metrics.avgLeadTime}{' '}
            <span className="text-sm font-semibold text-muted-foreground">days</span>
          </p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
            <span>Promised SLA: <strong>{metrics.avgPromisedLeadTime} days</strong></span>
            {metrics.leadTimeVariance <= 0 ? (
              <span className="text-emerald-600 font-bold ml-1">(On Schedule)</span>
            ) : (
              <span className="text-amber-600 font-bold ml-1">(+{metrics.leadTimeVariance}d buffer)</span>
            )}
          </div>
        </div>

        {/* Card 3: On-Time Delivery Rate */}
        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              On-Time Dispatch Rate
            </p>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Award size={15} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
            {metrics.onTimeDeliveryRate}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {filteredDeliveries.filter((d) => d.actualLeadTimeDays <= d.promisedLeadTimeDays).length} of {filteredDeliveries.length} orders delivered on time
          </p>
        </div>

        {/* Card 4: Total Delivered Procurement Spend */}
        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Procurement Volume
            </p>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <DollarSign size={15} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
            {formatPrice(metrics.totalSpend)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {metrics.totalUnitsReceived.toLocaleString()} ingredient units verified
          </p>
        </div>
      </div>

      {/* Main Charts Grid using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Lead Times Over Time (Promised vs Actual) */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock size={16} className="text-primary" /> Vendor Lead Times Over Time (Days)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparison of agreed SLA promised lead time vs actual kitchen arrival duration.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
              Days
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualLeadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val: number, name: string) => [
                    `${val} days`,
                    name === 'avgActualLeadTime' ? 'Actual Lead Time' : 'Promised SLA',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(val) => (val === 'avgActualLeadTime' ? 'Actual Delivery Days' : 'Promised Days SLA')}
                />
                <ReferenceLine y={2.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target 2.0d', fill: '#10b981', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="avgActualLeadTime"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#actualLeadGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="avgPromisedLeadTime"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Order Fulfillment Rates Over Time (%) */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Order Fulfillment Rates Over Time (%)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proportion of ordered ingredients delivered complete without damage or shortages.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
              Benchmark 95%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrends} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="fulfillmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[90, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val}%`, 'Fulfillment Rate']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Min SLA 95%', fill: '#ef4444', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="fulfillmentRate"
                  name="Order Fulfillment %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fulfillmentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparative Bar Chart: Supplier Reliability Matrix */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers size={16} className="text-primary" /> Vendor Reliability & Lead Time Matrix
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cross-supplier comparison of fulfillment completeness and average turnaround lead days.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {supplierRankingData.length} Evaluated Suppliers
          </span>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supplierRankingData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" />
              <YAxis yAxisId="left" orientation="left" domain={[85, 100]} unit="%" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 4]} unit="d" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="fulfillmentRate" name="Fulfillment Rate (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgLeadDays" name="Avg Lead Days" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supplier Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s, idx) => {
          const supDeliveries = HISTORICAL_SUPPLIER_DELIVERIES.filter((d) => d.supplierId === s.id);
          const count = supDeliveries.length;
          const avgFulfillment =
            count > 0
              ? (supDeliveries.reduce((acc, d) => acc + d.fulfillmentRate, 0) / count).toFixed(1)
              : '98.5';
          const avgLead =
            count > 0
              ? (supDeliveries.reduce((acc, d) => acc + d.actualLeadTimeDays, 0) / count).toFixed(1)
              : s.leadTimeDays.toString();

          const grade = Number(avgFulfillment) >= 99 ? 'A+ Elite' : Number(avgFulfillment) >= 96 ? 'A Reliable' : 'B+ Good';

          return (
            <div
              key={s.id}
              className="bg-card rounded-2xl border border-border p-4 hover:border-primary transition-all shadow-sm flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                      {s.code}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      grade.startsWith('A+')
                        ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                        : 'bg-primary/10 text-primary border border-primary/30'
                    }`}
                  >
                    {grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Fulfillment Rate</span>
                    <strong className="text-sm font-black text-emerald-600">{avgFulfillment}%</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Avg Lead Time</span>
                    <strong className="text-sm font-black text-foreground">{avgLead} Days</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Promised SLA</span>
                    <strong className="text-xs text-foreground font-semibold">{s.leadTimeDays} Days</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Payment Terms</span>
                    <strong className="text-xs text-foreground font-semibold">{s.paymentTerms}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{count > 0 ? `${count} Delivered Batches` : 'Active Vendor'}</span>
                {onSelectSupplierForEdit && (
                  <button
                    onClick={() => onSelectSupplierForEdit(s)}
                    className="text-primary font-bold hover:underline"
                  >
                    Edit Terms
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Deliveries Audit Trail Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Supplier Delivery & Fulfillment Audit Trail ({filteredDeliveries.length} Records)
            </h3>
            <p className="text-xs text-muted-foreground">
              Granular tracking of each purchase order shipment, arrival dates, and fulfillment accuracy.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            Total Spend: {formatPrice(metrics.totalSpend)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground text-left">
                <th className="p-3">PO Number</th>
                <th className="p-3">Supplier</th>
                <th className="p-3 text-center">Order Date</th>
                <th className="p-3 text-center">Arrival Date</th>
                <th className="p-3 text-center">Promised / Actual</th>
                <th className="p-3 text-center">Units Ordered / Rcvd</th>
                <th className="p-3 text-center">Fulfillment %</th>
                <th className="p-3 text-right">Order Value</th>
                <th className="p-3 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeliveries.map((del) => {
                const isOnTime = del.actualLeadTimeDays <= del.promisedLeadTimeDays;
                return (
                  <tr key={del.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{del.poNumber}</td>
                    <td className="p-3">
                      <span className="font-bold text-foreground block">{del.supplierName}</span>
                      <span className="text-[10px] text-muted-foreground">{del.notes}</span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{del.orderDate}</td>
                    <td className="p-3 text-center text-muted-foreground">{del.actualDeliveryDate}</td>
                    <td className="p-3 text-center font-mono">
                      <span>{del.promisedLeadTimeDays}d / </span>
                      <strong className={isOnTime ? 'text-emerald-600' : 'text-amber-600'}>
                        {del.actualLeadTimeDays}d
                      </strong>
                    </td>
                    <td className="p-3 text-center font-mono">
                      {del.orderedUnits} / <strong>{del.receivedUnits}</strong>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-black font-mono ${
                          del.fulfillmentRate >= 99
                            ? 'text-emerald-600'
                            : del.fulfillmentRate >= 95
                            ? 'text-foreground'
                            : 'text-destructive'
                        }`}
                      >
                        {del.fulfillmentRate}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-foreground">{formatPrice(del.totalAmount)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          del.status === 'on_time_full'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {del.status === 'on_time_full' ? 'ON TIME & FULL' : 'MINOR DELAY'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

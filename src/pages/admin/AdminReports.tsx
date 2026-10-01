import React, { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import {
  getPOSTransactions,
} from '@/lib/posStore';
import {
  getOrders,
  formatPrice,
} from '@/lib/store';
import {
  getCentralProducts,
} from '@/lib/inventoryStore';
import {
  Calendar, DollarSign, TrendingUp, BarChart2, PieChart, Download,
  Printer, ArrowUpRight, ArrowDownRight, Layers, FileSpreadsheet,
  CheckCircle2, CreditCard, Banknote, QrCode
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');

  const posTxs = getPOSTransactions().filter((t) => t.status === 'completed');
  const onlineOrders = getOrders().filter((o) => !['cancelled', 'refunded'].includes(o.status));
  const products = getCentralProducts();

  // Aggregate Sales & Financial Metrics
  const summary = useMemo(() => {
    const posGross = posTxs.reduce((s, t) => s + t.subtotal, 0);
    const posDiscount = posTxs.reduce((s, t) => s + t.orderDiscount, 0);
    const posNet = posTxs.reduce((s, t) => s + t.totalAmount, 0);

    const onlineGross = onlineOrders.reduce((s, o) => s + o.subtotal, 0);
    const onlineNet = onlineOrders.reduce((s, o) => s + o.total, 0);

    const grossSales = posGross + onlineGross;
    const totalDiscounts = posDiscount;
    const netSales = posNet + onlineNet;

    // Estimate COGS (Cost of Goods Sold)
    const totalCost = products.reduce((s, p) => s + p.stock * p.cost, 0);
    const estimatedCOGS = Math.round(netSales * 0.52);
    const grossProfit = Math.max(0, netSales - estimatedCOGS);
    const profitMargin = netSales > 0 ? Math.round((grossProfit / netSales) * 100) : 0;

    // Payment Methods Breakdown
    let cashTotal = 0;
    let cardTotal = 0;
    let digitalTotal = 0;

    posTxs.forEach((tx) => {
      tx.payments.forEach((p) => {
        if (p.method === 'cash') cashTotal += p.amount;
        else if (p.method === 'card') cardTotal += p.amount;
        else digitalTotal += p.amount;
      });
    });

    onlineOrders.forEach((o) => {
      if (['cod', 'cop'].includes(o.paymentMethod)) cashTotal += o.total;
      else digitalTotal += o.total;
    });

    return {
      grossSales,
      totalDiscounts,
      netSales,
      estimatedCOGS,
      grossProfit,
      profitMargin,
      cashTotal,
      cardTotal,
      digitalTotal,
      totalTransactions: posTxs.length + onlineOrders.length,
      posCount: posTxs.length,
      onlineCount: onlineOrders.length,
    };
  }, [posTxs, onlineOrders, products]);

  // Sales by Category
  const categorySales = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};

    posTxs.forEach((tx) => {
      tx.items.forEach((item) => {
        const cat = item.product.category || 'general';
        if (!map[cat]) map[cat] = { name: cat, count: 0, revenue: 0 };
        map[cat].count += item.quantity;
        map[cat].revenue += item.lineTotal;
      });
    });

    return Object.values(map);
  }, [posTxs]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Amount / Value'],
      ['Gross Sales', summary.grossSales],
      ['Total Discounts Given', summary.totalDiscounts],
      ['Net Sales', summary.netSales],
      ['Estimated COGS', summary.estimatedCOGS],
      ['Gross Profit', summary.grossProfit],
      ['Gross Profit Margin (%)', `${summary.profitMargin}%`],
      ['Total Cash Revenue', summary.cashTotal],
      ['Total Card Revenue', summary.cardTotal],
      ['Total Digital/E-Wallet Revenue', summary.digitalTotal],
      ['Total Completed Orders', summary.totalTransactions],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial report exported to CSV');
  };

  return (
    <AdminLayout title="Sales Analytics & Business Reports">
      <div className="space-y-6">
        {/* Filter Bar & Export Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'Year to Date' },
              { id: 'all', label: 'Lifetime' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} /> Export CSV
            </button>
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-black transition-colors flex items-center gap-1.5"
            >
              <Printer size={15} /> Print Report
            </button>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gross Sales</p>
            <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
              {formatPrice(summary.grossSales)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{summary.totalTransactions} transactions</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Net Sales</p>
            <p className="text-2xl font-black text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
              {formatPrice(summary.netSales)}
            </p>
            <p className="text-[11px] text-red-600 mt-1">Discounts: -{formatPrice(summary.totalDiscounts)}</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Estimated Profit</p>
            <p className="text-2xl font-black text-green-600 mt-1" style={{ fontFamily: 'Nunito' }}>
              {formatPrice(summary.grossProfit)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Margin: {summary.profitMargin}%</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Omnichannel Mix</p>
            <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
              {summary.posCount} POS / {summary.onlineCount} Web
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Store vs Online split</p>
          </div>
        </div>

        {/* Revenue by Payment Tender Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-foreground" style={{ fontFamily: 'Nunito' }}>
              Tender & Payment Methods
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-2">
                  <Banknote className="text-green-600" size={16} />
                  <span className="font-bold">Cash Tendered</span>
                </div>
                <span className="font-black text-primary">{formatPrice(summary.cashTotal)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-2">
                  <QrCode className="text-blue-600" size={16} />
                  <span className="font-bold">GCash & Maya E-Wallets</span>
                </div>
                <span className="font-black text-primary">{formatPrice(summary.digitalTotal)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-purple-600" size={16} />
                  <span className="font-bold">Credit & Debit Cards</span>
                </div>
                <span className="font-black text-primary">{formatPrice(summary.cardTotal)}</span>
              </div>
            </div>
          </div>

          {/* Product & Top Sellers */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-foreground" style={{ fontFamily: 'Nunito' }}>
              Inventory Valuation Summary
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="table-header text-left">Top Selling Product</th>
                    <th className="table-header text-center">Unit</th>
                    <th className="table-header text-right">Selling Price</th>
                    <th className="table-header text-center">Live Stock</th>
                    <th className="table-header text-right">Asset Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="px-4 py-3 font-bold text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-center capitalize text-muted-foreground">{p.unit || 'bilao'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">{formatPrice(p.promoPrice || p.price)}</td>
                      <td className="px-4 py-3 text-center font-bold">{p.stock}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{formatPrice(p.stock * p.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


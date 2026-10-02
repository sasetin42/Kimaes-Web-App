import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  BellRing,
  CheckCircle2,
  Volume2,
  VolumeX,
  Settings2,
  RefreshCw,
  Plus,
  ArrowRight,
  Sliders,
  History,
  FileSpreadsheet,
  AlertCircle,
  X,
  Package,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  SafetyStockAlertItem,
  SafetyStockConfig,
  SafetyStockEventLog,
  getSafetyStockConfig,
  saveSafetyStockConfig,
  subscribeToSafetyStockAlerts,
  acknowledgeAlert,
  clearAcknowledgement,
  getSafetyStockHistory,
  playSafetyAlertSound,
  simulateSafetyStockDeduction,
} from '@/services/safetyStockService';
import { getCentralProducts, adjustStockManual } from '@/lib/inventoryStore';
import { formatPrice } from '@/lib/store';
import { toast } from 'sonner';

interface SafetyStockAlertsProps {
  onOpenReorderModal?: (productId: string, suggestedQuantity: number) => void;
  className?: string;
}

export default function SafetyStockAlerts({
  onOpenReorderModal,
  className = '',
}: SafetyStockAlertsProps) {
  const [alerts, setAlerts] = useState<SafetyStockAlertItem[]>([]);
  const [config, setConfig] = useState<SafetyStockConfig>(getSafetyStockConfig());
  const [history, setHistory] = useState<SafetyStockEventLog[]>(getSafetyStockHistory());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'thresholds' | 'history'>('active');
  const [editingCustomId, setEditingCustomId] = useState<string>('');
  const [editingThresholdVal, setEditingThresholdVal] = useState<number>(15);

  const products = getCentralProducts();

  useEffect(() => {
    const unsub = subscribeToSafetyStockAlerts((syncedAlerts) => {
      setAlerts(syncedAlerts);
      setHistory(getSafetyStockHistory());
    });
    return unsub;
  }, []);

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalCount = alerts.filter((a) => a.severity === 'critical_out').length;
  const urgentCount = alerts.filter((a) => a.severity === 'urgent_danger').length;

  const handleToggleSound = () => {
    const next = !config.audioAlertEnabled;
    const updated = { ...config, audioAlertEnabled: next };
    setConfig(updated);
    saveSafetyStockConfig(updated);
    if (next) {
      playSafetyAlertSound();
      toast.success('Audio notifications enabled (Test sound played)');
    } else {
      toast.info('Audio notifications muted');
    }
  };

  const handleGlobalThresholdChange = (val: number) => {
    const updated = { ...config, globalThreshold: val };
    setConfig(updated);
    saveSafetyStockConfig(updated);
    toast.success(`Global safety stock threshold updated to ${val} units`);
  };

  const handleSetCustomThreshold = (productId: string, val: number) => {
    const updatedCustoms = { ...config.customThresholds, [productId]: val };
    const updated = { ...config, customThresholds: updatedCustoms };
    setConfig(updated);
    saveSafetyStockConfig(updated);
    setEditingCustomId('');
    toast.success('Custom safety stock threshold saved');
  };

  const handleRemoveCustomThreshold = (productId: string) => {
    const updatedCustoms = { ...config.customThresholds };
    delete updatedCustoms[productId];
    const updated = { ...config, customThresholds: updatedCustoms };
    setConfig(updated);
    saveSafetyStockConfig(updated);
    toast.info('Reverted to default safety stock threshold');
  };

  const handleAcknowledge = (productId: string, productName: string) => {
    acknowledgeAlert(productId, 'Admin Staff');
    toast.success(`Acknowledged safety stock alert for ${productName}`);
  };

  const handleQuickRestock = (productId: string, qty: number, productName: string) => {
    adjustStockManual(productId, qty, 'adjustment', 'Safety stock replenishment', 'Admin Staff');
    clearAcknowledgement(productId);
    toast.success(`Restocked ${qty} units of ${productName}`);
  };

  const handleExportShortages = () => {
    if (alerts.length === 0) {
      toast.info('No safety stock breaches to export');
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,SKU,Item Name,Category,Current Stock,Safety Threshold,Deficit,Suggested Reorder,Unit,Severity\n' +
      alerts
        .map(
          (a) =>
            `"${a.sku}","${a.productName}","${a.category}",${a.currentStock},${a.safetyThreshold},${a.deficitQuantity},${a.suggestedReorderQuantity},"${a.unit}","${a.severity}"`
        )
        .join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute(
      'download',
      `safety_stock_shortages_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Safety stock shortages CSV exported');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Real-time Notification Banner for Staff */}
      {alerts.length > 0 ? (
        <div
          className={`rounded-2xl p-4 border transition-all shadow-sm ${
            criticalCount > 0
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : urgentCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
              : 'bg-primary/10 border-primary/30 text-foreground'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  criticalCount > 0
                    ? 'bg-destructive text-destructive-foreground animate-pulse'
                    : urgentCount > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-foreground">
                    Real-Time Safety Stock Alert
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      criticalCount > 0
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {alerts.length} Breached Items
                  </span>
                  {unacknowledgedAlerts.length > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold px-2 py-0.5 rounded-full">
                      {unacknowledgedAlerts.length} Unacknowledged
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {criticalCount > 0
                    ? `Critical: ${criticalCount} items completely out of stock! Immediate commissary requisition required.`
                    : `${alerts.length} ingredients dropped below staff-defined safety buffers (Threshold: ${config.globalThreshold} units).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
                title={config.audioAlertEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
              >
                {config.audioAlertEnabled ? (
                  <Volume2 size={16} className="text-primary" />
                ) : (
                  <VolumeX size={16} />
                )}
              </button>

              <button
                onClick={() => setIsOpen(true)}
                className="btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                <Sliders size={14} /> Open Safety Stock Center
              </button>
            </div>
          </div>

          {/* Quick pills preview of breached items */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 pt-1 border-t border-border/50 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
              Action Items:
            </span>
            {alerts.slice(0, 5).map((a) => (
              <span
                key={a.productId}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border ${
                  a.severity === 'critical_out'
                    ? 'bg-destructive/20 border-destructive/40 text-destructive'
                    : a.severity === 'urgent_danger'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-300'
                    : 'bg-muted border-border text-foreground'
                }`}
              >
                <span>{a.productName}</span>
                <span className="font-mono bg-background/80 px-1 rounded text-[10px]">
                  {a.currentStock}/{a.safetyThreshold} {a.unit}
                </span>
                {a.acknowledged && (
                  <CheckCircle2 size={11} className="text-emerald-500" title="Acknowledged" />
                )}
              </span>
            ))}
            {alerts.length > 5 && (
              <button
                onClick={() => setIsOpen(true)}
                className="text-[11px] font-bold text-primary hover:underline whitespace-nowrap"
              >
                +{alerts.length - 5} more
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} />
            </div>
            <div>
              <p className="font-bold">All Inventory Safety Buffers Healthy</p>
              <p className="text-[11px] opacity-80">
                All tracked ingredients exceed defined safety threshold ({config.globalThreshold} units). Real-time monitoring active.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Pick first product and simulate drop for demonstration
                const target = products[0];
                if (target) {
                  simulateSafetyStockDeduction(target.id, 8);
                  toast.warning(`Simulated stock reduction on "${target.name}" to test real-time alerts!`);
                }
              }}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline hover:opacity-80"
              title="Test threshold alert"
            >
              Test Notification Drill
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-background/80 text-foreground font-bold hover:bg-background transition-colors text-[11px]"
            >
              Configure Buffers
            </button>
          </div>
        </div>
      )}

      {/* Safety Stock Control Center Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground" style={{ fontFamily: 'Nunito' }}>
                    Safety Stock & Real-Time Alerts Control Center
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define minimum ingredient safety buffers, manage active breach notifications, and trigger commissary reorders.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border px-6 gap-6 text-xs font-bold bg-card">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-primary text-primary font-black'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlertTriangle size={15} /> Active Threshold Breaches ({alerts.length})
              </button>
              <button
                onClick={() => setActiveTab('thresholds')}
                className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'thresholds'
                    ? 'border-primary text-primary font-black'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders size={15} /> Threshold Configuration
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary text-primary font-black'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <History size={15} /> Alert History & Audit Trail ({history.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: ACTIVE BREACHES */}
              {activeTab === 'active' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground">
                      Staff notifications trigger automatically whenever stock drops at or below defined safety stock levels.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportShortages}
                        className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
                      >
                        <FileSpreadsheet size={14} /> Export Shortages (CSV)
                      </button>
                      <button
                        onClick={() => {
                          const target = products[1] || products[0];
                          if (target) {
                            simulateSafetyStockDeduction(target.id, 6);
                            toast.warning(`Simulated stock deduction on ${target.name}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 flex items-center gap-1.5"
                      >
                        <Zap size={14} className="text-amber-500" /> Drill Simulation
                      </button>
                    </div>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
                      <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-foreground">Zero Safety Stock Breaches</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        All inventory items currently possess sufficient buffer stock above their specified thresholds.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {alerts.map((item) => (
                        <div
                          key={item.productId}
                          className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                            item.severity === 'critical_out'
                              ? 'bg-destructive/10 border-destructive/40'
                              : item.severity === 'urgent_danger'
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                item.severity === 'critical_out'
                                  ? 'bg-destructive text-destructive-foreground'
                                  : item.severity === 'urgent_danger'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              <Package size={17} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">
                                  {item.productName}
                                </h4>
                                <span className="font-mono text-[10px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-bold">
                                  {item.sku}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    item.severity === 'critical_out'
                                      ? 'bg-destructive text-destructive-foreground'
                                      : item.severity === 'urgent_danger'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-primary/20 text-primary'
                                  }`}
                                >
                                  {item.severity === 'critical_out'
                                    ? 'CRITICAL OUT'
                                    : item.severity === 'urgent_danger'
                                    ? 'URGENT DANGER'
                                    : 'SAFETY BREACH'}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
                                <span>
                                  Current Stock:{' '}
                                  <strong className="text-foreground">
                                    {item.currentStock} {item.unit}
                                  </strong>
                                </span>
                                <span>
                                  Safety Threshold:{' '}
                                  <strong className="text-foreground">
                                    {item.safetyThreshold} {item.unit}
                                  </strong>
                                </span>
                                <span>
                                  Shortage Deficit:{' '}
                                  <strong className="text-destructive">
                                    -{item.deficitQuantity} {item.unit}
                                  </strong>
                                </span>
                                <span>
                                  Suggested Reorder:{' '}
                                  <strong className="text-primary font-bold">
                                    +{item.suggestedReorderQuantity} {item.unit}
                                  </strong>
                                </span>
                              </div>

                              {item.acknowledged && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 size={12} /> Acknowledged by {item.acknowledgedBy} at{' '}
                                  {new Date(item.acknowledgedAt || '').toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border/50">
                            {!item.acknowledged ? (
                              <button
                                onClick={() => handleAcknowledge(item.productId, item.productName)}
                                className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 size={13} /> Acknowledge
                              </button>
                            ) : (
                              <button
                                onClick={() => clearAcknowledgement(item.productId)}
                                className="px-2.5 py-1.5 rounded-xl text-muted-foreground text-xs hover:text-foreground"
                                title="Reset acknowledge status"
                              >
                                Un-ack
                              </button>
                            )}

                            <button
                              onClick={() => {
                                handleQuickRestock(
                                  item.productId,
                                  item.suggestedReorderQuantity,
                                  item.productName
                                );
                              }}
                              className="btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1"
                            >
                              <Plus size={13} /> Quick Restock (+{item.suggestedReorderQuantity})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: THRESHOLD CONFIGURATION */}
              {activeTab === 'thresholds' && (
                <div className="space-y-6">
                  {/* Global Threshold Card */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Sliders size={16} className="text-primary" /> Global Safety Stock Threshold
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Standard safety buffer applied to any product or ingredient without a custom override.
                        </p>
                      </div>
                      <span className="text-2xl font-black text-primary font-mono">
                        {config.globalThreshold}{' '}
                        <span className="text-xs font-semibold text-muted-foreground">units</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={config.globalThreshold}
                        onChange={(e) => handleGlobalThresholdChange(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>5 units (Minimal)</span>
                        <span>15 units (Recommended)</span>
                        <span>30 units (High Buffer)</span>
                        <span>50 units (Bulk Events)</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio & Settings Card */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        {config.audioAlertEnabled ? (
                          <Volume2 size={16} className="text-primary" />
                        ) : (
                          <VolumeX size={16} className="text-muted-foreground" />
                        )}
                        Kitchen & Commissary Audible Chime
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Emits a gentle auditory tone when ingredients reach critical or urgent breach levels.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                        config.audioAlertEnabled
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {config.audioAlertEnabled ? 'Sound Active' : 'Sound Muted'}
                    </button>
                  </div>

                  {/* Individual Item Safety Stock Threshold Overrides */}
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          Custom Per-Item Safety Stock Overrides
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          High-volume party dishes (e.g. Pancit Malabon, Palabok Bilaos) can have elevated safety thresholds.
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold">
                        {Object.keys(config.customThresholds).length} Customized Items
                      </span>
                    </div>

                    <div className="divide-y divide-border text-xs max-h-72 overflow-y-auto">
                      {products.map((p) => {
                        const hasCustom = config.customThresholds[p.id] !== undefined;
                        const effectiveThreshold =
                          config.customThresholds[p.id] ?? (p.reorderLevel || config.globalThreshold);

                        return (
                          <div
                            key={p.id}
                            className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                                {p.sku}
                              </span>
                              <div>
                                <p className="font-bold text-foreground">{p.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  Current Stock:{' '}
                                  <strong
                                    className={
                                      p.stock <= effectiveThreshold
                                        ? 'text-destructive'
                                        : 'text-foreground'
                                    }
                                  >
                                    {p.stock} {p.unit || 'pcs'}
                                  </strong>{' '}
                                  | Reorder Point: {effectiveThreshold} {p.unit || 'pcs'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {editingCustomId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={editingThresholdVal}
                                    onChange={(e) => setEditingThresholdVal(Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded-lg border border-border bg-card text-center font-bold"
                                  />
                                  <button
                                    onClick={() => handleSetCustomThreshold(p.id, editingThresholdVal)}
                                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCustomId('')}
                                    className="px-2 py-1 rounded-lg border border-border text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                                      hasCustom
                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {effectiveThreshold} {p.unit || 'pcs'} {hasCustom ? '(Custom)' : '(Default)'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingCustomId(p.id);
                                      setEditingThresholdVal(effectiveThreshold);
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted font-bold text-[11px]"
                                  >
                                    Edit
                                  </button>
                                  {hasCustom && (
                                    <button
                                      onClick={() => handleRemoveCustomThreshold(p.id)}
                                      className="text-muted-foreground hover:text-destructive px-1"
                                      title="Reset to global threshold"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Real-time chronological log of safety stock threshold events, sales deductions, and restocking audits.
                    </p>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {history.length} Events Logged
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                      No safety stock events recorded yet.
                    </div>
                  ) : (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground text-left">
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Product / SKU</th>
                              <th className="p-3 text-center">Stock Before</th>
                              <th className="p-3 text-center">Stock After</th>
                              <th className="p-3 text-center">Threshold</th>
                              <th className="p-3 text-center">Severity</th>
                              <th className="p-3">Trigger Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {history.map((ev) => (
                              <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3 text-muted-foreground whitespace-nowrap">
                                  {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3">
                                  <span className="font-bold text-foreground block">{ev.productName}</span>
                                  <span className="font-mono text-[10px] text-muted-foreground">{ev.sku}</span>
                                </td>
                                <td className="p-3 text-center font-mono">{ev.stockBefore}</td>
                                <td className="p-3 text-center font-mono font-bold text-destructive">{ev.stockAfter}</td>
                                <td className="p-3 text-center font-mono">{ev.threshold}</td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      ev.severity === 'critical_out'
                                        ? 'bg-destructive text-destructive-foreground'
                                        : ev.severity === 'urgent_danger'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-primary/20 text-primary'
                                    }`}
                                  >
                                    {ev.severity.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">{ev.actor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20 text-xs">
              <span className="text-muted-foreground">
                Current Global Safety Stock Buffer: <strong>{config.globalThreshold} units</strong>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-primary px-5 py-2 text-xs font-black shadow-sm"
              >
                Close Safety Center
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

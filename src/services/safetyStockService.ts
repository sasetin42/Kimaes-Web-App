// Real-Time Safety Stock Notification & Threshold Management Service
import { getCentralProducts, subscribeToInventoryUpdates, adjustStockManual } from '@/lib/inventoryStore';
import type { Product } from '@/types';

export type AlertSeverity = 'critical_out' | 'urgent_danger' | 'warning_low';

export interface SafetyStockAlertItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  safetyThreshold: number;
  deficitQuantity: number;
  suggestedReorderQuantity: number;
  unit: string;
  severity: AlertSeverity;
  supplierName?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  timestamp: string;
}

export interface SafetyStockConfig {
  globalThreshold: number;
  customThresholds: Record<string, number>; // productId -> threshold
  audioAlertEnabled: boolean;
  autoReorderSuggestions: boolean;
}

const STORAGE_KEY_CONFIG = 'kimae_safety_stock_config';
const STORAGE_KEY_ACKNOWLEDGED = 'kimae_safety_stock_ack';
const STORAGE_KEY_HISTORY = 'kimae_safety_stock_history';

export interface SafetyStockEventLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  stockBefore: number;
  stockAfter: number;
  threshold: number;
  severity: AlertSeverity;
  timestamp: string;
  actor: string;
}

const DEFAULT_CONFIG: SafetyStockConfig = {
  globalThreshold: 15,
  customThresholds: {
    'prod-1': 20, // Pancit Malabon
    'prod-2': 20, // Pancit Palabok
    'prod-3': 15, // Sweet Spaghetti
    'prod-4': 18, // Pork Sisig
    'prod-5': 25, // Lumpiang Shanghai
  },
  audioAlertEnabled: true,
  autoReorderSuggestions: true,
};

// In-memory subscribers
type AlertListener = (alerts: SafetyStockAlertItem[]) => void;
const listeners: Set<AlertListener> = new Set();

export const getSafetyStockConfig = (): SafetyStockConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed reading safety stock config', e);
  }
  return DEFAULT_CONFIG;
};

export const saveSafetyStockConfig = (config: SafetyStockConfig) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    broadcastSafetyStockEvaluation();
  } catch (e) {
    console.error('Failed saving safety stock config', e);
  }
};

export const getAcknowledgedAlerts = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACKNOWLEDGED);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

export const acknowledgeAlert = (productId: string, staffName: string = 'Staff') => {
  if (typeof window === 'undefined') return;
  try {
    const acks = getAcknowledgedAlerts();
    acks[productId] = `${new Date().toISOString()}|${staffName}`;
    localStorage.setItem(STORAGE_KEY_ACKNOWLEDGED, JSON.stringify(acks));
    broadcastSafetyStockEvaluation();
  } catch (e) {
    console.error('Failed acknowledging alert', e);
  }
};

export const clearAcknowledgement = (productId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const acks = getAcknowledgedAlerts();
    delete acks[productId];
    localStorage.setItem(STORAGE_KEY_ACKNOWLEDGED, JSON.stringify(acks));
    broadcastSafetyStockEvaluation();
  } catch (e) {
    console.error('Failed clearing acknowledgement', e);
  }
};

export const getSafetyStockHistory = (): SafetyStockEventLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: 'log-1',
      productId: 'prod-4',
      productName: 'Pork Sisig Kapampangan',
      sku: 'PSK-004',
      stockBefore: 16,
      stockAfter: 12,
      threshold: 15,
      severity: 'warning_low',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actor: 'POS Checkout #42',
    },
    {
      id: 'log-2',
      productId: 'prod-5',
      productName: 'Lumpiang Shanghai Fiesta Tray',
      sku: 'LSF-005',
      stockBefore: 6,
      stockAfter: 2,
      threshold: 15,
      severity: 'urgent_danger',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      actor: 'Online Catering Order #1089',
    },
  ];
};

export const logSafetyStockBreach = (log: Omit<SafetyStockEventLog, 'id'>) => {
  if (typeof window === 'undefined') return;
  try {
    const list = getSafetyStockHistory();
    const entry: SafetyStockEventLog = {
      id: `ssl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...log,
    };
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.error('Failed logging safety breach', e);
  }
};

/**
 * Play a gentle audio chime when a critical safety stock threshold is breached
 */
export const playSafetyAlertSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    // Audio context may be restricted by autoplay policy before user gesture
  }
};

/**
 * Evaluate all products against defined safety stock thresholds
 */
export const evaluateSafetyStockAlerts = (products: Product[] = getCentralProducts()): SafetyStockAlertItem[] => {
  const config = getSafetyStockConfig();
  const acks = getAcknowledgedAlerts();
  const alerts: SafetyStockAlertItem[] = [];

  for (const p of products) {
    const threshold = config.customThresholds[p.id] ?? (p.reorderLevel || config.globalThreshold);

    if (p.stock <= threshold) {
      let severity: AlertSeverity = 'warning_low';
      if (p.stock <= 0) {
        severity = 'critical_out';
      } else if (p.stock <= Math.max(3, Math.floor(threshold * 0.35))) {
        severity = 'urgent_danger';
      }

      const ackInfo = acks[p.id];
      const isAcked = !!ackInfo;
      const [ackTime, ackBy] = ackInfo ? ackInfo.split('|') : ['', ''];

      const deficit = Math.max(0, threshold - p.stock);
      // Suggested reorder brings buffer to 2x safety stock
      const suggestedReorder = Math.max(10, threshold * 2 - p.stock);

      alerts.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        currentStock: p.stock,
        safetyThreshold: threshold,
        deficitQuantity: deficit,
        suggestedReorderQuantity: suggestedReorder,
        unit: p.unit || 'pcs',
        severity,
        supplierName: p.supplierId ? 'Preferred Commissary Vendor' : 'Central Commissary',
        acknowledged: isAcked,
        acknowledgedAt: ackTime,
        acknowledgedBy: ackBy,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Sort: Critical out-of-stock first, then urgent, then by deficit
  alerts.sort((a, b) => {
    if (a.severity === 'critical_out' && b.severity !== 'critical_out') return -1;
    if (b.severity === 'critical_out' && a.severity !== 'critical_out') return 1;
    if (a.severity === 'urgent_danger' && b.severity !== 'urgent_danger') return -1;
    if (b.severity === 'urgent_danger' && a.severity !== 'urgent_danger') return 1;
    return b.deficitQuantity - a.deficitQuantity;
  });

  return alerts;
};

export const broadcastSafetyStockEvaluation = () => {
  const alerts = evaluateSafetyStockAlerts();
  listeners.forEach((listener) => {
    try {
      listener(alerts);
    } catch (e) {
      console.error('Error invoking safety stock alert listener', e);
    }
  });
};

/**
 * Hook or subscription for real-time safety stock alerts
 */
export const subscribeToSafetyStockAlerts = (callback: (alerts: SafetyStockAlertItem[]) => void) => {
  listeners.add(callback);
  callback(evaluateSafetyStockAlerts());

  // Also hook into central inventory updates
  const unsubInv = subscribeToInventoryUpdates(() => {
    const alerts = evaluateSafetyStockAlerts();
    callback(alerts);
  });

  return () => {
    listeners.delete(callback);
    unsubInv();
  };
};

/**
 * Simulate safety stock drop for demonstration & staff drills
 */
export const simulateSafetyStockDeduction = (productId: string, deductAmount: number = 5) => {
  const products = getCentralProducts();
  const prod = products.find((p) => p.id === productId);
  if (!prod) return;

  const newStock = Math.max(0, prod.stock - deductAmount);
  adjustStockManual(
    productId,
    -deductAmount,
    'adjustment',
    `Safety stock drill deduction (-${deductAmount})`,
    'Admin Simulation'
  );

  const config = getSafetyStockConfig();
  const threshold = config.customThresholds[productId] ?? (prod.reorderLevel || config.globalThreshold);
  if (newStock <= threshold) {
    logSafetyStockBreach({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      stockBefore: prod.stock,
      stockAfter: newStock,
      threshold,
      severity: newStock === 0 ? 'critical_out' : newStock <= 5 ? 'urgent_danger' : 'warning_low',
      timestamp: new Date().toISOString(),
      actor: 'Admin Drill Simulation',
    });
    if (config.audioAlertEnabled) {
      playSafetyAlertSound();
    }
  }
};

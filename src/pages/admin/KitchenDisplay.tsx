import React, { useState, useEffect, useRef, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { getOrders, updateOrderStatus, formatPrice } from '@/lib/store';
import type { Order, OrderStatus } from '@/types';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  HelpCircle,
  X,
  Flame,
  Radio,
  Send,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const COLUMNS: { status: OrderStatus; label: string; color: string; bg: string; border: string }[] = [
  { status: 'confirmed', label: 'New / Confirmed', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' },
  { status: 'preparing', label: 'In the Wok / Preparing', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
  { status: 'ready', label: 'Plated / Ready for Dispatch', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800' },
  { status: 'completed', label: 'Completed / Dispatched', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
];

export interface KitchenShortageAlert {
  id: string;
  item: string;
  severity: 'critical' | 'low_stock';
  reportedAt: string;
  reportedBy: string;
  resolved: boolean;
}

const SHORTAGES_STORAGE_KEY = 'kimae_kitchen_shortages';

function KitchenCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (status: OrderStatus) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(order.updatedAt || order.createdAt).getTime();
    const calculateElapsed = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    };
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000);
    return () => clearInterval(interval);
  }, [order.updatedAt, order.createdAt]);

  const prepLimit = order.estimatedPrepTime || 40;
  const isOverdue = elapsed > prepLimit && order.status !== 'completed';
  const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'completed',
  };
  const next = nextMap[order.status];

  // Extract short number for chef convenience
  const shortNum = order.orderNumber.replace(/^[A-Z]+-\d+-/, '') || order.orderNumber;

  return (
    <div
      id={`order-card-${order.orderNumber}`}
      className={`bg-card rounded-2xl border-2 transition-all p-4 shadow-sm flex flex-col justify-between ${
        isOverdue
          ? 'border-destructive ring-1 ring-destructive'
          : order.status === 'preparing'
          ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20'
          : 'border-border'
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-foreground" style={{ fontFamily: 'Nunito' }}>
                {order.orderNumber}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-secondary text-primary text-[10px] font-mono font-bold">
                #{shortNum}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">{order.customer.name}</p>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              isOverdue
                ? 'bg-destructive/15 text-destructive'
                : 'bg-primary/15 text-secondary dark:text-primary'
            }`}
          >
            <Clock size={11} />
            {elapsed}m
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-2 mb-3 mt-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-muted/40 p-2 rounded-xl border border-border/50 text-xs">
              <span className="w-5 h-5 rounded-lg bg-primary text-secondary text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.quantity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{item.product.name}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <p className="text-[10px] text-muted-foreground italic truncate">
                    {Object.entries(item.selectedOptions)
                      .map(([k, v]) => (Array.isArray(v) ? v.join(', ') : v))
                      .join(' • ')}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                    📝 {item.specialInstructions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60 mb-3">
          <span className="capitalize font-semibold">{order.deliveryMethod}</span>
          <span className="font-black text-primary">{formatPrice(order.total)}</span>
        </div>

        {isOverdue && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-destructive bg-destructive/10 rounded-xl p-2 mb-2">
            <AlertCircle size={13} /> Overdue by {elapsed - prepLimit}m
          </div>
        )}

        {next && (
          <button
            onClick={() => onAdvance(next)}
            className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <CheckCircle size={14} />
            Mark as {next === 'preparing' ? 'Preparing' : next === 'ready' ? 'Ready' : 'Completed'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [recognizedCommand, setRecognizedCommand] = useState('');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [manualCommandInput, setManualCommandInput] = useState('');

  // Shortage alerts
  const [shortageAlerts, setShortageAlerts] = useState<KitchenShortageAlert[]>(() => {
    try {
      const stored = localStorage.getItem(SHORTAGES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [
        {
          id: 'alert-1',
          item: 'Bilao Size Large (Bamboo)',
          severity: 'low_stock',
          reportedAt: new Date(Date.now() - 3600000).toISOString(),
          reportedBy: 'Chef Marvin',
          resolved: false,
        },
      ];
    } catch {
      return [];
    }
  });

  const recognitionRef = useRef<any>(null);

  // Sync orders with store
  const refresh = () => setOrders([...getOrders()]);

  useEffect(() => {
    const handleOrderSync = () => setOrders([...getOrders()]);
    window.addEventListener('kimae_orders_sync', handleOrderSync);
    return () => window.removeEventListener('kimae_orders_sync', handleOrderSync);
  }, []);

  // Save shortages to local storage
  useEffect(() => {
    localStorage.setItem(SHORTAGES_STORAGE_KEY, JSON.stringify(shortageAlerts));
  }, [shortageAlerts]);

  // Audio feedback using SpeechSynthesis
  const speakFeedback = (text: string) => {
    if (!audioFeedbackEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Process text command (from microphone or manual entry)
  const processCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    if (!text) return;

    setTranscript(rawText);

    // 1. INVENTORY SHORTAGE COMMANDS
    // e.g. "shortage chicken", "out of stock garlic", "low stock noodles", "ubos na lumpia", "shortage large bilao"
    const shortageKeywords = ['shortage', 'out of stock', 'low stock', 'ubos na', 'kulang'];
    const matchedShortageKey = shortageKeywords.find((k) => text.includes(k));

    if (matchedShortageKey) {
      let item = text.replace(matchedShortageKey, '').replace(/alert|please|na|ng/gi, '').trim();
      if (!item) item = 'Ingredient / Supplies';
      // Capitalize first letters
      item = item.replace(/\b\w/g, (c) => c.toUpperCase());

      const severity: 'critical' | 'low_stock' =
        matchedShortageKey === 'out of stock' || matchedShortageKey === 'ubos na'
          ? 'critical'
          : 'low_stock';

      const newAlert: KitchenShortageAlert = {
        id: `shortage-${Date.now()}`,
        item,
        severity,
        reportedAt: new Date().toISOString(),
        reportedBy: 'Kitchen Chef (Voice)',
        resolved: false,
      };

      setShortageAlerts((prev) => [newAlert, ...prev]);
      setRecognizedCommand(`📢 Recorded Shortage: ${item}`);
      toast.warning(`Inventory Shortage Alert: "${item}" reported by kitchen`);
      speakFeedback(`Shortage alert recorded for ${item}`);
      return;
    }

    // 2. ORDER STATUS UPDATE COMMANDS
    // e.g. "order 123 ready", "preparing order 123", "order 123 completed", "mark 123 ready"
    let targetStatus: OrderStatus | null = null;
    if (text.includes('ready') || text.includes('handa na') || text.includes('plated')) {
      targetStatus = 'ready';
    } else if (text.includes('preparing') || text.includes('cooking') || text.includes('in the wok') || text.includes('start')) {
      targetStatus = 'preparing';
    } else if (text.includes('complete') || text.includes('completed') || text.includes('dispatched') || text.includes('done')) {
      targetStatus = 'completed';
    } else if (text.includes('confirmed') || text.includes('new')) {
      targetStatus = 'confirmed';
    }

    // Extract numbers from text
    const numberMatches = text.match(/\d+/g);
    const currentOrders = getOrders();

    if (targetStatus && numberMatches && numberMatches.length > 0) {
      const searchNum = numberMatches[0];
      // Match by orderNumber ending with searchNum or exact match
      const matchedOrder = currentOrders.find(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchNum) ||
          o.id.toLowerCase().includes(searchNum)
      );

      if (matchedOrder) {
        updateOrderStatus(matchedOrder.id, targetStatus, 'Updated via Kitchen Voice Command', 'Kitchen Chef');
        setOrders([...getOrders()]);
        const msg = `Order #${searchNum} is now ${targetStatus}!`;
        setRecognizedCommand(`✅ ${msg}`);
        toast.success(msg);
        speakFeedback(`Order ${searchNum} marked as ${targetStatus}`);
        return;
      } else {
        const errorMsg = `No active order found matching #${searchNum}`;
        setRecognizedCommand(`⚠️ ${errorMsg}`);
        toast.error(errorMsg);
        speakFeedback(errorMsg);
        return;
      }
    }

    // Match by customer name if no number
    if (targetStatus) {
      const matchedByName = currentOrders.find((o) =>
        text.includes(o.customer.name.toLowerCase())
      );
      if (matchedByName) {
        updateOrderStatus(matchedByName.id, targetStatus, 'Updated via Kitchen Voice Command', 'Kitchen Chef');
        setOrders([...getOrders()]);
        const msg = `Order for ${matchedByName.customer.name} marked as ${targetStatus}!`;
        setRecognizedCommand(`✅ ${msg}`);
        toast.success(msg);
        speakFeedback(msg);
        return;
      }
    }

    // Unrecognized command
    setRecognizedCommand(`❓ Unrecognized: "${rawText}". Try "Order [number] Ready" or "Shortage [item]"`);
  };

  // Setup Web Speech API Recognition
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      // Fallback: request mic permission to confirm mic access
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then((stream) => {
          setIsListening(true);
          toast.info('Microphone accessed. Use voice command simulator bar below.');
        })
        .catch(() => {
          toast.error('Microphone access denied. Please enable microphone permissions in your browser.');
        });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-PH';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success('Microphone ON: Kitchen Voice Assistant listening...');
        speakFeedback('Kitchen voice assistant active');
      };

      recognition.onresult = (event: any) => {
        const currentResult = event.results[event.results.length - 1];
        if (currentResult.isFinal) {
          const speechText = currentResult[0].transcript;
          processCommand(speechText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied! Please click the lock icon in the address bar to allow.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart if user hasn't explicitly stopped listening
        if (recognitionRef.current && isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Recognition start error:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    toast.info('Microphone turned OFF.');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setShortageAlerts((prev) => prev.filter((a) => a.id !== alertId));
    toast.success('Shortage alert marked as resolved / replenished');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCommandInput.trim()) return;
    processCommand(manualCommandInput);
    setManualCommandInput('');
  };

  const handleAdvance = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    setOrders([...getOrders()]);
  };

  const getColumnOrders = (status: OrderStatus) => orders.filter((o) => o.status === status);

  return (
    <AdminLayout title="Kitchen Display System (KDS)">
      <div className="space-y-4">
        {/* Top Control Header with Voice Command Center */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Microphone Toggle Button */}
            <button
              onClick={toggleListening}
              className={`relative px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/20'
                  : 'bg-primary text-secondary hover:bg-brand-yellow-dark'
              }`}
            >
              {isListening ? <Mic size={18} className="animate-bounce" /> : <Mic size={18} />}
              <span>{isListening ? 'Mic Active (Listening)' : 'Turn On Mic'}</span>
              {isListening && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
            </button>

            {/* Audio Speech Synthesis Feedback Toggle */}
            <button
              onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
              title={audioFeedbackEnabled ? 'Voice confirmation is ON' : 'Voice confirmation is MUTED'}
              className={`p-2.5 rounded-xl border transition-colors ${
                audioFeedbackEnabled
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground'
              }`}
            >
              {audioFeedbackEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Command Cheat Sheet Dialog Trigger */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} /> Voice Commands Guide
            </button>
          </div>

          {/* Quick Voice / Text Simulator Bar for Noisy Kitchens */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCommandInput}
                onChange={(e) => setManualCommandInput(e.target.value)}
                placeholder="Say or type command e.g. 'Order 123 Ready' or 'Shortage Chicken'..."
                className="w-full pl-3 pr-8 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl hover:bg-black transition-colors"
            >
              <Send size={13} />
            </button>
            <button
              type="button"
              onClick={refresh}
              className="p-2 border border-border bg-card rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh queue"
            >
              <RefreshCw size={14} />
            </button>
          </form>
        </div>

        {/* Live Audio Transcript & Status Bar */}
        {(isListening || recognizedCommand) && (
          <div className="bg-secondary text-secondary-foreground rounded-2xl p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-md border border-secondary-foreground/20 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-400 animate-ping" />
              <span className="text-xs font-bold text-primary">Kitchen Mic Live:</span>
              <span className="text-xs text-white/90 italic font-mono">
                {transcript ? `"${transcript}"` : 'Listening for chef voice command...'}
              </span>
            </div>

            {recognizedCommand && (
              <div className="text-xs font-bold text-amber-300 bg-white/10 px-3 py-1 rounded-lg">
                {recognizedCommand}
              </div>
            )}
          </div>
        )}

        {/* Shortage Alerts Banner */}
        {shortageAlerts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <AlertTriangle size={16} className="text-amber-600 animate-pulse" />
                <span>Active Kitchen Shortage Alerts ({shortageAlerts.length})</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Say "Shortage [Ingredient]" anytime to log an urgent stock issue
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {shortageAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <span>⚠️ {alert.item}</span>
                  <span className="text-[10px] opacity-70">
                    ({new Date(alert.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    title="Mark shortage resolved"
                    className="ml-1 hover:text-foreground text-muted-foreground"
                  >
                    <CheckCircle size={14} className="hover:text-green-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4-Column Kitchen Display Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colOrders = getColumnOrders(col.status);
            return (
              <div key={col.status} className="flex flex-col">
                {/* Column Header */}
                <div
                  className={`rounded-t-2xl ${col.bg} border ${col.border} px-4 py-3 flex items-center justify-between border-b-0`}
                >
                  <span className={`font-black text-sm ${col.color}`} style={{ fontFamily: 'Nunito' }}>
                    {col.label}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full border ${col.border} flex items-center justify-center text-xs font-black ${col.color} bg-card`}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 bg-muted/30 rounded-b-2xl border border-t-0 border-border p-3 space-y-3 min-h-[350px]">
                  {colOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40">
                      <ChefHat size={32} />
                      <p className="text-xs mt-2 font-semibold">No orders in this stage</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <KitchenCard
                        key={order.id}
                        order={order}
                        onAdvance={(status) => handleAdvance(order.id, status)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Commands Cheat Sheet Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-secondary flex items-center justify-center">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>
                    Chef Voice Commands Guide
                  </h3>
                  <p className="text-xs text-muted-foreground">Hands-free voice control for busy kitchens</p>
                </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-foreground">
              {/* Status Update Commands */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                <p className="font-bold text-primary uppercase tracking-wide text-[10px]">
                  1. Order Status Commands
                </p>
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    • <strong className="text-foreground">"Order 123 Ready"</strong> or <strong className="text-foreground">"Mark 123 ready"</strong> → Moves ticket to Plated/Ready
                  </p>
                  <p>
                    • <strong className="text-foreground">"Order 123 Preparing"</strong> or <strong className="text-foreground">"Start Order 123"</strong> → Moves ticket to Preparing
                  </p>
                  <p>
                    • <strong className="text-foreground">"Order 123 Completed"</strong> or <strong className="text-foreground">"Done Order 123"</strong> → Completes and clears ticket
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 italic pt-1">
                    Tip: You can say the last 3-4 digits of the order number or full number.
                  </p>
                </div>
              </div>

              {/* Shortage Alerts */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide text-[10px]">
                  2. Inventory Shortage & Out of Stock Alerts
                </p>
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    • <strong className="text-foreground">"Shortage Chicken"</strong> or <strong className="text-foreground">"Kulang Chicken"</strong> → Logs alert
                  </p>
                  <p>
                    • <strong className="text-foreground">"Out of Stock Garlic"</strong> or <strong className="text-foreground">"Ubos na Garlic"</strong> → Critical alert
                  </p>
                  <p>
                    • <strong className="text-foreground">"Low Stock Pancit Malabon"</strong> → Low stock warning
                  </p>
                </div>
              </div>

              {/* Quick simulation buttons */}
              <div>
                <p className="font-bold text-muted-foreground mb-2">Test Voice Actions Now:</p>
                <div className="flex flex-wrap gap-2">
                  {['Order 123 Ready', 'Order 123 Preparing', 'Shortage Buttered Shrimp', 'Shortage Lumpiang Shanghai', 'Out of Stock Large Bilao'].map(
                    (cmd) => (
                      <button
                        key={cmd}
                        onClick={() => {
                          processCommand(cmd);
                          setShowHelpModal(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-primary/20 text-xs font-semibold"
                      >
                        🗣️ "{cmd}"
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button onClick={() => setShowHelpModal(false)} className="btn-secondary px-5 py-2 text-xs">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

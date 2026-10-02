import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Calendar,
  Users,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Sparkles,
  FileSpreadsheet,
  Layers,
  ChefHat,
  TrendingUp,
  Percent,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { formatPrice } from '@/lib/store';
import type { Product } from '@/types';
import { toast } from 'sonner';

export interface IngredientSpec {
  id: string;
  name: string;
  category: 'noodles' | 'meat' | 'seafood' | 'produce' | 'seasoning' | 'packaging';
  amountPerUnit: number;
  unit: string;
  unitCost: number;
}

export interface DishConfig {
  id: string;
  name: string;
  category: string;
  servingsPerUnit: number; // pax served per bilao/tray
  retailPrice: number;
  ingredients: IngredientSpec[];
}

export interface SelectedEventDish {
  dishId: string;
  volume: number; // number of bilaos or trays required
}

export interface EventPreset {
  id: string;
  name: string;
  targetPax: number;
  description: string;
  dishes: { dishId: string; volume: number }[];
}

// Master Recipe Registry for Catering & Event Dishes
export const CATERING_DISH_REGISTRY: DishConfig[] = [
  {
    id: 'dish-malabon',
    name: 'Special Pancit Malabon Party Bilao (16")',
    category: 'party-bilao',
    servingsPerUnit: 12,
    retailPrice: 1250,
    ingredients: [
      { id: 'raw-malabon-noodles', name: 'Thick Rice Noodles (Malabon)', category: 'noodles', amountPerUnit: 0.5, unit: 'kg', unitCost: 95 },
      { id: 'raw-achuete-sauce', name: 'Achuete & Shrimp Sauce Base', category: 'seasoning', amountPerUnit: 0.45, unit: 'L', unitCost: 80 },
      { id: 'raw-pork-belly', name: 'Cooked Pork Belly (Diced)', category: 'meat', amountPerUnit: 0.35, unit: 'kg', unitCost: 340 },
      { id: 'raw-fresh-shrimp', name: 'Fresh Shrimps (Shelled & Poached)', category: 'seafood', amountPerUnit: 0.25, unit: 'kg', unitCost: 450 },
      { id: 'raw-boiled-eggs', name: 'Hard-Boiled Eggs', category: 'produce', amountPerUnit: 3, unit: 'pcs', unitCost: 9 },
      { id: 'raw-chicharon', name: 'Crushed Special Chicharon', category: 'seasoning', amountPerUnit: 0.1, unit: 'kg', unitCost: 280 },
      { id: 'raw-garlic-onions', name: 'Toasted Garlic & Spring Onions', category: 'produce', amountPerUnit: 0.08, unit: 'kg', unitCost: 150 },
      { id: 'raw-calamansi', name: 'Fresh Native Calamansi', category: 'produce', amountPerUnit: 12, unit: 'pcs', unitCost: 2 },
      { id: 'raw-bilao-16', name: 'Large Woven Bamboo Bilao (16")', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 65 },
      { id: 'raw-banana-leaves', name: 'Fresh Banana Leaves Liner', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 15 },
    ],
  },
  {
    id: 'dish-palabok',
    name: 'Fiesta Pancit Palabok Bilao (16")',
    category: 'party-bilao',
    servingsPerUnit: 12,
    retailPrice: 1150,
    ingredients: [
      { id: 'raw-palabok-noodles', name: 'Bihon / Palabok Noodles', category: 'noodles', amountPerUnit: 0.5, unit: 'kg', unitCost: 85 },
      { id: 'raw-palabok-gravy', name: 'Golden Palabok Gravy Base', category: 'seasoning', amountPerUnit: 0.5, unit: 'L', unitCost: 75 },
      { id: 'raw-tinapa-flakes', name: 'Smoked Tinapa Flakes', category: 'seafood', amountPerUnit: 0.12, unit: 'kg', unitCost: 320 },
      { id: 'raw-pork-belly', name: 'Cooked Pork Belly (Diced)', category: 'meat', amountPerUnit: 0.25, unit: 'kg', unitCost: 340 },
      { id: 'raw-fresh-shrimp', name: 'Fresh Shrimps (Shelled & Poached)', category: 'seafood', amountPerUnit: 0.2, unit: 'kg', unitCost: 450 },
      { id: 'raw-boiled-eggs', name: 'Hard-Boiled Eggs', category: 'produce', amountPerUnit: 3, unit: 'pcs', unitCost: 9 },
      { id: 'raw-chicharon', name: 'Crushed Special Chicharon', category: 'seasoning', amountPerUnit: 0.1, unit: 'kg', unitCost: 280 },
      { id: 'raw-calamansi', name: 'Fresh Native Calamansi', category: 'produce', amountPerUnit: 12, unit: 'pcs', unitCost: 2 },
      { id: 'raw-bilao-16', name: 'Large Woven Bamboo Bilao (16")', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 65 },
      { id: 'raw-banana-leaves', name: 'Fresh Banana Leaves Liner', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 15 },
    ],
  },
  {
    id: 'dish-spaghetti',
    name: 'Special Pinoy Sweet Spaghetti Party Tray',
    category: 'food-trays',
    servingsPerUnit: 15,
    retailPrice: 1200,
    ingredients: [
      { id: 'raw-spaghetti-pasta', name: 'Spaghetti Pasta Noodles', category: 'noodles', amountPerUnit: 0.8, unit: 'kg', unitCost: 90 },
      { id: 'raw-spaghetti-sauce', name: 'Pinoy Sweet Spaghetti Sauce', category: 'seasoning', amountPerUnit: 1.0, unit: 'kg', unitCost: 110 },
      { id: 'raw-ground-pork', name: 'Ground Pork & Beef Blend', category: 'meat', amountPerUnit: 0.5, unit: 'kg', unitCost: 320 },
      { id: 'raw-red-hotdogs', name: 'Filipino Red Hotdogs (Sliced)', category: 'meat', amountPerUnit: 0.35, unit: 'kg', unitCost: 190 },
      { id: 'raw-cheddar-cheese', name: 'Grated Quickmelt Cheddar Cheese', category: 'seasoning', amountPerUnit: 0.25, unit: 'kg', unitCost: 260 },
      { id: 'raw-onions-garlic', name: 'Minced White Onion & Garlic', category: 'produce', amountPerUnit: 0.1, unit: 'kg', unitCost: 120 },
      { id: 'raw-aluminum-tray', name: 'Party Size Aluminum Tray + Lid', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 45 },
    ],
  },
  {
    id: 'dish-sisig',
    name: 'Sizzling Pork Sisig Kapampangan Party Tray',
    category: 'food-trays',
    servingsPerUnit: 12,
    retailPrice: 1450,
    ingredients: [
      { id: 'raw-pork-mask', name: 'Boiled & Grilled Pork Mask/Belly', category: 'meat', amountPerUnit: 1.2, unit: 'kg', unitCost: 360 },
      { id: 'raw-red-onions', name: 'Minced Red Onions', category: 'produce', amountPerUnit: 0.25, unit: 'kg', unitCost: 130 },
      { id: 'raw-green-chili', name: 'Green Chili (Siling Haba) Chopped', category: 'produce', amountPerUnit: 0.06, unit: 'kg', unitCost: 180 },
      { id: 'raw-liver-sauce', name: 'Chicken Liver Seasoning Pate', category: 'meat', amountPerUnit: 0.18, unit: 'kg', unitCost: 210 },
      { id: 'raw-calamansi-juice', name: 'Pure Native Calamansi Juice', category: 'produce', amountPerUnit: 0.08, unit: 'L', unitCost: 140 },
      { id: 'raw-aluminum-tray', name: 'Party Size Aluminum Tray + Lid', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 45 },
    ],
  },
  {
    id: 'dish-shanghai',
    name: 'Lumpiang Shanghai Fiesta Tray (60 pcs)',
    category: 'food-trays',
    servingsPerUnit: 15,
    retailPrice: 950,
    ingredients: [
      { id: 'raw-ground-pork', name: 'Ground Lean Pork', category: 'meat', amountPerUnit: 1.0, unit: 'kg', unitCost: 320 },
      { id: 'raw-lumpia-wrapper', name: 'Lumpia Spring Roll Wrappers', category: 'noodles', amountPerUnit: 60, unit: 'pcs', unitCost: 1.2 },
      { id: 'raw-carrots-onions', name: 'Minced Carrots & Sweet Onions', category: 'produce', amountPerUnit: 0.35, unit: 'kg', unitCost: 110 },
      { id: 'raw-boiled-eggs', name: 'Eggs (Binder)', category: 'produce', amountPerUnit: 2, unit: 'pcs', unitCost: 9 },
      { id: 'raw-sweet-chili-dip', name: 'Sweet & Sour Chili Dip', category: 'seasoning', amountPerUnit: 0.3, unit: 'L', unitCost: 65 },
      { id: 'raw-aluminum-tray', name: 'Party Size Aluminum Tray + Lid', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 45 },
    ],
  },
  {
    id: 'dish-kakanin',
    name: 'Maja Blanca Especial Bilao (14")',
    category: 'party-bilao',
    servingsPerUnit: 15,
    retailPrice: 750,
    ingredients: [
      { id: 'raw-coconut-cream', name: 'Fresh Coconut Cream (Gata)', category: 'seasoning', amountPerUnit: 0.8, unit: 'L', unitCost: 110 },
      { id: 'raw-condensed-milk', name: 'Evaporated & Condensed Milk', category: 'seasoning', amountPerUnit: 0.6, unit: 'L', unitCost: 95 },
      { id: 'raw-cornstarch', name: 'High Grade Cornstarch', category: 'seasoning', amountPerUnit: 0.35, unit: 'kg', unitCost: 80 },
      { id: 'raw-sweet-corn', name: 'Sweet Whole Kernel Corn', category: 'produce', amountPerUnit: 0.42, unit: 'kg', unitCost: 60 },
      { id: 'raw-latik-curds', name: 'Golden Toasted Latik Curds', category: 'seasoning', amountPerUnit: 0.12, unit: 'kg', unitCost: 220 },
      { id: 'raw-bilao-14', name: 'Medium Bamboo Bilao (14")', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 55 },
      { id: 'raw-banana-leaves', name: 'Fresh Banana Leaves Liner', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 15 },
    ],
  },
  {
    id: 'dish-puto',
    name: 'Special Puto Pandan with Cheese Bilao',
    category: 'party-bilao',
    servingsPerUnit: 15,
    retailPrice: 650,
    ingredients: [
      { id: 'raw-rice-flour', name: 'Special Rice Flour (Galapong)', category: 'noodles', amountPerUnit: 0.6, unit: 'kg', unitCost: 75 },
      { id: 'raw-cheddar-cheese', name: 'Grated Cheddar Cheese Toppings', category: 'seasoning', amountPerUnit: 0.2, unit: 'kg', unitCost: 260 },
      { id: 'raw-pandan-extract', name: 'Fresh Pandan Leaf Extract', category: 'seasoning', amountPerUnit: 0.05, unit: 'L', unitCost: 120 },
      { id: 'raw-sugar', name: 'Refined White Sugar', category: 'seasoning', amountPerUnit: 0.3, unit: 'kg', unitCost: 68 },
      { id: 'raw-bilao-14', name: 'Medium Bamboo Bilao (14")', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 55 },
      { id: 'raw-banana-leaves', name: 'Fresh Banana Leaves Liner', category: 'packaging', amountPerUnit: 1, unit: 'pcs', unitCost: 15 },
    ],
  },
];

// Event Catering Presets
export const EVENT_PRESETS: EventPreset[] = [
  {
    id: 'preset-grand-fiesta',
    name: 'Grand Cavite Fiesta Banquet (200 Pax)',
    targetPax: 200,
    description: 'A grand Filipino feast with full noodle bilao stations, pork trays, crispy lumpia, and traditional kakanin.',
    dishes: [
      { dishId: 'dish-malabon', volume: 10 }, // 120 pax
      { dishId: 'dish-palabok', volume: 8 },  // 96 pax
      { dishId: 'dish-spaghetti', volume: 8 }, // 120 pax
      { dishId: 'dish-shanghai', volume: 15 }, // 225 pcs
      { dishId: 'dish-sisig', volume: 6 },     // 72 pax
      { dishId: 'dish-kakanin', volume: 8 },   // 120 pax
      { dishId: 'dish-puto', volume: 6 },      // 90 pax
    ],
  },
  {
    id: 'preset-corporate',
    name: 'Corporate Townhall Buffet (100 Pax)',
    targetPax: 100,
    description: 'Tailored for corporate quarterly meetings and office salo-salo in industrial hubs.',
    dishes: [
      { dishId: 'dish-malabon', volume: 6 }, // 72 pax
      { dishId: 'dish-palabok', volume: 4 }, // 48 pax
      { dishId: 'dish-shanghai', volume: 10 }, // 150 pcs
      { dishId: 'dish-sisig', volume: 6 }, // 72 pax
      { dishId: 'dish-kakanin', volume: 5 }, // 75 pax
    ],
  },
  {
    id: 'preset-birthday',
    name: 'Family Birthday Celebration (50 Pax)',
    targetPax: 50,
    description: 'Essential birthday setup with signature Pancit Malabon, Sweet Spaghetti, and Lumpiang Shanghai.',
    dishes: [
      { dishId: 'dish-malabon', volume: 3 }, // 36 pax
      { dishId: 'dish-spaghetti', volume: 3 }, // 45 pax
      { dishId: 'dish-shanghai', volume: 5 }, // 75 pcs
      { dishId: 'dish-kakanin', volume: 3 }, // 45 pax
    ],
  },
];

// Baseline Raw Inventory Stock on hand in Dasmariñas Commissary
const DEFAULT_RAW_STOCK_MAP: Record<string, number> = {
  'raw-malabon-noodles': 8.0, // kg
  'raw-palabok-noodles': 6.5, // kg
  'raw-spaghetti-pasta': 10.0, // kg
  'raw-rice-flour': 12.0, // kg
  'raw-lumpia-wrapper': 400, // pcs
  'raw-pork-belly': 5.0, // kg
  'raw-ground-pork': 8.5, // kg
  'raw-pork-mask': 6.0, // kg
  'raw-red-hotdogs': 4.0, // kg
  'raw-fresh-shrimp': 4.2, // kg
  'raw-tinapa-flakes': 2.0, // kg
  'raw-boiled-eggs': 60, // pcs
  'raw-calamansi': 180, // pcs
  'raw-garlic-onions': 3.0, // kg
  'raw-red-onions': 4.0, // kg
  'raw-carrots-onions': 5.0, // kg
  'raw-green-chili': 1.5, // kg
  'raw-calamansi-juice': 1.8, // L
  'raw-sweet-corn': 6.0, // kg
  'raw-coconut-cream': 10.0, // L
  'raw-condensed-milk': 8.0, // L
  'raw-cornstarch': 5.0, // kg
  'raw-sugar': 8.0, // kg
  'raw-latik-curds': 1.8, // kg
  'raw-pandan-extract': 0.8, // L
  'raw-cheddar-cheese': 3.5, // kg
  'raw-achuete-sauce': 5.0, // L
  'raw-palabok-gravy': 6.0, // L
  'raw-spaghetti-sauce': 8.0, // kg
  'raw-sweet-chili-dip': 4.0, // L
  'raw-liver-sauce': 2.5, // kg
  'raw-chicharon': 2.0, // kg
  'raw-bilao-16': 18, // pcs
  'raw-bilao-14': 12, // pcs
  'raw-banana-leaves': 35, // pcs
  'raw-aluminum-tray': 24, // pcs
};

interface BulkIngredientCalculatorProps {
  products: Product[];
}

export default function BulkIngredientCalculator({ products }: BulkIngredientCalculatorProps) {
  // Event Details State
  const [eventName, setEventName] = useState<string>('Grand Cavite Fiesta Banquet');
  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [targetPax, setTargetPax] = useState<number>(200);
  const [selectedDishes, setSelectedDishes] = useState<SelectedEventDish[]>(
    EVENT_PRESETS[0].dishes
  );
  const [dishToAdd, setDishToAdd] = useState<string>(CATERING_DISH_REGISTRY[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showPrintSheet, setShowPrintSheet] = useState<boolean>(false);

  // Load custom preset
  const handleLoadPreset = (preset: EventPreset) => {
    setEventName(preset.name);
    setTargetPax(preset.targetPax);
    setSelectedDishes(preset.dishes);
    toast.success(`Loaded "${preset.name}" preset!`);
  };

  // Modify quantity of a selected dish
  const handleUpdateVolume = (dishId: string, delta: number) => {
    setSelectedDishes((prev) =>
      prev
        .map((item) => {
          if (item.dishId === dishId) {
            const nextVol = Math.max(0, item.volume + delta);
            return { ...item, volume: nextVol };
          }
          return item;
        })
        .filter((item) => item.volume > 0)
    );
  };

  // Set explicit volume
  const handleSetVolume = (dishId: string, val: number) => {
    setSelectedDishes((prev) =>
      prev
        .map((item) => (item.dishId === dishId ? { ...item, volume: Math.max(0, val) } : item))
        .filter((item) => item.volume > 0)
    );
  };

  // Add new dish to event
  const handleAddDish = () => {
    if (!dishToAdd) return;
    const existing = selectedDishes.find((d) => d.dishId === dishToAdd);
    if (existing) {
      handleUpdateVolume(dishToAdd, 1);
    } else {
      setSelectedDishes((prev) => [...prev, { dishId: dishToAdd, volume: 1 }]);
    }
    toast.success('Added dish to event volume requirements.');
  };

  // Remove dish from event
  const handleRemoveDish = (dishId: string) => {
    setSelectedDishes((prev) => prev.filter((d) => d.dishId !== dishId));
  };

  // Total Pax capacity served by selected dishes
  const totalEventCapacityPax = useMemo(() => {
    return selectedDishes.reduce((sum, item) => {
      const cfg = CATERING_DISH_REGISTRY.find((d) => d.id === item.dishId);
      return sum + (cfg ? cfg.servingsPerUnit * item.volume : 0);
    }, 0);
  }, [selectedDishes]);

  // Projected Event Retail Value
  const projectedRetailValue = useMemo(() => {
    return selectedDishes.reduce((sum, item) => {
      const cfg = CATERING_DISH_REGISTRY.find((d) => d.id === item.dishId);
      return sum + (cfg ? cfg.retailPrice * item.volume : 0);
    }, 0);
  }, [selectedDishes]);

  // Total Bilaos & Food Trays Count
  const totalContainersCount = useMemo(() => {
    return selectedDishes.reduce((sum, item) => sum + item.volume, 0);
  }, [selectedDishes]);

  // ==============================================================
  // AGGREGATED RAW MATERIAL STOCK PROJECTION ENGINE
  // ==============================================================
  const projectedIngredients = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        unit: string;
        unitCost: number;
        totalRequired: number;
        stockOnHand: number;
        usedInDishes: { dishName: string; amount: number }[];
      }
    >();

    selectedDishes.forEach(({ dishId, volume }) => {
      const dish = CATERING_DISH_REGISTRY.find((d) => d.id === dishId);
      if (!dish || volume <= 0) return;

      dish.ingredients.forEach((ing) => {
        const key = ing.id;
        const requiredAmount = ing.amountPerUnit * volume;
        const stockOnHand = DEFAULT_RAW_STOCK_MAP[key] ?? 10;

        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.totalRequired += requiredAmount;
          existing.usedInDishes.push({ dishName: dish.name, amount: requiredAmount });
        } else {
          map.set(key, {
            id: ing.id,
            name: ing.name,
            category: ing.category,
            unit: ing.unit,
            unitCost: ing.unitCost,
            totalRequired: requiredAmount,
            stockOnHand,
            usedInDishes: [{ dishName: dish.name, amount: requiredAmount }],
          });
        }
      });
    });

    const items = Array.from(map.values()).map((item) => {
      const totalCost = item.totalRequired * item.unitCost;
      const isDeficit = item.stockOnHand < item.totalRequired;
      const shortageAmount = isDeficit
        ? Number((item.totalRequired - item.stockOnHand).toFixed(2))
        : 0;
      const shortageCost = shortageAmount * item.unitCost;
      const remainingStockAfter = Number((item.stockOnHand - item.totalRequired).toFixed(2));

      return {
        ...item,
        totalRequired: Number(item.totalRequired.toFixed(2)),
        totalCost: Math.round(totalCost),
        isDeficit,
        shortageAmount,
        shortageCost: Math.round(shortageCost),
        remainingStockAfter,
      };
    });

    // Filter by category if requested
    if (categoryFilter !== 'all') {
      return items.filter((i) => i.category === categoryFilter);
    }

    // Sort by deficit first, then total cost desc
    return items.sort((a, b) => {
      if (a.isDeficit && !b.isDeficit) return -1;
      if (!a.isDeficit && b.isDeficit) return 1;
      return b.totalCost - a.totalCost;
    });
  }, [selectedDishes, categoryFilter]);

  // Aggregate Metrics
  const totalProjectedMaterialCost = useMemo(() => {
    return projectedIngredients.reduce((s, i) => s + i.totalCost, 0);
  }, [projectedIngredients]);

  const totalShortageProcurementCost = useMemo(() => {
    return projectedIngredients.reduce((s, i) => s + i.shortageCost, 0);
  }, [projectedIngredients]);

  const deficitItemsCount = useMemo(() => {
    return projectedIngredients.filter((i) => i.isDeficit).length;
  }, [projectedIngredients]);

  const estimatedFoodCostPct = useMemo(() => {
    return projectedRetailValue > 0
      ? Math.round((totalProjectedMaterialCost / projectedRetailValue) * 100)
      : 0;
  }, [totalProjectedMaterialCost, projectedRetailValue]);

  const estimatedGrossMarginPct = useMemo(() => {
    return Math.max(0, 100 - estimatedFoodCostPct);
  }, [estimatedFoodCostPct]);

  // Trigger Requisition Alerts
  const handleGenerateRequisitions = () => {
    const deficits = projectedIngredients.filter((i) => i.isDeficit);
    if (deficits.length === 0) {
      toast.success('All raw materials are currently in stock! No procurement needed.');
      return;
    }

    const summary = deficits
      .slice(0, 3)
      .map((d) => `${d.name}: +${d.shortageAmount} ${d.unit}`)
      .join(', ');

    toast.warning(
      `🚨 Logged purchase orders for ${deficits.length} items (${summary}...). Est. Budget: ${formatPrice(
        totalShortageProcurementCost
      )}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
              Bulk Ingredient Calculator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary text-secondary flex items-center gap-1 shadow-sm">
              <Sparkles size={11} /> Events & Catering
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically projects required raw material stock, identifies deficits, and calculates material procurement budgets based on product volume requirements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateRequisitions}
            disabled={deficitItemsCount === 0}
            className="px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
          >
            <AlertTriangle size={14} />
            Procure Shortages ({deficitItemsCount})
          </button>
          <button
            onClick={() => setShowPrintSheet(true)}
            className="btn-primary px-4 py-2 text-xs font-black shadow-sm flex items-center gap-1.5"
          >
            <Printer size={14} /> Print Prep Sheet
          </button>
        </div>
      </div>

      {/* Preset Event Buttons */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={13} className="text-primary" /> Popular Event Presets:
          </span>
          <span className="text-[11px] text-muted-foreground">Tap a preset to load typical volume configurations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EVENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="p-3 rounded-xl border border-border hover:border-primary/60 bg-muted/20 hover:bg-primary/5 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-foreground group-hover:text-primary transition-colors">
                  {preset.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {preset.targetPax} Pax
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Event Metadata Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Event Name / Occasion
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. Fiesta Wedding Banquet"
            className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Event Date / Delivery
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Target Headcount (Pax)
            </label>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                totalEventCapacityPax >= targetPax
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-amber-500/10 text-amber-600'
              }`}
            >
              {totalEventCapacityPax} / {targetPax} Pax Capacity
            </span>
          </div>
          <input
            type="number"
            min={10}
            max={1000}
            step={10}
            value={targetPax}
            onChange={(e) => setTargetPax(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Selected Product Volume Requirements Builder */}
      <div className="bg-card rounded-3xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-foreground flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
              <Package size={18} className="text-primary" />
              Event Product Volume Requirements ({selectedDishes.length} Dishes Selected)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify the number of bilaos and food trays needed for this gathering.
            </p>
          </div>

          {/* Add dish selector */}
          <div className="flex items-center gap-2">
            <select
              value={dishToAdd}
              onChange={(e) => setDishToAdd(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary max-w-[240px]"
            >
              {CATERING_DISH_REGISTRY.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddDish}
              className="btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1 shadow-sm"
            >
              <Plus size={14} /> Add Dish
            </button>
          </div>
        </div>

        {/* Selected Dishes Cards/Table */}
        {selectedDishes.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
            No dishes selected for this event yet. Use the dropdown above or pick a preset.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDishes.map((item) => {
              const dish = CATERING_DISH_REGISTRY.find((d) => d.id === item.dishId);
              if (!dish) return null;
              const totalServings = dish.servingsPerUnit * item.volume;
              const totalRetail = dish.retailPrice * item.volume;

              return (
                <div
                  key={dish.id}
                  className="p-3.5 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-foreground line-clamp-1">{dish.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Capacity: <strong>{totalServings} pax</strong> ({dish.servingsPerUnit} pax/unit)
                      </p>
                      <p className="text-[11px] text-primary font-bold">
                        {formatPrice(dish.retailPrice)} ea • Total: {formatPrice(totalRetail)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveDish(dish.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition-colors"
                      title="Remove dish"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Volume Required:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateVolume(dish.id, -1)}
                        className="w-6 h-6 rounded-lg bg-card border border-border text-xs font-black hover:bg-muted flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={item.volume}
                        onChange={(e) => handleSetVolume(dish.id, Number(e.target.value))}
                        className="w-12 text-center text-xs font-black bg-background border border-border rounded-lg py-0.5"
                      />
                      <button
                        onClick={() => handleUpdateVolume(dish.id, 1)}
                        className="w-6 h-6 rounded-lg bg-card border border-border text-xs font-black hover:bg-muted flex items-center justify-center"
                      >
                        +
                      </button>
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">
                        units
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI Financial & Stock Projections Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="admin-stat-card">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Total Material Cost
          </p>
          <p className="text-2xl font-black text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
            {formatPrice(totalProjectedMaterialCost)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {estimatedFoodCostPct}% Food Cost Ratio ({estimatedGrossMarginPct}% Margin)
          </p>
        </div>

        <div className="admin-stat-card">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Event Catering Value
          </p>
          <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
            {formatPrice(projectedRetailValue)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {totalContainersCount} bilaos & trays for ~{totalEventCapacityPax} pax
          </p>
        </div>

        <div className="admin-stat-card">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Raw Material Types
          </p>
          <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
            {projectedIngredients.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Noodles, meats, produce, packaging
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            deficitItemsCount > 0
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            {deficitItemsCount > 0 ? (
              <>
                <AlertTriangle size={14} /> Material Deficits
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Fully In Stock
              </>
            )}
          </p>
          <p className="text-2xl font-black mt-1" style={{ fontFamily: 'Nunito' }}>
            {deficitItemsCount}{' '}
            <span className="text-xs font-normal">
              {deficitItemsCount === 1 ? 'shortage' : 'shortages'}
            </span>
          </p>
          <p className="text-[11px] mt-0.5">
            {deficitItemsCount > 0
              ? `Procurement needed: ${formatPrice(totalShortageProcurementCost)}`
              : 'Ready for commissary batch prep'}
          </p>
        </div>
      </div>

      {/* Raw Material Stock Projection Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Table Header with Category Filter */}
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Projected Raw Material Requirements & Stock Analysis
            </h3>
            <p className="text-xs text-muted-foreground">
              Compares required amounts for {eventName} against live commissary on-hand stock
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Filter:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories ({projectedIngredients.length})</option>
              <option value="noodles">Noodles & Pasta</option>
              <option value="meat">Meat & Poultry</option>
              <option value="seafood">Seafood</option>
              <option value="produce">Fresh Produce</option>
              <option value="seasoning">Sauces & Seasonings</option>
              <option value="packaging">Bilaos & Packaging</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/15 text-muted-foreground font-bold">
                <th className="p-3 text-left">Raw Material Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">Required Volume</th>
                <th className="p-3 text-right">Stock On Hand</th>
                <th className="p-3 text-right">Projected Balance</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Shortage Needed</th>
                <th className="p-3 text-right">Total Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {projectedIngredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No ingredient requirements to project. Add dishes to this event above.
                  </td>
                </tr>
              ) : (
                projectedIngredients.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-muted/40 transition-colors ${
                      item.isDeficit ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-foreground">
                      {item.name}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        Used in {item.usedInDishes.length} event dish(es)
                      </span>
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">{item.category}</td>
                    <td className="p-3 text-right font-black text-foreground">
                      {item.totalRequired} {item.unit}
                    </td>
                    <td className="p-3 text-right font-semibold text-muted-foreground">
                      {item.stockOnHand} {item.unit}
                    </td>
                    <td
                      className={`p-3 text-right font-black ${
                        item.isDeficit ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {item.remainingStockAfter > 0 ? `+${item.remainingStockAfter}` : item.remainingStockAfter} {item.unit}
                    </td>
                    <td className="p-3 text-center">
                      {item.isDeficit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-destructive/15 text-destructive border border-destructive/25">
                          <AlertTriangle size={11} /> SHORTAGE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black text-destructive">
                      {item.isDeficit ? (
                        <>
                          +{item.shortageAmount} {item.unit}
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            ({formatPrice(item.shortageCost)})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground font-normal">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                      {formatPrice(item.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE CATERING PREP & REQUISITION MODAL */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Print Catering Kitchen Prep & Requisition Sheet
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Official commissary prep breakdown for {eventName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="btn-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={14} /> Print Now
                </button>
                <button
                  onClick={() => setShowPrintSheet(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 print:p-0">
              <div className="border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                      Kimae's Party Bilao - Kitchen Prep & Procurement Sheet
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Commissary Unit: Dasmariñas, Cavite • Production Date: {eventDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-primary text-secondary">
                      {targetPax} Pax Event
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-muted-foreground">Event: </span>
                    <strong className="text-foreground">{eventName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Date: </span>
                    <strong className="text-foreground">{eventDate}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Dishes: </span>
                    <strong className="text-foreground">{totalContainersCount} units</strong>
                  </div>
                </div>
              </div>

              {/* Dish volumes */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  1. Production Volume Requirements
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedDishes.map((item) => {
                    const dish = CATERING_DISH_REGISTRY.find((d) => d.id === item.dishId);
                    if (!dish) return null;
                    return (
                      <div key={dish.id} className="p-2.5 rounded-xl border border-border text-xs flex justify-between items-center">
                        <span className="font-semibold text-foreground line-clamp-1">{dish.name}</span>
                        <strong className="text-primary font-black ml-2">{item.volume}x</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Raw Material Checklist */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  2. Raw Material Prep & Procurement Checklist
                </h4>
                <table className="w-full text-xs border border-border">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                      <th className="p-2 text-left">Check</th>
                      <th className="p-2 text-left">Ingredient</th>
                      <th className="p-2 text-right">Required</th>
                      <th className="p-2 text-right">On Hand</th>
                      <th className="p-2 text-right">Status / Procurement Needed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {projectedIngredients.map((item) => (
                      <tr key={item.id} className={item.isDeficit ? 'bg-amber-500/10' : ''}>
                        <td className="p-2 text-center w-8">
                          <input type="checkbox" className="accent-primary" />
                        </td>
                        <td className="p-2 font-bold text-foreground">{item.name}</td>
                        <td className="p-2 text-right font-black">
                          {item.totalRequired} {item.unit}
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {item.stockOnHand} {item.unit}
                        </td>
                        <td className="p-2 text-right">
                          {item.isDeficit ? (
                            <span className="font-bold text-destructive">
                              DEFICIT: Need +{item.shortageAmount} {item.unit} ({formatPrice(item.shortageCost)})
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">✓ In Stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signoff */}
              <div className="pt-6 border-t border-border grid grid-cols-2 gap-8 text-xs text-muted-foreground">
                <div>
                  <div className="border-b border-muted-foreground/40 pb-6 mb-1"></div>
                  <p className="font-bold text-foreground">Prepared By (Head Commissary Chef)</p>
                </div>
                <div>
                  <div className="border-b border-muted-foreground/40 pb-6 mb-1"></div>
                  <p className="font-bold text-foreground">Approved By (Purchasing / Admin)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

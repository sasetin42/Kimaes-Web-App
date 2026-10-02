import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Layers,
  Package,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  ShieldAlert,
  History,
  Edit,
  AlertCircle,
  X,
  ChevronRight,
  BarChart3,
  ChefHat,
  Calculator,
  Printer,
  Scale,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Flame,
} from 'lucide-react';
import {
  getCentralProducts,
  getInventoryMovements,
  adjustStockManual,
  subscribeToInventoryUpdates,
} from '@/lib/inventoryStore';
import { formatPrice } from '@/lib/store';
import { CATEGORIES } from '@/constants/data';
import BulkIngredientCalculator from '@/components/features/BulkIngredientCalculator';
import SafetyStockAlerts from '@/components/features/SafetyStockAlerts';
import type { Product, InventoryMovement, InventoryMovementType } from '@/types';
import { toast } from 'sonner';

// Standard Recipe Specifications for Bulk Party Orders
export interface RecipeItem {
  id: string;
  name: string;
  category: 'noodles' | 'meat' | 'seafood' | 'produce' | 'seasoning' | 'packaging';
  baseAmount: number;
  unit: string;
  unitCost: number;
  matchedSku?: string;
}

export interface DishRecipe {
  id: string;
  name: string;
  category: string;
  baseYield: number; // e.g., 1 Bilao
  baseServings: number; // e.g., 10-12 pax
  description: string;
  ingredients: RecipeItem[];
}

const PRESET_RECIPES: DishRecipe[] = [
  {
    id: 'rec-malabon',
    name: 'Special Pancit Malabon Party Bilao',
    category: 'party-bilao',
    baseYield: 1,
    baseServings: 12,
    description: 'Thick rice noodles steeped in rich achuete shrimp broth with egg, chicharon, and seafood toppings.',
    ingredients: [
      { id: 'ing-1', name: 'Thick Rice Noodles (Malabon)', category: 'noodles', baseAmount: 0.5, unit: 'kg', unitCost: 95 },
      { id: 'ing-2', name: 'Achuete & Shrimp Sauce Base', category: 'seasoning', baseAmount: 0.45, unit: 'L', unitCost: 80 },
      { id: 'ing-3', name: 'Cooked Pork Belly (Diced)', category: 'meat', baseAmount: 0.35, unit: 'kg', unitCost: 340 },
      { id: 'ing-4', name: 'Fresh Shrimps (Shelled & Poached)', category: 'seafood', baseAmount: 0.25, unit: 'kg', unitCost: 450 },
      { id: 'ing-5', name: 'Hard-Boiled Eggs (Sliced)', category: 'produce', baseAmount: 3, unit: 'pcs', unitCost: 9 },
      { id: 'ing-6', name: 'Crushed Special Chicharon', category: 'seasoning', baseAmount: 0.1, unit: 'kg', unitCost: 280 },
      { id: 'ing-7', name: 'Toasted Minced Garlic & Spring Onions', category: 'produce', baseAmount: 0.08, unit: 'kg', unitCost: 150 },
      { id: 'ing-8', name: 'Fresh Native Calamansi', category: 'produce', baseAmount: 12, unit: 'pcs', unitCost: 2 },
      { id: 'ing-9', name: 'Large Woven Bamboo Bilao (16-inch)', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 65 },
      { id: 'ing-10', name: 'Fresh Wiped Banana Leaves Liner', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 15 },
    ],
  },
  {
    id: 'rec-palabok',
    name: 'Fiesta Pancit Palabok Bilao',
    category: 'party-bilao',
    baseYield: 1,
    baseServings: 12,
    description: 'Tender bihon noodles topped with golden shrimp gravy, tinapa flakes, and crunchy garnishes.',
    ingredients: [
      { id: 'ing-11', name: 'Bihon / Palabok Rice Noodles', category: 'noodles', baseAmount: 0.5, unit: 'kg', unitCost: 85 },
      { id: 'ing-12', name: 'Golden Palabok Gravy Base', category: 'seasoning', baseAmount: 0.5, unit: 'L', unitCost: 75 },
      { id: 'ing-13', name: 'Smoked Tinapa Flakes (Pure)', category: 'seafood', baseAmount: 0.12, unit: 'kg', unitCost: 320 },
      { id: 'ing-14', name: 'Boiled Pork Slices', category: 'meat', baseAmount: 0.25, unit: 'kg', unitCost: 340 },
      { id: 'ing-15', name: 'Steamed Shrimps', category: 'seafood', baseAmount: 0.2, unit: 'kg', unitCost: 450 },
      { id: 'ing-16', name: 'Sliced Hard-Boiled Eggs', category: 'produce', baseAmount: 3, unit: 'pcs', unitCost: 9 },
      { id: 'ing-17', name: 'Crushed Chicharon Balat', category: 'seasoning', baseAmount: 0.1, unit: 'kg', unitCost: 280 },
      { id: 'ing-18', name: 'Fresh Native Calamansi', category: 'produce', baseAmount: 12, unit: 'pcs', unitCost: 2 },
      { id: 'ing-19', name: 'Large Bamboo Bilao + Liner', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 80 },
    ],
  },
  {
    id: 'rec-spaghetti',
    name: 'Special Pinoy Sweet Spaghetti Party Tray',
    category: 'food-trays',
    baseYield: 1,
    baseServings: 15,
    description: 'Sweet-style Filipino spaghetti with savory ground meat, red hotdogs, and melted cheddar.',
    ingredients: [
      { id: 'ing-20', name: 'Spaghetti Pasta Noodles', category: 'noodles', baseAmount: 0.8, unit: 'kg', unitCost: 90 },
      { id: 'ing-21', name: 'Pinoy Sweet Spaghetti Sauce', category: 'seasoning', baseAmount: 1.0, unit: 'kg', unitCost: 110 },
      { id: 'ing-22', name: 'Ground Pork & Beef Blend', category: 'meat', baseAmount: 0.5, unit: 'kg', unitCost: 320 },
      { id: 'ing-23', name: 'Filipino Red Hotdogs (Sliced)', category: 'meat', baseAmount: 0.35, unit: 'kg', unitCost: 190 },
      { id: 'ing-24', name: 'Grated Quickmelt Cheddar Cheese', category: 'seasoning', baseAmount: 0.25, unit: 'kg', unitCost: 260 },
      { id: 'ing-25', name: 'Minced White Onion & Garlic', category: 'produce', baseAmount: 0.1, unit: 'kg', unitCost: 120 },
      { id: 'ing-26', name: 'Heavy Duty Party Aluminum Tray', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 45 },
    ],
  },
  {
    id: 'rec-sisig',
    name: 'Pork Sisig Kapampangan Party Platter',
    category: 'food-trays',
    baseYield: 1,
    baseServings: 12,
    description: 'Crispy grilled pork mask and belly seasoned with calamansi, chili, and savory liver sauce.',
    ingredients: [
      { id: 'ing-27', name: 'Boiled & Grilled Pork Mask/Belly', category: 'meat', baseAmount: 1.2, unit: 'kg', unitCost: 360 },
      { id: 'ing-28', name: 'Minced Red Onions', category: 'produce', baseAmount: 0.25, unit: 'kg', unitCost: 130 },
      { id: 'ing-29', name: 'Green Chili (Siling Haba) Chopped', category: 'produce', baseAmount: 0.06, unit: 'kg', unitCost: 180 },
      { id: 'ing-30', name: 'Chicken Liver Seasoning Pate', category: 'meat', baseAmount: 0.18, unit: 'kg', unitCost: 210 },
      { id: 'ing-31', name: 'Pure Native Calamansi Juice', category: 'produce', baseAmount: 0.08, unit: 'L', unitCost: 140 },
      { id: 'ing-32', name: 'Heavy Duty Food Tray & Cover', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 45 },
    ],
  },
  {
    id: 'rec-shanghai',
    name: 'Lumpiang Shanghai Fiesta Tray (60 pcs)',
    category: 'food-trays',
    baseYield: 1,
    baseServings: 15,
    description: 'Golden crispy pork spring rolls with carrots, onions, and sweet chili dipping sauce.',
    ingredients: [
      { id: 'ing-33', name: 'Ground Lean Pork', category: 'meat', baseAmount: 1.0, unit: 'kg', unitCost: 320 },
      { id: 'ing-34', name: 'Lumpia Spring Roll Wrappers', category: 'noodles', baseAmount: 60, unit: 'pcs', unitCost: 1.2 },
      { id: 'ing-35', name: 'Minced Carrots & Sweet Onions', category: 'produce', baseAmount: 0.35, unit: 'kg', unitCost: 110 },
      { id: 'ing-36', name: 'Egg & Seasoning Binder', category: 'produce', baseAmount: 2, unit: 'pcs', unitCost: 9 },
      { id: 'ing-37', name: 'Sweet & Sour Chili Dip', category: 'seasoning', baseAmount: 0.3, unit: 'L', unitCost: 65 },
      { id: 'ing-38', name: 'Serving Tray with Liner', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 45 },
    ],
  },
  {
    id: 'rec-kakanin',
    name: 'Maja Blanca Especial Bilao',
    category: 'party-bilao',
    baseYield: 1,
    baseServings: 15,
    description: 'Creamy coconut milk pudding with sweet whole kernel corn and fragrant latik topping.',
    ingredients: [
      { id: 'ing-39', name: 'Fresh Coconut Cream (Gata)', category: 'seasoning', baseAmount: 0.8, unit: 'L', unitCost: 110 },
      { id: 'ing-40', name: 'Evaporated & Condensed Milk', category: 'seasoning', baseAmount: 0.6, unit: 'L', unitCost: 95 },
      { id: 'ing-41', name: 'High Grade Cornstarch', category: 'seasoning', baseAmount: 0.35, unit: 'kg', unitCost: 80 },
      { id: 'ing-42', name: 'Sweet Whole Kernel Corn', category: 'produce', baseAmount: 0.42, unit: 'kg', unitCost: 60 },
      { id: 'ing-43', name: 'Golden Toasted Latik Curds', category: 'seasoning', baseAmount: 0.12, unit: 'kg', unitCost: 220 },
      { id: 'ing-44', name: 'Medium Bamboo Bilao + Liner', category: 'packaging', baseAmount: 1, unit: 'pcs', unitCost: 60 },
    ],
  },
];

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>(getCentralProducts());
  const [movements, setMovements] = useState<InventoryMovement[]>(getInventoryMovements());
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'calculator' | 'scaler'>('overview');

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<string>('');
  const [adjustType, setAdjustType] = useState<
    'adjustment' | 'waste_damaged' | 'physical_count' | 'stock_in' | 'stock_out'
  >('physical_count');
  const [adjustReason, setAdjustReason] = useState('');

  // -------------------------------------------------------------
  // RECIPE SCALER STATE (Tool for Bulk Party Orders)
  // -------------------------------------------------------------
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(PRESET_RECIPES[0].id);
  const [originalRecipeQty, setOriginalRecipeQty] = useState<number>(1);
  const [targetBulkQty, setTargetBulkQty] = useState<number>(10); // Default to 10 bilaos
  const [targetHeadcount, setTargetHeadcount] = useState<number>(120); // Default headcount

  // Subscribe to real-time inventory updates across POS, store checkout, and goods receiving
  useEffect(() => {
    const unsub = subscribeToInventoryUpdates(() => {
      setProducts(getCentralProducts());
      setMovements(getInventoryMovements());
    });
    return unsub;
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchCat = catFilter === 'all' || p.category === catFilter;

      const isOut = p.stock <= 0;
      const isLow = p.stock > 0 && p.stock <= (p.reorderLevel || 10);
      const isHealthy = p.stock > (p.reorderLevel || 10);

      const matchStatus =
        stockStatusFilter === 'all' ||
        (stockStatusFilter === 'out' && isOut) ||
        (stockStatusFilter === 'low' && isLow) ||
        (stockStatusFilter === 'healthy' && isHealthy);

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, catFilter, stockStatusFilter]);

  // Inventory Metrics & Valuation
  const metrics = useMemo(() => {
    const totalItems = products.reduce((s, p) => s + p.stock, 0);
    const totalCostValuation = products.reduce((s, p) => s + p.stock * p.cost, 0);
    const totalRetailValuation = products.reduce(
      (s, p) => s + p.stock * (p.promoPrice || p.price),
      0
    );
    const lowStockCount = products.filter(
      (p) => p.stock > 0 && p.stock <= (p.reorderLevel || 10)
    ).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;

    return {
      totalItems,
      totalCostValuation,
      totalRetailValuation,
      projectedMargin:
        totalRetailValuation > 0
          ? Math.round(((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100)
          : 0,
      lowStockCount,
      outOfStockCount,
      totalSKUs: products.length,
    };
  }, [products]);

  // Handle Adjustment Submit
  const handlePerformAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const nextQty = parseInt(newStockInput, 10);
    if (isNaN(nextQty) || nextQty < 0) {
      toast.error('Please enter a valid non-negative quantity');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Reason / audit explanation is required');
      return;
    }

    const diff = nextQty - selectedProduct.stock;
    const movementType: InventoryMovementType =
      adjustType === 'physical_count'
        ? 'stock_adjustment'
        : adjustType === 'waste_damaged'
        ? 'waste_damaged'
        : adjustType === 'stock_in'
        ? 'purchase_received'
        : 'stock_adjustment';

    adjustStockManual(selectedProduct.id, diff, movementType, adjustReason, 'Admin (Staff)');
    toast.success(`Inventory updated: ${selectedProduct.name} is now ${nextQty} units.`);
    setShowAdjustModal(false);
    setSelectedProduct(null);
    setNewStockInput('');
    setAdjustReason('');
  };

  // -------------------------------------------------------------
  // RECIPE SCALER CALCULATIONS
  // -------------------------------------------------------------
  const activeRecipe = useMemo(() => {
    return PRESET_RECIPES.find((r) => r.id === selectedRecipeId) || PRESET_RECIPES[0];
  }, [selectedRecipeId]);

  // Scaling Factor
  const scalingFactor = useMemo(() => {
    if (originalRecipeQty <= 0) return 1;
    return targetBulkQty / originalRecipeQty;
  }, [originalRecipeQty, targetBulkQty]);

  // Scaled Ingredients Calculation
  const scaledIngredients = useMemo(() => {
    return activeRecipe.ingredients.map((ing) => {
      const requiredQty = Number((ing.baseAmount * scalingFactor).toFixed(2));
      const totalCost = Math.round(requiredQty * ing.unitCost);

      // Estimate commissary stock matching
      const matchedProd = products.find(
        (p) =>
          p.name.toLowerCase().includes(ing.name.toLowerCase().split(' ')[0]) ||
          (ing.matchedSku && p.sku === ing.matchedSku)
      );

      // Approximate stock on hand
      const stockOnHand = matchedProd ? matchedProd.stock * (ing.unit === 'kg' ? 1 : 1) : 25;
      const isShortage = stockOnHand < requiredQty;
      const shortageAmount = isShortage ? Number((requiredQty - stockOnHand).toFixed(2)) : 0;

      return {
        ...ing,
        requiredQty,
        totalCost,
        stockOnHand,
        isShortage,
        shortageAmount,
      };
    });
  }, [activeRecipe, scalingFactor, products]);

  const totalRawMaterialCost = useMemo(() => {
    return scaledIngredients.reduce((sum, item) => sum + item.totalCost, 0);
  }, [scaledIngredients]);

  const costPerBilao = useMemo(() => {
    return targetBulkQty > 0 ? Math.round(totalRawMaterialCost / targetBulkQty) : 0;
  }, [totalRawMaterialCost, targetBulkQty]);

  const totalShortagesCount = useMemo(() => {
    return scaledIngredients.filter((i) => i.isShortage).length;
  }, [scaledIngredients]);

  // Handle Headcount change to auto-calculate required bilaos
  const handleHeadcountChange = (val: number) => {
    setTargetHeadcount(val);
    const suggestedBilaos = Math.max(1, Math.ceil(val / activeRecipe.baseServings));
    setTargetBulkQty(suggestedBilaos);
  };

  // Dispatch Shortage Alert to Kitchen/Purchasing
  const handleCreateRequisitionAlert = () => {
    if (totalShortagesCount === 0) {
      toast.success('All raw materials are in stock! No requisition required.');
      return;
    }
    const shortageNames = scaledIngredients
      .filter((i) => i.isShortage)
      .map((i) => `${i.name} (need ${i.shortageAmount} ${i.unit})`)
      .join(', ');

    toast.warning(
      `Requisition & Shortage Alert logged for ${totalShortagesCount} items: ${shortageNames.slice(0, 70)}...`
    );
  };

  return (
    <AdminLayout title="Inventory & Recipe Scaler">
      <div className="space-y-6">
        {/* Real-time Safety Stock Threshold & Notification Alert System */}
        <SafetyStockAlerts />

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Total Stock Valuation
            </p>
            <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
              {formatPrice(metrics.totalCostValuation)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Retail: {formatPrice(metrics.totalRetailValuation)} ({metrics.projectedMargin}% Margin)
            </p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Total Raw Units In Stock
            </p>
            <p className="text-2xl font-black text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
              {metrics.totalItems.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-muted-foreground">units</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.totalSKUs} Tracked SKUs</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={14} /> Low-Stock Warnings
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1" style={{ fontFamily: 'Nunito' }}>
              {metrics.lowStockCount}{' '}
              <span className="text-sm font-semibold text-muted-foreground">items</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Below reorder point (≤15)</p>
          </div>

          <div className="admin-stat-card">
            <p className="text-xs text-destructive font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertCircle size={14} /> Out of Stock
            </p>
            <p className="text-2xl font-black text-destructive mt-1" style={{ fontFamily: 'Nunito' }}>
              {metrics.outOfStockCount}{' '}
              <span className="text-sm font-semibold text-muted-foreground">items</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Auto-hidden on Online Store</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border gap-6 flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={16} /> Real-Time Stock Catalog
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'calculator'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator size={16} /> Bulk Ingredient Calculator (Events)
          </button>
          <button
            onClick={() => setActiveTab('scaler')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'scaler'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ChefHat size={16} /> Single Dish Scaler
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History size={16} /> Audit Trail & Movements ({movements.length})
          </button>
        </div>

        {/* TAB 1: Real-Time Stock Catalog */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKU, barcode, name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="healthy">In Stock (Healthy)</option>
                  <option value="low">Low Stock Alert</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,SKU,Barcode,Product Name,Stock,Unit,Cost,Price,Valuation\n' +
                      products
                        .map(
                          (p) =>
                            `"${p.sku}","${p.barcode || ''}","${p.name}",${p.stock},"${p.unit || 'pcs'}",${p.cost},${p.price},${p.stock * p.cost}`
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute(
                      'download',
                      `inventory_valuation_${new Date().toISOString().split('T')[0]}.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Inventory valuation CSV downloaded!');
                  }}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={15} /> Export CSV
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Product / SKU</th>
                      <th className="table-header text-left hidden md:table-cell">Barcode</th>
                      <th className="table-header text-center">Unit</th>
                      <th className="table-header text-right">Cost Price</th>
                      <th className="table-header text-right">Selling Price</th>
                      <th className="table-header text-center">Current Stock</th>
                      <th className="table-header text-right hidden lg:table-cell">Stock Value</th>
                      <th className="table-header text-center">Status</th>
                      <th className="table-header text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLowStock = p.stock > 0 && p.stock <= (p.reorderLevel || 15);

                      return (
                        <tr key={p.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-border"
                              />
                              <div>
                                <p className="font-bold text-foreground text-xs leading-tight">{p.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.sku}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">
                            {p.barcode || '—'}
                          </td>

                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            {p.unit || 'pcs'}
                          </td>

                          <td className="px-4 py-3 text-right text-xs font-mono">{formatPrice(p.cost)}</td>

                          <td className="px-4 py-3 text-right text-xs font-bold text-foreground font-mono">
                            {formatPrice(p.promoPrice || p.price)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-black text-sm font-mono ${
                                isOutOfStock
                                  ? 'text-destructive'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-foreground'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right text-xs font-mono hidden lg:table-cell text-muted-foreground">
                            {formatPrice(p.stock * p.cost)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                                Low Stock ({p.stock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                                In Stock
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setNewStockInput(String(p.stock));
                                setShowAdjustModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold transition-colors"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Audit Trail & Stock Movements */}
        {activeTab === 'movements' && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="table-header text-left">Timestamp</th>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-center">Movement Type</th>
                    <th className="table-header text-center">Qty Change</th>
                    <th className="table-header text-center">Balance Before → After</th>
                    <th className="table-header text-left">Reason / Ref</th>
                    <th className="table-header text-left">Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m.id} className="table-row">
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleString()}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{m.productName}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{m.sku}</p>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                              m.type === 'pos_sale'
                                ? 'bg-blue-100 text-blue-700'
                                : m.type === 'online_sale'
                                ? 'bg-purple-100 text-purple-700'
                                : m.type === 'purchase_received'
                                ? 'bg-green-100 text-green-700'
                                : m.type === 'waste_damaged'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {m.type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-black ${
                              isPositive ? 'text-green-600' : 'text-destructive'
                            }`}
                          >
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-foreground">
                          {m.quantityBefore} → {m.quantityAfter}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          <p className="line-clamp-1">{m.reason}</p>
                          {m.referenceId && (
                            <span className="text-[10px] font-mono text-primary font-bold">
                              Ref: {m.referenceId}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {m.recordedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {movements.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No stock movements recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BULK INGREDIENT CALCULATOR (Event Planning & Volume Requirements) */}
        {activeTab === 'calculator' && (
          <BulkIngredientCalculator products={products} />
        )}

        {/* TAB 4: RECIPE SCALER TOOL (Single Dish Recipe Scaler) */}
        {activeTab === 'scaler' && (
          <div className="space-y-6">
            {/* Control Panel Card */}
            <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-black text-xl text-foreground flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                    <Scale size={24} className="text-primary" /> Recipe Scaler & Bulk Material Calculator
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculate exact raw ingredients, noodles, meats, and packaging needed for catering, large gatherings, and corporate party bilaos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer size={15} /> Print Kitchen Prep Sheet
                  </button>
                  <button
                    onClick={handleCreateRequisitionAlert}
                    className="px-3.5 py-2 rounded-xl bg-primary text-secondary text-xs font-black hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <AlertTriangle size={14} /> Log Shortages to Purchasing
                  </button>
                </div>
              </div>

              {/* Recipe Selector & Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Select Base Recipe / Dish
                  </label>
                  <select
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PRESET_RECIPES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Base yield: {activeRecipe.baseYield} Bilao (Serves {activeRecipe.baseServings} pax)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Original Recipe Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={originalRecipeQty}
                      onChange={(e) => setOriginalRecipeQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm font-black focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      bilao(s)
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Standard recipe unit multiplier</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Target Bulk Order Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={targetBulkQty}
                      onChange={(e) => {
                        const next = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setTargetBulkQty(next);
                        setTargetHeadcount(next * activeRecipe.baseServings);
                      }}
                      className="w-full px-3 py-2 rounded-xl border-2 border-primary/50 bg-primary/5 text-sm font-black text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                      bilao(s)
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Multiplier: {scalingFactor}x original batch</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Or Scale by Guest Headcount (Pax)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={targetHeadcount}
                      onChange={(e) => handleHeadcountChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm font-black focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      pax
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Auto-recommends {targetBulkQty} bilaos
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 border-t border-border flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-muted-foreground text-[11px]">Quick Bulk Presets:</span>
                {[
                  { label: '5 Bilaos (Family Party - 60 pax)', qty: 5 },
                  { label: '10 Bilaos (Company Meeting - 120 pax)', qty: 10 },
                  { label: '25 Bilaos (Fiesta / Wedding - 300 pax)', qty: 25 },
                  { label: '50 Bilaos (Corporate Event - 600 pax)', qty: 50 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setTargetBulkQty(preset.qty);
                      setTargetHeadcount(preset.qty * activeRecipe.baseServings);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                      targetBulkQty === preset.qty
                        ? 'bg-primary text-secondary border-primary font-black shadow-sm'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Total Bulk Batch</p>
                <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
                  {targetBulkQty}{' '}
                  <span className="text-xs font-normal text-muted-foreground">bilaos</span>
                </p>
                <p className="text-[11px] text-primary font-bold mt-0.5">
                  Feeds ~{targetBulkQty * activeRecipe.baseServings} guests
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-semibold uppercase">
                  Est. Raw Ingredient Cost
                </p>
                <p className="text-2xl font-black text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
                  {formatPrice(totalRawMaterialCost)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatPrice(costPerBilao)} raw cost / bilao
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Ingredients Needed</p>
                <p className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Nunito' }}>
                  {scaledIngredients.length}{' '}
                  <span className="text-xs font-normal text-muted-foreground">raw items</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Noodles, meats, sauces, liners</p>
              </div>

              <div
                className={`p-4 rounded-2xl border shadow-sm ${
                  totalShortagesCount > 0
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase flex items-center gap-1 ${
                    totalShortagesCount > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {totalShortagesCount > 0 ? (
                    <>
                      <AlertTriangle size={14} /> Material Shortages
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> All In Stock
                    </>
                  )}
                </p>
                <p
                  className={`text-2xl font-black mt-1 ${
                    totalShortagesCount > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                  style={{ fontFamily: 'Nunito' }}
                >
                  {totalShortagesCount}{' '}
                  <span className="text-xs font-normal">
                    {totalShortagesCount === 1 ? 'item' : 'items'}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalShortagesCount > 0
                    ? 'Immediate purchasing order needed'
                    : 'Ready for batch cooking'}
                </p>
              </div>
            </div>

            {/* Scaled Ingredients Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Required Raw Materials for {targetBulkQty}x {activeRecipe.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Scaled from original {originalRecipeQty} unit base recipe ({scalingFactor}x multiplier)
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  Base Servings: {activeRecipe.baseServings} pax/bilao
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Raw Material / Ingredient</th>
                      <th className="table-header text-center">Category</th>
                      <th className="table-header text-right">Base Recipe Qty (1x)</th>
                      <th className="table-header text-right font-black text-foreground">
                        Scaled Required Qty ({targetBulkQty}x)
                      </th>
                      <th className="table-header text-center">Commissary Stock</th>
                      <th className="table-header text-center">Stock Status</th>
                      <th className="table-header text-right">Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scaledIngredients.map((item) => (
                      <tr
                        key={item.id}
                        className={`table-row ${
                          item.isShortage ? 'bg-destructive/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground text-xs">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Est. {formatPrice(item.unitCost)} per {item.unit}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-muted text-muted-foreground">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {item.baseAmount} {item.unit}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-black text-sm text-primary">
                          {item.requiredQty} {item.unit}
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {item.stockOnHand} {item.unit}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.isShortage ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-destructive/15 text-destructive flex items-center justify-center gap-1">
                              <AlertTriangle size={11} />
                              Short by {item.shortageAmount} {item.unit}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 flex items-center justify-center gap-1">
                              <CheckCircle2 size={11} />
                              Sufficient
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {formatPrice(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 font-black text-xs border-t-2 border-border">
                      <td colSpan={3} className="px-4 py-3 text-left">
                        Total Raw Materials for Batch ({targetBulkQty} Bilaos)
                      </td>
                      <td className="px-4 py-3 text-right text-primary font-mono text-sm">
                        {scaledIngredients.length} Items Scaled
                      </td>
                      <td colSpan={2} className="px-4 py-3 text-center">
                        {totalShortagesCount > 0 ? (
                          <span className="text-destructive font-bold">
                            ⚠️ {totalShortagesCount} Shortages Flagged
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">
                            ✅ All Ingredients Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-primary font-mono">
                        {formatPrice(totalRawMaterialCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ADJUSTMENT & WRITE-OFF MODAL */}
        {showAdjustModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div>
                  <h3 className="font-black text-base" style={{ fontFamily: 'Nunito' }}>
                    Adjust Stock: {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    SKU: {selectedProduct.sku} • Current Stock: {selectedProduct.stock}
                  </p>
                </div>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePerformAdjustment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    Adjustment Reason / Category
                  </label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="physical_count">Physical Count Tally / Cycle Count</option>
                    <option value="waste_damaged">Waste / Spoiled Ingredients</option>
                    <option value="stock_in">Manual Stock In (Add to Inventory)</option>
                    <option value="stock_out">Manual Stock Out (Deduct from Inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    New Ending Quantity ({selectedProduct.unit || 'pcs'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStockInput}
                    onChange={(e) => setNewStockInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-base font-black focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Delta:{' '}
                    {parseInt(newStockInput || '0', 10) - selectedProduct.stock > 0 ? '+' : ''}
                    {parseInt(newStockInput || '0', 10) - selectedProduct.stock} units
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    Audit Explanation / Reason
                  </label>
                  <textarea
                    rows={2}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. End of day physical count tally / Spoiled vegetable tray"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-secondary text-xs font-black hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Save & Record Movement
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

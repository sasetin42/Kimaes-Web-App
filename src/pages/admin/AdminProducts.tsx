import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { CATEGORIES } from '@/constants/data';
import { Plus, Search, Edit3, Trash2, Copy, Eye, EyeOff, Star, ChefHat, Barcode, DollarSign, Upload, Image as ImageIcon } from 'lucide-react';
import { formatPrice } from '@/lib/store';
import {
  getCentralProducts,
  saveCentralProducts,
  subscribeToProductUpdates,
  recordInventoryMovement,
} from '@/lib/inventoryStore';
import { compressImageForFirestore, validateImageFile } from '@/lib/imageCompressor';
import type { Product } from '@/types';
import { toast } from 'sonner';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(getCentralProducts());
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [compressing, setCompressing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: CATEGORIES[0]?.id || 'cat-1',
    price: 0,
    cost: 0,
    stock: 20,
    unit: 'bilao',
    description: '',
  });

  useEffect(() => {
    const unsub = subscribeToProductUpdates(() => {
      setProducts(getCentralProducts());
    });
    return unsub;
  }, []);

  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const toggleAvailability = (id: string) => {
    const updated = products.map(p => (p.id === id ? { ...p, available: !p.available } : p));
    setProducts(updated);
    saveCentralProducts(updated);
  };

  const toggleFeatured = (id: string) => {
    const updated = products.map(p => (p.id === id ? { ...p, featured: !p.featured } : p));
    setProducts(updated);
    saveCentralProducts(updated);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Archive this product?')) {
      const updated = products.map(p => (p.id === id ? { ...p, status: 'archived' as const } : p));
      setProducts(updated);
      saveCentralProducts(updated);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setImagePreview('');
    setFormData({
      name: '',
      sku: `KPB-${Math.floor(100 + Math.random() * 900)}`,
      barcode: `4800${Math.floor(10000000 + Math.random() * 90000000)}`,
      category: CATEGORIES[0]?.id || 'cat-1',
      price: 500,
      cost: 250,
      stock: 25,
      unit: 'bilao',
      description: '',
    });
    setShowForm(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setImagePreview(p.images[0] || '');
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      unit: p.unit || 'bilao',
      description: p.description || '',
    });
    setShowForm(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    try {
      setCompressing(true);
      const res = await compressImageForFirestore(file, 800, 0.75);
      setImagePreview(res.dataUrl);
      toast.success(`Image compressed (${Math.round(res.sizeBytes / 1024)} KB) for Cloud Firestore!`);
    } catch (err: any) {
      toast.error(err.message || 'Compression failed');
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const all = getCentralProducts();
    const finalImg = imagePreview || 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80';

    if (editingId) {
      const idx = all.findIndex(p => p.id === editingId);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode,
          category: formData.category,
          images: [finalImg],
          price: Number(formData.price),
          cost: Number(formData.cost),
          stock: Number(formData.stock),
          unit: formData.unit,
          description: formData.description,
          available: Number(formData.stock) > 0,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        description: formData.description,
        shortDescription: formData.description.slice(0, 60),
        images: [finalImg],
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock: Number(formData.stock),
        unit: formData.unit,
        minOrder: 1,
        maxOrder: 20,
        servingSize: 'Large Bilao',
        personsServed: 10,
        prepTime: 45,
        featured: false,
        bestSeller: false,
        isNew: true,
        recommended: false,
        available: Number(formData.stock) > 0,
        options: [],
        tags: ['New'],
        status: 'active',
        reorderLevel: 5,
        taxConfig: 'standard_vat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(newProd);

      recordInventoryMovement({
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        type: 'purchase_received',
        quantityChange: newProd.stock,
        quantityBefore: 0,
        quantityAfter: newProd.stock,
        unitCost: newProd.cost,
        totalValue: newProd.stock * newProd.cost,
        reason: 'New Product Registered in Catalog',
        recordedBy: 'Admin Staff',
      });
    }

    saveCentralProducts(all);
    setProducts(all);
    setShowForm(false);
  };

  return (
    <AdminLayout title="Products">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..." className="input-field pl-9 py-2 w-full sm:w-64" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field py-2">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Products table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header text-left">Product</th>
                <th className="table-header text-left hidden md:table-cell">Category</th>
                <th className="table-header text-right">Price</th>
                <th className="table-header text-center hidden sm:table-cell">Stock</th>
                <th className="table-header text-center">Available</th>
                <th className="table-header text-center hidden lg:table-cell">Featured</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const cat = CATEGORIES.find(c => c.id === product.category);
                return (
                  <tr key={product.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold truncate max-w-[150px]">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                          <div className="flex gap-1 mt-0.5">
                            {product.bestSeller && <span className="badge-status bg-primary/10 text-primary text-[9px]">⭐ Best</span>}
                            {product.isNew && <span className="badge-status bg-green-100 text-green-700 text-[9px]">New</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{cat?.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-primary">{formatPrice(product.promoPrice || product.price)}</span>
                      {product.promoPrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</p>}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`font-semibold ${product.stock < 10 ? 'text-destructive' : 'text-foreground'}`}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleAvailability(product.id)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${product.available ? 'bg-green-400' : 'bg-muted-foreground/30'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <button onClick={() => toggleFeatured(product.id)}
                        className={`p-1 rounded-lg transition-colors ${product.featured ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                        <Star size={16} fill={product.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditModal(product)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => {
                          openAddModal();
                          setFormData(prev => ({ ...prev, name: `${product.name} (Copy)`, price: product.price, cost: product.cost }));
                        }} className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => deleteProduct(product.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 w-full max-w-lg shadow-2xl my-8">
            <h2 className="font-black text-xl mb-1" style={{ fontFamily: 'Nunito' }}>
              {editingId ? 'Edit Catalog Product' : 'Add New Product to Central Catalog'}
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Changes will immediately synchronize across Online Store, POS Register, and Inventory Ledger.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Firestore-Only Image Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Product Photo (Firestore In-Document Storage)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-2 cursor-pointer font-bold">
                      <Upload size={14} />
                      {compressing ? 'Compressing...' : 'Upload & Compress Photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageFileChange}
                        disabled={compressing}
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Auto-compressed to &lt;250KB WebP. Stored 100% directly in Cloud Firestore (No Firebase Storage required).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Product Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Lumpiang Shanghai Party Bilao"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">SKU Code</label>
                  <input
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field font-mono text-xs"
                    placeholder="KPB-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Barcode / EAN</label>
                  <input
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-field font-mono text-xs"
                    placeholder="4800123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Selling Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Cost Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Current Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Description & Ingredients</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-none text-xs"
                  rows={3}
                  placeholder="Crispy fried spring rolls served with homemade sweet chili dip..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-outline flex-1 text-sm py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-sm py-2.5 font-bold shadow-md"
                >
                  {editingId ? 'Save Changes' : 'Create & Stock Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  X,
  Check,
  Trash2,
  Sparkles,
  Flame,
  Crown,
  Gift,
  Users,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import {
  OrderTag,
  getAllTags,
  createCustomTag,
  deleteCustomTag,
  assignTagToOrder,
  removeTagFromOrder,
  getOrderTags,
} from '@/services/orderTagService';
import OrderTagBadge from './OrderTagBadge';
import { toast } from 'sonner';

interface OrderTagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string; // If provided, allows toggling tags for this specific order
  orderNumber?: string;
  onTagsUpdated?: () => void;
}

export default function OrderTagManagerModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onTagsUpdated,
}: OrderTagManagerModalProps) {
  const [allTags, setAllTags] = useState<OrderTag[]>(getAllTags());
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<OrderTag['color']>('red');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [newTagIcon, setNewTagIcon] = useState<OrderTag['iconName']>('Sparkles');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const currentOrderTags = orderId ? getOrderTags(orderId) : [];
  const currentOrderTagIds = new Set(currentOrderTags.map((t) => t.id));

  const refreshTags = () => {
    setAllTags(getAllTags());
    if (onTagsUpdated) onTagsUpdated();
  };

  const handleToggleTag = (tagId: string) => {
    if (!orderId) return;
    if (currentOrderTagIds.has(tagId)) {
      removeTagFromOrder(orderId, tagId);
      toast.info('Tag unassigned');
    } else {
      assignTagToOrder(orderId, tagId);
      toast.success('Tag assigned to order');
    }
    refreshTags();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagLabel.trim()) {
      toast.error('Tag label is required');
      return;
    }

    createCustomTag({
      label: newTagLabel,
      color: newTagColor,
      description: newTagDesc,
      iconName: newTagIcon,
    });

    toast.success(`Created custom tag: "${newTagLabel}"`);
    setNewTagLabel('');
    setNewTagDesc('');
    setIsCreating(false);
    refreshTags();
  };

  const handleDelete = (tagId: string, label: string) => {
    deleteCustomTag(tagId);
    toast.info(`Deleted tag: "${label}"`);
    refreshTags();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="font-black text-base text-foreground" style={{ fontFamily: 'Nunito' }}>
                {orderNumber ? `Manage Tags for Order #${orderNumber}` : 'Custom Order Status Tags'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {orderNumber
                  ? 'Assign or remove color-coded priority and custom tags for this order'
                  : 'Create and configure custom status tags across all customer orders'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Active Tags Selection (if orderId is provided) */}
          {orderId && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Click to Assign / Unassign to this Order:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allTags.map((tag) => {
                  const isAssigned = currentOrderTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isAssigned
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <OrderTagBadge tag={tag} size="sm" />
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          isAssigned
                            ? 'bg-primary text-primary-foreground font-black'
                            : 'border border-border text-transparent'
                        }`}
                      >
                        <Check size={12} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Tags Catalog / Management */}
          {!orderId && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Existing Status Tags:
              </label>
              <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-card">
                {allTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <OrderTagBadge tag={tag} size="sm" />
                      {tag.description && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {tag.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {tag.isPreset ? (
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                          System Preset
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(tag.id, tag.label)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete custom tag"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Custom Tag Expandable Section */}
          <div className="pt-2 border-t border-border">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-border text-xs font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-muted-foreground"
              >
                <Plus size={15} /> Create New Custom Status Tag
              </button>
            ) : (
              <form onSubmit={handleCreate} className="bg-muted/30 p-4 rounded-2xl border border-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" /> Create Custom Tag
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Tag Label (e.g., "Corporate", "Wedding", "Fragile")
                  </label>
                  <input
                    type="text"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="Enter short tag name..."
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Color Theme
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['red', 'amber', 'emerald', 'blue', 'purple', 'pink', 'cyan', 'orange'] as const).map(
                        (c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewTagColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              c === 'red'
                                ? 'bg-red-500'
                                : c === 'amber'
                                ? 'bg-amber-500'
                                : c === 'emerald'
                                ? 'bg-emerald-500'
                                : c === 'blue'
                                ? 'bg-blue-500'
                                : c === 'purple'
                                ? 'bg-purple-500'
                                : c === 'pink'
                                ? 'bg-pink-500'
                                : c === 'cyan'
                                ? 'bg-cyan-500'
                                : 'bg-orange-500'
                            } ${newTagColor === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-80'}`}
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Icon
                    </label>
                    <select
                      value={newTagIcon}
                      onChange={(e) => setNewTagIcon(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-card text-xs"
                    >
                      <option value="Sparkles">Sparkles (General)</option>
                      <option value="Flame">Flame / Zap (Urgent)</option>
                      <option value="Crown">Crown (VIP / High Value)</option>
                      <option value="Gift">Gift (Present)</option>
                      <option value="Users">Users (Party / Group)</option>
                      <option value="AlertCircle">Alert / Warning</option>
                      <option value="Heart">Heart (Salo-Salo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Internal Staff Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTagDesc}
                    onChange={(e) => setNewTagDesc(e.target.value)}
                    placeholder="Brief explanation for staff..."
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-1.5 text-xs font-black"
                  >
                    Save Tag
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {allTags.length} Total Status Tags Available
          </span>
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 text-xs font-black shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

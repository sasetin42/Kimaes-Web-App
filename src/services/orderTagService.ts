// Custom Status Tags Service for Admin Orders
export interface OrderTag {
  id: string;
  label: string;
  color: 'red' | 'amber' | 'emerald' | 'blue' | 'purple' | 'pink' | 'cyan' | 'orange';
  bgClass: string;
  textClass: string;
  borderClass: string;
  iconName?: 'Zap' | 'Crown' | 'Gift' | 'Users' | 'AlertCircle' | 'Heart' | 'Flame' | 'Sparkles';
  description?: string;
  isPreset?: boolean;
}

export const PRESET_ORDER_TAGS: OrderTag[] = [
  {
    id: 'tag-rush',
    label: 'Rush',
    color: 'red',
    bgClass: 'bg-red-500/15 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-500/30',
    iconName: 'Flame',
    description: 'High priority urgent preparation & dispatch',
    isPreset: true,
  },
  {
    id: 'tag-vip',
    label: 'VIP',
    color: 'amber',
    bgClass: 'bg-amber-500/15 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-amber-500/30',
    iconName: 'Crown',
    description: 'High-value customer or corporate account',
    isPreset: true,
  },
  {
    id: 'tag-gift',
    label: 'Gift',
    color: 'purple',
    bgClass: 'bg-purple-500/15 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-500/30',
    iconName: 'Gift',
    description: 'Send as present; include card, no receipt in box',
    isPreset: true,
  },
  {
    id: 'tag-event',
    label: 'Party / Event',
    color: 'blue',
    bgClass: 'bg-blue-500/15 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-500/30',
    iconName: 'Users',
    description: 'Large gathering headcount order',
    isPreset: true,
  },
  {
    id: 'tag-fragile',
    label: 'Special Care',
    color: 'orange',
    bgClass: 'bg-orange-500/15 dark:bg-orange-950/40',
    textClass: 'text-orange-800 dark:text-orange-300',
    borderClass: 'border-orange-500/30',
    iconName: 'AlertCircle',
    description: 'Fragile kakanin bilao setup & dietary instructions',
    isPreset: true,
  },
];

const STORAGE_KEY_TAGS = 'kimae_order_tags_definitions';
const STORAGE_KEY_ASSIGNMENTS = 'kimae_order_tag_assignments';
const TAGS_SYNC_EVENT = 'kimae_order_tags_sync';

export const getColorClasses = (color: OrderTag['color']) => {
  switch (color) {
    case 'red':
      return {
        bgClass: 'bg-red-500/15 dark:bg-red-950/40',
        textClass: 'text-red-700 dark:text-red-300',
        borderClass: 'border-red-500/30',
      };
    case 'amber':
      return {
        bgClass: 'bg-amber-500/15 dark:bg-amber-950/40',
        textClass: 'text-amber-800 dark:text-amber-300',
        borderClass: 'border-amber-500/30',
      };
    case 'emerald':
      return {
        bgClass: 'bg-emerald-500/15 dark:bg-emerald-950/40',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        borderClass: 'border-emerald-500/30',
      };
    case 'blue':
      return {
        bgClass: 'bg-blue-500/15 dark:bg-blue-950/40',
        textClass: 'text-blue-700 dark:text-blue-300',
        borderClass: 'border-blue-500/30',
      };
    case 'purple':
      return {
        bgClass: 'bg-purple-500/15 dark:bg-purple-950/40',
        textClass: 'text-purple-700 dark:text-purple-300',
        borderClass: 'border-purple-500/30',
      };
    case 'pink':
      return {
        bgClass: 'bg-pink-500/15 dark:bg-pink-950/40',
        textClass: 'text-pink-700 dark:text-pink-300',
        borderClass: 'border-pink-500/30',
      };
    case 'cyan':
      return {
        bgClass: 'bg-cyan-500/15 dark:bg-cyan-950/40',
        textClass: 'text-cyan-800 dark:text-cyan-300',
        borderClass: 'border-cyan-500/30',
      };
    case 'orange':
    default:
      return {
        bgClass: 'bg-orange-500/15 dark:bg-orange-950/40',
        textClass: 'text-orange-800 dark:text-orange-300',
        borderClass: 'border-orange-500/30',
      };
  }
};

export const getAllTags = (): OrderTag[] => {
  if (typeof window === 'undefined') return PRESET_ORDER_TAGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TAGS);
    if (!raw) return PRESET_ORDER_TAGS;
    const custom: OrderTag[] = JSON.parse(raw);
    // Combine presets with custom, avoiding duplicates
    const presetIds = new Set(PRESET_ORDER_TAGS.map((t) => t.id));
    return [...PRESET_ORDER_TAGS, ...custom.filter((c) => !presetIds.has(c.id))];
  } catch {
    return PRESET_ORDER_TAGS;
  }
};

export const createCustomTag = (tag: {
  label: string;
  color: OrderTag['color'];
  description?: string;
  iconName?: OrderTag['iconName'];
}): OrderTag => {
  const classes = getColorClasses(tag.color);
  const newTag: OrderTag = {
    id: `tag-custom-${Date.now()}`,
    label: tag.label.trim(),
    color: tag.color,
    bgClass: classes.bgClass,
    textClass: classes.textClass,
    borderClass: classes.borderClass,
    description: tag.description?.trim(),
    iconName: tag.iconName || 'Sparkles',
    isPreset: false,
  };

  const all = getAllTags().filter((t) => !t.isPreset);
  all.push(newTag);
  try {
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(all));
    window.dispatchEvent(new Event(TAGS_SYNC_EVENT));
  } catch (e) {
    console.error('Failed saving custom tag', e);
  }

  return newTag;
};

export const deleteCustomTag = (tagId: string) => {
  const all = getAllTags().filter((t) => !t.isPreset && t.id !== tagId);
  try {
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(all));
    // Also remove from any order assignments
    const map = getAllAssignments();
    Object.keys(map).forEach((ordId) => {
      map[ordId] = map[ordId].filter((id) => id !== tagId);
    });
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(map));
    window.dispatchEvent(new Event(TAGS_SYNC_EVENT));
  } catch (e) {
    console.error('Failed deleting custom tag', e);
  }
};

// Map of orderId -> string[] of tag IDs
const getAllAssignments = (): Record<string, string[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Pre-seed a few realistic tags for demo orders
  return {
    'ord-1': ['tag-rush', 'tag-vip'],
    'ord-2': ['tag-gift'],
    'ord-3': ['tag-event'],
  };
};

export const getOrderTags = (orderId: string): OrderTag[] => {
  const map = getAllAssignments();
  const tagIds = map[orderId] || [];
  const allTags = getAllTags();
  return tagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is OrderTag => Boolean(t));
};

export const assignTagToOrder = (orderId: string, tagId: string) => {
  const map = getAllAssignments();
  const current = map[orderId] || [];
  if (!current.includes(tagId)) {
    map[orderId] = [...current, tagId];
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(map));
      window.dispatchEvent(new Event(TAGS_SYNC_EVENT));
    } catch (e) {
      console.error('Failed assigning tag to order', e);
    }
  }
};

export const removeTagFromOrder = (orderId: string, tagId: string) => {
  const map = getAllAssignments();
  if (map[orderId]) {
    map[orderId] = map[orderId].filter((id) => id !== tagId);
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(map));
      window.dispatchEvent(new Event(TAGS_SYNC_EVENT));
    } catch (e) {
      console.error('Failed removing tag from order', e);
    }
  }
};

export const subscribeToTagUpdates = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(TAGS_SYNC_EVENT, callback);
  return () => {
    window.removeEventListener(TAGS_SYNC_EVENT, callback);
  };
};

import React from 'react';
import {
  Flame,
  Crown,
  Gift,
  Users,
  AlertCircle,
  Sparkles,
  Heart,
  Zap,
  X,
} from 'lucide-react';
import type { OrderTag } from '@/services/orderTagService';

interface OrderTagBadgeProps {
  tag: OrderTag;
  onRemove?: () => void;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export default function OrderTagBadge({
  tag,
  onRemove,
  size = 'xs',
  className = '',
}: OrderTagBadgeProps) {
  const renderIcon = () => {
    const iconSize = size === 'xs' ? 10 : size === 'sm' ? 12 : 14;
    switch (tag.iconName) {
      case 'Flame':
      case 'Zap':
        return <Flame size={iconSize} className="shrink-0" />;
      case 'Crown':
        return <Crown size={iconSize} className="shrink-0" />;
      case 'Gift':
        return <Gift size={iconSize} className="shrink-0" />;
      case 'Users':
        return <Users size={iconSize} className="shrink-0" />;
      case 'AlertCircle':
        return <AlertCircle size={iconSize} className="shrink-0" />;
      case 'Heart':
        return <Heart size={iconSize} className="shrink-0" />;
      case 'Sparkles':
      default:
        return <Sparkles size={iconSize} className="shrink-0" />;
    }
  };

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px] gap-1'
      : size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-black rounded-md border tracking-tight transition-all select-none shadow-xs ${tag.bgClass} ${tag.textClass} ${tag.borderClass} ${sizeClasses} ${className}`}
      title={tag.description || tag.label}
    >
      {renderIcon()}
      <span>{tag.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 p-0.5 -mr-0.5 rounded transition-opacity"
          title={`Remove tag: ${tag.label}`}
        >
          <X size={size === 'xs' ? 9 : 11} />
        </button>
      )}
    </span>
  );
}

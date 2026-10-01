import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Clock, Users, ShoppingCart, ChefHat } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, toggleFavorite, getFavorites } from '@/lib/store';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  compact?: boolean;
}

function ProductCardComponent({ product, onAddToCart, compact = false }: ProductCardProps) {
  const [isFav, setIsFav] = useState(() => getFavorites().includes(product.id));

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(product.id);
    setIsFav(added);
  };

  const price = product.promoPrice || product.price;
  const hasPromo = !!product.promoPrice;

  return (
    <div className="card-product group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${compact ? 'h-36' : 'h-48'}`}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.bestSeller && (
            <span className="badge-status bg-primary text-primary-foreground text-[10px]">
              <Star size={9} fill="currentColor" /> Best Seller
            </span>
          )}
          {product.isNew && (
            <span className="badge-status bg-green-500 text-white text-[10px]">
              ✨ New
            </span>
          )}
          {hasPromo && (
            <span className="badge-status bg-destructive text-white text-[10px]">
              Sale!
            </span>
          )}
          {!product.available && (
            <span className="badge-status bg-gray-500 text-white text-[10px]">
              Out of Stock
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={handleFav}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className={`font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-1 ${compact ? 'text-sm' : 'text-base'}`}
            style={{ fontFamily: 'Nunito' }}>
            {product.name}
          </h3>
        </Link>

        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.shortDescription}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users size={11} /> {product.personsServed} pax
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {product.prepTime}min
          </span>
          <span className="flex items-center gap-1">
            <ChefHat size={11} /> {product.servingSize}
          </span>
        </div>

        {/* Price & Add to cart */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="price-tag text-xl">
              {formatPrice(price)}
            </span>
            {hasPromo && (
              <span className="text-xs text-muted-foreground line-through ml-2">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart ? onAddToCart(product) : null}
            disabled={!product.available}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              product.available
                ? 'bg-primary text-primary-foreground hover:bg-brand-yellow-dark shadow-brand'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={13} />
            {compact ? 'Add' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.compact === nextProps.compact &&
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.promoPrice === nextProps.product.promoPrice &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.available === nextProps.product.available &&
    prevProps.product.bestSeller === nextProps.product.bestSeller &&
    prevProps.product.featured === nextProps.product.featured &&
    prevProps.product.isNew === nextProps.product.isNew &&
    prevProps.product.images?.[0] === nextProps.product.images?.[0]
  );
});

export default ProductCard;

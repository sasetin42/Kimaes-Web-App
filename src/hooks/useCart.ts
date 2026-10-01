import { useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '@/types';
import { getCart, saveCart, calculateCartTotal } from '@/lib/store';
import { toast } from 'sonner';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const addToCart = useCallback((
    product: Product,
    quantity: number,
    selectedOptions: Record<string, string | string[]>,
    optionPriceAdd: number,
    specialInstructions?: string
  ) => {
    const currentCart = getCart();
    const existingIdx = currentCart.findIndex(
      item => item.product.id === product.id &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (existingIdx >= 0) {
      currentCart[existingIdx].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        product,
        quantity,
        selectedOptions,
        optionPriceAdd,
        specialInstructions,
      };
      currentCart.push(newItem);
    }

    saveCart(currentCart);
    setCart([...currentCart]);
    toast.success(`${product.name} added to cart! 🛒`, { description: `${quantity} item(s) added` });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    const currentCart = getCart().filter(item => item.id !== itemId);
    saveCart(currentCart);
    setCart(currentCart);
    toast.info('Item removed from cart');
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    const currentCart = getCart();
    const idx = currentCart.findIndex(item => item.id === itemId);
    if (idx >= 0) {
      if (quantity <= 0) {
        currentCart.splice(idx, 1);
        toast.info('Item removed from cart');
      } else {
        currentCart[idx].quantity = quantity;
      }
      saveCart(currentCart);
      setCart([...currentCart]);
    }
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
    setCart([]);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateCartTotal(cart);

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal };
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  product_id: string;
  product_name: string;
  brand: string;
  price_xof: number;
  quantity: number;
  image_url: string | null;
  requires_prescription: boolean;
  pharmacy_id: string;
  pharmacy_name: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'pharma_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadCart();
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const saveCart = async () => {
        try {
          await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
        } catch (error) {
          console.error('Error saving cart:', error);
        }
      };

      saveCart();
    }
  }, [items, isHydrated]);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === newItem.product_id);
      if (existing) {
        return prev.map(i =>
          i.product_id === newItem.product_id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      // Clear cart if different pharmacy
      if (prev.length > 0 && prev[0].pharmacy_id !== newItem.pharmacy_id) {
        return [newItem];
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (product_id: string) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  };

  const updateQuantity = (product_id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(product_id);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.product_id === product_id ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, i) => sum + i.price_xof * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

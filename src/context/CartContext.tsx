"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Product } from "@/types/menu";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CartItem = {
  product: Product;
  quantity: number;
  note?: string;
  unitPrice?: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD"; product: Product; note?: string; unitPrice?: number }
  | { type: "REMOVE"; productId: number; note?: string }
  | { type: "DECREMENT"; productId: number; note?: string }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, note?: string, unitPrice?: number) => void;
  removeFromCart: (productId: number, note?: string) => void;
  decrementFromCart: (productId: number, note?: string) => void;
  clearCart: () => void;
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find(
        (i) => i.product.id === action.product.id && i.note === action.note
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id && i.note === action.note
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1, note: action.note, unitPrice: action.unitPrice }] };
    }

    case "DECREMENT": {
      const existing = state.items.find(
        (i) => i.product.id === action.productId && i.note === action.note
      );
      if (!existing) return state;
      if (existing.quantity === 1) {
        return { items: state.items.filter((i) => !(i.product.id === action.productId && i.note === action.note)) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId && i.note === action.note ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }

    case "REMOVE":
      return { items: state.items.filter((i) => !(i.product.id === action.productId && i.note === action.note)) };

    case "CLEAR":
      return { items: [] };

    case "HYDRATE":
      return { items: action.items };

    default:
      return state;
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "bignona_cart";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const hydrated = useRef(false);

  // Hidratación desde localStorage (solo en cliente)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: CartItem[] = JSON.parse(stored);
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: "HYDRATE", items });
        }
      }
    } catch {
      // localStorage corrupto: ignorar
    } finally {
      hydrated.current = true;
    }
  }, []);

  // Persistir en localStorage solo después de hidratar
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = useCallback((product: Product, note?: string, unitPrice?: number) => {
    dispatch({ type: "ADD", product, note, unitPrice });
  }, []);

  const removeFromCart = useCallback((productId: number, note?: string) => {
    dispatch({ type: "REMOVE", productId, note });
  }, []);

  const decrementFromCart = useCallback((productId: number, note?: string) => {
    dispatch({ type: "DECREMENT", productId, note });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () =>
      state.items.reduce(
        (sum, i) => sum + (i.unitPrice ?? parseFloat(i.product.price)) * i.quantity,
        0
      ),
    [state.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      decrementFromCart,
      clearCart,
    }),
    [state.items, totalItems, totalPrice, addToCart, removeFromCart, decrementFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

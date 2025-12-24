import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ComboItem } from "../services/api"; // ✅ backend API import

export interface Category {
  categoryId: string;
  _id: string;
  name: string;
  description?: string;
  totalItems?: number;
}

export interface CartItem {
  itemId: string;
  _id: string;
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isCombo: boolean;
  comboItems?: ComboItem[];
  images?: string[];
  loyaltyPoints: number;
  stockStatus: string;
  status: string;
  categoryId: Category | string;
  quantity: number;
  availableBranches: {
    _id: string;
    name: string;
    address?: string;
    status?: string;
  }[];
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  typeOfOrder: string;
  arrivalTime: string | null;
  specialInstruction: string;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      typeOfOrder: null,
      arrivalTime: null,
      specialInstruction: null,


      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === newItem.id);

        let updatedItems;
        if (existingItem) {
          updatedItems = items.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          updatedItems = [...items, { ...newItem, quantity: 1 }];
        }

        set({ items: updatedItems });
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [], arrivalTime: null, specialInstruction: "" });
      },


      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (open) => set({ isOpen: open }),

    }),
    {
      name: "ayamku-cart",
    }
  )
);
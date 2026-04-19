import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number }) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((item) => item.product_id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
              },
            ],
          };
        });
      },

      removeItem: (product_id) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== product_id),
        }));
      },

      updateQuantity: (product_id, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product_id === product_id ? { ...item, quantity: Math.max(0, quantity) } : item
            )
            .filter((item) => item.quantity > 0),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'kt-pos-cart-storage',
    }
  )
);

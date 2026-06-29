import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import storage from '../storage';

export interface CartItem {
  drugId: string;
  drugName: string;
  drugImage: string;
  formulation: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLogo: string;
  price: number;
  quantity: number;
}

interface CartStoreState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (drugId: string, pharmacyId: string) => void;
  updateQuantity: (drugId: string, pharmacyId: string, quantity: number) => void;
  getItem: (drugId: string, pharmacyId: string) => CartItem | undefined;
  getItemsByPharmacy: () => Map<string, CartItem[]>;
  isInCart: (drugId: string) => boolean;
  getCartPharmacyId: (drugId: string) => string | undefined;
  clearCart: () => void;
}

const cartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: item => {
        set(state => {
          const existing = state.items.find(
            i => i.drugId === item.drugId && i.pharmacyId === item.pharmacyId,
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                i.drugId === item.drugId && i.pharmacyId === item.pharmacyId
                  ? {...i, quantity: i.quantity + 1}
                  : i,
              ),
            };
          }
          // Remove same drug from different pharmacy (one pharmacy per drug)
          const filtered = state.items.filter(i => i.drugId !== item.drugId);
          return {items: [...filtered, {...item, quantity: 1}]};
        });
      },
      removeItem: (drugId, pharmacyId) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.drugId === drugId && i.pharmacyId === pharmacyId),
          ),
        }));
      },
      updateQuantity: (drugId, pharmacyId, quantity) => {
        if (quantity < 1 || quantity > 99) return;
        set(state => ({
          items: state.items.map(i =>
            i.drugId === drugId && i.pharmacyId === pharmacyId
              ? {...i, quantity}
              : i,
          ),
        }));
      },
      getItem: (drugId, pharmacyId) => {
        return get().items.find(
          i => i.drugId === drugId && i.pharmacyId === pharmacyId,
        );
      },
      getItemsByPharmacy: () => {
        const items = get().items;
        const map = new Map<string, CartItem[]>();
        items.forEach(item => {
          const group = map.get(item.pharmacyId) || [];
          group.push(item);
          map.set(item.pharmacyId, group);
        });
        return map;
      },
      isInCart: drugId => {
        return get().items.some(i => i.drugId === drugId);
      },
      getCartPharmacyId: drugId => {
        return get().items.find(i => i.drugId === drugId)?.pharmacyId;
      },
      clearCart: () => set({items: []}),
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => storage.zustandStorage),
    },
  ),
);

export default cartStore;

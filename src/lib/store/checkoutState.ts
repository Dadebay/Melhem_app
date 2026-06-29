import {create} from 'zustand';

// Ephemeral checkout state — NOT persisted. Shared between Checkout and AddressPicker.
interface CheckoutState {
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
}

const checkoutState = create<CheckoutState>(set => ({
  selectedAddressId: null,
  setSelectedAddressId: id => set({selectedAddressId: id}),
}));

export default checkoutState;

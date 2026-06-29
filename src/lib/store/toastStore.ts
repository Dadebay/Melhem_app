import {create} from 'zustand';

interface ToastState {
  message: string | null;
  /** Bumped on every show() so the host can re-trigger its animation even when
   *  the same message is shown twice in a row. */
  seq: number;
  show: (message: string) => void;
  hide: () => void;
}

const toastStore = create<ToastState>(set => ({
  message: null,
  seq: 0,
  show: message => set(state => ({message, seq: state.seq + 1})),
  hide: () => set({message: null}),
}));

/** Fire a lightweight toast from anywhere without subscribing to the store. */
export const showToast = (message: string) => toastStore.getState().show(message);

export default toastStore;

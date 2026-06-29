import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import storage from '../storage';

export interface User {
  id: number;
  phone: string;
  username?: string | null;
  image?: string | null;
  fcm_token?: string | null;
}

/** Top-level location the user picked during onboarding. */
export interface SelectedLocation {
  id: number;
  name: string;
}

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Picked location + onboarding flag live here (survive logout). */
  location: SelectedLocation | null;
  onboarded: boolean;
  login: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setLocation: (location: SelectedLocation) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

const authStore = create<AuthStoreState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      location: null,
      onboarded: false,
      login: (user, accessToken) =>
        set({user, accessToken, isAuthenticated: true}),
      setUser: user => set({user}),
      setLocation: location => set({location}),
      completeOnboarding: () => set({onboarded: true}),
      // Keep location & onboarded — they are preferences, not session state.
      logout: () =>
        set({user: null, accessToken: null, isAuthenticated: false}),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => storage.zustandStorage),
    },
  ),
);

export default authStore;

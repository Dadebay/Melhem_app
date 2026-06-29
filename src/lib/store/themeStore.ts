import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import storage from '../storage';

interface ThemeStoreState {
  theme: AppTheme;
  toggleTheme: () => void;
}

const themeStore = create<ThemeStoreState>()(
  persist(
    set => ({
      theme: 'light',
      toggleTheme: () =>
        set(state => ({theme: state.theme === 'dark' ? 'light' : 'dark'})),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => storage.zustandStorage),
    },
  ),
);

export default themeStore;

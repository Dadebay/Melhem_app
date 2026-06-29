import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import storage from '../storage';

/**
 * A self-contained snapshot of a bookmarked drug.
 *
 * Favourites are stored fully locally: each entry carries everything needed to
 * render its card and to navigate to the detail screen, so the Bookmark screen
 * never has to resolve ids against the backend. This keeps the feature working
 * offline and for items the drugs API can't resolve (e.g. legacy inventory
 * rows keyed by a Mongo `_id`). Prices are a snapshot and refresh the next time
 * the user opens the live detail screen.
 */
export interface BookmarkItem {
  /** Stable unique key: numeric drug id for catalogue drugs, `_id` for inventory. */
  id: string;
  name: string;
  imageKey: string | null;
  priceText: string | null;
  isOutOfStock: boolean;
  formulationText?: string | null;
  pharmacy?: {name: string; logo: string};
  /** Detail-screen nav params, mirroring `Nav.Shared['Drug']`. */
  navPrice?: number;
  navPharmacy?: {_id: string; name: string; logo: string};
}

interface AppStoreState {
  bookmarks: BookmarkItem[];
  /** Toggles the bookmark and returns `true` if it was just added. */
  toggleBookmark: (item: BookmarkItem) => boolean;
  lastSearchedDrugs: {id: number; name: string}[];
  clearLastSearchedDrugs: () => void;
}

const appStore = create<AppStoreState>()(
  persist(
    set => ({
      bookmarks: [],
      toggleBookmark: item => {
        let added = false;
        set(state => {
          const exists = state.bookmarks.some(b => b.id === item.id);
          added = !exists;
          const bookmarks = exists
            ? state.bookmarks.filter(b => b.id !== item.id)
            : [item, ...state.bookmarks];
          return {bookmarks};
        });
        return added;
      },
      lastSearchedDrugs: [],
      clearLastSearchedDrugs: () =>
        set(() => ({
          lastSearchedDrugs: [],
        })),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => storage.zustandStorage),
      version: 2,
      // Earlier versions stored bare id strings. Full snapshots can't be
      // rebuilt from those offline, so drop anything that isn't a BookmarkItem.
      migrate: (persisted, _version) => {
        const state = persisted as Partial<AppStoreState> | undefined;
        if (state && Array.isArray(state.bookmarks)) {
          state.bookmarks = state.bookmarks.filter(
            (b): b is BookmarkItem =>
              !!b &&
              typeof b === 'object' &&
              typeof (b as BookmarkItem).id === 'string',
          );
        }
        return state as AppStoreState;
      },
    },
  ),
);

export default appStore;

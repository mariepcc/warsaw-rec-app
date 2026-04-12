import { create } from "zustand";
import { getFavouriteNames } from "@/api/places";

type FavouritesStore = {
  favouriteNames: Set<string>;
  load: () => Promise<void>;
  add: (name: string) => void;
  remove: (name: string) => void;
  toggle: (name: string) => void;
};

export const useFavouritesStore = create<FavouritesStore>((set, get) => ({
  favouriteNames: new Set(),
  load: async () => {
    const names = await getFavouriteNames();
    set({ favouriteNames: new Set(names) });
  },
  add: (name) =>
    set((s) => ({ favouriteNames: new Set([...s.favouriteNames, name]) })),
  remove: (name) =>
    set((s) => {
      const next = new Set(s.favouriteNames);
      next.delete(name);
      return { favouriteNames: next };
    }),
  toggle: (name) => {
    const { favouriteNames, add, remove } = get();
    favouriteNames.has(name) ? remove(name) : add(name);
  },
}));

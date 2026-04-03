import { create } from "zustand";
import type { Place } from "@/api/places";

interface PlaceDetailState {
  selected: Place | null;
  setSelected: (place: Place | null) => void;
}

export const usePlaceDetailStore = create<PlaceDetailState>((set) => ({
  selected: null,
  setSelected: (place) => set({ selected: place }),
}));

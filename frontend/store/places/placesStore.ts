import { create } from "zustand";
import { Place } from "@/api/places";

type PlaceStore = {
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place) => void;
};

export const usePlaceStore = create<PlaceStore>((set) => ({
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
}));

import { create } from "zustand";
import { Place } from "@/api/places";

type PlaceStore = {
  selectedPlace: Place | null;
  source: "chat" | "saved" | "map" | null;
  setSelectedPlace: (place: Place, source: "chat" | "saved" | "map") => void;
};

export const usePlaceStore = create<PlaceStore>((set) => ({
  selectedPlace: null,
  source: null,
  setSelectedPlace: (place, source) => set({ selectedPlace: place, source }),
}));

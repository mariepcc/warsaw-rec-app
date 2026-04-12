import { create } from "zustand";
import { Place } from "@/api/places";

type PlaceStore = {
  selectedPlace: Place | null;
  source: "chat" | "saved" | null;
  setSelectedPlace: (place: Place, source: "chat" | "saved") => void;
};

export const usePlaceStore = create<PlaceStore>((set) => ({
  selectedPlace: null,
  source: null,
  setSelectedPlace: (place, source) => set({ selectedPlace: place, source }),
}));

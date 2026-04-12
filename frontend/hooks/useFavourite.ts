import { useState, useCallback, useRef } from "react";
import { toggleFavourite } from "@/api/places";
import type { Place } from "@/api/places";

export function useFavourite(place: Place) {
  const [isFav, setIsFav] = useState(place.is_favourite ?? false);
  const [loading, setLoading] = useState(false);
  const placeRef = useRef(place);
  placeRef.current = place; // ← aktualizuj przy każdym renderze

  const toggle = useCallback(async () => {
    const previous = isFav;
    setIsFav((v) => !v);
    setLoading(true);
    try {
      const next = await toggleFavourite(placeRef.current);
      console.log("toggle result:", next, "previous was:", previous);
      setIsFav(next);
    } catch (e) {
      console.log("toggle error:", e);
      setIsFav(previous);
    } finally {
      setLoading(false);
    }
  }, [isFav]);

  return { isFav, loading, toggle };
}

import { useState, useCallback } from "react";
import { toggleFavourite } from "@/api/places";

type UseFavouriteReturn = {
  isFav: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
};

export function useFavourite(
  placeId: string,
  initialValue: boolean = false,
): UseFavouriteReturn {
  const [isFav, setIsFav] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    const previous = isFav;
    setIsFav((v) => !v);
    setLoading(true);
    try {
      const next = await toggleFavourite(placeId);
      setIsFav(next);
    } catch {
      setIsFav(previous);
    } finally {
      setLoading(false);
    }
  }, [placeId, isFav]);

  return { isFav, loading, toggle };
}

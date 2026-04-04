import { useState, useEffect, useCallback } from "react";
import { isFavourite, toggleFavourite } from "@/api/places";

type UseFavouriteReturn = {
  isFav: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
};

export function useFavourite(placeId: string): UseFavouriteReturn {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    isFavourite(placeId)
      .then((val) => {
        if (!cancelled) setIsFav(val);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const toggle = useCallback(async () => {
    const previous = isFav;
    setIsFav((v) => !v);

    try {
      const next = await toggleFavourite(placeId);
      setIsFav(next);
    } catch {
      setIsFav(previous);
    }
  }, [placeId, isFav]);

  return { isFav, loading, toggle };
}

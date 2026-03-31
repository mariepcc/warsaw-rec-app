import { useState, useEffect, useCallback } from "react";
import { isFavourite, toggleFavourite } from "@/api/places";

type UseFavouriteReturn = {
  isFav: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
};

export function useFavourite(placeName: string): UseFavouriteReturn {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    isFavourite(placeName)
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
  }, [placeName]);

  const toggle = useCallback(async () => {
    const previous = isFav;
    setIsFav((v) => !v);

    try {
      const next = await toggleFavourite(placeName);
      setIsFav(next);
    } catch {
      setIsFav(previous);
    }
  }, [placeName, isFav]);

  return { isFav, loading, toggle };
}

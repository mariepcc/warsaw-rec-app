import apiClient from "./client";

export type Place = {
  name: string;
  address?: string;
  district?: string;
  rating?: number;
  user_rating_count?: number;
  price_level?: string;
  main_category?: string;
  sub_category?: string;
  opening_hours?: string;
  maps_url?: string;
  menu_url?: string;
  serves_vegetarian?: boolean;
  outdoor_seating?: boolean;
  serves_coffee?: boolean;
  serves_breakfast?: boolean;
  serves_lunch?: boolean;
  serves_dinner?: boolean;
  serves_dessert?: boolean;
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_cocktails?: boolean;
  dine_in?: boolean;
  takeout?: boolean;
  reservable?: boolean;
  live_music?: boolean;
  good_for_groups?: boolean;
  menu_for_children?: boolean;
  lat?: number;
  lon?: number;
  price_range_start?: number;
  price_range_end?: number;
  google_maps_direct_link?: string;
};

export async function savePlace(place: Place, sessionId?: string) {
  const response = await apiClient.post("/places/save", {
    place,
    session_id: sessionId,
  });
  return response.data;
}

export async function unsavePlace(placeName: string) {
  const response = await apiClient.delete(
    `/places/delete/${encodeURIComponent(placeName)}`,
  );
  return response.data;
}

export async function getSavedPlaces(category?: string) {
  const response = await apiClient.get("/places/saved", {
    params: category ? { category } : undefined,
  });
  return response.data;
}

export async function checkSaved(placeName: string) {
  const response = await apiClient.get(
    `/places/saved/${encodeURIComponent(placeName)}/check`,
  );
  return response.data;
}
export async function isFavourite(placeName: string): Promise<boolean> {
  const response = await apiClient.get<{ favourite: boolean }>(
    `/places/${encodeURIComponent(placeName)}/is-favourite`,
  );
  return response.data.favourite;
}

export async function toggleFavourite(placeName: string): Promise<boolean> {
  const response = await apiClient.post<{ favourite: boolean }>(
    `/places/${encodeURIComponent(placeName)}/favourite`,
  );
  return response.data.favourite;
}

import { Ionicons } from "@expo/vector-icons";

export const SUB_BY_CATEGORY: Record<string, string[]> = {
  Gastronomia: [
    "Restauracja",
    "Kuchnia Azjatycka",
    "Kuchnia Włoska",
    "Kuchnia Polska",
    "Kuchnia Indyjska",
    "Burgery & Amerykańska",
    "Steki & Grill",
    "Kuchnia Latynoamerykańska",
    "Owoce Morza & Ryby",
    "Kuchnia Roślinna",
    "Fast Food & Przekąski",
    "Kebab & Bliskowschodnia",
    "Kuchnie Świata (Inne)",
  ],
  "Kawa i Słodycze": [
    "Kawiarnia",
    "Piekarnia & Cukiernia",
    "Lody & Zimne Desery",
  ],
  "Kultura & Rozrywka": [
    "Muzeum & Galeria",
    "Atrakcje & Zabytki",
    "Edukacja & Nauka",
    "Rozrywka Aktywna",
  ],
  "Życie Nocne": ["Bar", "Klub"],
  "Natura & Rekreacja": ["Park & Ogród", "ZOO & Akwarium"],
};

export type Category = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export const CATEGORIES: Category[] = [
  {
    key: "Gastronomia",
    label: "Jedzenie",
    icon: "restaurant-outline",
    color: "#E8622A",
  },
  {
    key: "Kawa i Słodycze",
    label: "Kawa",
    icon: "cafe-outline",
    color: "#7C5CBF",
  },
  {
    key: "Kultura & Rozrywka",
    label: "Kultura",
    icon: "color-palette-outline",
    color: "#2A8BE8",
  },
  {
    key: "Życie Nocne",
    label: "Nocne",
    icon: "musical-notes-outline",
    color: "#3D3D5C",
  },
  {
    key: "Natura & Rekreacja",
    label: "Natura",
    icon: "leaf-outline",
    color: "#2A9E6A",
  },
];

export const PRICE_LEVELS = [
  { label: "$", value: "PRICE_LEVEL_INEXPENSIVE" },
  { label: "$$", value: "PRICE_LEVEL_MODERATE" },
  { label: "$$$", value: "PRICE_LEVEL_EXPENSIVE" },
  { label: "$$$$", value: "PRICE_LEVEL_LUXURY" },
];

export const DISTRICTS = [
  "Śródmieście",
  "Mokotów",
  "Żoliborz",
  "Wola",
  "Ochota",
  "Praga Południe",
  "Praga Północ",
  "Ursynów",
  "Wilanów",
  "Bielany",
  "Targówek",
  "Rembertów",
  "Wawer",
  "Wesoła",
];

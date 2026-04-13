from __future__ import annotations

import json
from datetime import datetime
from typing import Any, List, Optional
from zoneinfo import ZoneInfo
from pydantic import BaseModel, Field
from services.llm_factory import LLMFactory


class MessageFilter(BaseModel):
    field: str = Field(description="Nazwa pola z metadanych")
    op: str = Field(description="Operator: ==, >=, <=, !=")
    value: Any = Field(description="Wartość filtra — string, int, float lub bool")


class MetadataExtractionResult(BaseModel):
    filters: List[MessageFilter] = Field(
        default_factory=list,
        description="Tylko filtry jednoznacznie wynikające z wiadomości użytkownika",
    )
    clean_query: str = Field(
        description="Zapytanie bez filtrów kategorycznych, gotowe do embedowania",
    )
    results_limit: int = Field(
        default=3,
        description="Ile rekomendacji chce użytkownik (1–10), domyślnie 3",
    )
    wants_open_now: bool = Field(
        default=False,
        description="Czy użytkownik pyta o miejsca aktualnie otwarte",
    )
    wants_open_at: Optional[str] = Field(
        default=None,
        description="Konkretna godzina w formacie HH:MM jeśli użytkownik podał, np. '10:00'",
    )
    wants_open_day: Optional[str] = Field(
        default=None,
        description="Dzień tygodnia po polsku (małe litery), np. 'sobota', jeśli podany",
    )


class HydeResponse(BaseModel):
    hypothetical_description: str = Field(
        description="Hipotetyczny opis miejsca pasującego do zapytania, 3-5 zdań"
    )


SYSTEM_PROMPT = """
Jesteś ekstrakatorem filtrów dla systemu rekomendacji miejsc gastronomicznych 
i kulturalnych w Warszawie. Wszystkie zapytania dotyczą restauracji, kawiarni, 
barów, parków, muzeów i innych miejsc w mieście.
Zwracaj TYLKO filtry, które są jednoznacznie i wprost wspomniane przez użytkownika.
Nie uzupełniaj wartości domyślnych ani nie zgaduj.

━━━ DOSTĘPNE FILTRY I ICH WARTOŚCI ━━━

WSPÓLNE (gastronomia i kultura):
  district     (==)  Dokładna nazwa dzielnicy:
                     Śródmieście, Wola, Praga Północ, Mokotów, Praga Południe,
                     Ochota, Włochy, Wawer, Targówek, Żoliborz, Ursynów, Ursus,
                     Bemowo, Bielany, Wilanów, Białołęka, Wesoła, Rembertów

  main_category (==) Jedna z czterech wartości:
                     'Gastronomia'          — restauracje, bary, knajpy, fast food
                     'Kawa i Słodycze'      — kawiarnie, piekarnie, cukiernie, lody
                     'Kultura & Rozrywka'   — muzea, galerie, teatry, atrakcje
                     'Życie Nocne'          — kluby, bary, koncerty, wydarzenia wieczorne
                     'Natura & Rekreacja'   — parki, ogrody, ZOO

  sub_category  (==) Dokładna wartość z listy:
                     Restauracja, Kuchnia Polska, Kuchnia Europejska & Śródziemnomorska,
                     Kuchnia Włoska, Kebab & Bliskowschodnia, Kuchnia Roślinna,
                     Kuchnia Azjatycka, Kuchnia Latynoamerykańska, Kuchnia Indyjska,
                     Burgery & Amerykańska, Kawiarnia, Piekarnia & Cukiernia,
                     Steki & Grill, Lody & Zimne Desery, Fast Food & Przekąski,
                     Owoce Morza & Ryby, Kuchnie Świata (Inne),
                     Atrakcje & Zabytki, Rozrywka Aktywna, Muzeum & Galeria,
                     Park & Ogród, ZOO & Akwarium, Edukacja & Nauka, Bar, Klub

  rating        (>=) Minimalna ocena, float 1.0–5.0
                     Użyj gdy użytkownik pyta o "najlepsze", "wysoko oceniane" itp.
                     Sugerowana wartość: 4.0
  user_rating_count (>=) Minimalna liczba ocen, float
                     Użyj gdy użytkownik pyta o "popularne", "często oceniane", "z dużą liczbą ocen" itp.
                     Sugerowana wartość: 1000

  outdoor_seating (==) true/false
  good_for_groups (==) true/false
  reservable      (==) true/false

TYLKO GASTRONOMIA (main_category: Gastronomia lub Kawa i Słodycze):
  price_level   (==)  Dokładna wartość tekstowa:
                      'PRICE_LEVEL_INEXPENSIVE'    — tanie, budżetowe
                      'PRICE_LEVEL_MODERATE'       — średnia cena
                      'PRICE_LEVEL_EXPENSIVE'      — drogie
                      'PRICE_LEVEL_VERY_EXPENSIVE' — bardzo drogie

  takeout           (==) true/false
  dine_in           (==) true/false
  serves_breakfast  (==) true/false
  serves_lunch      (==) true/false
  serves_dinner     (==) true/false
  serves_coffee     (==) true/false
  serves_beer       (==) true/false
  serves_wine       (==) true/false
  serves_cocktails  (==) true/false
  serves_vegetarian (==) true/false
  serves_dessert    (==) true/false
  live_music        (==) true/false
  menu_for_children (==) true/false
  
  WAŻNE: dla pól booleanowych zawsze zwracaj wartość true lub false (nie 1/0).

━━━ GODZINY OTWARCIA ━━━
NIE zwracaj filtra dla opening_hours — to pole JSON i nie nadaje się do prostego predykatu.
Zamiast tego:
- Jeśli użytkownik pyta "teraz otwarte" / "aktualnie" / "w tej chwili" → wants_open_now = true
- Jeśli pyta "otwarte o 10" / "o 21:00" → wants_open_at = "10:00" (format HH:MM)
- Jeśli podaje dzień ("w sobotę", "w niedzielę") → wants_open_day = "sobota"
  Domyślny dzień to dzisiaj (nie wpisuj go, jeśli nie podany wprost).

━━━ LICZBA REKOMENDACJI ━━━
- Domyślnie: 3
- Jeśli użytkownik prosi o konkretną liczbę ("5 miejsc", "kilka" → 4, "jedno" → 1): ustaw results_limit
- Maksimum: 10

━━━ CLEAN QUERY ━━━
Przepisz zapytanie zachowując CAŁĄ semantykę użytkownika.
Usuń TYLKO: konkretne liczby (oceny, ceny), nazwy dzielnic/ulic.
ZACHOWAJ WSZYSTKO INNE: typ miejsca, atmosferę, okazję, nastrój, towarzystwo,
typ kuchni, porę dnia, opis doświadczenia, przymiotniki.

Przykłady:
"modne klimatyczne miejsca na śniadanie wysokie oceny Mokotów"
→ clean_query: "modne klimatyczne kawiarnie na śniadanie przytulna atmosfera"

"tania wegańska kawiarnia z ogródkiem"
→ clean_query: "wegańska kawiarnia roślinna menu ogródek na zewnątrz"

"romantyczna restauracja na randkę wieczorem"
→ clean_query: "romantyczna restauracja intymna atmosfera kolacja wieczór"
"""


HYDE_PROMPT = """
Jesteś HyDE (Hypothetical Document Embeddings) modułem w RAG pipeline, który tworzy hipotetyczne opisy miejsc w Warszawie.
Na podstawie zapytania napisz krótki opis (3-5 zdań) miejsca które idealnie pasuje.

Opis powinien brzmieć jak fragment opinii klientów z Google Maps — zawierać:
- typ miejsca i rodzaj kuchni/oferty
- atmosferę i wystrój
- co klienci chwalą

ZASADY:
- ABSOLUTNIE NIE wymyślaj nazw własnych miejsc — żadnych nazw restauracji, kawiarni itp.
- Pisz w trzeciej osobie bez podmiotu: "Serwuje autentyczne curry..." nie "Restauracja X serwuje..."
- Skup się na charakterze miejsca, NIE na lokalizacji
- Uwzględnij kontekst użycia: pora dnia, okazja (randka, praca, rodzina), nastrój
- Jeśli zapytanie dotyczy śniadania — opisz klimat poranny, światło, spokój
- Jeśli wieczór/randka — opisz atmosferę, oświetlenie, intymność
- Pisz w języku polskim

Przykład dla "indyjskie jedzenie autentyczna kuchnia":
"Serwuje autentyczne dania kuchni indyjskiej — curry, biryani i świeżo 
wypiekane naan z pieca tandoor. Aromatyczne przyprawy i świeże składniki. 
Klienci chwalą bogactwo smaków i obsługę która pomaga wybrać dania."
"""

WARSAW_TZ = ZoneInfo("Europe/Warsaw")

DAY_MAP = {
    0: "poniedziałek",
    1: "wtorek",
    2: "środa",
    3: "czwartek",
    4: "piątek",
    5: "sobota",
    6: "niedziela",
}


class MetadataExtractor:
    @staticmethod
    def expand_query_with_hyde(clean_query: str) -> str:
        """Generuje hipotetyczny opis miejsca dla lepszego vector search."""
        llm = LLMFactory("openai")

        result = llm.create_completion(
            response_model=HydeResponse,
            messages=[
                {"role": "system", "content": HYDE_PROMPT},
                {"role": "user", "content": clean_query},
            ],
        )

        return f"{clean_query}. {result.hypothetical_description}"

    @staticmethod
    def extract(query: str) -> MetadataExtractionResult:
        llm = LLMFactory("openai")
        return llm.create_completion(
            response_model=MetadataExtractionResult,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query},
            ],
        )

    @staticmethod
    def build_predicates(extraction: MetadataExtractionResult):
        """Buduje predykaty timescale-vector."""
        from timescale_vector import client

        if not extraction.filters:
            return None

        BOOL_FIELDS = {
            "takeout",
            "dine_in",
            "reservable",
            "outdoor_seating",
            "good_for_groups",
            "live_music",
            "menu_for_children",
            "serves_breakfast",
            "serves_lunch",
            "serves_dinner",
            "serves_dessert",
            "serves_coffee",
            "serves_vegetarian",
            "serves_wine",
            "serves_beer",
            "serves_cocktails",
        }

        INT_FIELDS = {"user_rating_count", "price_range_start", "price_range_end"}

        predicates = None
        for f in extraction.filters:
            if f.field in BOOL_FIELDS:
                value = "true" if f.value else "false"
            elif f.field in INT_FIELDS:
                value = float(f.value)
            elif f.field == "rating":
                value = float(f.value)
            else:
                value = f.value

            p = client.Predicates(f.field, f.op, value)
            predicates = p if predicates is None else predicates & p

        return predicates

    @staticmethod
    def filter_by_opening_hours(
        results,
        extraction: MetadataExtractionResult,
    ):
        """
        Post-filtruje wyniki vector search po godzinach otwarcia.
        Wywołaj PO vec.search() jeśli extraction.wants_open_now lub wants_open_at.
        """
        if not extraction.wants_open_now and not extraction.wants_open_at:
            return results

        now = datetime.now(WARSAW_TZ)

        if extraction.wants_open_now:
            check_time = now.strftime("%H:%M")
            check_day = DAY_MAP[now.weekday()]
        else:
            check_time = extraction.wants_open_at
            check_day = extraction.wants_open_day or DAY_MAP[now.weekday()]

        def is_open(row) -> bool:
            raw = row.get("opening_hours") or row.get("godziny_json")
            if not raw:
                return True
            try:
                hours = json.loads(raw) if isinstance(raw, str) else raw
            except (json.JSONDecodeError, TypeError):
                return True

            slots = hours.get(check_day)
            if slots is None:
                return False

            for start, end in slots:
                if start <= check_time <= end:
                    return True
            return False

        try:
            return results[results.apply(lambda r: is_open(r), axis=1)]
        except AttributeError:
            return [r for r in results if is_open(r)]

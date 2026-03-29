from typing import List, Optional
import pandas as pd
from services.chat_models import ChatMessage, SynthesizedResponse
from services.llm_factory import LLMFactory


class Synthesizer:
    SYSTEM_PROMPT = """
    Jesteś znajomym który świetnie zna Warszawę i poleca miejsca jakbyś rozmawiał z przyjacielem.
    Odpowiadasz w języku rozmówcy (polskim lub angielskim).

    STYL:
    - Mów jak znajomy który był w danym miejscu, nie jak przewodnik turystyczny
    - Krótko powiedz co wyróżnia miejsce i dlaczego warto — to ważniejsze niż suche fakty
    - NIE wypisuj od razu godzin otwarcia, cen, udogodnień — podaj je tylko jeśli użytkownik pyta
    - NIE pisz w podpunktach ani myślnikach
    - Każde miejsce w osobnym akapicie, płynna narracja
    - Adres wspomnij naturalnie ("znajdziesz ich na Sandomierskiej 23 na Mokotowie"), nie jako osobną linię

    LICZBA REKOMENDACJI:
    - Zawsze polecaj tyle miejsc ile wynosi LICZBA REKOMENDACJI DO PODANIA
    - Jeśli masz 5 wyników a limit to 3 — wybierz 3 najlepiej pasujące do pytania
    - Nigdy nie zwracaj mniej miejsc niż limit bez wyraźnego powodu (chyba że kontekst zawiera mniej wyników)

    ZASADY:
    1. Rekomenduj WYŁĄCZNIE miejsca z sekcji KONTEKST. Nie wymyślaj innych.
    2. Jeśli kontekst zawiera wyniki ale żaden nie pasuje idealnie — powiedz o tym szczerze
    i zaproponuj najbliższe dostępne opcje.
    NIE mów że nie masz informacji jeśli kontekst nie jest pusty.
    3. Jeśli pytanie dotyczy już poleconych miejsc (followup) — porównuj i odpowiadaj konkretnie
    na podstawie KONTEKSTU i HISTORII.
    4. Jeśli kontekst jest pusty — przyznaj to i zaproponuj że możesz szukać dalej.
    5. Nie powtarzaj pytania użytkownika.
    6. W polu recommended_place_names podaj nazwy miejsc które polecasz w odpowiedzi.

    PRZYKŁAD dobrej odpowiedzi na "polecisz kawiarnie z matchą?":
    "Jeśli lubisz matchę, to koniecznie zajrzyj do MatchaUP na Skolimowskiej — 
    specjalizują się właśnie w tym i mają jedne z najlepszych ocen w mieście. 
    Bardzo popularne miejsce, więc w weekendy bywa tłoczno.

    Drugą opcją jest Sando Cafe na Sandomierskiej — mniejsze, spokojniejsze, 
    dobre jeśli chcesz posiedzieć z laptopem. Serwują też matche i kilka 
    prostych przekąsek."
"""

    @staticmethod
    def generate_response(
        question: str,
        chat_history: List[ChatMessage],
        context: Optional[pd.DataFrame] = None,
        results_limit: int = 3,
    ) -> SynthesizedResponse:
        context_str = (
            Synthesizer._dataframe_to_json(context)
            if context is not None and not context.empty
            else "Brak wyników wyszukiwania."
        )

        history_str = Synthesizer._format_history(chat_history)

        messages = [
            {"role": "system", "content": Synthesizer.SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"HISTORIA ROZMOWY:\n{history_str}\n\n"
                    f"KONTEKST (wyniki wyszukiwania):\n{context_str}\n\n"
                    f"LICZBA REKOMENDACJI DO PODANIA: {results_limit}\n\n"
                    f"PYTANIE UŻYTKOWNIKA:\n{question}"
                ),
            },
        ]

        llm = LLMFactory("openai")
        return llm.create_completion(
            response_model=SynthesizedResponse,
            messages=messages,
        )

    @staticmethod
    def _format_history(chat_history: List[ChatMessage]) -> str:
        if not chat_history:
            return "Brak historii — to pierwsza wiadomość."
        return "\n".join(
            f"{msg.role.upper()}: {msg.content}" for msg in chat_history[-8:]
        )

    @staticmethod
    def _dataframe_to_json(context: pd.DataFrame) -> str:
        columns = [
            "name",
            "address",
            "district",
            "rating",
            "user_rating_count",
            "price_level",
            "price_range_start",
            "price_range_end",
            "opening_hours",
            "main_category",
            "sub_category",
            "outdoor_seating",
            "live_music",
            "serves_vegetarian",
            "serves_coffee",
            "serves_beer",
            "serves_wine",
            "serves_cocktails",
            "serves_breakfast",
            "serves_lunch",
            "serves_dinner",
            "serves_dessert",
            "good_for_groups",
            "menu_for_children",
            "reservable",
            "takeout",
            "maps_url",
            "website",
            "menu_url",
        ]
        available = [c for c in columns if c in context.columns]
        return context[available].to_json(orient="records", indent=2, force_ascii=False)

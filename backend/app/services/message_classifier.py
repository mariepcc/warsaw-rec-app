from typing import List
from schemas.chat import ChatMessage, ClassificationResult
from services.llm_factory import LLMFactory


class MessageClassifier:
    SYSTEM_PROMPT = """
    Jesteś klasyfikatorem wiadomości dla systemu rekomendacji miejsc w Warszawie.
    Klasyfikuj wiadomość użytkownika do jednej z trzech kategorii:

    - "rag": Nowe zapytanie o miejsca, restauracje, kawiarnie, atrakcje kulturalne.
    Nie nawiązuje do poprzednich wyników. Wymaga wyszukiwania w bazie.
    Przykłady: "gdzie zjeść sushi?", "polecasz jakieś muzeum?"

    - "followup": Pytanie o szczegóły już poleconych miejsc, bez szukania nowych.
    Nawiązuje do konkretnych miejsc z historii rozmowy.
    Przykłady: "a które jest tańsze?", "jak daleko od centrum?", "które ma ogródek?"

    - "hybrid": Nawiązuje do kontekstu (typ miejsca, cecha), ale szuka NOWYCH miejsc.
    Przykłady: "a coś podobnego ale na Mokotowie?", "a takie miejsce ale z muzyką na żywo?"

    ZASADY DLA reformulated_query:
    - Przepisz zapytanie jako kompletne, samodzielne zapytanie uwzględniające kontekst historii
    - Zawrzyj wszystkie istotne informacje: typ miejsca, atmosferę, dzielnicę, cenę jeśli wspomniane
    - NIE dodawaj wykluczeń ("inne niż X", "nie X") — vector search tego nie obsługuje
    - Dla "followup" zostaw reformulated_query jako null

    WAŻNE: Zawsze analizuj wiadomość w kontekście poprzedniej rozmowy.
    Jeśli rozmowa dotyczyła jedzenia/napojów, słowa takie jak "matcha" interpretuj
    jako napój/kawiarnia, nie sport.
    """

    @staticmethod
    def classify(
        message: str,
        chat_history: List[ChatMessage],
    ) -> ClassificationResult:
        history_str = "\n".join(
            f"{msg.role.upper()}: {msg.content}" for msg in chat_history[-6:]
        )

        messages = [
            {"role": "system", "content": MessageClassifier.SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Historia rozmowy:\n{history_str}\n\nNowa wiadomość: {message}"
                ),
            },
        ]

        llm = LLMFactory("openai")
        return llm.create_completion(
            response_model=ClassificationResult,
            messages=messages,
        )

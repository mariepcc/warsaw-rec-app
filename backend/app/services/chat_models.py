from typing import Any, List, Optional, Literal
from pydantic import BaseModel, Field


class MessageFilter(BaseModel):
    field: str
    op: str
    value: float | str | int


class ClassificationResult(BaseModel):
    message_type: Literal["rag", "followup", "hybrid"] = Field(
        description="Typ wiadomości: nowe zapytanie, followup, lub hybrid"
    )
    reasoning: str = Field(description="Krótkie uzasadnienie klasyfikacji")
    reformulated_query: Optional[str] = Field(
        default=None,
        description="Przepisane zapytanie uwzględniające kontekst historii (dla rag i hybrid)",
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class SynthesizedResponse(BaseModel):
    thought_process: List[str] = Field(
        description="Myśli asystenta podczas syntezowania odpowiedzi"
    )
    answer: str = Field(description="Odpowiedź dla użytkownika")
    enough_context: bool = Field(description="Czy asystent miał wystarczający kontekst")
    recommended_place_names: List[str] = Field(
        default_factory=list,
        description="Nazwy poleconych miejsc (do zapisu w historii)",
    )
    _context: Any = None

from pydantic import BaseModel
from typing import Optional
from schemas.places import PlaceResponse


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    places: list[PlaceResponse] = []
    enough_context: bool

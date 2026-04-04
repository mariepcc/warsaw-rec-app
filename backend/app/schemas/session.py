from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionResponse(BaseModel):
    id: str
    created_at: datetime
    first_message: Optional[str] = None
    message_count: int = 0


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    message_type: Optional[str]
    created_at: datetime

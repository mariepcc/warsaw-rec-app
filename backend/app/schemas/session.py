from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionResponse(BaseModel):
    id: str
    created_at: datetime


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    message_type: Optional[str]
    created_at: datetime

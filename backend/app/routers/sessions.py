import datetime
import uuid
from fastapi import APIRouter, HTTPException
from schemas.session import SessionResponse, MessageResponse
from database.chat_repository import ChatRepository
from config.settings import get_settings
import os

router = APIRouter()
settings = get_settings()
repo = ChatRepository(settings.database.service_url)


@router.get("/{session_id}/messages", response_model=list[MessageResponse])
async def get_session_messages(session_id: str):
    try:
        messages = repo.get_history(session_id)
        return [
            MessageResponse(
                id=str(uuid.uuid4()),
                role=m.role,
                content=m.content,
                message_type=None,
                created_at=datetime.utcnow(),
            )
            for m in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

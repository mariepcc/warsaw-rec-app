from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from schemas.session import MessageResponse, SessionResponse
from database.chat_repository import ChatRepository
from config.settings import get_settings

router = APIRouter()
settings = get_settings()
repo = ChatRepository(settings.database.service_url)


@router.get("/", response_model=list[SessionResponse])
async def get_sessions(user: dict = Depends(get_current_user)):
    sessions = repo.get_sessions(user["user_id"])
    return [
        SessionResponse(
            id=str(s["id"]),
            created_at=s["created_at"],
            first_message=s["first_message"],
            message_count=s["message_count"],
        )
        for s in sessions
    ]


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
                created_at=datetime.now(timezone.utc),
            )
            for m in messages
        ]
    except Exception as e:
        print(f"BŁĄD POBIERANIA HISTORII: {e}")
        raise HTTPException(status_code=500, detail=str(e))

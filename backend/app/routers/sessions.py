from datetime import datetime, timezone
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from schemas.session import MessageResponse, SessionResponse
from database.chat_repository import ChatRepository
from config.settings import get_settings

router = APIRouter()
settings = get_settings()
repo = ChatRepository(settings.database.service_url)
logger = logging.getLogger(__name__)


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
async def get_session_messages(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    try:
        if not repo.session_belongs_to_user(session_id, user["user_id"]):
            raise HTTPException(status_code=403, detail="Brak dostępu")
        messages = repo.get_history(session_id)
        return [
            MessageResponse(
                id=str(uuid.uuid4()),
                role=m.role,
                content=m.content,
                type=m.message_type,
                places=m.recommended_places or [],
                created_at=datetime.now(timezone.utc),
            )
            for m in messages
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_session_messages error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Wystąpił błąd serwera")


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    try:
        repo.delete_session(session_id, user["user_id"])
        return {"success": True}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Brak dostępu")
    except Exception:
        logger.error("delete_session error", exc_info=True)
        raise HTTPException(status_code=500, detail="Wystąpił błąd serwera")

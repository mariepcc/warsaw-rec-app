from fastapi import APIRouter, HTTPException
from schemas.chat import ChatRequest, ChatResponse
from services.chat_service import ChatService
import uuid

router = APIRouter()
chat_service = ChatService()


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())

        response = chat_service.handle_message(
            user_id="anonymous",  # tymczasowo, potem z JWT
            session_id=session_id,
            message=request.message,
        )

        return ChatResponse(
            answer=response.answer,
            session_id=session_id,
            recommended_places=response.recommended_place_names,
            enough_context=response.enough_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends
from dependencies import get_current_user
from schemas.chat import ChatRequest, ChatResponse
from schemas.places import PlaceResponse
from services.chat_service import ChatService
import uuid
import traceback


router = APIRouter()
chat_service = ChatService()


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        response = chat_service.handle_message(
            user_id=user["user_id"],
            session_id=session_id,
            message=request.message,
        )

        places = []
        if (
            hasattr(response, "_context")
            and response._context is not None
            and not response._context.empty
            and response.recommended_place_names
        ):
            recommended = set(response.recommended_place_names)
            filtered = response._context[response._context["name"].isin(recommended)]
            for _, row in filtered.iterrows():
                places.append(
                    PlaceResponse(
                        id=row.get("id"),
                        name=row.get("name"),
                        address=row.get("address"),
                        district=row.get("district"),
                        rating=row.get("rating"),
                        user_rating_count=int(row["user_rating_count"]),
                        price_level=row.get("price_level"),
                        opening_hours=row.get("opening_hours"),
                        maps_url=row.get("maps_url"),
                        menu_url=row.get("menu_url"),
                        serves_vegetarian=row.get("serves_vegetarian"),
                        outdoor_seating=row.get("outdoor_seating"),
                        serves_coffee=row.get("serves_coffee"),
                        serves_breakfast=row.get("serves_breakfast"),
                        serves_lunch=row.get("serves_lunch"),
                        serves_dinner=row.get("serves_dinner"),
                        serves_dessert=row.get("serves_dessert"),
                        serves_beer=row.get("serves_beer"),
                        serves_wine=row.get("serves_wine"),
                        serves_cocktails=row.get("serves_cocktails"),
                        dine_in=row.get("dine_in"),
                        takeout=row.get("takeout"),
                        reservable=row.get("reservable"),
                        live_music=row.get("live_music"),
                        good_for_groups=row.get("good_for_groups"),
                        menu_for_children=row.get("menu_for_children"),
                        main_category=row.get("main_category"),
                        sub_category=row.get("sub_category"),
                        editorial_summary=row.get("editorial_summary"),
                    )
                )

        return ChatResponse(
            answer=response.answer,
            type=response.type,
            session_id=session_id,
            places=places,
            enough_context=response.enough_context,
        )
    except Exception:
        traceback.print_exc()
        raise

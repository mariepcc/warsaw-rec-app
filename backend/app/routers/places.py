from fastapi import APIRouter, Depends, HTTPException
import logging
from schemas.places import SavedPlaceResponse, ToggleFavouriteRequest
from database.places_repository import PlacesRepository
from dependencies import get_current_user
from config.settings import get_settings

router = APIRouter()
settings = get_settings()
places_repo = PlacesRepository(settings.database.service_url)
logger = logging.getLogger(__name__)


@router.get("/all")
async def get_all_places(user: dict = Depends(get_current_user)):
    places = places_repo.get_all_places()
    return places


@router.get("/favourites", response_model=list[SavedPlaceResponse])
async def get_saved_places(
    user: dict = Depends(get_current_user),
):
    places = places_repo.get_favourite_places(user["user_id"])
    return places


@router.post("/favourites/{place_id}/toggle")
async def toggle_favourite(
    place: ToggleFavouriteRequest,
    user: dict = Depends(get_current_user),
):
    try:
        is_fav = places_repo.toggle_favourite(user["user_id"], place.model_dump())
        return {"is_favourite": is_fav}
    except Exception as e:
        logger.error(f"toggle_favourite error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Wystąpił błąd serwera")


@router.get("/favourite-names")
async def get_favourite_names(user: dict = Depends(get_current_user)):
    names = places_repo.get_favourite_names(user["user_id"])
    return {"names": names}

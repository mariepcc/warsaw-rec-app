from fastapi import APIRouter, Body, Depends, HTTPException
from typing import Optional
from schemas.places import SavedPlaceResponse
from database.places_repository import PlacesRepository
from dependencies import get_current_user
from config.settings import get_settings

router = APIRouter()
settings = get_settings()
places_repo = PlacesRepository(settings.database.service_url)


@router.get("/all")
async def get_all_places():
    places = places_repo.get_all_places()
    return places


@router.get("/favourites", response_model=list[SavedPlaceResponse])
async def get_saved_places(
    category: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    places = places_repo.get_favourite_places(user["user_id"], category)
    return places


@router.post("/favourites/{place_id}/toggle")
async def toggle_favourite(
    place: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    try:
        print(f"place data received in backend: {place}")
        is_fav = places_repo.toggle_favourite(user["user_id"], place)
        print(f"toggled favourite for place {place['id']}, new status: {is_fav}")
        return {"is_favourite": is_fav}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

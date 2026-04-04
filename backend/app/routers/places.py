from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from schemas.places import SavePlaceRequest, SavedPlaceResponse
from database.places_repository import PlacesRepository
from dependencies import get_current_user
from config.settings import get_settings

router = APIRouter()
settings = get_settings()
places_repo = PlacesRepository(settings.database.service_url)


@router.post("/save")
async def save_place(
    request: SavePlaceRequest,
    user: dict = Depends(get_current_user),
):
    saved = places_repo.save_place(
        user_id=user["user_id"],
        place=request.place,
        session_id=request.session_id,
    )
    return {"saved": saved}


@router.delete("/delete/{place_id}")
async def unsave_place(
    place_id: str,
    user: dict = Depends(get_current_user),
):
    deleted = places_repo.delete_place(user["user_id"], place_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Place not found")
    return {"deleted": True}


@router.get("/saved", response_model=list[SavedPlaceResponse])
async def get_saved_places(
    category: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    places = places_repo.get_saved_places(user["user_id"], category)
    return places


@router.get("/{place_id}/is-favourite")
async def is_favourite(
    place_id: str,
    user: dict = Depends(get_current_user),
):
    """Zwraca czy dane miejsce jest oznaczone jako ulubione przez usera."""
    result = places_repo.is_favourite(user["user_id"], place_id)
    return {"favourite": result}


@router.post("/{place_id}/favourite")
async def toggle_favourite(
    place_id: str,
    user: dict = Depends(get_current_user),
):
    toggled = places_repo.mark_as_favourite(user["user_id"], place_id)

    return {"favourite": toggled}

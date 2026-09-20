from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user, get_profile_service
from app.models.user import User
from app.schemas.profile import UserProfileResponse, UserProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
):
    """Retrieve the profile of the currently authenticated user."""
    return profile_service.get_profile(current_user)


@router.put("", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
):
    """Update display name, timezone, timezone mode, or theme preference."""
    return profile_service.update_profile(current_user, payload)

from fastapi import APIRouter, Depends
from app.schemas.setting import SettingsResponse, SettingsUpdate
from app.services.settings_service import SettingsService
from app.api.dependencies import get_settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsResponse)
def get_settings(service: SettingsService = Depends(get_settings_service)):
    return service.get_settings()


@router.put("", response_model=SettingsResponse)
def update_settings(
    patch: SettingsUpdate,
    service: SettingsService = Depends(get_settings_service)
):
    return service.update_settings(patch)


@router.post("/delete-all")
def delete_all_data(service: SettingsService = Depends(get_settings_service)):
    return service.delete_all_data()

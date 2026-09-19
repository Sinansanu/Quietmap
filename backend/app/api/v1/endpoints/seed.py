from fastapi import APIRouter, Depends, Query
from app.services.settings_service import SettingsService
from app.api.dependencies import get_settings_service

router = APIRouter(prefix="/seed", tags=["Development Seed"])


@router.post("")
def seed_demo_data(
    days: int = Query(7, description="Number of historical days to simulate (7, 14, or 30)"),
    service: SettingsService = Depends(get_settings_service)
):
    return service.seed_demo_data(days=days)

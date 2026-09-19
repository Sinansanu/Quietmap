from typing import List
from fastapi import APIRouter, Depends
from app.schemas.location import LocationMapMetrics
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_analytics_service

router = APIRouter(prefix="/focus-map", tags=["Focus Map"])


@router.get("", response_model=List[LocationMapMetrics])
def get_focus_map(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    return analytics_service.get_focus_map()

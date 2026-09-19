from fastapi import APIRouter, Depends, Query
from app.schemas.timeline import TimelineResponse
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_analytics_service

router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.get("", response_model=TimelineResponse)
def get_timeline(
    range: str = Query("day", pattern="^(12h|day|week)$", description="Timeline window duration"),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    return analytics_service.get_timeline(range)

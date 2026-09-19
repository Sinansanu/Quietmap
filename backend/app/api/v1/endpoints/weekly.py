from fastapi import APIRouter, Depends
from app.schemas.weekly import WeeklyResponse
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_analytics_service

router = APIRouter(prefix="/weekly", tags=["Weekly Report"])


@router.get("", response_model=WeeklyResponse)
def get_weekly_report(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    return analytics_service.get_weekly()

from fastapi import APIRouter, Depends
from app.schemas.dashboard import DashboardResponse
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_analytics_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    return analytics_service.get_dashboard()

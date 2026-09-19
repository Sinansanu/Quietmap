from fastapi import APIRouter, Depends
from app.schemas.insights import InsightsResponse
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_analytics_service

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=InsightsResponse)
def get_insights(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    return analytics_service.get_insights()

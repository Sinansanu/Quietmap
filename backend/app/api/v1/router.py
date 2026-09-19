from fastapi import APIRouter
from .endpoints import (
    locations,
    sessions,
    noise,
    dashboard,
    focus_map,
    timeline,
    insights,
    weekly,
    settings,
    seed,
    health
)

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(locations.router)
api_v1_router.include_router(sessions.router)
api_v1_router.include_router(noise.router)
api_v1_router.include_router(dashboard.router)
api_v1_router.include_router(focus_map.router)
api_v1_router.include_router(timeline.router)
api_v1_router.include_router(insights.router)
api_v1_router.include_router(weekly.router)
api_v1_router.include_router(settings.router)
api_v1_router.include_router(seed.router)
api_v1_router.include_router(health.router)

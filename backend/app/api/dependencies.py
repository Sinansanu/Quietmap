from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.location_service import LocationService
from app.services.focus_session_service import FocusSessionService
from app.services.noise_monitoring_service import NoiseMonitoringService
from app.services.analytics_service import AnalyticsService
from app.services.settings_service import SettingsService


def get_location_service(db: Session = Depends(get_db)) -> LocationService:
    return LocationService(db)


def get_session_service(db: Session = Depends(get_db)) -> FocusSessionService:
    return FocusSessionService(db)


def get_noise_service(db: Session = Depends(get_db)) -> NoiseMonitoringService:
    return NoiseMonitoringService(db)


def get_analytics_service(db: Session = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(db)

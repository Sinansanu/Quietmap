from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.location_service import LocationService
from app.services.focus_session_service import FocusSessionService
from app.services.noise_monitoring_service import NoiseMonitoringService
from app.services.analytics_service import AnalyticsService
from app.services.settings_service import SettingsService
from app.services.profile_service import ProfileService
from app.core.security import decode_access_token


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token: Optional[str] = None

    # 1. Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()

    # 2. Fallback to HttpOnly cookie
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    user = UserRepository(db).get_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been deactivated."
        )

    return user


def get_location_service(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LocationService:
    return LocationService(db, user_id=current_user.id)


def get_session_service(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FocusSessionService:
    return FocusSessionService(db, user_id=current_user.id)


def get_noise_service(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> NoiseMonitoringService:
    return NoiseMonitoringService(db, user_id=current_user.id)


def get_analytics_service(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AnalyticsService:
    return AnalyticsService(db, user_id=current_user.id)


def get_settings_service(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SettingsService:
    return SettingsService(db, user_id=current_user.id)


def get_profile_service(
    db: Session = Depends(get_db)
) -> ProfileService:
    return ProfileService(db)


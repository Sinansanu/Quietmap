from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.repositories.session_repository import SessionRepository
from app.repositories.location_repository import LocationRepository
from app.repositories.noise_repository import NoiseRepository
from app.models.interruption import Interruption
from app.schemas.focus_session import FocusSessionStart, FocusSessionResponse, FocusSessionEndResponse
from app.core.math import calculate_focus_score, calculate_stability
from app.services.noise_monitoring_service import NoiseMonitoringService


class FocusSessionService:
    def __init__(self, db: Session):
        self.db = db
        self.session_repo = SessionRepository(db)
        self.location_repo = LocationRepository(db)
        self.noise_repo = NoiseRepository(db)

    def get_active(self) -> Optional[FocusSessionResponse]:
        active = self.session_repo.get_active()
        if not active:
            return None
        return FocusSessionResponse.model_validate(active)

    def start_session(self, payload: FocusSessionStart) -> FocusSessionResponse:
        active = self.session_repo.get_active()
        if active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A focus session is already in progress. End the current session before starting a new one."
            )

        if payload.location_id:
            loc = self.location_repo.get_by_id(payload.location_id)
            if not loc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Location with ID {payload.location_id} does not exist."
                )

        activity = (payload.activity or "Work").strip()[:64]
        session = self.session_repo.create(
            location_id=payload.location_id,
            activity=activity
        )
        return FocusSessionResponse.model_validate(session)

    def end_session(self, session_id: str) -> FocusSessionEndResponse:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Focus session with ID {session_id} not found."
            )
        if session.ended_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This focus session has already ended."
            )

        now = datetime.now(timezone.utc)
        started_at = session.started_at if session.started_at.tzinfo else session.started_at.replace(tzinfo=timezone.utc)
        duration_minutes = max(0.5, (now - started_at).total_seconds() / 60.0)

        # Retrieve noise samples recorded during this session
        samples = self.noise_repo.get_samples_for_session(session_id)
        levels = [s.noise_level for s in samples]

        avg_noise = round(sum(levels) / len(levels), 1) if levels else 35.0
        stability = calculate_stability(levels)

        # Retrieve interruptions
        interruption_count = self.db.scalar(
            select(func.count(Interruption.id)).where(Interruption.focus_session_id == session_id)
        ) or 0

        score = calculate_focus_score(
            average_noise=avg_noise,
            stability=stability,
            interruptions=interruption_count,
            duration_minutes=duration_minutes
        )

        ended = self.session_repo.end(
            session_id=session_id,
            ended_at=now,
            focus_score=score,
            average_noise=avg_noise,
            stability_score=stability,
            interruption_count=interruption_count
        )

        NoiseMonitoringService.cleanup_session_tracker(session_id)

        return FocusSessionEndResponse(
            id=ended.id,
            started_at=started_at,
            ended_at=now,
            duration_minutes=round(duration_minutes, 1),
            focus_score=score,
            average_noise=avg_noise,
            stability_score=stability,
            interruptions=interruption_count
        )

    def list_history(self, limit: int = 50) -> List[FocusSessionResponse]:
        sessions = self.session_repo.list_history(limit=limit)
        return [FocusSessionResponse.model_validate(s) for s in sessions]

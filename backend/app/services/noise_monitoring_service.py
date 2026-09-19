from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.repositories.noise_repository import NoiseRepository
from app.repositories.location_repository import LocationRepository
from app.repositories.session_repository import SessionRepository
from app.models.interruption import Interruption
from app.schemas.noise import NoiseSampleCreate, NoiseSampleResponse, LiveLevelResponse
from app.core.math import clamp, relative_noise_label


class NoiseMonitoringService:
    # In-memory tracking for active focus sessions to detect spikes accurately across ticks
    _session_trackers: Dict[str, Dict[str, Any]] = {}

    def __init__(self, db: Session, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id
        self.noise_repo = NoiseRepository(db, user_id=user_id)
        self.location_repo = LocationRepository(db, user_id=user_id)
        self.session_repo = SessionRepository(db, user_id=user_id)

    def record_sample(
        self,
        payload: NoiseSampleCreate,
        interruption_threshold: float = 18.0,
        sampling_interval_seconds: int = 10
    ) -> NoiseSampleResponse:
        level = clamp(payload.noise_level, 0.0, 100.0)
        at = payload.recorded_at or datetime.now(timezone.utc)
        if at.tzinfo is None:
            at = at.replace(tzinfo=timezone.utc)

        # Validate location if provided
        loc_id = payload.location_id
        if loc_id and not self.location_repo.get_by_id(loc_id):
            loc_id = None

        # Validate active session if provided
        sess_id = payload.focus_session_id
        if sess_id:
            active = self.session_repo.get_by_id(sess_id)
            if not active or active.ended_at is not None:
                sess_id = None

        sample = self.noise_repo.insert(
            recorded_at=at,
            noise_level=level,
            location_id=loc_id,
            focus_session_id=sess_id
        )

        if sess_id:
            self._evaluate_interruption(
                session_id=sess_id,
                timestamp=at,
                level=level,
                threshold=interruption_threshold,
                sampling_interval=sampling_interval_seconds
            )

        return NoiseSampleResponse.model_validate(sample)

    def _evaluate_interruption(
        self,
        session_id: str,
        timestamp: datetime,
        level: float,
        threshold: float,
        sampling_interval: int
    ) -> None:
        tracker = self._session_trackers.setdefault(
            session_id,
            {"baseline": None, "spike_start": None, "peak": 0.0, "interruption_id": None}
        )

        if tracker["baseline"] is None:
            tracker["baseline"] = level
            tracker["peak"] = level
            return

        delta = level - tracker["baseline"]
        is_spike = (delta >= threshold)

        if is_spike:
            if tracker["spike_start"] is None:
                tracker["spike_start"] = timestamp
                tracker["peak"] = level
            else:
                tracker["peak"] = max(tracker["peak"], level)

            spike_start = tracker["spike_start"]
            if spike_start.tzinfo is None:
                spike_start = spike_start.replace(tzinfo=timezone.utc)
            curr_time = timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)

            duration = max(float(sampling_interval), (curr_time - spike_start).total_seconds())

            if tracker["interruption_id"] is None:
                # First time crossing threshold - log interruption immediately
                interruption = Interruption(
                    focus_session_id=session_id,
                    started_at=spike_start,
                    duration_seconds=duration,
                    intensity=round(delta, 1),
                    peak_level=round(tracker["peak"], 1)
                )
                self.db.add(interruption)
                self.db.commit()
                self.db.refresh(interruption)
                tracker["interruption_id"] = interruption.id
            else:
                # Prolonged spike: update duration and peak intensity of the existing interruption
                existing = self.db.get(Interruption, tracker["interruption_id"])
                if existing:
                    existing.duration_seconds = duration
                    existing.peak_level = max(existing.peak_level, level)
                    existing.intensity = round(existing.peak_level - tracker["baseline"], 1)
                    self.db.commit()
        else:
            # Noise returned to normal: smoothly update baseline (exponential moving average)
            tracker["baseline"] = tracker["baseline"] * 0.85 + level * 0.15
            tracker["spike_start"] = None
            tracker["interruption_id"] = None
            tracker["peak"] = level

    def get_latest_level(self) -> Optional[LiveLevelResponse]:
        latest = self.noise_repo.get_latest()
        if not latest:
            return None
        return LiveLevelResponse(
            recorded_at=latest.recorded_at,
            noise_level=latest.noise_level,
            label=relative_noise_label(latest.noise_level)
        )

    @classmethod
    def cleanup_session_tracker(cls, session_id: str) -> None:
        cls._session_trackers.pop(session_id, None)

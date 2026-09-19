from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.noise_repository import NoiseRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.location_repository import LocationRepository
from app.models.focus_session import FocusSession
from app.models.interruption import Interruption
from app.models.setting import Setting
from app.schemas.dashboard import DashboardResponse
from app.schemas.location import LocationMapMetrics, LocationResponse
from app.schemas.timeline import TimelineResponse
from app.schemas.insights import InsightsResponse
from app.schemas.weekly import WeeklyResponse
from app.schemas.setting import SettingsResponse
from app.schemas.noise import LiveLevelResponse
from app.core.math import relative_noise_label


class AnalyticsService:
    def __init__(self, db: Session, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id
        self.analytics_repo = AnalyticsRepository(db, user_id=user_id)
        self.noise_repo = NoiseRepository(db, user_id=user_id)
        self.session_repo = SessionRepository(db, user_id=user_id)
        self.location_repo = LocationRepository(db, user_id=user_id)

    def get_dashboard(self) -> DashboardResponse:
        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # 1. Latest noise level
        latest_sample = self.noise_repo.get_latest()
        live_level = None
        if latest_sample:
            live_level = LiveLevelResponse(
                recorded_at=latest_sample.recorded_at,
                noise_level=latest_sample.noise_level,
                label=relative_noise_label(latest_sample.noise_level)
            )

        # 2. Active focus session
        active_sess = self.session_repo.get_active()

        # 3. Aggregates for today
        completed_conds = [
            FocusSession.started_at >= today_start,
            FocusSession.ended_at.is_not(None)
        ]
        if self.user_id:
            completed_conds.append(FocusSession.user_id == self.user_id)

        completed_today = self.db.scalar(
            select(func.count(FocusSession.id)).where(and_(*completed_conds))
        ) or 0

        interruptions_stmt = (
            select(func.count(Interruption.id))
            .join(FocusSession, Interruption.focus_session_id == FocusSession.id)
            .where(Interruption.started_at >= today_start)
        )
        if self.user_id:
            interruptions_stmt = interruptions_stmt.where(FocusSession.user_id == self.user_id)

        interruptions_today = self.db.scalar(interruptions_stmt) or 0

        avg_score_conds = [
            FocusSession.started_at >= today_start,
            FocusSession.focus_score.is_not(None)
        ]
        if self.user_id:
            avg_score_conds.append(FocusSession.user_id == self.user_id)

        avg_score_val = self.db.scalar(
            select(func.avg(FocusSession.focus_score)).where(and_(*avg_score_conds))
        )
        avg_score = int(round(avg_score_val)) if avg_score_val is not None else None

        # 4. Locations & Settings
        locations = [LocationResponse.model_validate(loc) for loc in self.location_repo.get_all()]

        settings_stmt = select(Setting)
        if self.user_id:
            settings_stmt = settings_stmt.where(Setting.user_id == self.user_id)
        settings_dict = {s.key: s.value for s in self.db.scalars(settings_stmt).all()}

        settings_res = SettingsResponse(
            ambient_monitoring=(settings_dict.get("ambient_monitoring", "true").lower() == "true"),
            sampling_interval=int(settings_dict.get("sampling_interval", "10")),
            interruption_threshold=int(settings_dict.get("interruption_threshold", "18")),
            default_activity=settings_dict.get("default_activity", "Work")
        )

        return DashboardResponse(
            last_sample=live_level,
            active_session=active_sess,
            completed_today=completed_today,
            interruptions_today=interruptions_today,
            average_score=avg_score,
            locations=locations,
            settings=settings_res
        )

    def get_focus_map(self) -> List[LocationMapMetrics]:
        return self.analytics_repo.get_focus_map_metrics()

    def get_timeline(self, range_str: str = "day") -> TimelineResponse:
        now = datetime.now(timezone.utc)
        if range_str == "week":
            start_time = now - timedelta(days=7)
            bucket_seconds = 1800  # 30-minute buckets (~336 points max)
        elif range_str == "12h":
            start_time = now - timedelta(hours=12)
            bucket_seconds = 120   # 2-minute buckets (~360 points max)
        else:  # day
            start_time = now - timedelta(hours=24)
            bucket_seconds = 300   # 5-minute buckets (~288 points max)

        buckets = self.noise_repo.get_bucketed_timeline(
            start_time=start_time,
            end_time=now,
            bucket_seconds=bucket_seconds
        )
        locations = [LocationResponse.model_validate(loc) for loc in self.location_repo.get_all()]

        return TimelineResponse(
            range=range_str,
            samples=buckets,
            locations=locations
        )

    def get_insights(self) -> InsightsResponse:
        return self.analytics_repo.get_insights()

    def get_weekly(self) -> WeeklyResponse:
        return self.analytics_repo.get_weekly_report()

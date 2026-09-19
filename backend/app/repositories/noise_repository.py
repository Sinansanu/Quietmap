from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.noise_sample import NoiseSample
from app.schemas.timeline import TimelineBucket


class NoiseRepository:
    def __init__(self, db: Session):
        self.db = db

    def insert(
        self,
        recorded_at: datetime,
        noise_level: float,
        location_id: Optional[str] = None,
        focus_session_id: Optional[str] = None
    ) -> NoiseSample:
        dt = recorded_at if recorded_at.tzinfo else recorded_at.replace(tzinfo=timezone.utc)
        sample = NoiseSample(
            recorded_at=dt,
            noise_level=round(noise_level, 1),
            location_id=location_id,
            focus_session_id=focus_session_id
        )
        self.db.add(sample)
        self.db.commit()
        self.db.refresh(sample)
        return sample

    def get_latest(self) -> Optional[NoiseSample]:
        stmt = select(NoiseSample).order_by(NoiseSample.recorded_at.desc()).limit(1)
        return self.db.scalars(stmt).first()

    def get_samples_for_session(self, session_id: str) -> List[NoiseSample]:
        stmt = (
            select(NoiseSample)
            .where(NoiseSample.focus_session_id == session_id)
            .order_by(NoiseSample.recorded_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_bucketed_timeline(
        self,
        start_time: datetime,
        end_time: datetime,
        bucket_seconds: int = 300
    ) -> List[TimelineBucket]:
        stmt = (
            select(
                NoiseSample.recorded_at,
                NoiseSample.noise_level,
                NoiseSample.location_id,
                NoiseSample.focus_session_id
            )
            .where(
                and_(
                    NoiseSample.recorded_at >= start_time,
                    NoiseSample.recorded_at <= end_time
                )
            )
            .order_by(NoiseSample.recorded_at.asc())
        )
        raw_samples = self.db.execute(stmt).all()
        if not raw_samples:
            return []

        buckets: Dict[int, Dict[str, Any]] = {}
        for row in raw_samples:
            dt, level, loc_id, sess_id = row
            dt_aware = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            epoch = int(dt_aware.timestamp())
            bucket_key = (epoch // bucket_seconds) * bucket_seconds

            if bucket_key not in buckets:
                buckets[bucket_key] = {
                    "timestamp": datetime.fromtimestamp(bucket_key, tz=timezone.utc),
                    "sum": level,
                    "min": level,
                    "max": level,
                    "count": 1,
                    "location_id": loc_id,
                    "focus_session_id": sess_id
                }
            else:
                b = buckets[bucket_key]
                b["sum"] += level
                b["min"] = min(b["min"], level)
                b["max"] = max(b["max"], level)
                b["count"] += 1
                if loc_id:
                    b["location_id"] = loc_id
                if sess_id:
                    b["focus_session_id"] = sess_id

        result = []
        for key in sorted(buckets.keys()):
            b = buckets[key]
            result.append(
                TimelineBucket(
                    timestamp=b["timestamp"],
                    noise_level=round(b["sum"] / b["count"], 1),
                    noise_min=round(b["min"], 1),
                    noise_max=round(b["max"], 1),
                    sample_count=b["count"],
                    location_id=b["location_id"],
                    focus_session_id=b["focus_session_id"]
                )
            )
        return result

from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.models.setting import Setting
from app.models.location import Location
from app.models.focus_session import FocusSession
from app.models.noise_sample import NoiseSample
from app.models.interruption import Interruption
from app.models.daily_statistic import DailyStatistic
from app.schemas.setting import SettingsResponse, SettingsUpdate
from app.core.math import clamp, calculate_focus_score, calculate_stability


DEFAULT_SETTINGS: Dict[str, str] = {
    "ambient_monitoring": "true",
    "sampling_interval": "10",
    "interruption_threshold": "18",
    "default_activity": "Work"
}


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_settings(self) -> SettingsResponse:
        current = {s.key: s.value for s in self.db.scalars(select(Setting)).all()}
        for k, v in DEFAULT_SETTINGS.items():
            if k not in current:
                setting = Setting(key=k, value=v)
                self.db.add(setting)
                current[k] = v
        self.db.commit()

        return SettingsResponse(
            ambient_monitoring=(current["ambient_monitoring"].lower() == "true"),
            sampling_interval=int(current["sampling_interval"]),
            interruption_threshold=int(current["interruption_threshold"]),
            default_activity=current["default_activity"]
        )

    def update_settings(self, patch: SettingsUpdate) -> SettingsResponse:
        updates = patch.model_dump(exclude_unset=True)
        for key, val in updates.items():
            db_setting = self.db.get(Setting, key)
            val_str = str(val).lower() if isinstance(val, bool) else str(val)
            if db_setting:
                db_setting.value = val_str
            else:
                self.db.add(Setting(key=key, value=val_str))
        self.db.commit()
        return self.get_settings()

    def delete_all_data(self) -> Dict[str, bool]:
        self.db.execute(delete(Interruption))
        self.db.execute(delete(NoiseSample))
        self.db.execute(delete(FocusSession))
        self.db.execute(delete(DailyStatistic))
        self.db.execute(delete(Location))
        self.db.execute(delete(Setting))

        for k, v in DEFAULT_SETTINGS.items():
            self.db.add(Setting(key=k, value=v))
        self.db.commit()
        return {"deleted": True}

    def seed_demo_data(self, days: int = 7) -> Dict[str, Any]:
        day_count = days if days in (7, 14, 30) else 7
        self.delete_all_data()

        # 1. Create standard locations
        location_names = ["Desk", "Library", "Home"]
        locations = []
        for name in location_names:
            loc = Location(name=name)
            self.db.add(loc)
            locations.append(loc)
        self.db.commit()
        for loc in locations:
            self.db.refresh(loc)

        now = datetime.now(timezone.utc)

        # 2. Populate historical data per day
        for day_offset in range(day_count - 1, -1, -1):
            date_base = now - timedelta(days=day_offset)
            day_midnight = datetime(date_base.year, date_base.month, date_base.day, tzinfo=timezone.utc)
            loc = locations[day_offset % len(locations)]

            # Generate hourly samples from 7 AM to 10 PM
            for hour in range(7, 22):
                minute = 15 + ((day_offset * 7 + hour * 3) % 35)
                sample_time = day_midnight + timedelta(hours=hour, minutes=minute)

                morning = (8 <= hour <= 11)
                afternoon = (14 <= hour <= 17)
                variation = ((day_offset * 11 + hour * 5) % 13) - 6
                base_level = 22 if morning else 62 if afternoon else 38
                noise_lvl = round(clamp(base_level + variation, 8.0, 92.0), 1)

                sample = NoiseSample(
                    recorded_at=sample_time,
                    noise_level=noise_lvl,
                    location_id=loc.id
                )
                self.db.add(sample)

            # Generate a focus session for the day
            sess_start = day_midnight + timedelta(hours=9 + (day_offset % 3), minutes=10)
            duration_mins = 45.0 + ((day_offset * 13) % 45)
            sess_end = sess_start + timedelta(minutes=duration_mins)
            activities = ["Coding", "Writing", "Reading", "Deep Work"]
            act = activities[day_offset % len(activities)]

            focus_sess = FocusSession(
                started_at=sess_start,
                ended_at=sess_end,
                location_id=loc.id,
                activity=act,
                focus_score=round(clamp(88 - (day_offset % 5) * 4 + (4 if loc.name == "Desk" else 0), 55, 96)),
                average_noise=26.0 if loc.name == "Desk" else 36.0,
                stability_score=85.0,
                interruption_count=day_offset % 3
            )
            self.db.add(focus_sess)
            self.db.commit()
            self.db.refresh(focus_sess)

            # Generate interruptions if any
            for i in range(focus_sess.interruption_count):
                int_start = sess_start + timedelta(minutes=15 + i * 15)
                interruption = Interruption(
                    focus_session_id=focus_sess.id,
                    started_at=int_start,
                    duration_seconds=20.0 + i * 15.0,
                    intensity=18.0 + i * 5.0,
                    peak_level=55.0 + i * 10.0
                )
                self.db.add(interruption)

        self.db.commit()
        return {"seeded_days": day_count, "status": "success"}

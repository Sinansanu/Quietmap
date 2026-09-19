from typing import List, Dict, Optional, Any
from datetime import datetime, date, timezone, timedelta
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import Session
from app.models.location import Location
from app.models.focus_session import FocusSession
from app.models.noise_sample import NoiseSample
from app.models.interruption import Interruption
from app.models.daily_statistic import DailyStatistic
from app.schemas.location import LocationMapMetrics
from app.schemas.insights import InsightsResponse, QuietestHourInfo, BestLocationInfo, VariablePeriodInfo
from app.schemas.weekly import WeeklyResponse, WeeklyDay, BestDayInfo
from app.core.math import format_hour_window


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_focus_map_metrics(self) -> List[LocationMapMetrics]:
        locations = self.db.scalars(select(Location).order_by(Location.created_at.asc())).all()
        if not locations:
            return []

        session_stmt = (
            select(
                FocusSession.location_id,
                func.count(FocusSession.id).label("session_count"),
                func.avg(FocusSession.focus_score).label("avg_score")
            )
            .where(
                and_(
                    FocusSession.ended_at.is_not(None),
                    FocusSession.location_id.is_not(None)
                )
            )
            .group_by(FocusSession.location_id)
        )
        session_data = {
            row[0]: {"count": row[1], "score": round(row[2]) if row[2] is not None else None}
            for row in self.db.execute(session_stmt).all()
        }

        noise_stmt = (
            select(
                NoiseSample.location_id,
                func.avg(NoiseSample.noise_level).label("avg_noise"),
                func.count(NoiseSample.id).label("sample_count")
            )
            .where(NoiseSample.location_id.is_not(None))
            .group_by(NoiseSample.location_id)
        )
        noise_data = {
            row[0]: {"avg_noise": round(row[1], 1) if row[1] is not None else None, "count": row[2]}
            for row in self.db.execute(noise_stmt).all()
        }

        interruption_stmt = (
            select(
                FocusSession.location_id,
                func.count(Interruption.id).label("interruption_count")
            )
            .join(FocusSession, Interruption.focus_session_id == FocusSession.id)
            .where(FocusSession.location_id.is_not(None))
            .group_by(FocusSession.location_id)
        )
        interruption_data = {
            row[0]: row[1]
            for row in self.db.execute(interruption_stmt).all()
        }

        best_times: Dict[str, str] = {}
        for loc in locations:
            samples = self.db.scalars(
                select(NoiseSample)
                .where(NoiseSample.location_id == loc.id)
            ).all()
            if samples:
                hour_buckets: Dict[int, List[float]] = {}
                for s in samples:
                    dt = s.recorded_at if s.recorded_at.tzinfo else s.recorded_at.replace(tzinfo=timezone.utc)
                    hour_buckets.setdefault(dt.hour, []).append(s.noise_level)
                if hour_buckets:
                    best_hour = min(hour_buckets.keys(), key=lambda h: sum(hour_buckets[h]) / len(hour_buckets[h]))
                    best_times[loc.id] = format_hour_window(best_hour, 2)

        results = []
        for loc in locations:
            s_info = session_data.get(loc.id, {"count": 0, "score": None})
            n_info = noise_data.get(loc.id, {"avg_noise": None, "count": 0})
            i_count = interruption_data.get(loc.id, 0)
            best_time = best_times.get(loc.id)

            created_at = loc.created_at if loc.created_at.tzinfo else loc.created_at.replace(tzinfo=timezone.utc)
            results.append(
                LocationMapMetrics(
                    id=loc.id,
                    name=loc.name,
                    sessions=s_info["count"],
                    focus_score=s_info["score"],
                    average_noise=n_info["avg_noise"],
                    interruptions=i_count,
                    best_time=best_time,
                    created_at=created_at
                )
            )

        results.sort(key=lambda x: (x.focus_score is None, -(x.focus_score or 0), -x.sessions))
        return results

    def get_insights(self) -> InsightsResponse:
        total_samples = self.db.scalar(select(func.count(NoiseSample.id))) or 0
        total_sessions = self.db.scalar(
            select(func.count(FocusSession.id)).where(FocusSession.ended_at.is_not(None))
        ) or 0

        if total_samples < 15 or total_sessions < 2:
            return InsightsResponse(
                ready=False,
                sample_count=total_samples,
                session_count=total_sessions,
                reason="QuietMap requires at least 15 noise measurements and 2 completed focus sessions to detect local patterns."
            )

        samples = self.db.scalars(select(NoiseSample)).all()
        hour_map: Dict[int, List[float]] = {}
        for s in samples:
            dt = s.recorded_at if s.recorded_at.tzinfo else s.recorded_at.replace(tzinfo=timezone.utc)
            hour_map.setdefault(dt.hour, []).append(s.noise_level)

        quietest_info = None
        variable_info = None

        if hour_map:
            candidate_hours = [h for h, levels in hour_map.items() if len(levels) >= 2] or list(hour_map.keys())
            if candidate_hours:
                quietest_hour = min(candidate_hours, key=lambda h: sum(hour_map[h]) / len(hour_map[h]))
                avg_noise = round(sum(hour_map[quietest_hour]) / len(hour_map[quietest_hour]), 1)
                quietest_info = QuietestHourInfo(
                    hour=quietest_hour,
                    label=format_hour_window(quietest_hour, 2),
                    average_noise=avg_noise
                )

                def calc_variance(levels: List[float]) -> float:
                    if len(levels) < 2:
                        return 0.0
                    avg = sum(levels) / len(levels)
                    return sum((x - avg) ** 2 for x in levels) / len(levels)

                var_hours = [h for h in candidate_hours if len(hour_map[h]) >= 2]
                if var_hours:
                    variable_hour = max(var_hours, key=lambda h: calc_variance(hour_map[h]))
                    var_val = round(calc_variance(hour_map[variable_hour]), 1)
                    variable_info = VariablePeriodInfo(
                        hour=variable_hour,
                        label=format_hour_window(variable_hour, 2),
                        variance=var_val
                    )

        best_loc_stmt = (
            select(
                Location.id,
                Location.name,
                func.avg(FocusSession.focus_score).label("avg_score"),
                func.count(FocusSession.id).label("session_count")
            )
            .join(FocusSession, FocusSession.location_id == Location.id)
            .where(FocusSession.focus_score.is_not(None))
            .group_by(Location.id, Location.name)
            .order_by(desc("avg_score"), desc("session_count"))
            .limit(1)
        )
        best_loc_row = self.db.execute(best_loc_stmt).first()
        best_location_info = None
        if best_loc_row and best_loc_row[2] is not None:
            best_location_info = BestLocationInfo(
                id=best_loc_row[0],
                name=best_loc_row[1],
                focus_score=int(round(best_loc_row[2])),
                session_count=int(best_loc_row[3])
            )

        is_ready = bool(quietest_info and best_location_info)
        return InsightsResponse(
            ready=is_ready,
            sample_count=total_samples,
            session_count=total_sessions,
            reason=None if is_ready else "Need more session observations across multiple hours.",
            quietest=quietest_info,
            best_location=best_location_info,
            variable_period=variable_info
        )

    def get_weekly_report(self) -> WeeklyResponse:
        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=6)).date()

        day_metrics: Dict[date, Dict[str, Any]] = {}
        for i in range(7):
            d = start_date + timedelta(days=i)
            day_metrics[d] = {
                "noise_levels": [],
                "focus_scores": [],
                "interruptions": 0,
                "focus_minutes": 0.0
            }

        start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)
        samples = self.db.scalars(
            select(NoiseSample).where(NoiseSample.recorded_at >= start_dt)
        ).all()
        for s in samples:
            dt = s.recorded_at if s.recorded_at.tzinfo else s.recorded_at.replace(tzinfo=timezone.utc)
            d = dt.date()
            if d in day_metrics:
                day_metrics[d]["noise_levels"].append(s.noise_level)

        sessions = self.db.scalars(
            select(FocusSession).where(
                and_(FocusSession.started_at >= start_dt, FocusSession.ended_at.is_not(None))
            )
        ).all()

        total_interruptions = 0
        longest_minutes = 0.0
        total_focus_minutes = 0.0

        for sess in sessions:
            s_start = sess.started_at if sess.started_at.tzinfo else sess.started_at.replace(tzinfo=timezone.utc)
            s_end = sess.ended_at if sess.ended_at.tzinfo else sess.ended_at.replace(tzinfo=timezone.utc)
            d = s_start.date()
            duration = max(0.0, (s_end - s_start).total_seconds() / 60.0)
            total_focus_minutes += duration
            longest_minutes = max(longest_minutes, duration)
            if d in day_metrics:
                if sess.focus_score is not None:
                    day_metrics[d]["focus_scores"].append(sess.focus_score)
                day_metrics[d]["interruptions"] += sess.interruption_count
                day_metrics[d]["focus_minutes"] += duration
            total_interruptions += sess.interruption_count

        days_list: List[WeeklyDay] = []
        best_day_info: Optional[BestDayInfo] = None
        best_score = -1

        for d in sorted(day_metrics.keys()):
            info = day_metrics[d]
            avg_noise = round(sum(info["noise_levels"]) / len(info["noise_levels"]), 1) if info["noise_levels"] else None
            avg_score = round(sum(info["focus_scores"]) / len(info["focus_scores"])) if info["focus_scores"] else None

            day_name = d.strftime("%A")
            days_list.append(
                WeeklyDay(
                    date=d.isoformat(),
                    day_name=day_name[:3],
                    average_noise=avg_noise,
                    focus_score=avg_score,
                    interruptions=info["interruptions"],
                    focus_minutes=round(info["focus_minutes"], 1)
                )
            )

            if avg_score is not None and avg_score > best_score:
                best_score = avg_score
                best_day_info = BestDayInfo(
                    date=d.isoformat(),
                    day_name=day_name,
                    focus_score=avg_score
                )

        return WeeklyResponse(
            days=days_list,
            best_day=best_day_info,
            total_interruptions=total_interruptions,
            longest_session_minutes=round(longest_minutes, 1),
            total_focus_minutes=round(total_focus_minutes, 1)
        )

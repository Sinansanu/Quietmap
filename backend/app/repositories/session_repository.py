from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.focus_session import FocusSession


class SessionRepository:
    def __init__(self, db: Session, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id

    def get_active(self) -> Optional[FocusSession]:
        stmt = select(FocusSession).where(FocusSession.ended_at.is_(None))
        if self.user_id:
            stmt = stmt.where(FocusSession.user_id == self.user_id)
        stmt = stmt.order_by(FocusSession.started_at.desc())
        return self.db.scalars(stmt).first()

    def get_by_id(self, session_id: str) -> Optional[FocusSession]:
        if not self.user_id:
            return self.db.get(FocusSession, session_id)
        stmt = select(FocusSession).where(
            and_(FocusSession.id == session_id, FocusSession.user_id == self.user_id)
        )
        return self.db.scalars(stmt).first()

    def create(self, location_id: Optional[str], activity: Optional[str], started_at: Optional[datetime] = None) -> FocusSession:
        session = FocusSession(
            user_id=self.user_id,
            location_id=location_id,
            activity=activity,
            started_at=started_at or datetime.now(timezone.utc)
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def end(
        self,
        session_id: str,
        ended_at: datetime,
        focus_score: int,
        average_noise: float,
        stability_score: float,
        interruption_count: int
    ) -> Optional[FocusSession]:
        session = self.get_by_id(session_id)
        if not session or session.ended_at is not None:
            return None
        session.ended_at = ended_at
        session.focus_score = focus_score
        session.average_noise = average_noise
        session.stability_score = stability_score
        session.interruption_count = interruption_count
        self.db.commit()
        self.db.refresh(session)
        return session

    def auto_close_stale_sessions(self, max_hours: int = 12) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_hours)
        stmt = select(FocusSession).where(
            and_(FocusSession.ended_at.is_(None), FocusSession.started_at < cutoff)
        )
        stale_sessions = list(self.db.scalars(stmt).all())
        for s in stale_sessions:
            s.ended_at = s.started_at + timedelta(minutes=45)
            s.focus_score = 50
        if stale_sessions:
            self.db.commit()
        return len(stale_sessions)

    def list_history(self, limit: int = 50) -> List[FocusSession]:
        stmt = select(FocusSession).where(FocusSession.ended_at.is_not(None))
        if self.user_id:
            stmt = stmt.where(FocusSession.user_id == self.user_id)
        stmt = stmt.order_by(FocusSession.ended_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())

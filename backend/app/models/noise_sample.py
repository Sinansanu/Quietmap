import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.db.base import Base

if TYPE_CHECKING:
    from .user import User
    from .location import Location
    from .focus_session import FocusSession


class NoiseSample(Base):
    __tablename__ = "noise_samples"
    __table_args__ = (
        CheckConstraint(
            "noise_level >= 0.0 AND noise_level <= 100.0",
            name="check_noise_level_range"
        ),
        Index("ix_noise_samples_location_time", "location_id", "recorded_at"),
        Index("ix_noise_samples_session_time", "focus_session_id", "recorded_at"),
        Index("ix_noise_samples_user_time", "user_id", "recorded_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    noise_level: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    focus_session_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("focus_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="noise_samples"
    )
    location: Mapped[Optional["Location"]] = relationship(
        "Location",
        back_populates="noise_samples"
    )
    focus_session: Mapped[Optional["FocusSession"]] = relationship(
        "FocusSession",
        back_populates="noise_samples"
    )

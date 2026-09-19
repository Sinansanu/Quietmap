import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.db.base import Base

if TYPE_CHECKING:
    from .location import Location
    from .noise_sample import NoiseSample
    from .interruption import Interruption


class FocusSession(Base):
    __tablename__ = "focus_sessions"
    __table_args__ = (
        CheckConstraint(
            "(focus_score IS NULL) OR (focus_score >= 0 AND focus_score <= 100)",
            name="check_focus_score_range"
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    activity: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True
    )
    focus_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    average_noise: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    stability_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    interruption_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    location: Mapped[Optional["Location"]] = relationship(
        "Location",
        back_populates="focus_sessions"
    )
    noise_samples: Mapped[List["NoiseSample"]] = relationship(
        "NoiseSample",
        back_populates="focus_session"
    )
    interruptions: Mapped[List["Interruption"]] = relationship(
        "Interruption",
        back_populates="focus_session",
        cascade="all, delete-orphan"
    )

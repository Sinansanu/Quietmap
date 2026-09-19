import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.db.base import Base

if TYPE_CHECKING:
    from .focus_session import FocusSession


class Interruption(Base):
    __tablename__ = "interruptions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    focus_session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("focus_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    duration_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    intensity: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    peak_level: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    focus_session: Mapped["FocusSession"] = relationship(
        "FocusSession",
        back_populates="interruptions"
    )

import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.db.base import Base

if TYPE_CHECKING:
    from .focus_session import FocusSession
    from .noise_sample import NoiseSample


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    focus_sessions: Mapped[List["FocusSession"]] = relationship(
        "FocusSession",
        back_populates="location",
        cascade="all, delete-orphan"
    )
    noise_samples: Mapped[List["NoiseSample"]] = relationship(
        "NoiseSample",
        back_populates="location"
    )

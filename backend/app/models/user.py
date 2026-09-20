import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.db.base import Base

if TYPE_CHECKING:
    from .location import Location
    from .focus_session import FocusSession
    from .noise_sample import NoiseSample


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(128),
        nullable=False
    )
    timezone: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True
    )
    timezone_mode: Mapped[str] = mapped_column(
        String(16),
        default="auto",
        server_default="auto",
        nullable=False
    )
    theme_preference: Mapped[str] = mapped_column(
        String(16),
        default="system",
        server_default="system",
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True
    )

    locations: Mapped[List["Location"]] = relationship(
        "Location",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    focus_sessions: Mapped[List["FocusSession"]] = relationship(
        "FocusSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    noise_samples: Mapped[List["NoiseSample"]] = relationship(
        "NoiseSample",
        back_populates="user",
        cascade="all, delete-orphan"
    )

from typing import Optional
from sqlalchemy import String, Integer, Float, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date, datetime, timezone
from app.db.base import Base


class DailyStatistic(Base):
    __tablename__ = "daily_statistics"

    date: Mapped[date] = mapped_column(
        Date,
        primary_key=True
    )
    average_noise: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    quietest_hour: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    quietest_period_label: Mapped[Optional[str]] = mapped_column(
        String(32),
        nullable=True
    )
    interruption_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    average_focus_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    total_focus_minutes: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )
    sample_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

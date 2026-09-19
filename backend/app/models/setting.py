import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Setting(Base):
    __tablename__ = "settings"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_settings_user_key"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    key: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True
    )
    value: Mapped[str] = mapped_column(
        String(256),
        nullable=False
    )


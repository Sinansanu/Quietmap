from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func
from app.models.user import User
from app.models.location import Location
from app.models.focus_session import FocusSession
from app.models.noise_sample import NoiseSample
from app.models.setting import Setting


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        normalized = email.strip().lower()
        stmt = select(User).where(func.lower(User.email) == normalized)
        return self.db.scalars(stmt).first()

    def count(self) -> int:
        return self.db.scalar(select(func.count(User.id))) or 0

    def create(self, email: str, hashed_password: str, full_name: str) -> User:
        user = User(
            email=email.strip().lower(),
            hashed_password=hashed_password,
            full_name=full_name.strip()
        )
        self.db.add(user)
        self.db.flush()
        return user

    def update_profile(
        self,
        user: User,
        full_name: Optional[str] = None,
        timezone: Optional[str] = None,
        timezone_mode: Optional[str] = None,
        theme_preference: Optional[str] = None
    ) -> User:
        if full_name is not None:
            user.full_name = full_name.strip()
        if timezone is not None:
            user.timezone = timezone.strip() if timezone else None
        if timezone_mode is not None:
            user.timezone_mode = timezone_mode.strip().lower()
        if theme_preference is not None:
            user.theme_preference = theme_preference.strip().lower()
        self.db.flush()
        return user

    def claim_legacy_data_if_first_user(self, user_id: str) -> int:
        """
        Atomically claim any unassigned legacy data (where user_id IS NULL)
        if and only if this user is the sole registered user in the database.
        Must be called within an active transaction.
        """
        total_users = self.db.scalar(select(func.count(User.id))) or 0
        if total_users != 1:
            return 0

        claimed_locations = self.db.execute(
            update(Location)
            .where(Location.user_id.is_(None))
            .values(user_id=user_id)
        ).rowcount or 0

        claimed_sessions = self.db.execute(
            update(FocusSession)
            .where(FocusSession.user_id.is_(None))
            .values(user_id=user_id)
        ).rowcount or 0

        claimed_samples = self.db.execute(
            update(NoiseSample)
            .where(NoiseSample.user_id.is_(None))
            .values(user_id=user_id)
        ).rowcount or 0

        claimed_settings = self.db.execute(
            update(Setting)
            .where(Setting.user_id.is_(None))
            .values(user_id=user_id)
        ).rowcount or 0

        return claimed_locations + claimed_sessions + claimed_samples + claimed_settings

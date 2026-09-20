from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.profile import UserProfileResponse, UserProfileUpdate


class ProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def get_profile(self, user: User) -> UserProfileResponse:
        return UserProfileResponse.model_validate(user)

    def update_profile(self, user: User, payload: UserProfileUpdate) -> UserProfileResponse:
        changed = False

        new_full_name = payload.full_name
        new_timezone = payload.timezone
        new_timezone_mode = payload.timezone_mode
        new_theme_pref = payload.theme_preference

        # 1. Full name
        if new_full_name is not None and new_full_name != user.full_name:
            user.full_name = new_full_name
            changed = True

        # 2. Timezone mode
        if new_timezone_mode is not None and new_timezone_mode != user.timezone_mode:
            user.timezone_mode = new_timezone_mode
            changed = True

        # 3. Timezone
        if new_timezone is not None and new_timezone != user.timezone:
            user.timezone = new_timezone
            changed = True

        # 4. Theme preference
        if new_theme_pref is not None and new_theme_pref != user.theme_preference:
            user.theme_preference = new_theme_pref
            changed = True

        if changed:
            user.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(user)

        return UserProfileResponse.model_validate(user)

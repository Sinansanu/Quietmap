from typing import Optional
from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegister, UserLogin, UserResponse, AuthSuccessResponse, TokenResponse
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token
)
from app.config import settings


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def _set_auth_cookie(self, response: Response, token: str) -> None:
        max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=max_age_seconds,
            expires=max_age_seconds,
            samesite="lax",
            secure=(settings.ENVIRONMENT == "production"),
            path="/"
        )

    def register(self, payload: UserRegister, response: Response) -> AuthSuccessResponse:
        validate_password_strength(payload.password)

        existing = self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        hashed = hash_password(payload.password)

        # Atomic user creation + first-user legacy claim
        try:
            user = self.user_repo.create(
                email=payload.email,
                hashed_password=hashed,
                full_name=payload.full_name
            )
            self.user_repo.claim_legacy_data_if_first_user(user.id)
            self.db.commit()
            self.db.refresh(user)
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during account registration."
            )

        token = create_access_token(subject=user.id)
        self._set_auth_cookie(response, token)

        return AuthSuccessResponse(
            status="authenticated",
            user=UserResponse.model_validate(user)
        )

    def login(self, payload: UserLogin, response: Response) -> AuthSuccessResponse:
        user = self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated."
            )

        token = create_access_token(subject=user.id)
        self._set_auth_cookie(response, token)

        return AuthSuccessResponse(
            status="authenticated",
            user=UserResponse.model_validate(user)
        )

    def issue_token(self, payload: UserLogin) -> TokenResponse:
        """Issue access token for automated tests and API tools without requiring cookie support."""
        user = self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated."
            )

        token = create_access_token(subject=user.id)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    def logout(self, response: Response) -> dict:
        response.delete_cookie(key="access_token", path="/", samesite="lax")
        return {"status": "logged_out", "message": "Successfully logged out"}

    def get_me(self, user: User) -> UserResponse:
        return UserResponse.model_validate(user)

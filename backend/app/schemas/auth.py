import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserRegister(BaseModel):
    email: str = Field(..., max_length=255, description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 chars, letters & digits)")
    full_name: Optional[str] = Field(None, max_length=128, description="Optional display name")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean


class UserLogin(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime


class AuthSuccessResponse(BaseModel):
    """Returned to browser on login/register. Access token is set strictly via HttpOnly cookie."""
    status: str = "authenticated"
    user: UserResponse


class TokenResponse(BaseModel):
    """Returned to API tools and automated test clients."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

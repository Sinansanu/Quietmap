import zoneinfo
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    timezone: Optional[str] = None
    timezone_mode: str = "auto"
    theme_preference: str = "system"
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100, description="Full display name (2-100 characters)")
    timezone: Optional[str] = Field(None, max_length=64, description="Standard IANA timezone identifier (e.g., 'America/New_York')")
    timezone_mode: Optional[str] = Field(None, description="Timezone mode: 'auto' or 'manual'")
    theme_preference: Optional[str] = Field(None, description="Theme preference: 'light', 'dark', or 'system'")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if len(clean) < 2 or len(clean) > 100:
                raise ValueError("Full name must be between 2 and 100 characters.")
            return clean
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean:
                return None
            try:
                zoneinfo.ZoneInfo(clean)
            except Exception:
                raise ValueError(f"Invalid IANA timezone identifier: '{clean}'.")
            return clean
        return v

    @field_validator("timezone_mode")
    @classmethod
    def validate_timezone_mode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in ("auto", "manual"):
                raise ValueError("Timezone mode must be either 'auto' or 'manual'.")
            return clean
        return v

    @field_validator("theme_preference")
    @classmethod
    def validate_theme_preference(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in ("light", "dark", "system"):
                raise ValueError("Theme preference must be 'light', 'dark', or 'system'.")
            return clean
        return v

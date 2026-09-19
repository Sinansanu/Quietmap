from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class NoiseSampleCreate(BaseModel):
    recorded_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the sample"
    )
    noise_level: float = Field(..., ge=0.0, le=100.0, description="Normalized relative noise level (0-100)")
    location_id: Optional[str] = Field(None, description="Optional location ID context")
    focus_session_id: Optional[str] = Field(None, description="Optional active session ID context")


class NoiseSampleResponse(BaseModel):
    id: str
    recorded_at: datetime
    noise_level: float
    location_id: Optional[str] = None
    focus_session_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LiveLevelResponse(BaseModel):
    recorded_at: datetime
    noise_level: float
    label: str

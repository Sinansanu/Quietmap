from typing import Optional
from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    ambient_monitoring: bool = True
    sampling_interval: int = Field(10, description="Sampling interval in seconds")
    interruption_threshold: int = Field(18, description="Interruption rise threshold")
    default_activity: str = Field("Work", description="Default session activity")


class SettingsUpdate(BaseModel):
    ambient_monitoring: Optional[bool] = None
    sampling_interval: Optional[int] = Field(None, ge=5, le=120)
    interruption_threshold: Optional[int] = Field(None, ge=5, le=50)
    default_activity: Optional[str] = Field(None, max_length=64)

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FocusSessionStart(BaseModel):
    location_id: Optional[str] = Field(None, description="Associated location ID")
    activity: Optional[str] = Field("Work", max_length=64, description="Focus session activity description")


class FocusSessionResponse(BaseModel):
    id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    location_id: Optional[str] = None
    activity: Optional[str] = None
    focus_score: Optional[int] = None
    average_noise: Optional[float] = None
    stability_score: Optional[float] = None
    interruption_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FocusSessionEndResponse(BaseModel):
    id: str
    started_at: datetime
    ended_at: datetime
    duration_minutes: float
    focus_score: int
    average_noise: float
    stability_score: float
    interruptions: int

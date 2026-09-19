from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=64, description="Unique workspace label")


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64, description="New workspace label")


class LocationResponse(LocationBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LocationMapMetrics(BaseModel):
    id: str
    name: str
    sessions: int
    focus_score: Optional[int] = None
    average_noise: Optional[float] = None
    interruptions: int
    best_time: Optional[str] = None
    created_at: datetime

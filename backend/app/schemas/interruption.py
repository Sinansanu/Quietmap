from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InterruptionResponse(BaseModel):
    id: str
    focus_session_id: str
    started_at: datetime
    duration_seconds: float
    intensity: float
    peak_level: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

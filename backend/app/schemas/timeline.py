from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .location import LocationResponse


class TimelineBucket(BaseModel):
    timestamp: datetime
    noise_level: float
    noise_min: float
    noise_max: float
    sample_count: int
    location_id: Optional[str] = None
    focus_session_id: Optional[str] = None


class TimelineResponse(BaseModel):
    range: str
    samples: List[TimelineBucket]
    locations: List[LocationResponse]

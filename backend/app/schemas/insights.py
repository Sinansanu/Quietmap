from typing import Optional
from pydantic import BaseModel


class QuietestHourInfo(BaseModel):
    hour: int
    label: str
    average_noise: float


class BestLocationInfo(BaseModel):
    id: str
    name: str
    focus_score: int
    session_count: int


class VariablePeriodInfo(BaseModel):
    hour: int
    label: str
    variance: float


class InsightsResponse(BaseModel):
    ready: bool
    sample_count: int
    session_count: int
    reason: Optional[str] = None
    quietest: Optional[QuietestHourInfo] = None
    best_location: Optional[BestLocationInfo] = None
    variable_period: Optional[VariablePeriodInfo] = None

from typing import List, Optional
from pydantic import BaseModel


class WeeklyDay(BaseModel):
    date: str
    day_name: str
    average_noise: Optional[float] = None
    focus_score: Optional[int] = None
    interruptions: int = 0
    focus_minutes: float = 0.0


class BestDayInfo(BaseModel):
    date: str
    day_name: str
    focus_score: int


class WeeklyResponse(BaseModel):
    days: List[WeeklyDay]
    best_day: Optional[BestDayInfo] = None
    total_interruptions: int = 0
    longest_session_minutes: float = 0.0
    total_focus_minutes: float = 0.0

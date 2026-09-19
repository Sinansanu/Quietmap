from typing import Optional, List
from pydantic import BaseModel
from .noise import LiveLevelResponse
from .focus_session import FocusSessionResponse
from .location import LocationResponse
from .setting import SettingsResponse


class DashboardResponse(BaseModel):
    last_sample: Optional[LiveLevelResponse] = None
    active_session: Optional[FocusSessionResponse] = None
    completed_today: int = 0
    interruptions_today: int = 0
    average_score: Optional[int] = None
    locations: List[LocationResponse] = []
    settings: SettingsResponse

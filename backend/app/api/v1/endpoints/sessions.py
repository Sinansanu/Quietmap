from typing import Optional, List
from fastapi import APIRouter, Depends, status
from app.schemas.focus_session import FocusSessionStart, FocusSessionResponse, FocusSessionEndResponse
from app.services.focus_session_service import FocusSessionService
from app.api.dependencies import get_session_service

router = APIRouter(prefix="/sessions", tags=["Focus Sessions"])


@router.get("/active", response_model=Optional[FocusSessionResponse])
def get_active_session(service: FocusSessionService = Depends(get_session_service)):
    return service.get_active()


@router.post("/start", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    payload: FocusSessionStart,
    service: FocusSessionService = Depends(get_session_service)
):
    return service.start_session(payload)


@router.post("/{session_id}/end", response_model=FocusSessionEndResponse)
def end_session(
    session_id: str,
    service: FocusSessionService = Depends(get_session_service)
):
    return service.end_session(session_id)


@router.get("/history", response_model=List[FocusSessionResponse])
def list_history(
    limit: int = 50,
    service: FocusSessionService = Depends(get_session_service)
):
    return service.list_history(limit=limit)

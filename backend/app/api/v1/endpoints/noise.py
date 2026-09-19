from typing import Optional
from fastapi import APIRouter, Depends, status
from app.schemas.noise import NoiseSampleCreate, NoiseSampleResponse, LiveLevelResponse
from app.services.noise_monitoring_service import NoiseMonitoringService
from app.services.settings_service import SettingsService
from app.api.dependencies import get_noise_service, get_settings_service

router = APIRouter(prefix="/noise", tags=["Noise Telemetry"])


@router.post("/sample", response_model=NoiseSampleResponse, status_code=status.HTTP_201_CREATED)
def record_noise_sample(
    payload: NoiseSampleCreate,
    noise_service: NoiseMonitoringService = Depends(get_noise_service),
    settings_service: SettingsService = Depends(get_settings_service)
):
    settings = settings_service.get_settings()
    return noise_service.record_sample(
        payload=payload,
        interruption_threshold=float(settings.interruption_threshold),
        sampling_interval_seconds=settings.sampling_interval
    )


@router.get("/latest", response_model=Optional[LiveLevelResponse])
def get_latest_level(noise_service: NoiseMonitoringService = Depends(get_noise_service)):
    return noise_service.get_latest_level()

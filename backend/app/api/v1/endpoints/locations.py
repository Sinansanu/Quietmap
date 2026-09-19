from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
from app.services.location_service import LocationService
from app.api.dependencies import get_location_service

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=List[LocationResponse])
def list_locations(service: LocationService = Depends(get_location_service)):
    return service.list_locations()


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    service: LocationService = Depends(get_location_service)
):
    return service.create_location(payload)


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: str,
    service: LocationService = Depends(get_location_service)
):
    return service.get_location(location_id)


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: str,
    payload: LocationUpdate,
    service: LocationService = Depends(get_location_service)
):
    return service.update_location(location_id, payload)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: str,
    service: LocationService = Depends(get_location_service)
):
    service.delete_location(location_id)

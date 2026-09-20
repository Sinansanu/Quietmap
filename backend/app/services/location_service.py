from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.location_repository import LocationRepository
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse


class LocationService:
    def __init__(self, db: Session, user_id: Optional[str] = None):
        self.repo = LocationRepository(db, user_id=user_id)

    def list_locations(self) -> List[LocationResponse]:
        locations = self.repo.get_all()
        return [LocationResponse.model_validate(loc) for loc in locations]

    def get_location(self, location_id: str) -> LocationResponse:
        location = self.repo.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Location with ID {location_id} not found."
            )
        return LocationResponse.model_validate(location)

    def create_location(self, payload: LocationCreate) -> LocationResponse:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="A non-empty location name is required."
            )
        existing = self.repo.get_by_name(clean_name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A location named '{clean_name}' already exists in your workspace."
            )
        location = self.repo.create(clean_name)
        return LocationResponse.model_validate(location)

    def update_location(self, location_id: str, payload: LocationUpdate) -> LocationResponse:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="A non-empty location name is required."
            )
        existing = self.repo.get_by_name(clean_name)
        if existing and existing.id != location_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Another location named '{clean_name}' already exists in your workspace."
            )
        updated = self.repo.update(location_id, clean_name)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Location with ID {location_id} not found."
            )
        return LocationResponse.model_validate(updated)

    def delete_location(self, location_id: str) -> None:
        deleted = self.repo.delete(location_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Location with ID {location_id} not found."
            )

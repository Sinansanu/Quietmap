from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session
from app.models.location import Location


class LocationRepository:
    def __init__(self, db: Session, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id

    def get_all(self) -> List[Location]:
        stmt = select(Location)
        if self.user_id:
            stmt = stmt.where(Location.user_id == self.user_id)
        stmt = stmt.order_by(Location.created_at.asc())
        return list(self.db.scalars(stmt).all())

    def get_by_id(self, location_id: str) -> Optional[Location]:
        if not self.user_id:
            return self.db.get(Location, location_id)
        stmt = select(Location).where(
            and_(Location.id == location_id, Location.user_id == self.user_id)
        )
        return self.db.scalars(stmt).first()

    def get_by_name(self, name: str) -> Optional[Location]:
        stmt = select(Location).where(func.lower(Location.name) == name.strip().lower())
        if self.user_id:
            stmt = stmt.where(Location.user_id == self.user_id)
        return self.db.scalars(stmt).first()

    def create(self, name: str) -> Location:
        location = Location(name=name.strip(), user_id=self.user_id)
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def update(self, location_id: str, new_name: str) -> Optional[Location]:
        location = self.get_by_id(location_id)
        if not location:
            return None
        location.name = new_name.strip()
        self.db.commit()
        self.db.refresh(location)
        return location

    def delete(self, location_id: str) -> bool:
        location = self.get_by_id(location_id)
        if not location:
            return False
        self.db.delete(location)
        self.db.commit()
        return True

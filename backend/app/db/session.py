from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine_kwargs = {
    "pool_pre_ping": True,
    "echo": (settings.ENVIRONMENT == "debug"),
}

if not settings.DATABASE_URL.startswith("sqlite"):
    # Recycle connections after 5 minutes to prevent disconnects on idle pooler connections
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency injection yield for database session with automatic closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

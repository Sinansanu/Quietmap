import os
from typing import Generator
import pytest

# Ensure testing uses an in-memory database before importing application modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
import app.models  # Register all models
from app.main import app
from app.api.dependencies import get_current_user

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

TEST_USER_ID = "test-user-uuid-1234"


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    user = User(
        id=TEST_USER_ID,
        email="testuser@example.com",
        hashed_password="hashed_pw_placeholder",
        full_name="Test Runner",
        is_active=True
    )
    session.add(user)
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    return db_session.get(User, TEST_USER_ID)


@pytest.fixture(scope="function")
def client(db_session: Session, test_user: User) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

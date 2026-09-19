from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base
import app.models  # Ensure all models are registered on Base
from app.repositories.session_repository import SessionRepository
from app.services.settings_service import SettingsService
from app.api.v1.router import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Attempt database table creation and stale session cleanup
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            session_repo = SessionRepository(db)
            recovered = session_repo.auto_close_stale_sessions(max_hours=12)
            if recovered:
                print(f"[QuietMap API] Auto-closed {recovered} stale active sessions from prior run.")

            # Ensure default settings exist
            settings_service = SettingsService(db)
            settings_service.get_settings()
        finally:
            db.close()
    except Exception as e:
        print(f"[QuietMap API] Startup database check deferred (e.g. waiting for PostgreSQL): {e}")

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Privacy-first ambient noise and personal focus cartographer REST API.",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please consult backend logs."
        }
    )


app.include_router(api_v1_router)


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }

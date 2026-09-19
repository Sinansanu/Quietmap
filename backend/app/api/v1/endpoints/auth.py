from fastapi import APIRouter, Depends, Response, status
from app.schemas.auth import UserRegister, UserLogin, UserResponse, AuthSuccessResponse, TokenResponse
from app.models.user import User
from app.services.auth_service import AuthService
from app.api.dependencies import get_auth_service, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user account and set the secure HttpOnly session cookie."""
    return auth_service.register(payload=payload, response=response)


@router.post("/login", response_model=AuthSuccessResponse)
def login(
    payload: UserLogin,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Authenticate with email and password and set the secure HttpOnly session cookie."""
    return auth_service.login(payload=payload, response=response)


@router.post("/token", response_model=TokenResponse)
def issue_token(
    payload: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Issue a Bearer access token for automated tests and API tooling."""
    return auth_service.issue_token(payload=payload)


@router.post("/logout")
def logout(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Log out by deleting the HttpOnly access token cookie."""
    return auth_service.logout(response=response)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Retrieve profile information for the currently authenticated user."""
    return auth_service.get_me(user=current_user)

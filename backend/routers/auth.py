from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from models.auth import UserCredentials, AuthResponse
from db.database import get_supabase, get_supabase_async
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
async def register_user(user_data: UserCredentials, supabase: Client = Depends(get_supabase)):
    """
    Register a new user using Supabase Auth.
    """
    try:
        logger.info(f"Attempting to register user: {user_data.email}")
        res = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })

        # Check if user object exists and has an ID
        if res.user and res.user.id:
             logger.info(f"Successfully initiated registration for user: {res.user.email}")
             # In Supabase, sign_up might require email confirmation depending on settings
             # The user object is returned immediately, but might not be 'active' yet.
             # We return a success message prompting the user to check their email.
             return AuthResponse(
                 user_id=str(res.user.id),
                 email=res.user.email,
                 message="Registration successful. Please check your email to confirm your account."
             )
        elif res.user is None and res.session is None:
             # This case might happen if email confirmation is enabled and the user already exists but is unconfirmed.
             # Supabase might not return an error but also no user/session.
             logger.warning(f"Registration attempt for {user_data.email} returned no user or session, possibly due to pending confirmation or existing user.")
             # Consider checking if user exists first if needed
             # For now, return a generic message or potentially query the user status
             return AuthResponse(message="Registration process initiated. If you didn't receive a confirmation email, please check your spam folder or try logging in.")
        else:
            # Handle unexpected response structure
             logger.error(f"Unexpected response structure during registration for {user_data.email}: {res}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected registration response structure")


    except Exception as e:
        logger.exception(f"Unexpected error during registration for {user_data.email}: {e}") # Use logger.exception to include stack trace
        # 提供更具体的错误信息
        if "User already registered" in str(e):
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
        elif "Password should be at least 6 characters" in str(e):
             raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 6 characters long.")
        else:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login_user(user_data: UserCredentials, supabase: Client = Depends(get_supabase)):
    """
    Authenticate a user using Supabase Auth and return a session token.
    """
    try:
        logger.info(f"Attempting to login user: {user_data.email}")
        res = supabase.auth.sign_in_with_password({
             "email": user_data.email,
             "password": user_data.password
        })

        # Check if session and user are present
        if res.session and res.user and res.session.access_token:
            logger.info(f"Successfully logged in user: {res.user.email}")
            return AuthResponse(
                user_id=str(res.user.id),
                email=res.user.email,
                access_token=res.session.access_token,
                token_type="bearer"
            )
        else:
            # Handle unexpected response structure
            logger.error(f"Unexpected response structure during login for {user_data.email}: {res}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected login response structure")

    except Exception as e:
        logger.exception(f"Unexpected error during login for {user_data.email}: {e}")
        if "Invalid login credentials" in str(e):
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
        elif "Email not confirmed" in str(e):
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email not confirmed. Please check your inbox.")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Login failed: {str(e)}") 
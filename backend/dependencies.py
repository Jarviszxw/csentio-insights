import os
import logging
from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

logger = logging.getLogger(__name__)

async def get_current_user_supabase_client(authorization: Optional[str] = Header(None)) -> Client:
    """
    Dependency to get a Supabase client instance authenticated with the current user's token.
    Reads the Authorization header, validates the token, and sets the session for the client.
    Requires SUPABASE_URL and SUPABASE_KEY (anon key) environment variables.
    """
    if authorization is None:
        logger.warning("Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        logger.warning(f"Invalid authorization scheme or token missing: {scheme}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url = os.getenv("SUPABASE_URL")
    # IMPORTANT: Ensure SUPABASE_KEY is the ANON KEY for RLS to work
    supabase_key = os.getenv("SUPABASE_KEY") 
    # Add logging to confirm the key being used
    logger.info(f"Supabase Key used for client init: {'*****' + supabase_key[-4:] if supabase_key else 'MISSING!'}")

    if not supabase_url or not supabase_key:
        logger.error("Supabase URL or Key is missing in environment variables!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Server configuration error"
        )

    # Create a new client instance for this request
    # Use options to ensure schema is correct, adjust as needed
    options = ClientOptions(schema="public", auto_refresh_token=True, persist_session=False) # Persist session is false for server-side
    supabase: Client = create_client(supabase_url, supabase_key, options=options)

    try:
        # Set the user's session for this client instance using the provided token
        # This makes subsequent calls with this client instance RLS-aware for the user
        logger.info(f"Attempting to validate token: {token[:10]}...") # Log prefix
        user_response = supabase.auth.get_user(token)

        if user_response.user is None:
             logger.warning(f"Token validation failed for token: {token[:10]}... User is None in response.")
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Successfully authenticated user: {user_response.user.id}")

        # Explicitly set ONLY the Authorization header on the client instance 
        # Let supabase-py handle the apikey for PostgREST based on initial client creation
        supabase.options.headers.update({
            'Authorization': f'Bearer {token}',
            # 'apikey': supabase_key # REMOVE THIS LINE - rely on client init
        })
        # Clear potential stale apikey if it was set before
        if 'apikey' in supabase.options.headers:
             del supabase.options.headers['apikey']

        return supabase # Return the client configured with the user's auth context

    except HTTPException as e:
        # Re-raise HTTPExceptions directly
        raise e
    except Exception as e:
        # Log the detailed exception from supabase.auth.get_user or client creation
        logger.error(f"Error during Supabase authentication or user retrieval: {e}", exc_info=True)
        # Provide a more generic error message to the client
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user_supabase_client(authorization: Optional[str] = Header(None)) -> Optional[Client]:
    """
    Dependency to optionally get an authenticated Supabase client.
    Returns None if no valid Authorization header is provided.
    Useful for endpoints that might return public data or user-specific data.
    """
    if not authorization:
        return None
    try:
        # Reuse the main dependency logic
        return await get_current_user_supabase_client(authorization)
    except HTTPException as e:
        # If auth fails for any reason (even invalid scheme), treat as unauthenticated
        logger.info(f"Optional authentication failed or header missing: {e.detail}")
        return None

# Dependency to get the generic, unauthenticated client (using anon key)
# Keep the original get_supabase but perhaps rename for clarity
def get_supabase_anon_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY") # Should be anon key
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase URL or Key is missing for anon client!")
        raise ValueError("Supabase configuration is missing.")

    options = ClientOptions(schema="public", persist_session=False)
    return create_client(supabase_url, supabase_key, options=options) 
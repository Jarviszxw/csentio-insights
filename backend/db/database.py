from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Tuple, Union
from datetime import date
from supabase import create_client, Client
import os
import logging
from datetime import timedelta
import httpx

logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    logger.info(f"get_supabase: URL found: {'Yes' if supabase_url else 'No'}, Key found: {'Yes' if supabase_key else 'No'}")

    if not supabase_url or not supabase_key:
        logger.error("Supabase URL or Key is missing in environment variables!")
        raise ValueError("Supabase configuration is missing in environment variables.")

    return create_client(supabase_url, supabase_key)

async def get_supabase_async():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase URL or Key is missing in environment variables for async!")
        raise ValueError("Supabase configuration is missing in environment variables.")
        
    from supabase.client import ClientOptions, SupabaseClient
    options = ClientOptions(schema="public", auto_refresh_token=True, persist_session=True, use_tls=False)
    async with httpx.AsyncClient() as client:
        return await SupabaseClient(supabase_url, supabase_key, options, client).auth.get_session()
    
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Tuple, Union
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import logging
from datetime import timedelta

load_dotenv()
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

logger.info(f"Supabase URL configured: {'Yes' if SUPABASE_URL else 'No'}")
logger.info(f"Supabase Key configured: {'Yes' if SUPABASE_KEY else 'No'}")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)
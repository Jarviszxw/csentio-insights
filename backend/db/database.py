from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Tuple, Union
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import logging
from datetime import timedelta
import httpx

load_dotenv()
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

logger.info(f"Supabase URL configured: {'Yes' if SUPABASE_URL else 'No'}")
logger.info(f"Supabase Key configured: {'Yes' if SUPABASE_KEY else 'No'}")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_supabase_async():
    """
    获取异步Supabase客户端
    如果使用官方supabase包，这个函数应该返回异步客户端
    """
    # 使用supabase包的异步客户端
    from supabase.client import ClientOptions, SupabaseClient
    options = ClientOptions(schema="public", auto_refresh_token=True, persist_session=True, use_tls=False)
    async with httpx.AsyncClient() as client:
        return await SupabaseClient(SUPABASE_URL, SUPABASE_KEY, options, client).auth.get_session()
    
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import date
from supabase import Client
from db.database import get_supabase
from services import info_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/info", tags=["info"])

@router.get("/stores")
async def get_stores(
    supabase: Client = Depends(get_supabase)
):
    logger.info("API Call /api/info/stores: Get all stores")
    return await info_service.get_all_stores(supabase)


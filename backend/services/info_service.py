from supabase import Client
from typing import Optional, Tuple, List
from datetime import date, timedelta
import logging
from fastapi import HTTPException
from utils.utils import cal_pop_percentage, get_previous_date_range

logger = logging.getLogger(__name__)

async def get_all_stores(supabase: Client) -> List[dict]:
    try:
        query = supabase.table("stores").select("*").execute()
        logger.info(f"Query: {query}")
        stores = query.data
        return stores
    except Exception as e:
        logger.error(f"Error fetching stores: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stores")
        return []
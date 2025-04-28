from supabase import Client
from typing import Optional, Tuple, List, Dict
from datetime import date, timedelta
import logging
from fastapi import HTTPException
from utils.utils import cal_pop_percentage, get_previous_date_range
from models.info import StoreResponse, ProductResponse

logger = logging.getLogger(__name__)

async def get_all_stores(supabase: Client, is_active: Optional[bool] = None) -> List[StoreResponse]:
    try:
        query = supabase.table("stores").select("*")
        if is_active is not None:
            logger.info(f"Applying filter is_active = {is_active}")
            query = query.eq('is_active', is_active)
        
        result = query.execute()
        logger.info(f"Stores query result: {result}")
        stores = result.data
        return stores
    except Exception as e:
        logger.error(f"Error fetching stores: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stores: {str(e)}")

async def get_all_products(supabase: Client) -> List[ProductResponse]:
    try:
        query = supabase.table("products").select("product_id, sku_name, sku_code, price").execute()
        products = getattr(query, "data", [])
        return [
            {
                "id": p["product_id"],
                "name": p["sku_name"],
                "code": p["sku_code"],
                "price": p.get("price")
            }
            for p in products
        ]
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise

async def get_all_cities(supabase: Client) -> List[Dict]:
    try:
        query = supabase.table("cities").select("*")
        result = query.execute()
        logger.info(f"Cities query result: {result}")
        cities = result.data
        return cities
    except Exception as e:
        logger.error(f"Error fetching cities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch cities: {str(e)}")
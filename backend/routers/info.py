from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict
from datetime import date
from supabase import Client
from dependencies import get_current_user_supabase_client, get_optional_user_supabase_client
from services import info_service
import logging
from models.info import StoreResponse, ProductResponse, CityResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/info", tags=["info"])

@router.get("/stores", response_model=List[StoreResponse])
async def get_all_stores(
    supabase: Client = Depends(get_current_user_supabase_client),
    is_active: Optional[bool] = None
):
    logger.info("API Call /api/info/stores: Get all stores")
    return await info_service.get_all_stores(supabase, is_active)

@router.get("/products", response_model=List[ProductResponse])
async def get_all_products(
    supabase: Client = Depends(get_current_user_supabase_client)
):
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

@router.get("/cities", response_model=List[CityResponse])
async def get_all_cities(
    supabase: Client = Depends(get_current_user_supabase_client)
):
    logger.info("API Call /api/info/cities: Get all cities")
    return await info_service.get_all_cities(supabase)
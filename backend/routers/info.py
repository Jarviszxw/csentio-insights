from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict
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

@router.get("/products")
async def get_all_products(supabase: Client = Depends(get_supabase)) -> List[Dict]:
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
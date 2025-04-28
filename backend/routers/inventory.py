from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict
from datetime import date, datetime
from supabase import Client
from dependencies import get_current_user_supabase_client
from services import inventory_service
import logging
from models.inventory import InventoryRecordCreate, InventoryRecordResponse, InventoryRecord

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

@router.get("/statistics")
async def get_inventory_statistics(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None
):
    logger.info(f"API Call /api/inventory/statistics: Get inventory statistics for store_id={store_id}")
    try:
        return await inventory_service.get_inventory_statistics(supabase, store_id)
    except Exception as e:
        logger.error(f"Failed to get inventory statistics: {str(e)}")
        return {
            "sample": {"totalQuantity": 0, "skuDetails": []},
            "stock": {"totalQuantity": 0, "skuDetails": []},
            "error": str(e)
        }

@router.get("/distribution")
async def get_inventory_distribution(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None
):
    logger.info(f"API Call /api/inventory/distribution: Get inventory distribution for store_id={store_id}")
    try:
        return await inventory_service.get_inventory_distribution(supabase, store_id)
    except Exception as e:
        logger.error(f"Failed to get inventory distribution: {str(e)}")
        return []

@router.get("/records")
async def get_inventory_records(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    logger.info(f"API Call /api/inventory/records: Get inventory records for store_id={store_id}, from {start_date} to {end_date}")
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")
        return await inventory_service.get_inventory_records(supabase, store_id, start_date, end_date)
    except Exception as e:
        logger.error(f"Failed to get inventory records: {str(e)}")
        return []

@router.post("/records")
async def add_inventory_records(
    records: List[Dict],
    supabase: Client = Depends(get_current_user_supabase_client)
):
    logger.info(f"API Call /api/inventory/records: Add inventory records")
    try:
        return await inventory_service.add_inventory_records(supabase, records)
    except Exception as e:
        logger.error(f"Failed to add inventory records: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add inventory records: {str(e)}")

@router.post("/", response_model=InventoryRecordResponse, status_code=201)
async def add_inventory_shipment(
    shipment_data: InventoryRecordCreate,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    logger.info(f"API Call /api/inventory/: Add inventory shipment")
    try:
        return await inventory_service.add_inventory_shipment(supabase, shipment_data)
    except Exception as e:
        logger.error(f"Failed to add inventory shipment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add inventory shipment: {str(e)}")

@router.get("/", response_model=List[InventoryRecordResponse])
async def get_inventory_shipments(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None,
):
    logger.info(f"API Call /api/inventory/: Get inventory shipments for store_id={store_id}")
    try:
        return await inventory_service.get_inventory_shipments(supabase, store_id)
    except Exception as e:
        logger.error(f"Failed to get inventory shipments: {str(e)}")
        return []

@router.get("/stock")
async def get_stock_levels(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None,
):
    logger.info(f"API Call /api/inventory/stock: Get stock levels for store_id={store_id}")
    try:
        return await inventory_service.get_stock_levels(supabase, store_id)
    except Exception as e:
        logger.error(f"Failed to get stock levels: {str(e)}")
        return []

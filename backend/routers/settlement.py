from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date
from supabase import Client
from dependencies import get_current_user_supabase_client
# Use direct imports when running from project root with uvicorn
from models.settlement import SettlementCreate, SettlementItemCreate, SettlementUpdate, SettlementResponse, SettlementRecord, SettlementProduct
from services import settlement_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settlement", tags=["settlement"])

# Define the Settlement response model if needed, maybe excluding items or formatting differently
# class SettlementResponse(BaseModel): ...

# --- Specific paths FIRST ---
@router.get("/records", response_model=List[SettlementRecord])
async def get_settlement_records(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Retrieves all settlement records for a specific store.
    """
    logger.info(f"API Call GET /api/settlement/records for store {store_id}, from {start_date} to {end_date}")
    try:
        records = await settlement_service.get_settlement_records(supabase, store_id, start_date, end_date)
        return records
    except HTTPException as e:
        logger.error(f"HTTPException in get_settlement_records for store {store_id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_settlement_records for store {store_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving settlement records.")

@router.get("/products", response_model=List[SettlementProduct])
async def get_settlement_products(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Retrieves settlement products for a specific store.
    """
    logger.info(f"API Call GET /api/settlement/products for store {store_id}, from {start_date} to {end_date}")
    try:
        products = await settlement_service.get_settlement_products(supabase, store_id, start_date, end_date)
        return products
    except HTTPException as e:
        logger.error(f"HTTPException in get_settlement_products for store {store_id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_settlement_products for store {store_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving settlement products.")

# --- Root path ---
@router.post("/", status_code=201) # Use root path with prefix, define response_model if desired
async def add_new_settlement(
    settlement_data: SettlementCreate,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """
    Adds a new settlement record along with its items.
    
    - **settle_date**: Date of the settlement (YYYY-MM-DD).
    - **store_id**: ID of the store.
    - **total_amount**: Total settlement amount for the record.
    - **remarks**: Optional remarks.
    - **items**: A list of settlement items:
        - **product_id**: ID of the product.
        - **quantity**: Quantity of the product.
        - **unit_price**: Unit price used for this settlement item.
    """
    logger.info(f"API Call POST /api/settlement: Received payload for store {settlement_data.store_id} on {settlement_data.settle_date}")
    try:
        created_settlement = await settlement_service.create_settlement(supabase, settlement_data)
        logger.info(f"Successfully created settlement ID: {created_settlement.get('settlement_id')}")
        # Return the created settlement data (or adjust as needed)
        return created_settlement
    except HTTPException as e:
        logger.error(f"HTTPException in add_new_settlement for store {settlement_data.store_id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in add_new_settlement for store {settlement_data.store_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while adding settlement.")

# --- Dynamic paths LAST ---
@router.get("/{settlement_id}", response_model=SettlementResponse)
async def get_settlement_details(
    settlement_id: int,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """
    Retrieves the details of a specific settlement, including its items and product info.
    """
    logger.info(f"API Call GET /api/settlement/{settlement_id}")
    try:
        settlement = await settlement_service.get_settlement_by_id(supabase, settlement_id)
        if not settlement:
            raise HTTPException(status_code=404, detail="Settlement not found")
        return settlement
    except HTTPException as e:
        logger.warning(f"HTTPException getting settlement {settlement_id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error getting settlement {settlement_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving settlement.")

@router.put("/{settlement_id}", response_model=SettlementResponse)
async def update_existing_settlement(
    settlement_id: int,
    settlement_data: SettlementUpdate, # Use the new Update model
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """
    Updates an existing settlement record and its items.
    - Handles adding new items, updating existing items, and deleting removed items.
    """
    logger.info(f"API Call PUT /api/settlement/{settlement_id}")
    try:
        updated_settlement = await settlement_service.update_settlement(
            supabase, 
            settlement_id, 
            settlement_data
        )
        if not updated_settlement:
             # update_settlement service should raise 404 if not found initially
             raise HTTPException(status_code=500, detail="Update failed or settlement not found after update.") 
        return updated_settlement
    except HTTPException as e:
        logger.warning(f"HTTPException updating settlement {settlement_id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error updating settlement {settlement_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error updating settlement.")

# Add DELETE endpoint if needed, also using the new dependency
# @router.delete("/{settlement_id}", status_code=204)
# async def delete_settlement(
#     settlement_id: int,
#     supabase: Client = Depends(get_current_user_supabase_client)
# ):
#     logger.info(f"API Call DELETE /api/settlement/{settlement_id}")
#     try:
#         success = await settlement_service.delete_settlement(supabase, settlement_id)
#         if not success:
#              raise HTTPException(status_code=404, detail="Settlement not found")
#         # No content to return on successful delete
#         return None 
#     except HTTPException as e:
#        logger.warning(f"HTTPException deleting settlement {settlement_id}: {e.detail}")
#        raise e
#     except Exception as e:
#         logger.error(f"Unexpected error deleting settlement {settlement_id}: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail="Internal server error deleting settlement.")
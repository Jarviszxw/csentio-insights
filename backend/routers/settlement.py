from fastapi import APIRouter, Depends, HTTPException
from typing import List
from supabase import Client
from db.database import get_supabase
# Use direct imports when running from project root with uvicorn
from models.settlement import SettlementCreate, SettlementItemCreate, SettlementUpdate, SettlementResponse
from services import settlement_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settlements", tags=["settlements"])

# Define the Settlement response model if needed, maybe excluding items or formatting differently
# class SettlementResponse(BaseModel): ...

@router.post("/", status_code=201) # Use root path with prefix, define response_model if desired
async def add_new_settlement(
    settlement_data: SettlementCreate,
    supabase: Client = Depends(get_supabase)
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
    logger.info(f"API Call POST /api/settlements: Received payload for store {settlement_data.store_id} on {settlement_data.settle_date}")
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

# --- GET Settlement by ID ---
@router.get("/{settlement_id}", response_model=SettlementResponse)
async def get_settlement_details(
    settlement_id: int,
    supabase: Client = Depends(get_supabase)
):
    """
    Retrieves the details of a specific settlement, including its items and product info.
    """
    logger.info(f"API Call GET /api/settlements/{settlement_id}")
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

# --- UPDATE Settlement by ID ---
@router.put("/{settlement_id}", response_model=SettlementResponse)
async def update_existing_settlement(
    settlement_id: int,
    settlement_data: SettlementUpdate, # Use the new Update model
    supabase: Client = Depends(get_supabase)
):
    """
    Updates an existing settlement record and its items.
    - Handles adding new items, updating existing items, and deleting removed items.
    """
    logger.info(f"API Call PUT /api/settlements/{settlement_id}")
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

# Example Pydantic models directly in router if not in separate file:
# from pydantic import BaseModel, Field

# class SettlementItemCreate(BaseModel):
#     product_id: int
#     quantity: int = Field(..., gt=0)
#     unit_price: float = Field(..., ge=0) # Ensure price is non-negative

# class SettlementCreate(BaseModel):
#     settle_date: date
#     store_id: int
#     total_amount: float = Field(..., ge=0) # Ensure total amount is non-negative
#     remarks: Optional[str] = None
#     items: List[SettlementItemCreate] = Field(..., min_items=1) # Ensure at least one item 
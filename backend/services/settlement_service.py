from supabase import Client
from fastapi import HTTPException
from datetime import date, datetime
import logging
# Use direct imports when running from project root with uvicorn
from models.settlement import SettlementCreate, SettlementUpdate, SettlementItemCreate, SettlementItemUpdate, SettlementResponse

logger = logging.getLogger(__name__)

async def create_settlement(db: Client, settlement_data: SettlementCreate):
    """
    Creates a new settlement record and its associated items.
    """
    try:
        # 1. Prepare settlement data
        # Calculate settle_month (first day of the month)
        settle_month = settlement_data.settle_date.replace(day=1).isoformat()
        # --- AUTHENTICATION REQUIRED --- 
        # TODO: Replace placeholder with actual authenticated user ID.
        # This should typically come from an authentication dependency injected into the router.
        # Example: async def add_new_settlement(..., current_user: User = Depends(get_current_user)):
        #              created_by_user_id = current_user.id
        created_by_user_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890" # <<< --- MUST BE REPLACED --- >>>

        settlement_payload = {
            "settle_date": settlement_data.settle_date.isoformat(),
            "store_id": settlement_data.store_id,
            "total_amount": settlement_data.total_amount,
            "remarks": settlement_data.remarks,
            "settle_month": settle_month, 
            "created_by": created_by_user_id 
        }
        logger.info(f"Inserting settlement: {settlement_payload}")

        # 2. Insert into settlements table
        # Use .execute() for error handling provided by supabase-py
        settlement_insert_result = db.table("settlements").insert(settlement_payload).execute()

        # Error handling for settlement insertion
        if not settlement_insert_result.data:
             # Attempt to get error details from the result object
             error_details = getattr(settlement_insert_result, 'error', None)
             error_message = getattr(error_details, 'message', 'Unknown error') if error_details else 'Unknown error'
             logger.error(f"Failed to insert settlement: {error_message}")
             raise HTTPException(status_code=500, detail=f"Failed to create settlement record: {error_message}")

        # Ensure data is a list and get the first element
        if not isinstance(settlement_insert_result.data, list) or not settlement_insert_result.data:
             logger.error(f"Settlement insert returned unexpected data format: {settlement_insert_result.data}")
             raise HTTPException(status_code=500, detail="Failed to create settlement record: Invalid response from database.")
             
        created_settlement = settlement_insert_result.data[0]
        settlement_id = created_settlement.get('settlement_id')
        
        if not settlement_id:
             logger.error(f"Settlement ID not found in response: {created_settlement}")
             raise HTTPException(status_code=500, detail="Failed to create settlement record: Missing ID in response.")
             
        logger.info(f"Settlement created with ID: {settlement_id}")

        # 3. Prepare settlement items data
        items_payload = []
        for item in settlement_data.items:
            # Basic validation (can add more Pydantic validation in model)
            if item.quantity <= 0:
                 raise HTTPException(status_code=400, detail=f"Invalid quantity for product {item.product_id}: Quantity must be positive.")
            if item.unit_price < 0:
                  raise HTTPException(status_code=400, detail=f"Invalid unit price for product {item.product_id}: Price cannot be negative.")
                  
            items_payload.append({
                "settlement_id": settlement_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.unit_price # Map Pydantic unit_price to db 'price' column
            })

        if not items_payload:
             # This case should be prevented by Pydantic model validation (min_items=1)
             logger.error("No settlement items provided, although SettlementCreate requires items.")
             raise HTTPException(status_code=400, detail="Settlement must contain at least one item.")
             
        logger.info(f"Inserting {len(items_payload)} settlement items for settlement ID {settlement_id}")

        # 4. Insert into settlement_items table (bulk insert)
        items_insert_result = db.table("settlement_items").insert(items_payload).execute()

        # Error handling for items insertion 
        if not items_insert_result.data:
             error_details = getattr(items_insert_result, 'error', None)
             error_message = getattr(error_details, 'message', 'Unknown error') if error_details else 'Unknown error'
             logger.error(f"Failed to insert settlement items for settlement {settlement_id}: {error_message}")
             # --- TRANSACTION REQUIRED --- 
             # IMPORTANT: The settlement record (step 2) was already created.
             # If item insertion fails, the settlement exists without items, causing data inconsistency.
             # This entire operation (steps 2 & 4) should be wrapped in a database transaction.
             # Ideally, wrap steps 2 & 4 in a transaction or manually delete the settlement record.
             # Using a DB function via db.rpc() is often the best way with Supabase client.
             # --- Manual Rollback Attempt (Not Recommended / Unreliable) --- 
             try:
                 db.table("settlements").delete().eq("settlement_id", settlement_id).execute()
                 logger.warning(f"Rolled back settlement {settlement_id} due to item insertion failure.")
             except Exception as delete_err:
                 logger.error(f"Failed to rollback settlement {settlement_id} after item insertion failure: {delete_err}")
             
             raise HTTPException(status_code=500, detail=f"Failed to create settlement items: {error_message}")

        logger.info(f"Successfully inserted {len(items_insert_result.data)} items for settlement {settlement_id}.")

        # 5. Return created settlement (or fetch again for complete data)
        # The created_settlement dict only contains settlement fields.
        # Fetch again to include items, or manually combine.
        # Let's fetch again for simplicity and consistency.
        final_result = db.table("settlements").select("*, settlement_items(*, products(*))").eq("settlement_id", settlement_id).maybe_single().execute()
        
        if not final_result.data:
             logger.error(f"Could not fetch final settlement data for ID {settlement_id} after creation.")
             # Return the basic info as fallback
             return {**created_settlement, "items": items_insert_result.data} 
             
        return final_result.data

    except HTTPException as http_exc:
        raise http_exc # Re-raise validation/known errors
    except Exception as e:
        logger.error(f"Unexpected error creating settlement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 

async def get_settlement_by_id(db: Client, settlement_id: int):
    """
    Fetches a single settlement by its ID, including items and product details.
    """
    try:
        # Fetch settlement and related data in one go
        result = db.table("settlements")\
            .select("*, settlement_items(*, products(product_id, sku_name, sku_code))")\
            .eq("settlement_id", settlement_id)\
            .maybe_single()\
            .execute()
            
        if not result.data:
            logger.warning(f"Settlement with ID {settlement_id} not found.")
            return None
            
        logger.info(f"Successfully fetched settlement {settlement_id}")
        # Structure the response to match SettlementResponse Pydantic model if needed,
        # especially mapping db columns to model fields (e.g., price to unit_price for items?)
        # For now, returning the raw structure fetched
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching settlement {settlement_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch settlement details: {str(e)}")

async def update_settlement(db: Client, settlement_id: int, settlement_data: SettlementUpdate):
    """
    Updates an existing settlement and its items.
    Handles adding, updating, and deleting items.
    *** IMPORTANT: Needs Transaction Handling ***
    """
    logger.info(f"Starting update for settlement ID: {settlement_id}")
    
    # --- TRANSACTION REQUIRED --- 
    # All operations below should be within a single database transaction.
    # Using a database function via db.rpc() is recommended.

    try:
        # 1. Verify Settlement Exists
        existing_settlement = db.table("settlements").select("settlement_id").eq("settlement_id", settlement_id).maybe_single().execute()
        if not existing_settlement.data:
            raise HTTPException(status_code=404, detail=f"Settlement with ID {settlement_id} not found.")

        # 2. Update Settlements Table
        # Note: created_by and settle_month are typically not updated, but handle if needed.
        settlement_payload = {
            "settle_date": settlement_data.settle_date.isoformat(),
            "store_id": settlement_data.store_id,
            "total_amount": settlement_data.total_amount,
            "remarks": settlement_data.remarks,
            "updated_at": datetime.utcnow().isoformat() # Update timestamp
        }
        update_settlement_result = db.table("settlements")\
                                    .update(settlement_payload)\
                                    .eq("settlement_id", settlement_id)\
                                    .execute()
                                    
        if not update_settlement_result.data:
             error_details = getattr(update_settlement_result, 'error', None)
             error_message = getattr(error_details, 'message', 'Update failed') if error_details else 'Update failed'
             logger.error(f"Failed to update settlement {settlement_id}: {error_message}")
             # Rollback needed if in transaction
             raise HTTPException(status_code=500, detail=f"Failed to update settlement record: {error_message}")
             
        logger.info(f"Successfully updated settlement record {settlement_id}")

        # 3. Handle Settlement Items (Add/Update/Delete)
        # Get current items from DB
        current_items_result = db.table("settlement_items").select("item_id, product_id, quantity, price").eq("settlement_id", settlement_id).execute()
        current_items_map = {item['item_id']: item for item in getattr(current_items_result, 'data', [])}
        
        incoming_items_map = {item.item_id: item for item in settlement_data.items if isinstance(item, SettlementItemUpdate) and item.item_id is not None}
        new_items_payload = [item for item in settlement_data.items if isinstance(item, SettlementItemCreate) or item.item_id is None]
        
        items_to_add = []
        items_to_update = []
        item_ids_to_delete = set(current_items_map.keys()) # Start with all current IDs

        # Process incoming items
        for item in settlement_data.items:
            if item.item_id is not None and item.item_id in current_items_map:
                # Item exists, potentially update it
                item_ids_to_delete.remove(item.item_id) # Keep this one
                current_item = current_items_map[item.item_id]
                # Check if update is needed (compare fields)
                if (item.product_id != current_item['product_id'] or 
                    item.quantity != current_item['quantity'] or 
                    item.unit_price != current_item['price']): # Compare incoming unit_price with db price
                    items_to_update.append({
                        "item_id": item.item_id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "price": item.unit_price # Map to db 'price'
                    })
            elif item.item_id is None:
                # New item (no item_id provided)
                 items_to_add.append({
                     "settlement_id": settlement_id,
                     "product_id": item.product_id,
                     "quantity": item.quantity,
                     "price": item.unit_price # Map to db 'price'
                 })
            else:
                 # item_id provided but not in current_items_map -> error or ignore?
                 logger.warning(f"Received update for non-existent item_id {item.item_id} in settlement {settlement_id}. Ignoring.")
                 
        # --- Perform DB Operations for Items (within transaction ideally) --- 
        
        # Delete items
        if item_ids_to_delete:
            logger.info(f"Deleting items for settlement {settlement_id}: IDs {item_ids_to_delete}")
            delete_result = db.table("settlement_items").delete().in_("item_id", list(item_ids_to_delete)).execute()
            # Add error check for delete_result

        # Update items
        if items_to_update:
             logger.info(f"Updating {len(items_to_update)} items for settlement {settlement_id}")
             # Supabase client doesn't have bulk update, iterate (less efficient but works)
             for item_update_payload in items_to_update:
                  item_id_to_update = item_update_payload.pop("item_id") # Remove item_id before update
                  update_item_result = db.table("settlement_items")\
                                         .update(item_update_payload)\
                                         .eq("item_id", item_id_to_update)\
                                         .execute()
                  # Add error check for update_item_result
                  
        # Add new items
        if items_to_add:
            logger.info(f"Adding {len(items_to_add)} items for settlement {settlement_id}")
            add_result = db.table("settlement_items").insert(items_to_add).execute()
            # Add error check for add_result

        # 4. Fetch and return the updated settlement data
        logger.info(f"Finished update operations for settlement {settlement_id}. Fetching final data.")
        final_updated_data = await get_settlement_by_id(db, settlement_id)
        if not final_updated_data:
             logger.error(f"Failed to fetch settlement {settlement_id} after update operations.")
             # Rollback needed
             raise HTTPException(status_code=500, detail="Failed to retrieve settlement after update.")
             
        return final_updated_data
        
    except HTTPException as http_exc:
        # Rollback needed
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error updating settlement {settlement_id}: {e}", exc_info=True)
        # Rollback needed
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during update: {str(e)}") 
# settlement_service.py
from supabase import Client
from fastapi import HTTPException
from datetime import date, datetime
import logging
from typing import Optional, List

from models.settlement import SettlementCreate, SettlementUpdate, SettlementResponse, SettlementRecord, SettlementProduct

logger = logging.getLogger(__name__)

async def create_settlement(db: Client, settlement_data: SettlementCreate) -> dict:
    try:
        settle_month = settlement_data.settle_date.replace(day=1).isoformat()
        created_by_user_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # TODO: Replace with actual user ID

        settlement_payload = {
            "settle_date": settlement_data.settle_date.isoformat(),
            "store_id": settlement_data.store_id,
            "total_amount": settlement_data.total_amount,
            "remarks": settlement_data.remarks,
            "settle_month": settle_month,
            "created_by": created_by_user_id
        }
        logger.info(f"Inserting settlement: {settlement_payload}")

        settlement_insert_result = db.table("settlements").insert(settlement_payload).execute()

        if not settlement_insert_result.data:
            error_details = getattr(settlement_insert_result, 'error', None)
            error_message = getattr(error_details, 'message', 'Unknown error') if error_details else 'Unknown error'
            logger.error(f"Failed to insert settlement: {error_message}")
            raise HTTPException(status_code=500, detail=f"Failed to create settlement record: {error_message}")

        if not isinstance(settlement_insert_result.data, list) or not settlement_insert_result.data:
            logger.error(f"Settlement insert returned unexpected data format: {settlement_insert_result.data}")
            raise HTTPException(status_code=500, detail="Failed to create settlement record: Invalid response from database.")

        created_settlement = settlement_insert_result.data[0]
        settlement_id = created_settlement.get('settlement_id')

        if not settlement_id:
            logger.error(f"Settlement ID not found in response: {created_settlement}")
            raise HTTPException(status_code=500, detail="Failed to create settlement record: Missing ID in response.")

        logger.info(f"Settlement created with ID: {settlement_id}")

        items_payload = []
        for item in settlement_data.items:
            items_payload.append({
                "settlement_id": settlement_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.unit_price
            })

        if not items_payload:
            logger.error("No settlement items provided, although SettlementCreate requires items.")
            raise HTTPException(status_code=400, detail="Settlement must contain at least one item.")

        logger.info(f"Inserting {len(items_payload)} settlement items for settlement ID {settlement_id}")

        items_insert_result = db.table("settlement_items").insert(items_payload).execute()

        if not items_insert_result.data:
            error_details = getattr(items_insert_result, 'error', None)
            error_message = getattr(error_details, 'message', 'Unknown error') if error_details else 'Unknown error'
            logger.error(f"Failed to insert settlement items for settlement {settlement_id}: {error_message}")
            try:
                db.table("settlements").delete().eq("settlement_id", settlement_id).execute()
                logger.warning(f"Rolled back settlement {settlement_id} due to item insertion failure.")
            except Exception as delete_err:
                logger.error(f"Failed to rollback settlement {settlement_id} after item insertion failure: {delete_err}")
            raise HTTPException(status_code=500, detail=f"Failed to create settlement items: {error_message}")

        logger.info(f"Successfully inserted {len(items_insert_result.data)} items for settlement {settlement_id}.")

        final_result = db.table("settlements").select("*, settlement_items(*, products(*))").eq("settlement_id", settlement_id).maybe_single().execute()

        if not final_result.data:
            logger.error(f"Could not fetch final settlement data for ID {settlement_id} after creation.")
            return {**created_settlement, "items": items_insert_result.data}

        return final_result.data

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error creating settlement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

async def get_settlement_by_id(db: Client, settlement_id: int) -> Optional[dict]:
    try:
        result = db.table("settlements")\
            .select("*, settlement_items(*, products(product_id, sku_name, sku_code))")\
            .eq("settlement_id", settlement_id)\
            .maybe_single()\
            .execute()

        if not result.data:
            logger.warning(f"Settlement with ID {settlement_id} not found.")
            return None

        # Rename 'settlement_items' key to 'items' to match Pydantic model
        settlement_data = result.data
        if 'settlement_items' in settlement_data:
            settlement_data['items'] = settlement_data.pop('settlement_items')

        logger.info(f"Successfully fetched and processed settlement {settlement_id}")
        return settlement_data # Return the modified data

    except Exception as e:
        logger.error(f"Error fetching settlement {settlement_id}: {e}", exc_info=True)
        # Return None or raise exception based on desired error handling for the caller (router)
        # Returning None will lead to 404 in the router if this was the initial fetch failure
        # Raising HTTPException might be better if it's an unexpected processing error
        # For now, let's re-raise a generic 500 for unexpected errors during fetch/processing
        raise HTTPException(status_code=500, detail=f"Failed to fetch settlement details: {str(e)}")

async def update_settlement(db: Client, settlement_id: int, settlement_data: SettlementUpdate) -> dict:
    logger.info(f"Starting update for settlement ID: {settlement_id}")

    try:
        existing_settlement = db.table("settlements").select("settlement_id").eq("settlement_id", settlement_id).maybe_single().execute()
        if not existing_settlement.data:
            raise HTTPException(status_code=404, detail=f"Settlement with ID {settlement_id} not found.")

        settlement_payload = {
            "settle_date": settlement_data.settle_date.isoformat(),
            "store_id": settlement_data.store_id,
            "total_amount": settlement_data.total_amount,
            "remarks": settlement_data.remarks,
            "updated_at": datetime.utcnow().isoformat()
        }
        update_settlement_result = db.table("settlements")\
                                    .update(settlement_payload)\
                                    .eq("settlement_id", settlement_id)\
                                    .execute()

        if not update_settlement_result.data:
            error_details = getattr(update_settlement_result, 'error', None)
            error_message = getattr(error_details, 'message', 'Update failed') if error_details else 'Update failed'
            logger.error(f"Failed to update settlement {settlement_id}: {error_message}")
            raise HTTPException(status_code=500, detail=f"Failed to update settlement record: {error_message}")

        logger.info(f"Successfully updated settlement record {settlement_id}")

        current_items_result = db.table("settlement_items").select("item_id, product_id, quantity, price").eq("settlement_id", settlement_id).execute()
        current_items_map = {item['item_id']: item for item in getattr(current_items_result, 'data', [])}

        incoming_items_map = {item.item_id: item for item in settlement_data.items if isinstance(item, SettlementItemUpdate) and item.item_id is not None}
        new_items_payload = [item for item in settlement_data.items if isinstance(item, SettlementItemCreate) or item.item_id is None]

        items_to_add = []
        items_to_update = []
        item_ids_to_delete = set(current_items_map.keys())

        for item in settlement_data.items:
            if item.item_id is not None and item.item_id in current_items_map:
                item_ids_to_delete.remove(item.item_id)
                current_item = current_items_map[item.item_id]
                if (item.product_id != current_item['product_id'] or 
                    item.quantity != current_item['quantity'] or 
                    item.unit_price != current_item['price']):
                    items_to_update.append({
                        "item_id": item.item_id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "price": item.unit_price
                    })
            elif item.item_id is None:
                items_to_add.append({
                    "settlement_id": settlement_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price": item.unit_price
                })
            else:
                logger.warning(f"Received update for non-existent item_id {item.item_id} in settlement {settlement_id}. Ignoring.")

        if item_ids_to_delete:
            logger.info(f"Deleting items for settlement {settlement_id}: IDs {item_ids_to_delete}")
            delete_result = db.table("settlement_items").delete().in_("item_id", list(item_ids_to_delete)).execute()

        if items_to_update:
            logger.info(f"Updating {len(items_to_update)} items for settlement {settlement_id}")
            for item_update_payload in items_to_update:
                item_id_to_update = item_update_payload.pop("item_id")
                update_item_result = db.table("settlement_items")\
                                      .update(item_update_payload)\
                                      .eq("item_id", item_id_to_update)\
                                      .execute()

        if items_to_add:
            logger.info(f"Adding {len(items_to_add)} items for settlement {settlement_id}")
            add_result = db.table("settlement_items").insert(items_to_add).execute()

        logger.info(f"Finished update operations for settlement {settlement_id}. Fetching final data.")
        final_updated_data = await get_settlement_by_id(db, settlement_id)
        if not final_updated_data:
            logger.error(f"Failed to fetch settlement {settlement_id} after update operations.")
            raise HTTPException(status_code=500, detail="Failed to retrieve settlement after update.")

        return final_updated_data

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error updating settlement {settlement_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during update: {str(e)}")

async def get_settlement_records(db: Client, store_id: Optional[int] = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[SettlementRecord]:
    try:
        logger.info(f"Fetching settlement records with store_id={store_id}, start_date={start_date}, end_date={end_date}")

        # 简化查询，不再连接 users 表，稍后处理 created_by
        query = db.table("settlements").select("*, settlement_items(*, products(*)), stores(store_id, store_name)")

        if store_id is not None:
            query = query.eq("store_id", store_id)
        if start_date:
            query = query.gte("settle_date", start_date.isoformat())
        if end_date:
            query = query.lte("settle_date", end_date.isoformat())

        result = query.execute()
        settlements = getattr(result, "data", [])

        records = []
        for settlement in settlements:
            # 确保 created_by 字段存在且为字符串（UUID）
            created_by_value = str(settlement.get('created_by', 'Unknown')) 
            
            # 处理 items，确保 products 字段为字符串（产品名称）以匹配 Pydantic 模型
            processed_items = []
            for item in settlement.get('settlement_items', []):
                 product_info = item.get('products')
                 product_name = product_info.get('sku_name', f"Product {item.get('product_id')}") if product_info else f"Product {item.get('product_id')}"
                 processed_items.append({
                     "item_id": item['item_id'],
                     "product_id": item['product_id'],
                     "quantity": item['quantity'],
                     "price": item['price'],
                     "products": product_name # 使用产品名称字符串
                 })

            record = {
                "settlement_id": settlement['settlement_id'],
                "settle_date": settlement['settle_date'],
                "store": settlement['stores']['store_name'] if settlement.get('stores') else f"Store {settlement['store_id']}",
                "store_id": settlement['store_id'], # 保持 store_id 字段
                "total_amount": settlement['total_amount'],
                "remarks": settlement['remarks'],
                "created_by": created_by_value, # 使用 UUID 字符串或占位符
                "items": processed_items
            }
            # 尝试显式验证每一条记录，以便更快地捕捉 Pydantic 错误
            try:
                validated_record = SettlementRecord(**record)
                records.append(validated_record) # 添加验证后的模型实例
            except Exception as pydantic_error: # 更具体的可以是 pydantic.ValidationError
                 logger.error(f"Pydantic validation failed for settlement ID {settlement.get('settlement_id')}: {pydantic_error}")
                 logger.error(f"Record data causing error: {record}")
                 #可以选择跳过错误记录或抛出异常
                 # raise HTTPException(status_code=500, detail=f"Data processing error for settlement {settlement.get('settlement_id')}")
                 continue # 暂时跳过格式错误的记录

        logger.info(f"Successfully processed {len(records)} settlement records")
        return records

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching settlement records for store {store_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch settlement records: {str(e)}")

async def get_settlement_products(db: Client, store_id: Optional[int] = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[SettlementProduct]:
    try:
        logger.info(f"Fetching settlement products for store {store_id}, start_date={start_date}, end_date={end_date}")

        # Step 1: Find relevant settlement IDs based on store_id and date range
        settlements_query = db.table("settlements").select("settlement_id")
        if store_id:
            settlements_query = settlements_query.eq("store_id", store_id)
        if start_date:
            settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
        if end_date:
            settlements_query = settlements_query.lte("settle_date", end_date.isoformat())
        
        settlements_result = settlements_query.execute()
        matching_settlements = getattr(settlements_result, "data", [])
        settlement_ids = [s["settlement_id"] for s in matching_settlements if "settlement_id" in s]

        logger.info(f"Found {len(settlement_ids)} matching settlement IDs for store {store_id} and date range: {settlement_ids}")

        # Step 2: If no matching settlements, return empty list
        if not settlement_ids:
            return []

        # Step 3: Fetch settlement items for the found settlement IDs
        items_query = db.table("settlement_items").select("*, products(*)")
        items_query = items_query.in_("settlement_id", settlement_ids)
        
        result = items_query.execute()
        items = getattr(result, "data", [])
        logger.info(f"Fetched {len(items)} settlement items for the matching settlement IDs.")

        # Log the items returned by the Supabase query *after* filtering
        # logger.info(f"Settlement products: Items returned after Supabase query for store {store_id} and date range: {items}")

        # 按产品汇总数量
        product_summary = {}
        for item in items:
            product = item.get('products', {})
            if not product:
                continue
            product_id = item['product_id']
            if product_id not in product_summary:
                product_summary[product_id] = {
                    "product_id": product_id,
                    "sku_name": product.get('sku_name', f"Product {product_id}"),
                    "sku_code": product.get('sku_code', ''),
                    "quantity": 0
                }
            product_summary[product_id]["quantity"] += item['quantity']

        # 转换为 SettlementProduct 列表
        products = [SettlementProduct(**data) for data in product_summary.values()]
        logger.info(f"Fetched {len(products)} settlement products")
        return products

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching settlement products for store {store_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch settlement products: {str(e)}")

# inventory_service.py
from supabase import Client
from typing import Optional, List
from datetime import date, datetime
import logging
from fastapi import HTTPException

from models.inventory import InventoryStatisticsResponse, InventoryDistributionItem, InventoryRecord, InventoryRecordCreate

logger = logging.getLogger(__name__)

async def get_inventory_statistics(supabase: Client, store_id: Optional[int] = None) -> InventoryStatisticsResponse:
    try:
        sample_query = supabase.table("inventory_shipments").select("product_id, quantity").eq("is_sample", True)
        if store_id:
            sample_query = sample_query.eq("store_id", store_id)

        sample_result = sample_query.execute()
        samples = getattr(sample_result, "data", [])

        sample_by_product = {}
        for shipment in samples:
            product_id = shipment.get("product_id")
            quantity = int(shipment.get("quantity", 0))
            if product_id:
                if product_id not in sample_by_product:
                    sample_by_product[product_id] = 0
                sample_by_product[product_id] += quantity

        sample_product_ids = list(sample_by_product.keys())
        sample_products = {}
        if sample_product_ids:
            products_query = supabase.table("products").select("product_id, sku_name").in_("product_id", sample_product_ids)
            products_result = products_query.execute()
            sample_products = {p["product_id"]: p["sku_name"] for p in getattr(products_result, "data", [])}

        sample_sku_details = [
            {
                "id": pid,
                "name": sample_products.get(pid, f"SKU-{pid}"),
                "quantity": qty
            }
            for pid, qty in sample_by_product.items()
        ]
        sample_total = sum(sample_by_product.values())

        inventory_query = supabase.table("inventory_view").select("product_id, stock")
        if store_id:
            inventory_query = inventory_query.eq("store_id", store_id)

        inventory_result = inventory_query.execute()
        inventory_data = getattr(inventory_result, "data", [])

        inventory_by_product = {}
        for item in inventory_data:
            product_id = item.get("product_id")
            stock = int(item.get("stock", 0))
            if product_id and stock > 0:
                inventory_by_product[product_id] = stock

        inventory_product_ids = list(inventory_by_product.keys())
        inventory_products = {}
        if inventory_product_ids:
            products_query = supabase.table("products").select("product_id, sku_name").in_("product_id", inventory_product_ids)
            products_result = products_query.execute()
            inventory_products = {p["product_id"]: p["sku_name"] for p in getattr(products_result, "data", [])}

        inventory_sku_details = [
            {
                "id": pid,
                "name": inventory_products.get(pid, f"SKU-{pid}"),
                "quantity": qty
            }
            for pid, qty in inventory_by_product.items()
        ]
        inventory_total = sum(inventory_by_product.values())

        return {
            "sample": {
                "totalQuantity": sample_total,
                "skuDetails": sample_sku_details
            },
            "stock": {
                "totalQuantity": inventory_total,
                "skuDetails": inventory_sku_details
            }
        }

    except Exception as e:
        logger.error(f"Error fetching inventory statistics: {str(e)}")
        raise

async def get_inventory_distribution(supabase: Client, store_id: Optional[int] = None) -> List[InventoryDistributionItem]:
    try:
        query = supabase.table("inventory_view").select("product_id, stock")
        if store_id:
            query = query.eq("store_id", store_id)

        result = query.execute()
        data = getattr(result, "data", [])

        product_stock = {}
        for item in data:
            product_id = item.get("product_id")
            stock = int(item.get("stock", 0))
            if product_id and stock > 0:
                product_stock[product_id] = stock

        product_ids = list(product_stock.keys())
        products = {}
        if product_ids:
            products_query = supabase.table("products").select("product_id, sku_code").in_("product_id", product_ids)
            products_result = products_query.execute()
            products = {p["product_id"]: p["sku_code"] for p in getattr(products_result, "data", [])}

        distribution = [
            {
                "name": products.get(pid, f"SK-{pid}"),
                "quantity": qty
            }
            for pid, qty in product_stock.items()
        ]

        distribution.sort(key=lambda x: x["quantity"], reverse=True)
        return distribution

    except Exception as e:
        logger.error(f"Error fetching inventory distribution: {str(e)}")
        raise

async def get_inventory_records(
    supabase: Client,
    store_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[InventoryRecord]:
    try:
        query = supabase.table("inventory_shipments").select("*")
        if store_id:
            query = query.eq("store_id", store_id)
        if start_date:
            query = query.gte("shipping_date", start_date.isoformat())
        if end_date:
            query = query.lte("shipping_date", end_date.isoformat())

        result = query.execute()
        shipments = getattr(result, "data", [])

        store_ids = list(set(s.get("store_id") for s in shipments if s.get("store_id")))
        product_ids = list(set(s.get("product_id") for s in shipments if s.get("product_id")))

        stores = {}
        if store_ids:
            stores_query = supabase.table("stores").select("store_id, store_name").in_("store_id", store_ids)
            stores_result = stores_query.execute()
            stores = {s["store_id"]: s["store_name"] for s in getattr(stores_result, "data", [])}

        products = {}
        if product_ids:
            products_query = supabase.table("products").select("product_id, sku_name, sku_code").in_("product_id", product_ids)
            products_result = products_query.execute()
            products = {p["product_id"]: {"sku_name": p["sku_name"], "sku_code": p["sku_code"]} for p in getattr(products_result, "data", [])}

        records = []
        for shipment in shipments:
            product_id = shipment.get("product_id")
            store_id = shipment.get("store_id")
            created_by = shipment.get("created_by", "Unknown")

            records.append({
                "id": f"INV-{shipment['shipment_id']}",
                "createTime": shipment.get("created_at"),
                "inventory_date": shipment.get("shipping_date"),
                "store": stores.get(store_id, f"Store {store_id}"),
                "skuName": products.get(product_id, {}).get("sku_name", f"Product {product_id}"),
                "skuCode": products.get(product_id, {}).get("sku_code", f"SK-{product_id}"),
                "quantity": shipment.get("quantity"),
                "trackingNo": shipment.get("tracking_no"),
                "remarks": shipment.get("remarks"),
                "createdBy": created_by,
                "shipmentGroupId": str(shipment.get("shipment_group_id", shipment.get("shipment_id", ""))),
                "is_sample": shipment.get("is_sample")
            })

        return records

    except Exception as e:
        logger.error(f"Error fetching inventory records: {str(e)}")
        raise

async def add_inventory_records(supabase: Client, records: List[InventoryRecordCreate]) -> dict:
    try:
        shipments_to_insert = []
        for record in records:
            shipment = {
                "store_id": None,
                "product_id": None,
                "quantity": record.quantity,
                "is_sample": False,
                "tracking_no": record.trackingNo,
                "shipping_date": record.inventory_date,
                "remarks": record.remarks,
                "created_by": record.createdBy,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            store_query = supabase.table("stores").select("store_id").eq("store_name", record.store).execute()
            store_data = getattr(store_query, "data", [])
            if not store_data:
                raise HTTPException(status_code=400, detail=f"Store {record.store} not found")
            shipment["store_id"] = store_data[0]["store_id"]

            product_query = supabase.table("products").select("product_id").eq("sku_name", record.skuName).execute()
            product_data = getattr(product_query, "data", [])
            if not product_data:
                raise HTTPException(status_code=400, detail=f"Product {record.skuName} not found")
            shipment["product_id"] = product_data[0]["product_id"]

            shipments_to_insert.append(shipment)

        result = supabase.table("inventory_shipments").insert(shipments_to_insert).execute()
        if hasattr(result, "error") and result.error:
            raise Exception(result.error.message)

        return {"status": "success", "message": f"Added {len(shipments_to_insert)} inventory records"}

    except Exception as e:
        logger.error(f"Error adding inventory records: {str(e)}")
        raise
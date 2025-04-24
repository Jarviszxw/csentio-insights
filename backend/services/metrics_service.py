# metrics_service.py
from supabase import Client
from typing import Optional, Tuple, List
from datetime import date
import logging
from fastapi import HTTPException
from utils.utils import cal_pop_percentage, get_previous_date_range

from models.metrics import SalesResponse, GMVByStoreItem, GMVByProductItem, GMVByCityItem

logger = logging.getLogger(__name__)

def fetch_gmv_in_range(
    supabase: Client,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Tuple[float, bool]:
    logger.info(f"Fetching GMV for range: {start_date} to {end_date}")
    query = supabase.table("settlements").select("total_amount")
    if start_date:
        query = query.gte("settle_date", start_date.isoformat())
        logger.info(f"Added start_date filter: {start_date.isoformat()}")
    if end_date:
        query = query.lte("settle_date", end_date.isoformat())
        logger.info(f"Added end_date filter: {end_date.isoformat()}")

    logger.info(f"Executing Supabase query...")
    settlements_result = query.execute()
    settlements = getattr(settlements_result, "data", [])
    logger.info(f"Found {len(settlements)} settlements with total_amount")

    if not settlements:
        logger.warning("No settlements found for date range")
        return 0.0, False

    try:
        total_gmv = sum(float(settlement["total_amount"]) for settlement in settlements if "total_amount" in settlement and settlement["total_amount"] is not None)
        logger.info(f"Calculated total GMV: {total_gmv}")
        return total_gmv, True
    except Exception as e:
        logger.error(f"Error calculating GMV: {str(e)}")
        return 0.0, False

def fetch_stores_change_count_in_range(
    supabase: Client,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Tuple[int, int, int]:
    logger.info(f"Fetching stores change count for range: {start_date} to {end_date}")
    query = supabase.table("stores").select("store_id,is_active")
    if start_date:
        query = query.gte("updated_at", start_date.isoformat())
        logger.info(f"Added start_date filter: {start_date.isoformat()}")
    if end_date:
        query = query.lte("updated_at", end_date.isoformat())
        logger.info(f"Added end_date filter: {end_date.isoformat()}")

    stores_result = query.execute()
    stores = getattr(stores_result, "data", [])
    logger.info(f"Found {len(stores)} stores")

    active_stores = [store for store in stores if store["is_active"]]
    logger.info(f"Found {len(active_stores)} active stores")

    inactive_stores = [store for store in stores if not store["is_active"]]
    logger.info(f"Found {len(inactive_stores)} inactive stores")

    net_change = len(active_stores) - len(inactive_stores)
    logger.info(f"Net change: {net_change}")

    return len(active_stores), len(inactive_stores), net_change

async def fetch_sales_in_range(
    supabase: Client,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Tuple[int, bool]:
    logger.info(f"Fetching sales for range: {start_date} to {end_date}")
    query = supabase.table("settlements").select("settlement_id")
    if start_date:
        query = query.gte("settle_date", start_date.isoformat())
        logger.info(f"Added start_date filter: {start_date.isoformat()}")
    if end_date:
        query = query.lte("settle_date", end_date.isoformat())
        logger.info(f"Added end_date filter: {end_date.isoformat()}")

    logger.info(f"Executing settlements query...")
    settlements_result = query.execute()
    settlements = getattr(settlements_result, "data", [])
    logger.info(f"Found {len(settlements)} settlements")

    if not settlements:
        logger.warning("No settlements found for date range")
        return 0, False

    settlement_ids = [settlement["settlement_id"] for settlement in settlements]
    logger.info(f"Querying items for {len(settlement_ids)} settlement IDs")

    items_query = supabase.table("settlement_items").select("quantity").in_("settlement_id", settlement_ids)
    items_result = items_query.execute()
    items = getattr(items_result, "data", [])
    logger.info(f"Found {len(items)} items")

    total_sales = sum(int(item["quantity"]) for item in items if "quantity" in item and item["quantity"] is not None)
    logger.info(f"Calculated total sales: {total_sales}")

    return total_sales, True

async def get_total_sales(
    supabase: Client,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> SalesResponse:
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        if not start_date or not end_date:
            total_sales, _ = await fetch_sales_in_range(supabase)
            return SalesResponse(
                total_sales=total_sales,
                pop_percentage=0,
                trend="up"
            )

        total_sales, _ = await fetch_sales_in_range(supabase, start_date, end_date)

        prev_start_date, prev_end_date = get_previous_date_range(start_date, end_date)
        previous_sales, _ = await fetch_sales_in_range(supabase, prev_start_date, prev_end_date)

        pop_percentage = cal_pop_percentage(total_sales, previous_sales)
        trend = "up" if pop_percentage >= 0 else "down"

        return SalesResponse(
            total_sales=total_sales,
            pop_percentage=pop_percentage,
            trend=trend
        )

    except Exception as e:
        logger.error(f"Failed to get total sales: {str(e)}")
        return SalesResponse(
            total_sales=0,
            pop_percentage=0,
            trend="up",
            error=str(e)
        )

async def get_gmv_by_store(
    supabase: Client,
    start_date: date,
    end_date: date,
    limit: int
) -> List[GMVByStoreItem]:
    settlements_query = supabase.table("settlements").select("store_id,total_amount")
    settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
    settlements_query = settlements_query.lte("settle_date", end_date.isoformat())

    settlements_result = settlements_query.execute()
    settlements = getattr(settlements_result, "data", [])

    store_gmv = {}
    for settlement in settlements:
        store_id = settlement.get("store_id")
        total_amount = float(settlement.get("total_amount", 0))

        if not store_id:
            continue

        if store_id not in store_gmv:
            store_gmv[store_id] = 0

        store_gmv[store_id] += total_amount

    store_ids = list(store_gmv.keys())
    store_names = {}

    if store_ids:
        stores_query = supabase.table("stores").select("store_id,store_name")
        stores_query = stores_query.in_("store_id", store_ids)
        stores_result = stores_query.execute()
        stores = getattr(stores_result, "data", [])

        for store in stores:
            store_id = store.get("store_id")
            store_name = store.get("store_name", f"Store {store_id}")
            if store_id:
                store_names[store_id] = store_name

    result = []
    for store_id, gmv in store_gmv.items():
        store_name = store_names.get(store_id, f"Store {store_id}")
        result.append({
            "store": str(store_name),
            "gmv": gmv,
            "trend": 0
        })

    result.sort(key=lambda x: x["gmv"], reverse=True)
    return result[:limit]

async def get_gmv_by_product(
    supabase: Client,
    start_date: date,
    end_date: date,
    limit: int
) -> List[GMVByProductItem]:
    logger.info(f"Starting get_gmv_by_product for {start_date} to {end_date}, limit {limit}")
    try:
        settlements_query = supabase.table("settlements").select("settlement_id")
        settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
        settlements_query = settlements_query.lte("settle_date", end_date.isoformat())

        logger.info("Executing settlements query for product GMV...")
        settlements_result = settlements_query.execute()
        settlements = getattr(settlements_result, "data", [])
        logger.info(f"Found {len(settlements)} settlements in range.")

        if not settlements:
            logger.warning("No settlements found in range, returning empty list.")
            return []

        settlement_ids = [s["settlement_id"] for s in settlements if "settlement_id" in s]
        logger.info(f"Extracted {len(settlement_ids)} settlement IDs.")

        items_data = []
        if settlement_ids:
            logger.info("Querying settlement_items...")
            items_query = supabase.table("settlement_items").select("product_id,quantity,price")
            items_query = items_query.in_("settlement_id", settlement_ids)
            items_result = items_query.execute()
            items_data = getattr(items_result, "data", [])
            logger.info(f"Found {len(items_data)} settlement items.")
        else:
             logger.warning("No settlement IDs found, skipping items query.")


        product_gmv = {}
        logger.info("Calculating GMV per product...")
        for item in items_data:
            try:
                product_id = item.get("product_id")
                quantity_raw = item.get("quantity")
                price_raw = item.get("price")

                if not product_id:
                    logger.warning(f"Skipping item due to missing product_id: {item}")
                    continue
                
                if quantity_raw is None or price_raw is None:
                    logger.warning(f"Skipping item {item.get('item_id', 'N/A')} for product {product_id} due to missing quantity or price.")
                    continue

                quantity = int(quantity_raw)
                price = float(price_raw)

                if product_id not in product_gmv:
                    product_gmv[product_id] = 0

                product_gmv[product_id] += quantity * price
            except (ValueError, TypeError) as item_err:
                logger.error(f"Error processing settlement item {item.get('item_id', 'N/A')}: {item_err}, item data: {item}")
                continue

        logger.info(f"Calculated GMV for {len(product_gmv)} products.")

        product_ids = list(product_gmv.keys())
        product_names = {}

        if product_ids:
            logger.info("Querying product names...")
            products_query = supabase.table("products").select("product_id,sku_name")
            products_query = products_query.in_("product_id", product_ids)
            products_result = products_query.execute()
            products = getattr(products_result, "data", [])
            logger.info(f"Found {len(products)} product names.")

            for product in products:
                product_id = product.get("product_id")
                product_name = product.get("sku_name", f"Product {product_id}")
                if product_id:
                    product_names[product_id] = product_name
        else:
            logger.warning("No product IDs to query names for.")

        result = []
        logger.info("Formatting final result...")
        for product_id, gmv in product_gmv.items():
            product_name = product_names.get(product_id, f"Product {product_id}")
            result.append({
                "product": str(product_name),
                "gmv": gmv,
                "trend": 0
            })

        result.sort(key=lambda x: x["gmv"], reverse=True)
        logger.info(f"Returning top {limit} products by GMV.")
        return result[:limit]
    except Exception as e:
        logger.error(f"An unexpected error occurred in get_gmv_by_product: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error while fetching GMV by product: {str(e)}")

async def get_gmv_by_city(
    supabase: Client,
    start_date: date,
    end_date: date,
    limit: int
) -> List[GMVByCityItem]:
    logger.info(f"Starting get_gmv_by_city for {start_date} to {end_date}, limit {limit}")
    try:
        settlements_query = supabase.table("settlements").select("store_id,total_amount")
        settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
        settlements_query = settlements_query.lte("settle_date", end_date.isoformat())

        logger.info("Executing settlements query for city GMV...")
        settlements_result = settlements_query.execute()
        settlements = getattr(settlements_result, "data", [])
        logger.info(f"Found {len(settlements)} settlements in range.")


        store_gmv = {}
        logger.info("Calculating GMV per store...")
        for settlement in settlements:
             try:
                store_id = settlement.get("store_id")
                total_amount_raw = settlement.get("total_amount")

                if not store_id:
                    logger.warning(f"Skipping settlement due to missing store_id: {settlement.get('settlement_id', 'N/A')}")
                    continue
                
                if total_amount_raw is None:
                    logger.warning(f"Skipping settlement {settlement.get('settlement_id', 'N/A')} for store {store_id} due to missing total_amount.")
                    continue

                total_amount = float(total_amount_raw)

                if store_id not in store_gmv:
                    store_gmv[store_id] = 0

                store_gmv[store_id] += total_amount
             except (ValueError, TypeError) as settle_err:
                logger.error(f"Error processing settlement {settlement.get('settlement_id', 'N/A')}: {settle_err}, settlement data: {settlement}")
                continue

        logger.info(f"Calculated GMV for {len(store_gmv)} stores.")

        store_ids = list(store_gmv.keys())
        store_cities = {}

        if store_ids:
            logger.info("Querying store cities...")
            stores_query = supabase.table("stores").select("store_id,city_id")
            stores_query = stores_query.in_("store_id", store_ids)
            stores_result = stores_query.execute()
            stores = getattr(stores_result, "data", [])
            logger.info(f"Found {len(stores)} store city mappings.")


            for store in stores:
                store_id = store.get("store_id")
                city_id = store.get("city_id")
                if store_id and city_id:
                    store_cities[store_id] = city_id
                elif store_id:
                    logger.warning(f"Store {store_id} is missing city_id.")
        else:
            logger.warning("No store IDs to query cities for.")


        city_gmv = {}
        logger.info("Aggregating GMV per city...")
        for store_id, gmv in store_gmv.items():
            city_id = store_cities.get(store_id)
            if not city_id:
                logger.warning(f"Could not find city for store {store_id}, skipping its GMV ({gmv}) for city aggregation.")
                continue

            if city_id not in city_gmv:
                city_gmv[city_id] = 0

            city_gmv[city_id] += gmv
        logger.info(f"Aggregated GMV for {len(city_gmv)} cities.")

        city_ids = list(city_gmv.keys())
        city_names = {}

        if city_ids:
            logger.info("Querying city names...")
            cities_query = supabase.table("cities").select("id,city_name")
            cities_query = cities_query.in_("id", city_ids)
            cities_result = cities_query.execute()
            cities = getattr(cities_result, "data", [])
            logger.info(f"Found {len(cities)} city names.")


            for city in cities:
                city_id = city.get("id")
                city_name = city.get("city_name", f"City {city_id}")
                if city_id:
                    city_names[city_id] = city_name
        else:
             logger.warning("No city IDs to query names for.")


        result = []
        logger.info("Formatting final result...")
        for city_id, gmv in city_gmv.items():
            city_name = city_names.get(city_id, f"City {city_id}")
            result.append({
                "city": str(city_name),
                "gmv": gmv,
                "trend": 0
            })

        result.sort(key=lambda x: x["gmv"], reverse=True)
        logger.info(f"Returning top {limit} cities by GMV.")
        return result[:limit]
    except Exception as e:
        logger.error(f"An unexpected error occurred in get_gmv_by_city: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error while fetching GMV by city: {str(e)}")
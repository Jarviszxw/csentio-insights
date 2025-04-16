from supabase import Client
from typing import Optional, Tuple, List
from datetime import date, timedelta
import logging
from fastapi import HTTPException
from utils.utils import cal_pop_percentage, get_previous_date_range

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
) -> dict:
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        if not start_date or not end_date:
            total_sales, _ = await fetch_sales_in_range(supabase)
            return {
                "total_sales": total_sales,
                "pop_percentage": 0,
                "trend": "up"
            }

        total_sales, _ = await fetch_sales_in_range(supabase, start_date, end_date)

        prev_start_date, prev_end_date = get_previous_date_range(start_date, end_date)
        previous_sales, _ = await fetch_sales_in_range(supabase, prev_start_date, prev_end_date)

        pop_percentage = cal_pop_percentage(total_sales, previous_sales)
        trend = "up" if pop_percentage >= 0 else "down" 

        return {
            "total_sales": total_sales,
            "pop_percentage": pop_percentage,
            "trend": trend
        }

    except Exception as e:
        logger.error(f"Failed to get total sales: {str(e)}")
        return {
            "total_sales": 0,
            "pop_count": 0,
            "trend": "up",
            "error": str(e)
        }

async def get_gmv_by_store(
    supabase: Client,
    start_date: date,
    end_date: date,
    limit: int
) -> List[dict]:
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
            "store": str(store_name),  # 确保是字符串类型
            "gmv": gmv,
            "trend": 0  # 暂时没有计算trend的方法，设为0
        })
    
    result.sort(key=lambda x: x["gmv"], reverse=True)
    return result[:limit]

async def get_gmv_by_product(
    supabase: Client,
    start_date: date,
    end_date: date,
    limit: int
) -> List[dict]:
    # 1. 获取所有结算记录
    settlements_query = supabase.table("settlements").select("settlement_id")
    settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
    settlements_query = settlements_query.lte("settle_date", end_date.isoformat())
    
    settlements_result = settlements_query.execute()
    settlements = getattr(settlements_result, "data", [])
    
    # 如果没有结算记录，返回空结果
    if not settlements:
        return []
    
    settlement_ids = [s["settlement_id"] for s in settlements if "settlement_id" in s]
    
    # 2. 获取结算项目
    items_data = []
    if settlement_ids:
        items_query = supabase.table("settlement_items").select("product_id,quantity,price")
        items_query = items_query.in_("settlement_id", settlement_ids)
        items_result = items_query.execute()
        items_data = getattr(items_result, "data", [])
    
    # 3. 按产品聚合数据
    product_gmv = {}
    for item in items_data:
        product_id = item.get("product_id")
        quantity = int(item.get("quantity", 0))
        price = float(item.get("price", 0))
        
        if not product_id:
            continue
            
        if product_id not in product_gmv:
            product_gmv[product_id] = 0
            
        product_gmv[product_id] += quantity * price
    
    # 4. 获取产品名称
    product_ids = list(product_gmv.keys())
    product_names = {}
    
    if product_ids:
        products_query = supabase.table("products").select("product_id,sku_name")
        products_query = products_query.in_("product_id", product_ids)
        products_result = products_query.execute()
        products = getattr(products_result, "data", [])
        
        for product in products:
            product_id = product.get("product_id")
            product_name = product.get("sku_name", f"Product {product_id}")
            if product_id:
                product_names[product_id] = product_name
    
    # 5. 构建结果
    result = []
    for product_id, gmv in product_gmv.items():
        product_name = product_names.get(product_id, f"Product {product_id}")
        result.append({
            "product": str(product_name),  # 确保是字符串类型
            "gmv": gmv,
            "trend": 0  # 暂时没有计算trend的方法，设为0
        })
    
    # 6. 排序并限制结果数量
    result.sort(key=lambda x: x["gmv"], reverse=True)
    return result[:limit]

async def get_gmv_by_city(
    supabase: Client,
    start_date: date,
    end_date: date,
    limit: int
) -> List[dict]:
    # 1. 获取所有结算记录
    settlements_query = supabase.table("settlements").select("store_id,total_amount")
    settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
    settlements_query = settlements_query.lte("settle_date", end_date.isoformat())
    
    settlements_result = settlements_query.execute()
    settlements = getattr(settlements_result, "data", [])
    
    # 2. 按商店ID聚合数据
    store_gmv = {}
    for settlement in settlements:
        store_id = settlement.get("store_id")
        total_amount = float(settlement.get("total_amount", 0))
        
        if not store_id:
            continue
            
        if store_id not in store_gmv:
            store_gmv[store_id] = 0
            
        store_gmv[store_id] += total_amount
    
    # 3. 获取商店信息（包括城市ID）
    store_ids = list(store_gmv.keys())
    store_cities = {}
    
    if store_ids:
        stores_query = supabase.table("stores").select("store_id,city_id")
        stores_query = stores_query.in_("store_id", store_ids)
        stores_result = stores_query.execute()
        stores = getattr(stores_result, "data", [])
        
        for store in stores:
            store_id = store.get("store_id")
            city_id = store.get("city_id")
            if store_id and city_id:
                store_cities[store_id] = city_id
    
    # 4. 按城市聚合GMV
    city_gmv = {}
    for store_id, gmv in store_gmv.items():
        city_id = store_cities.get(store_id)
        if not city_id:
            continue
            
        if city_id not in city_gmv:
            city_gmv[city_id] = 0
            
        city_gmv[city_id] += gmv
    
    # 5. 获取城市名称
    city_ids = list(city_gmv.keys())
    city_names = {}
    
    if city_ids:
        cities_query = supabase.table("cities").select("id,city_name")
        cities_query = cities_query.in_("id", city_ids)
        cities_result = cities_query.execute()
        cities = getattr(cities_result, "data", [])
        
        for city in cities:
            city_id = city.get("id")
            city_name = city.get("city_name", f"City {city_id}")
            if city_id:
                city_names[city_id] = city_name
    
    # 6. 构建结果
    result = []
    for city_id, gmv in city_gmv.items():
        city_name = city_names.get(city_id, f"City {city_id}")
        result.append({
            "city": str(city_name),  # 确保是字符串类型
            "gmv": gmv,
            "trend": 0  # 暂时没有计算trend的方法，设为0
        })
    
    # 7. 排序并限制结果数量
    result.sort(key=lambda x: x["gmv"], reverse=True)
    return result[:limit]
    try:
        if not start_date or not end_date:
            total_sales, _ = await fetch_sales_in_range(supabase)
            return {
                "total_sales": total_sales,
                "pop_percentage": 0,
                "trend": "up"
            }

        total_sales, _ = await fetch_sales_in_range(supabase, start_date, end_date)

        prev_start_date, prev_end_date = get_previous_date_range(start_date, end_date)
        previous_sales, has_previous_data = await fetch_sales_in_range(supabase, prev_start_date, prev_end_date)

        pop_percentage = cal_pop_percentage(total_sales, previous_sales)
        trend = "up" if pop_percentage >= 0 else "down" 

        return {
            "total_sales": total_sales,
            "pop_percentage": pop_percentage,
            "trend": trend
        }

    except Exception as e:
        logger.error(f"Failed to get total sales: {str(e)}")
        return {
            "total_sales": 0,
            "pop_percentage": 0,
            "trend": "up",
            "error": str(e)
        }

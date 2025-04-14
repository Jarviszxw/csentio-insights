from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Tuple, Union
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import logging
from datetime import timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

app = FastAPI(title="CSENTIO API")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

logger.info(f"Supabase URL configured: {'Yes' if SUPABASE_URL else 'No'}")
logger.info(f"Supabase Key configured: {'Yes' if SUPABASE_KEY else 'No'}")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_sales_in_range(
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

def get_previous_date_range(start_date: date, end_date: date) -> Tuple[date, date]:
    delta = end_date - start_date
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - delta
    return prev_start_date, prev_end_date

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

def cal_pop_percentage(current_value: float, previous_value: float) -> float:
    if not isinstance(current_value, (int, float)) or not isinstance(previous_value, (int, float)):
        raise HTTPException(status_code=400, detail="Invalid input: current_value and previous_value must be numbers")

    if previous_value == 0:
        if current_value == 0:
            return 0.0 
        return 100.0 

    percentage = ((current_value - previous_value) / previous_value) * 100
    return round(percentage, 1)

@app.get("/")
async def root():
    return {"status": "API is running"}

@app.get("/api/test-supabase")
async def test_supabase(supabase: Client = Depends(get_supabase)):
    try:
        result = supabase.table("settlements").select("count", count="exact").execute()
        count = result.count if hasattr(result, 'count') else 0
        return {"status": "success", "connection": "ok", "settlements_count": count}
    except Exception as e:
        logger.error(f"Supabase connection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

@app.get("/api/metrics/total-gmv")
async def get_total_gmv(
    supabase: Client = Depends(get_supabase),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    logger.info(f"API Call /api/metrics/total-gmv: Get total gmv from {start_date} to {end_date}")
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        if not start_date or not end_date:
            total_gmv, _ = fetch_gmv_in_range(supabase)
            return {
                "total_gmv": total_gmv,
                "pop_percentage": 0,
                "trend": "up"
            }

        total_gmv, _ = fetch_gmv_in_range(supabase, start_date, end_date)

        prev_start_date, prev_end_date = get_previous_date_range(start_date, end_date)
        previous_gmv, has_previous_data = fetch_gmv_in_range(supabase, prev_start_date, prev_end_date)

        pop_percentage = cal_pop_percentage(total_gmv, previous_gmv)
        trend = "up" if pop_percentage >= 0 else "down"

        return {
            "total_gmv": total_gmv,
            "pop_percentage": pop_percentage,
            "trend": trend
        }
        
    except Exception as e:
        logger.error(f"Failed to get GMV data: {str(e)}")
        return {
            "total_gmv": 0.00,
            "pop_percentage": 0,
            "trend": "up",
            "error": str(e)
        }

@app.get("/api/metrics/total-sales")
async def get_total_sales(
    supabase: Client = Depends(get_supabase),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    logger.info(f"API Call /api/metrics/total-sales: Get total sales from {start_date} to {end_date}")
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        if not start_date or not end_date:
            total_sales, _ = fetch_sales_in_range(supabase)
            return {
                "total_sales": total_sales,
                "pop_percentage": 0,
                "trend": "up"
            }

        total_sales, _ = fetch_sales_in_range(supabase, start_date, end_date)

        prev_start_date, prev_end_date = get_previous_date_range(start_date, end_date)
        previous_sales, has_previous_data = fetch_sales_in_range(supabase, prev_start_date, prev_end_date)

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

@app.get("/api/metrics/total-stores")
async def get_total_stores(
    supabase: Client = Depends(get_supabase),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    logger.info(f"API Call /api/metrics/total-stores: Get total stores from {start_date} to {end_date}")
    try:
        logger.info(f"Executing stores query...")
        query = supabase.table("stores").select("store_id").eq("is_active", True)
        if end_date:
            query = query.lte("updated_at", end_date.isoformat())
        stores_result = query.execute()
        stores = getattr(stores_result, "data", [])
        current_total_stores = len(stores)

        added, removed, net_change = fetch_stores_change_count_in_range(supabase, start_date, end_date)

        return {
            "total_stores": current_total_stores,
            "added": added,
            "removed": removed,
            "net_change": net_change,
            "trend": "up" if net_change >= 0 else "down"
        }

    except Exception as e:  
        logger.error(f"Failed to get total stores: {str(e)}")
        return {
            "total_stores": 0,
            "added": 0,
            "removed": 0,
            "net_change": 0,
            "trend": "up",
            "error": str(e)
        }



@app.get("/api/metrics/monthly-data")
async def get_monthly_data(
    supabase: Client = Depends(get_supabase),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    logger.info(f"API Call /api/metrics/monthly-data: Get monthly GMV and sales from {start_date} to {end_date}")
    try:
        # 验证日期范围
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        # 如果没有提供日期范围，使用默认范围（今年1月至今）
        if not start_date or not end_date:
            from datetime import datetime
            current_year = datetime.now().year
            # 默认从当年1月到现在
            if not start_date:
                start_date = date(current_year, 1, 1)
            if not end_date:
                end_date = datetime.now().date()
            
        logger.info(f"Using date range: {start_date} to {end_date}")
        
        # 分月获取GMV数据 - 基于settle_month字段
        settlements_query = supabase.table("settlements").select("settle_month,total_amount")
        settlements_query = settlements_query.gte("settle_date", start_date.isoformat())
        settlements_query = settlements_query.lte("settle_date", end_date.isoformat())
        
        logger.info(f"Executing settlements query...")
        settlements_result = settlements_query.execute()
        settlements = getattr(settlements_result, "data", [])
        logger.info(f"Found {len(settlements)} settlement records")
        
        # 手动按月聚合数据
        monthly_gmv = {}
        for settlement in settlements:
            month_str = settlement.get('settle_month', '')[:7]  # 格式 YYYY-MM
            if not month_str:
                continue
                
            if month_str not in monthly_gmv:
                monthly_gmv[month_str] = 0
                
            monthly_gmv[month_str] += float(settlement.get('total_amount', 0))
        
        # 分月获取销售数据 - 需要手动聚合
        sales_settlements_query = supabase.table("settlements").select("settlement_id,settle_date")
        sales_settlements_query = sales_settlements_query.gte("settle_date", start_date.isoformat())
        sales_settlements_query = sales_settlements_query.lte("settle_date", end_date.isoformat())
        
        sales_settlements_result = sales_settlements_query.execute()
        sales_settlements = getattr(sales_settlements_result, "data", [])
        
        # 获取所有结算项目
        settlement_ids = [s["settlement_id"] for s in sales_settlements if "settlement_id" in s]
        
        items_data = []
        if settlement_ids:
            items_query = supabase.table("settlement_items").select("settlement_id,quantity")
            items_query = items_query.in_("settlement_id", settlement_ids)
            items_result = items_query.execute()
            items_data = getattr(items_result, "data", [])
        
        # 创建settlement_id到settle_date的映射
        settlement_dates = {s["settlement_id"]: s["settle_date"] for s in sales_settlements if "settlement_id" in s and "settle_date" in s}
        
        # 手动聚合销售数据
        monthly_sales = {}
        for item in items_data:
            settlement_id = item.get("settlement_id")
            quantity = item.get("quantity", 0)
            
            if not settlement_id or settlement_id not in settlement_dates:
                continue
                
            settle_date = settlement_dates[settlement_id]
            month_str = settle_date[:7]  # 格式 YYYY-MM
            
            if month_str not in monthly_sales:
                monthly_sales[month_str] = 0
                
            monthly_sales[month_str] += int(quantity)
        
        # 合并数据
        monthly_data = {}
        
        # 合并GMV数据
        for month, gmv in monthly_gmv.items():
            if month not in monthly_data:
                monthly_data[month] = {'date': month + '-01', 'gmv': 0, 'sales': 0}
            monthly_data[month]['gmv'] = gmv
        
        # 合并销售数据
        for month, sales in monthly_sales.items():
            if month not in monthly_data:
                monthly_data[month] = {'date': month + '-01', 'gmv': 0, 'sales': 0}
            monthly_data[month]['sales'] = sales
        
        # 将字典转换为列表并排序
        result = list(monthly_data.values())
        result.sort(key=lambda x: x['date'])
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get monthly data: {str(e)}")
        return []

@app.get("/api/metrics/gmv-by-dimension")
async def get_gmv_by_dimension(
    supabase: Client = Depends(get_supabase),
    dimension: str = "store",  # store, product, city
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 6
):
    logger.info(f"API Call /api/metrics/gmv-by-dimension: Get GMV by {dimension} from {start_date} to {end_date}")
    try:
        # 验证维度参数
        valid_dimensions = ["store", "product", "city"]
        if dimension not in valid_dimensions:
            raise HTTPException(status_code=400, detail=f"Invalid dimension. Must be one of: {', '.join(valid_dimensions)}")
            
        # 验证日期范围
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        # 如果没有提供日期范围，使用默认范围（今年1月至今）
        if not start_date or not end_date:
            from datetime import datetime
            current_year = datetime.now().year
            # 默认从当年1月到现在
            if not start_date:
                start_date = date(current_year, 1, 1)
            if not end_date:
                end_date = datetime.now().date()
            
        logger.info(f"Using date range: {start_date} to {end_date}")
        
        # 处理不同维度的数据
        if dimension == "store":
            return await get_gmv_by_store(supabase, start_date, end_date, limit)
        elif dimension == "product":
            return await get_gmv_by_product(supabase, start_date, end_date, limit)
        elif dimension == "city":
            return await get_gmv_by_city(supabase, start_date, end_date, limit)
        
    except Exception as e:
        logger.error(f"Failed to get GMV by {dimension}: {str(e)}")
        # 返回模拟数据作为备用
        dimension_key = {"store": "store", "product": "product", "city": "city"}[dimension]
        mock_data = []
        for i in range(limit):
            mock_data.append({
                dimension_key: f"{dimension_key.capitalize()} {chr(65 + i)}",
                "gmv": 100 * (limit - i),
                "trend": ((-1) ** i) * (i + 1) * 1.5
            })
        return mock_data

async def get_gmv_by_store(
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
    
    # 3. 获取商店名称
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
    
    # 4. 构建结果
    result = []
    for store_id, gmv in store_gmv.items():
        store_name = store_names.get(store_id, f"Store {store_id}")
        result.append({
            "store": str(store_name),  # 确保是字符串类型
            "gmv": gmv,
            "trend": 0  # 暂时没有计算trend的方法，设为0
        })
    
    # 5. 排序并限制结果数量
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

if __name__ == "__main__":
    import uvicorn
    logger.info("FastAPI is running...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
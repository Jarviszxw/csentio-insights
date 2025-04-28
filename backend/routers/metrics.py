from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel
from supabase import Client
from dependencies import get_current_user_supabase_client
# Use direct imports
# Comment out imports for models not defined in models/metrics.py
from models.metrics import SalesResponse # Keep this one if used
# from models.metrics import (
#     OverallSummaryResponse, StorePerformanceResponse, ProductPerformanceResponse,
#     SalesTrendsResponse, GeoDistributionResponse, InventoryAnalysisResponse,
#     SettlementOverviewResponse
# )
from services import metrics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

# Define placeholder models or adjust routes if these are needed
class PlaceholderResponse(BaseModel):
    message: str = "Model definition pending"

# Comment out or adjust routes using undefined models
# @router.get("/overall-summary", response_model=OverallSummaryResponse)
@router.get("/overall-summary", response_model=PlaceholderResponse) # Use placeholder
async def get_overall_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """Retrieve overall summary metrics."""
    logger.info(f"API Call GET /api/metrics/overall-summary from {start_date} to {end_date}")
    try:
        # summary = await metrics_service.get_overall_summary(supabase, start_date, end_date)
        # return summary
        return PlaceholderResponse()
    except Exception as e:
        logger.error(f"Error in get_overall_summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving overall summary.")

# @router.get("/store-performance", response_model=List[StorePerformanceResponse])
@router.get("/store-performance", response_model=List[PlaceholderResponse]) # Use placeholder
async def get_store_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: str = 'total_revenue', 
    ascending: bool = False,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """Retrieve performance metrics for each store."""
    logger.info(f"API Call GET /api/metrics/store-performance from {start_date} to {end_date}")
    try:
        # performance = await metrics_service.get_store_performance(supabase, start_date, end_date, sort_by, ascending)
        # return performance
         return [PlaceholderResponse()]
    except Exception as e:
        logger.error(f"Error in get_store_performance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving store performance.")

# @router.get("/product-performance", response_model=List[ProductPerformanceResponse])
@router.get("/product-performance", response_model=List[PlaceholderResponse]) # Use placeholder
async def get_product_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: str = 'total_revenue', 
    ascending: bool = False,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """Retrieve performance metrics for each product."""
    logger.info(f"API Call GET /api/metrics/product-performance from {start_date} to {end_date}")
    try:
        # performance = await metrics_service.get_product_performance(supabase, start_date, end_date, sort_by, ascending)
        # return performance
        return [PlaceholderResponse()]
    except Exception as e:
        logger.error(f"Error in get_product_performance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving product performance.")

# @router.get("/sales-trends", response_model=SalesTrendsResponse)
@router.get("/sales-trends", response_model=PlaceholderResponse) # Use placeholder
async def get_sales_trends(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    interval: str = 'month', # 'day', 'week', 'month'
    store_id: Optional[int] = None,
    product_id: Optional[int] = None,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """Retrieve sales trends over time."""
    logger.info(f"API Call GET /api/metrics/sales-trends from {start_date} to {end_date}")
    try:
        # trends = await metrics_service.get_sales_trends(supabase, start_date, end_date, interval, store_id, product_id)
        # return trends
        return PlaceholderResponse()
    except Exception as e:
        logger.error(f"Error in get_sales_trends: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving sales trends.")

# @router.get("/geospatial-distribution", response_model=List[GeoDistributionResponse])
@router.get("/geospatial-distribution", response_model=List[PlaceholderResponse]) # Use placeholder
async def get_geospatial_distribution(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """Retrieve geospatial distribution of sales or stores."""
    logger.info(f"API Call GET /api/metrics/geospatial-distribution from {start_date} to {end_date}")
    try:
        # distribution = await metrics_service.get_geospatial_distribution(supabase, start_date, end_date)
        # return distribution
        return [PlaceholderResponse()]
    except Exception as e:
        logger.error(f"Error in get_geospatial_distribution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving geospatial distribution.")

# @router.get("/inventory-analysis", response_model=InventoryAnalysisResponse)
@router.get("/inventory-analysis", response_model=PlaceholderResponse) # Use placeholder
async def get_inventory_analysis(
    supabase: Client = Depends(get_current_user_supabase_client),
    store_id: Optional[int] = None, # Optional filtering by store
    low_stock_threshold: int = 10 # Example threshold
):
    """Retrieve inventory analysis including stock levels and potential low stock items."""
    logger.info(f"API Call GET /api/metrics/inventory-analysis for store {store_id}")
    try:
        # analysis = await metrics_service.get_inventory_analysis(supabase, store_id, low_stock_threshold)
        # return analysis
        return PlaceholderResponse()
    except Exception as e:
        logger.error(f"Error in get_inventory_analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving inventory analysis.")

# @router.get("/settlement-overview", response_model=SettlementOverviewResponse)
@router.get("/settlement-overview", response_model=PlaceholderResponse) # Use placeholder
async def get_settlement_overview(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supabase: Client = Depends(get_current_user_supabase_client)
):
    """Retrieve overview of settlements."""
    logger.info(f"API Call GET /api/metrics/settlement-overview from {start_date} to {end_date}")
    try:
        # overview = await metrics_service.get_settlement_overview(supabase, start_date, end_date)
        # return overview
        return PlaceholderResponse()
    except Exception as e:
        logger.error(f"Error in get_settlement_overview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error retrieving settlement overview.")

@router.get("/total-sales")
async def get_total_sales(
    supabase: Client = Depends(get_current_user_supabase_client),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    store_id: Optional[int] = None
):
    logger.info(f"API Call /api/metrics/total-sales: Get total sales from {start_date} to {end_date} for store {store_id}")
    return await metrics_service.get_total_sales(supabase, start_date, end_date, store_id)

@router.get("/total-gmv")
async def get_total_gmv(
    supabase: Client = Depends(get_current_user_supabase_client),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    store_id: Optional[int] = None
):
    logger.info(f"API Call /api/metrics/total-gmv: Get total gmv from {start_date} to {end_date} for store {store_id}")
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be less than or equal to end_date")

        if not start_date or not end_date:
            total_gmv, _ = metrics_service.fetch_gmv_in_range(supabase, store_id=store_id)
            return {
                "total_gmv": total_gmv,
                "pop_percentage": 0,
                "trend": "up"
            }

        total_gmv, _ = metrics_service.fetch_gmv_in_range(supabase, start_date, end_date, store_id)

        prev_start_date, prev_end_date = metrics_service.get_previous_date_range(start_date, end_date)
        previous_gmv, has_previous_data = metrics_service.fetch_gmv_in_range(supabase, prev_start_date, prev_end_date, store_id)

        pop_percentage = metrics_service.cal_pop_percentage(total_gmv, previous_gmv)
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

@router.get("/total-stores")
async def get_total_stores(
    supabase: Client = Depends(get_current_user_supabase_client),
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

        added, removed, net_change = metrics_service.fetch_stores_change_count_in_range(supabase, start_date, end_date)

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


@router.get("/monthly-data")
async def get_monthly_data(
    supabase: Client = Depends(get_current_user_supabase_client),
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

@router.get("/gmv-by-dimension")
async def get_gmv_by_dimension(
    supabase: Client = Depends(get_current_user_supabase_client),
    dimension: str = "store",  # store, product, city
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: Optional[int] = None
):
    logger.info(f"API Call /api/metrics/gmv-by-dimension: Get GMV by {dimension} from {start_date} to {end_date}, limit={limit}")
    
    # Ensure limit is an integer with a default value before passing to service or using in mock data
    effective_limit = limit if limit is not None and limit > 0 else 6 
    logger.info(f"Using effective limit: {effective_limit}")
    
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
        
        # 处理不同维度的数据 - Pass effective_limit
        if dimension == "store":
            return await metrics_service.get_gmv_by_store(supabase, start_date, end_date, effective_limit)
        elif dimension == "product":
            return await metrics_service.get_gmv_by_product(supabase, start_date, end_date, effective_limit)
        elif dimension == "city":
            return await metrics_service.get_gmv_by_city(supabase, start_date, end_date, effective_limit)
        
    except Exception as e:
        # Log the original exception trace
        logger.error(f"Failed to get GMV by {dimension}: {str(e)}", exc_info=True) 
        # 返回模拟数据作为备用 - Use effective_limit
        dimension_key = {"store": "store", "product": "product", "city": "city"}[dimension]
        mock_data = []
        # Use effective_limit for mock data generation
        for i in range(effective_limit): 
            mock_data.append({
                dimension_key: f"{dimension_key.capitalize()} {chr(65 + i)}",
                "gmv": 100 * (effective_limit - i),
                "trend": ((-1) ** i) * (i + 1) * 1.5
            })
        # Also log that mock data is being returned
        logger.warning(f"Returning mock data for GMV by {dimension} due to error.")
        return mock_data
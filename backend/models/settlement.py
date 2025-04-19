from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class SettlementBase(BaseModel):
    settlement_id: int
    settle_date: date
    store_id: int
    total_amount: float

class SettlementItem(BaseModel):
    item_id: int
    settlement_id: int
    product_id: int
    quantity: int
    price: float
 
class SalesMetrics(BaseModel):
    total_sales: int
    pop_percentage: float = 0
    trend: str = "up"
from pydantic import BaseModel
from typing import Optional

class SalesResponse(BaseModel):
    total_sales: int
    pop_percentage: float
    trend: str
    error: Optional[str] = None

class GMVByStoreItem(BaseModel):
    store: str
    gmv: float
    trend: float

class GMVByProductItem(BaseModel):
    product: str
    gmv: float
    trend: float

class GMVByCityItem(BaseModel):
    city: str
    gmv: float
    trend: float
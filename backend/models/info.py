from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoreResponse(BaseModel):
    store_id: int
    store_name: str
    address: Optional[str]
    city_id: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    contact_info: Optional[str]
    contract_info: Optional[str]
    contract_file_url: Optional[str]

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: int
    name: str
    code: str
    price: Optional[float]
class CityResponse(BaseModel):
    id: int
    name: str
    latitude: Optional[float]
    longitude: Optional[float]
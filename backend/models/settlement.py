from pydantic import BaseModel, Field, validator
from typing import Optional, List, Union
from datetime import date, datetime

class SettlementItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    item_id: Optional[int] = None

class SettlementItemCreate(SettlementItemBase):
    unit_price: float = Field(..., ge=0)
    item_id: Optional[int] = None

class SettlementItemUpdate(SettlementItemBase):
    unit_price: float = Field(..., ge=0)
    item_id: int

class SettlementItemDB(SettlementItemBase):
    item_id: int
    settlement_id: int
    price: float

    class Config:
        orm_mode = True

class SettlementBase(BaseModel):
    settle_date: date
    store_id: int
    total_amount: float = Field(..., ge=0)
    remarks: Optional[str] = None

class SettlementCreate(SettlementBase):
    items: List[SettlementItemCreate] = Field(..., min_items=1)

class SettlementUpdate(SettlementBase):
    items: List[Union[SettlementItemUpdate, SettlementItemCreate]]

class SettlementDB(SettlementBase):
    settlement_id: int
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    settle_month: date

    class Config:
        from_attributes = True

class SettlementResponse(SettlementDB):
    class ProductInfo(BaseModel):
        id: int
        name: str
        code: str
        class Config:
            from_attributes = True
             
    class SettlementItemResponse(SettlementItemDB):
        products: Optional['ProductInfo'] = None
        class Config:
            from_attributes = True
         
    items: List['SettlementItemResponse'] = []
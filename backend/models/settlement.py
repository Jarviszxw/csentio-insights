from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Union

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
        from_attributes = True

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

class ProductInfo(BaseModel):
    product_id: int
    sku_name: str
    sku_code: str

    class Config:
        from_attributes = True

class SettlementItemResponse(SettlementItemDB):
    products: Optional[ProductInfo] = None

    class Config:
        from_attributes = True

class SettlementResponse(SettlementDB):
    items: List[SettlementItemResponse] = []

    class Config:
        from_attributes = True

class SettlementItemRecord(BaseModel):
    item_id: int
    product_id: int
    quantity: int
    price: float
    products: str  # 对应产品名称（sku_name）

    class Config:
        from_attributes = True

class SettlementRecord(BaseModel):
    settlement_id: int
    settle_date: str  # 数据库返回的日期可能是字符串
    store: str
    total_amount: float
    remarks: Optional[str]
    created_by: str
    items: List[SettlementItemRecord]

    class Config:
        from_attributes = True
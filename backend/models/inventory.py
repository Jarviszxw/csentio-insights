from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class SkuDetail(BaseModel):
    id: int
    name: str
    quantity: int

class InventoryStatisticsResponse(BaseModel):
    sample: dict  # {"totalQuantity": int, "skuDetails": List[SkuDetail]}
    stock: dict   # {"totalQuantity": int, "skuDetails": List[SkuDetail]}

class InventoryDistributionItem(BaseModel):
    name: str
    quantity: int

class InventoryRecord(BaseModel):
    id: str
    createTime: str
    inventory_date: str
    store: str
    skuName: str
    skuCode: str
    quantity: int
    trackingNo: Optional[str]
    remarks: Optional[str]
    createdBy: str
    shipmentGroupId: str
    is_sample: bool

    class Config:
        from_attributes = True

class InventoryRecordCreate(BaseModel):
    store: str
    skuName: str
    quantity: int = Field(..., gt=0)
    trackingNo: Optional[str] = None
    inventory_date: str  # ISO 格式日期字符串
    remarks: Optional[str] = None
    createdBy: Optional[str] = "system"

class InventoryRecordUpdate(BaseModel):
    store: str
    skuName: str
    quantity: int = Field(..., gt=0)
    trackingNo: Optional[str] = None
    remarks: Optional[str] = None

class InventoryRecordDB(InventoryRecord):
    id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class InventoryRecordResponse(InventoryRecordDB):
    store: str
    skuName: str
    quantity: int
    trackingNo: Optional[str]
    remarks: Optional[str]
    createdBy: str
    shipmentGroupId: str

    class Config:
        from_attributes = True

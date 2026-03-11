"""
Hotel Edge System - Pydantic Schemas
数据验证模型，基于 SPECIFICATION.md
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ========== User Schemas ==========
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: str = "staff"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Guest Schemas ==========
class GuestBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    id_card: Optional[str] = Field(None, max_length=20)
    vip_level: int = 0
    notes: Optional[str] = None


class GuestCreate(GuestBase):
    pass


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    id_card: Optional[str] = None
    vip_level: Optional[int] = None
    notes: Optional[str] = None


class GuestResponse(GuestBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Room Type Schemas ==========
class RoomTypeBase(BaseModel):
    name: str = Field(..., max_length=50)
    code: str = Field(..., max_length=20)
    description: Optional[str] = None
    base_price: float = Field(..., gt=0)
    max_occupancy: int = 2
    bed_count: int = 1
    amenities: Optional[dict] = None


class RoomTypeCreate(RoomTypeBase):
    pass


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    max_occupancy: Optional[int] = None
    bed_count: Optional[int] = None
    amenities: Optional[dict] = None


class RoomTypeResponse(RoomTypeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Room Schemas ==========
class RoomBase(BaseModel):
    number: str = Field(..., max_length=10)
    floor: Optional[int] = None
    room_type_id: int
    features: Optional[dict] = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    floor: Optional[int] = None
    room_type_id: Optional[int] = None
    status: Optional[str] = None
    features: Optional[dict] = None


class RoomResponse(RoomBase):
    id: int
    status: str
    room_type: Optional[RoomTypeResponse] = None
    
    class Config:
        from_attributes = True


# ========== Booking Schemas ==========
class BookingBase(BaseModel):
    guest_id: int
    room_type_id: int
    room_id: Optional[int] = None
    check_in_date: datetime
    check_out_date: datetime
    expected_arrival_time: Optional[datetime] = None
    room_rate: float = Field(..., gt=0)
    source: str = "walk-in"
    special_requests: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    room_type_id: Optional[int] = None
    room_id: Optional[int] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    expected_arrival_time: Optional[datetime] = None
    room_rate: Optional[float] = None
    status: Optional[str] = None
    special_requests: Optional[str] = None


class BookingResponse(BookingBase):
    id: int
    booking_no: str
    nights: int
    total_amount: float
    deposit: float
    status: str
    created_at: datetime
    guest: Optional[GuestResponse] = None
    room: Optional[RoomResponse] = None
    
    class Config:
        from_attributes = True


# ========== Check-In Schemas ==========
class CheckInBase(BaseModel):
    booking_id: Optional[int] = None
    guest_id: int
    room_id: int
    check_in_time: datetime
    check_out_time: datetime
    room_rate: float = Field(..., gt=0)
    deposit: float = 0
    pay_method: Optional[str] = None
    notes: Optional[str] = None


class CheckInCreate(CheckInBase):
    pass


class CheckInUpdate(BaseModel):
    check_out_time: Optional[datetime] = None
    room_rate: Optional[float] = None
    deposit: Optional[float] = None
    pay_method: Optional[str] = None
    notes: Optional[str] = None


class CheckInResponse(CheckInBase):
    id: int
    check_in_no: str
    actual_check_in_time: Optional[datetime] = None
    actual_check_out_time: Optional[datetime] = None
    status: str
    check_out_balance: float
    operator_id: Optional[int] = None
    created_at: datetime
    guest: Optional[GuestResponse] = None
    room: Optional[RoomResponse] = None
    
    class Config:
        from_attributes = True


# ========== Consumption Schemas ==========
class ConsumptionBase(BaseModel):
    check_in_id: int
    item_name: str
    quantity: int = 1
    unit_price: float = Field(..., gt=0)
    category: str = "minibar"


class ConsumptionCreate(ConsumptionBase):
    pass


class ConsumptionResponse(ConsumptionBase):
    id: int
    total_amount: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Room Device Schemas ==========
class RoomDeviceBase(BaseModel):
    room_id: int
    device_type: str
    device_name: str
    device_code: str
    mqtt_topic: Optional[str] = None


class RoomDeviceCreate(RoomDeviceBase):
    pass


class RoomDeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    status: Optional[str] = None
    state: Optional[dict] = None
    mqtt_topic: Optional[str] = None


class RoomDeviceResponse(RoomDeviceBase):
    id: int
    status: str
    state: Optional[dict] = None
    
    class Config:
        from_attributes = True


class DeviceControlRequest(BaseModel):
    """设备控制请求"""
    device_id: int
    action: str  # on, off, set
    value: Optional[dict] = None  # {"temperature": 25, "brightness": 80}


# ========== Scene Schemas ==========
class SceneBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    room_id: Optional[int] = None
    actions: List[dict]
    is_active: bool = True


class SceneCreate(SceneBase):
    pass


class SceneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    room_id: Optional[int] = None
    actions: Optional[List[dict]] = None
    is_active: Optional[bool] = None


class SceneResponse(SceneBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Dashboard Schemas ==========
class DashboardStats(BaseModel):
    """运营驾驶舱统计数据"""
    today_check_in: int = 0
    today_check_out: int = 0
    available_rooms: int = 0
    occupied_rooms: int = 0
    maintenance_rooms: int = 0
    total_rooms: int = 0
    occupancy_rate: float = 0.0
    today_revenue: float = 0.0
    pending_bookings: int = 0


# ========== Auth Schemas ==========
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# ========== Supplier Schemas ==========
class SupplierBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    category: str = "other"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    bank_info: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    rating: int = 5
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    bank_info: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    rating: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Warehouse Schemas ==========
class WarehouseBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    location: Optional[str] = None
    manager_id: Optional[int] = None
    notes: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class WarehouseResponse(WarehouseBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Inventory Item Schemas ==========
class InventoryItemBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    category: str = "other"
    unit: str = Field(..., max_length=20)
    min_stock: float = 0
    max_stock: float = 0
    warning_level: float = 0
    unit_price: float = 0
    storage_location: Optional[str] = None
    expiry_tracking: bool = False
    notes: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    warning_level: Optional[float] = None
    unit_price: Optional[float] = None
    storage_location: Optional[str] = None
    expiry_tracking: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class InventoryItemResponse(InventoryItemBase):
    id: int
    current_stock: float
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class InventoryItemWithStock(InventoryItemResponse):
    """带库存状态的物品"""
    stock_status: str = "normal"  # normal, low, critical, overstock


# ========== Purchase Order Schemas ==========
class PurchaseOrderItemBase(BaseModel):
    item_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    notes: Optional[str] = None


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    order_id: int
    total_amount: float
    received_quantity: float
    item: Optional[InventoryItemResponse] = None
    
    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    warehouse_id: Optional[int] = None
    expected_date: Optional[datetime] = None
    notes: Optional[str] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    warehouse_id: Optional[int] = None
    expected_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    order_no: str
    order_date: datetime
    total_amount: float
    status: str
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    ordered_by: Optional[int] = None
    created_at: datetime
    supplier: Optional[SupplierResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    items: List[PurchaseOrderItemResponse] = []
    
    class Config:
        from_attributes = True


# ========== Stock Record Schemas ==========
class StockRecordBase(BaseModel):
    item_id: int
    warehouse_id: int
    record_type: str
    quantity: float
    unit_price: Optional[float] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None


class StockRecordCreate(StockRecordBase):
    pass


class StockRecordResponse(StockRecordBase):
    id: int
    balance: float
    total_amount: Optional[float]
    operator_id: Optional[int] = None
    created_at: datetime
    item: Optional[InventoryItemResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    
    class Config:
        from_attributes = True


# ========== Purchase Statistics Schemas ==========
class PurchaseStatistics(BaseModel):
    """采购统计"""
    total_orders: int = 0
    pending_orders: int = 0
    approved_orders: int = 0
    received_orders: int = 0
    total_amount: float = 0.0
    approved_amount: float = 0.0


class InventoryStatistics(BaseModel):
    """库存统计"""
    total_items: int = 0
    low_stock_items: int = 0
    out_of_stock_items: int = 0
    total_value: float = 0.0


# ========== Product Schemas ==========
class ProductBase(BaseModel):
    product_code: str
    product_name: str
    category: str = "other"
    brand: Optional[str] = None
    specification: Optional[str] = None
    unit: str
    price: float = 0
    stock: int = 0
    min_order: int = 1
    supplier_id: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    status: bool = True
    is_featured: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    min_order: Optional[int] = None
    supplier_id: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Shopping Cart Schemas ==========
class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemCreate(CartItemBase):
    pass


class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    created_at: datetime
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True


# ========== Department Schemas ==========
class DepartmentBase(BaseModel):
    name: str
    code: str
    manager_id: Optional[int] = None
    parent_id: Optional[int] = None


class DepartmentResponse(DepartmentBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Procurement Request Schemas ==========
class ProcurementRequestItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class ProcurementRequestItemCreate(ProcurementRequestItemBase):
    pass


class ProcurementRequestItemResponse(ProcurementRequestItemBase):
    id: int
    request_id: int
    total_amount: float
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True


class ProcurementRequestBase(BaseModel):
    dept_id: Optional[int] = None
    expected_date: Optional[datetime] = None
    urgency: str = "normal"
    purpose: Optional[str] = None


class ProcurementRequestCreate(ProcurementRequestBase):
    items: List[ProcurementRequestItemCreate]


class ProcurementRequestResponse(ProcurementRequestBase):
    id: int
    request_no: str
    applicant_id: int
    total_amount: float
    freight: float = 0
    status: str
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    applicant: Optional[UserResponse] = None
    department: Optional[DepartmentResponse] = None
    items: List[ProcurementRequestItemResponse] = []
    
    class Config:
        from_attributes = True


# ========== Purchase Order New Schemas ==========
class PurchaseOrderNewItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class PurchaseOrderNewItemCreate(PurchaseOrderNewItemBase):
    pass


class PurchaseOrderNewItemResponse(PurchaseOrderNewItemBase):
    id: int
    order_id: int
    total_amount: float
    received_qty: int = 0
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True


class PurchaseOrderNewBase(BaseModel):
    request_id: Optional[int] = None
    supplier_id: int
    warehouse_id: Optional[int] = None
    freight: float = 0
    logistics_no: Optional[str] = None
    estimated_arrival: Optional[datetime] = None
    contact_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None


class PurchaseOrderNewCreate(PurchaseOrderNewBase):
    items: List[PurchaseOrderNewItemCreate]


class PurchaseOrderNewResponse(PurchaseOrderNewBase):
    id: int
    order_no: str
    total_amount: float
    status: str
    actual_arrival: Optional[datetime] = None
    created_at: datetime
    supplier: Optional[SupplierResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    items: List[PurchaseOrderNewItemResponse] = []
    
    class Config:
        from_attributes = True


# ========== Stock In Schemas ==========
class StockInItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    batch_no: Optional[str] = None
    production_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    quality_status: str = "ok"


class StockInItemCreate(StockInItemBase):
    pass


class StockInItemResponse(StockInItemBase):
    id: int
    stock_in_id: int
    total_amount: float
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True


class StockInBase(BaseModel):
    in_type: str
    supplier_id: Optional[int] = None
    order_id: Optional[int] = None
    warehouse_id: int
    in_date: Optional[datetime] = None
    remark: Optional[str] = None


class StockInCreate(StockInBase):
    items: List[StockInItemCreate]


class StockInResponse(StockInBase):
    id: int
    in_code: str
    total_qty: int = 0
    total_amount: float = 0
    status: str
    operator_id: Optional[int] = None
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    supplier: Optional[SupplierResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    operator: Optional[UserResponse] = None
    items: List[StockInItemResponse] = []
    
    class Config:
        from_attributes = True


# ========== Stock Out Schemas ==========
class StockOutItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class StockOutItemCreate(StockOutItemBase):
    pass


class StockOutItemResponse(StockOutItemBase):
    id: int
    stock_out_id: int
    total_amount: float
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True


class StockOutBase(BaseModel):
    out_type: str
    department_id: Optional[int] = None
    warehouse_id: int
    out_date: Optional[datetime] = None
    remark: Optional[str] = None


class StockOutCreate(StockOutBase):
    items: List[StockOutItemCreate]


class StockOutResponse(StockOutBase):
    id: int
    out_code: str
    total_qty: int = 0
    total_amount: float = 0
    status: str
    applicant_id: Optional[int] = None
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    department: Optional[DepartmentResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    applicant: Optional[UserResponse] = None
    items: List[StockOutItemResponse] = []
    
    class Config:
        from_attributes = True


# ========== Stock Alert Schemas ==========
class StockAlertResponse(BaseModel):
    id: int
    product_id: int
    alert_type: str
    current_qty: int
    threshold: Optional[int] = None
    status: str
    created_at: datetime
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True

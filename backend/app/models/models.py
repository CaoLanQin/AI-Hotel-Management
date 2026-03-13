"""
Hotel Edge System - Data Models
基于 SPECIFICATION.md 的数据库规范
- 表名：小写复数形式
- 字段名：snake_case
- 时间戳：created_at, updated_at
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class BookingStatus(str, enum.Enum):
    """预订状态"""
    PENDING = "pending"          # 待确认
    CONFIRMED = "confirmed"     # 已确认
    CANCELLED = "cancelled"     # 已取消
    CHECKED_IN = "checked_in"   # 已入住
    NO_SHOW = "no_show"         # 未到店
    COMPLETED = "completed"     # 已完成


class RoomStatus(str, enum.Enum):
    """房间状态"""
    AVAILABLE = "available"     # 可用
    OCCUPIED = "occupied"       # 已入住
    MAINTENANCE = "maintenance"  # 维修中
    CLEANING = "cleaning"       # 清洁中
    BLOCKED = "blocked"         # 锁定


class CheckInStatus(str, enum.Enum):
    """入住状态"""
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default="staff")  # admin, manager, staff
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Guest(Base):
    """客人表"""
    __tablename__ = "guests"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True)
    email = Column(String(100))
    id_card = Column(String(20))  # 身份证号
    vip_level = Column(Integer, default=0)  # VIP等级
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    bookings = relationship("Booking", back_populates="guest")
    check_ins = relationship("CheckIn", back_populates="guest")


class RoomType(Base):
    """房型表"""
    __tablename__ = "room_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # 大床房、双床房、豪华套房等
    code = Column(String(20), unique=True, index=True)  # STD, DELUXE, SUITE
    description = Column(Text)
    base_price = Column(Float, nullable=False)  # 基础价格
    max_occupancy = Column(Integer, default=2)  # 最大入住人数
    bed_count = Column(Integer, default=1)  # 床位数量
    amenities = Column(JSON)  # 设施列表
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    rooms = relationship("Room", back_populates="room_type")


class Room(Base):
    """房间表"""
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(10), unique=True, index=True, nullable=False)  # 房号 1001, 1002
    floor = Column(Integer)  # 楼层
    room_type_id = Column(Integer, ForeignKey("room_types.id"))
    status = Column(Enum(RoomStatus), default=RoomStatus.AVAILABLE)
    current_check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=True)
    features = Column(JSON)  # 房间特色
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    room_type = relationship("RoomType", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")
    devices = relationship("RoomDevice", back_populates="room")
    check_ins = relationship("CheckIn", back_populates="room", foreign_keys="CheckIn.room_id")


class Booking(Base):
    """预订表"""
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_no = Column(String(20), unique=True, index=True, nullable=False)  # 预订编号 BK20260309001
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)  # 入住时分配
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    expected_arrival_time = Column(DateTime)  # 预计到店时间
    nights = Column(Integer, nullable=False)  # 入住晚数
    room_rate = Column(Float, nullable=False)  # 房价
    total_amount = Column(Float, nullable=False)  # 总价
    deposit = Column(Float, default=0)  # 押金
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    source = Column(String(50))  # 预订来源：walk-in, phone, OTA
    special_requests = Column(Text)  # 特殊要求
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    guest = relationship("Guest", back_populates="bookings")
    room_type = relationship("RoomType")
    room = relationship("Room", back_populates="bookings")
    check_ins = relationship("CheckIn", back_populates="booking")


class CheckIn(Base):
    """入住表"""
    __tablename__ = "check_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    check_in_no = Column(String(20), unique=True, index=True, nullable=False)  # 入住编号 CI20260309001
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    check_in_time = Column(DateTime, nullable=False)
    check_out_time = Column(DateTime, nullable=False)
    actual_check_in_time = Column(DateTime)  # 实际入住时间
    actual_check_out_time = Column(DateTime)  # 实际退房时间
    status = Column(Enum(CheckInStatus), default=CheckInStatus.CHECKED_IN)
    room_rate = Column(Float, nullable=False)  # 房价
    deposit = Column(Float, default=0)  # 押金
    pay_method = Column(String(20))  # 支付方式
    check_out_balance = Column(Float, default=0)  # 退房结算金额
    operator_id = Column(Integer, ForeignKey("users.id"))  # 操作员
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    booking = relationship("Booking", back_populates="check_ins")
    guest = relationship("Guest", back_populates="check_ins")
    room = relationship("Room", back_populates="check_ins", foreign_keys=[room_id])
    operator = relationship("User")
    consumptions = relationship("Consumption", back_populates="check_in")


class Consumption(Base):
    """消费记录表（迷你吧、餐饮等）"""
    __tablename__ = "consumptions"
    
    id = Column(Integer, primary_key=True, index=True)
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=False)
    item_name = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    category = Column(String(20))  # minibar, dining, spa, laundry
    status = Column(String(20), default="pending")  # pending, paid
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    check_in = relationship("CheckIn", back_populates="consumptions")


class RoomDevice(Base):
    """客房设备表"""
    __tablename__ = "room_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    device_type = Column(String(50), nullable=False)  # light, curtain, ac, tv, lock
    device_name = Column(String(100), nullable=False)
    device_code = Column(String(50), unique=True, index=True)  # 设备唯一编码
    status = Column(String(20), default="offline")  # online, offline
    state = Column(JSON)  # 当前状态 {power: on, temperature: 25}
    mqtt_topic = Column(String(100))  # MQTT主题
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    room = relationship("Room", back_populates="devices")


class Scene(Base):
    """场景表"""
    __tablename__ = "scenes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    code = Column(String(20), unique=True, index=True)  # scene_code
    description = Column(Text)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)  # 可为全局场景
    actions = Column(JSON, nullable=False)  # [{device_type: "light", action: "on", value: 100}]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class OperationLog(Base):
    """操作日志表"""
    __tablename__ = "operation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    module = Column(String(50), nullable=False)  # 模块：frontdesk, room_control
    operation = Column(String(50), nullable=False)  # 操作：check_in, check_out
    target_type = Column(String(50))  # 目标类型：booking, room, device
    target_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    user = relationship("User")


# ==================== 供应链与采购模块 ====================

class SupplierCategory(str, enum.Enum):
    """供应商类别"""
    FOOD = "food"           # 食品饮料
    HOUSEKEEPING = "housekeeping"  # 客房用品
    EQUIPMENT = "equipment"  # 设备维修
    STATIONERY = "stationery"  # 办公文具
    OTHER = "other"         # 其他


class Supplier(Base):
    """供应商表"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 供应商名称
    code = Column(String(20), unique=True, index=True)  # 供应商编码
    category = Column(Enum(SupplierCategory), default=SupplierCategory.OTHER)
    contact_person = Column(String(50))  # 联系人
    phone = Column(String(20))  # 电话
    email = Column(String(100))  # 邮箱
    address = Column(Text)  # 地址
    bank_info = Column(String(200))  # 银行信息
    tax_id = Column(String(30))  # 税号
    payment_terms = Column(String(50))  # 付款条款
    rating = Column(Integer, default=5)  # 评分 1-5
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PurchaseOrderStatus(str, enum.Enum):
    """采购订单状态"""
    DRAFT = "draft"           # 草稿
    PENDING = "pending"       # 待审批
    APPROVED = "approved"     # 已审批
    REJECTED = "rejected"     # 已拒绝
    ORDERED = "ordered"       # 已下单
    RECEIVED = "received"     # 已入库
    CANCELLED = "cancelled"   # 已取消


class PurchaseOrder(Base):
    """采购订单表"""
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(20), unique=True, index=True, nullable=False)  # PO20260310001
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    order_date = Column(DateTime, nullable=False)
    expected_date = Column(DateTime)  # 期望到货日期
    total_amount = Column(Float, default=0)
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.DRAFT)
    approver_id = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    ordered_by = Column(Integer, ForeignKey("users.id"))  # 采购人
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    supplier = relationship("Supplier")
    warehouse = relationship("Warehouse")
    approver = relationship("User", foreign_keys=[approver_id])
    creator = relationship("User", foreign_keys=[ordered_by])
    items = relationship("PurchaseOrderItem", back_populates="order")


class PurchaseOrderItem(Base):
    """采购订单明细表"""
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0)  # 已入库数量
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    order = relationship("PurchaseOrder", back_populates="items")
    item = relationship("InventoryItem")


class Warehouse(Base):
    """仓库表"""
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 仓库名称
    code = Column(String(20), unique=True, index=True)  # 仓库编码
    location = Column(String(200))  # 位置
    manager_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    manager = relationship("User")


class InventoryItemCategory(str, enum.Enum):
    """库存物品类别"""
    FOOD = "food"           # 食品
    BEVERAGE = "beverage"   # 饮料
    HOUSEKEEPING = "housekeeping"  # 客房用品
    STATIONERY = "stationery"  # 办公用品
    MAINTENANCE = "maintenance"  # 维修材料
    OTHER = "other"         # 其他


class InventoryItem(Base):
    """库存物品表"""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 物品名称
    code = Column(String(20), unique=True, index=True)  # 物品编码
    category = Column(Enum(InventoryItemCategory), default=InventoryItemCategory.OTHER)
    unit = Column(String(20), nullable=False)  # 单位：个、箱、袋
    min_stock = Column(Float, default=0)  # 最低库存
    max_stock = Column(Float, default=0)  # 最高库存
    current_stock = Column(Float, default=0)  # 当前库存
    warning_level = Column(Float, default=0)  # 预警数量
    unit_price = Column(Float, default=0)  # 单价
    storage_location = Column(String(100))  # 存放位置
    expiry_tracking = Column(Boolean, default=False)  # 是否跟踪有效期
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    stock_records = relationship("StockRecord", back_populates="item")


class StockRecordType(str, enum.Enum):
    """库存记录类型"""
    PURCHASE = "purchase"     # 采购入库
    RETURN = "return"          # 退货
    TRANSFER = "transfer"     # 调拨
    ADJUST = "adjust"          # 调整
    CONSUME = "consume"        # 消耗


class StockRecord(Base):
    """库存记录表"""
    __tablename__ = "stock_records"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    record_type = Column(Enum(StockRecordType), nullable=False)
    quantity = Column(Float, nullable=False)  # 数量（正数入库，负数出库）
    balance = Column(Float, nullable=False)  # 变动后余额
    unit_price = Column(Float)  # 单价
    total_amount = Column(Float)  # 总金额
    reference_type = Column(String(50))  # 来源类型：purchase_order, transfer
    reference_id = Column(Integer)  # 来源ID
    operator_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    item = relationship("InventoryItem", back_populates="stock_records")
    warehouse = relationship("Warehouse")
    operator = relationship("User")


# ==================== 智能采购商城模块 ====================

class ProductCategory(str, enum.Enum):
    """商品分类"""
    HOUSEKEEPING = "housekeeping"  # 客房用品
    DINING = "dining"  # 餐饮用品
    CLEANING = "cleaning"  # 清洁用品
    ENGINEERING = "engineering"  # 工程物资
    STATIONERY = "stationery"  # 办公用品
    OTHER = "other"


class Product(Base):
    """商品表（智能采购商城）"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(30), unique=True, index=True, nullable=False)  # 商品编码
    product_name = Column(String(100), nullable=False)  # 商品名称
    category = Column(Enum(ProductCategory), default=ProductCategory.OTHER)
    brand = Column(String(50))  # 品牌
    specification = Column(String(100))  # 规格
    unit = Column(String(20), nullable=False)  # 单位
    price = Column(Float, nullable=False, default=0)  # 参考价格
    stock = Column(Integer, default=0)  # 库存数量
    min_order = Column(Integer, default=1)  # 起订量
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))  # 供应商
    image_url = Column(String(500))  # 商品图片
    description = Column(Text)  # 商品描述
    status = Column(Boolean, default=True)  # 上下架状态
    is_featured = Column(Boolean, default=False)  # 是否推荐
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    supplier = relationship("Supplier")
    # 多供应商报价（价格比较功能）
    supplier_prices = relationship("ProductSupplierPrice", back_populates="product", cascade="all, delete-orphan")


class ProductSupplierPrice(Base):
    """商品多供应商报价表"""
    __tablename__ = "product_supplier_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    price = Column(Float, nullable=False)  # 供应商报价
    min_order_qty = Column(Integer, default=1)  # 起订量
    discount_rate = Column(Float, default=0)  # 折扣率
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime)  # 生效日期
    valid_to = Column(DateTime)  # 失效日期
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    product = relationship("Product", back_populates="supplier_prices")
    supplier = relationship("Supplier")


class ShoppingCart(Base):
    """购物车表"""
    __tablename__ = "shopping_cart"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    user = relationship("User")
    product = relationship("Product")


class ProcurementRequestStatus(str, enum.Enum):
    """采购申请状态"""
    DRAFT = "draft"  # 草稿
    PENDING = "pending"  # 待审批
    APPROVED = "approved"  # 已审批
    REJECTED = "rejected"  # 已拒绝
    ORDERED = "ordered"  # 已下单
    RECEIVED = "received"  # 已入库
    CANCELLED = "cancelled"  # 已取消


class ProcurementRequest(Base):
    """采购申请表"""
    __tablename__ = "procurement_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    request_no = Column(String(20), unique=True, index=True, nullable=False)  # 申请单号
    dept_id = Column(Integer, ForeignKey("departments.id"))  # 部门
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 申请人
    total_amount = Column(Float, default=0)  # 总金额
    freight = Column(Float, default=0)  # 运费
    urgency = Column(String(20), default="normal")  # 紧急程度: normal, urgent, critical
    status = Column(Enum(ProcurementRequestStatus), default=ProcurementRequestStatus.DRAFT)
    expected_date = Column(DateTime)  # 期望到货日期
    purpose = Column(Text)  # 用途说明
    approver_id = Column(Integer, ForeignKey("users.id"))  # 审批人
    approved_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    applicant = relationship("User", foreign_keys=[applicant_id])
    approver = relationship("User", foreign_keys=[approver_id])
    department = relationship("Department")
    items = relationship("ProcurementRequestItem", back_populates="request")


class ProcurementRequestItem(Base):
    """采购申请明细表"""
    __tablename__ = "procurement_request_items"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("procurement_requests.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    request = relationship("ProcurementRequest", back_populates="items")
    product = relationship("Product")


class OrderStatus(str, enum.Enum):
    """订单状态"""
    PENDING = "pending"  # 待确认
    CONFIRMED = "confirmed"  # 已确认
    SHIPPED = "shipped"  # 已发货
    DELIVERING = "delivering"  # 配送中
    DELIVERED = "delivered"  # 已送达
    COMPLETED = "completed"  # 已完成
    CANCELLED = "cancelled"  # 已取消


class PurchaseOrderNew(Base):
    """采购订单表（新）"""
    __tablename__ = "purchase_orders_new"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(20), unique=True, index=True, nullable=False)  # 订单号
    request_id = Column(Integer, ForeignKey("procurement_requests.id"))  # 关联申请
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    total_amount = Column(Float, default=0)
    freight = Column(Float, default=0)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    logistics_no = Column(String(50))  # 物流单号
    estimated_arrival = Column(DateTime)  # 预计送达
    actual_arrival = Column(DateTime)  # 实际送达
    contact_phone = Column(String(20))  # 联系电话
    delivery_address = Column(String(200))  # 配送地址
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关系
    supplier = relationship("Supplier")
    warehouse = relationship("Warehouse")
    request = relationship("ProcurementRequest")
    items = relationship("PurchaseOrderNewItem", back_populates="order")


class PurchaseOrderNewItem(Base):
    """采购订单明细表（新）"""
    __tablename__ = "purchase_orders_new_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders_new.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    received_qty = Column(Integer, default=0)  # 已收货数量
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    order = relationship("PurchaseOrderNew", back_populates="items")
    product = relationship("Product")


class Department(Base):
    """部门表"""
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # 部门名称
    code = Column(String(20), unique=True, index=True)  # 部门编码
    manager_id = Column(Integer, ForeignKey("users.id"))  # 部门经理
    parent_id = Column(Integer, ForeignKey("departments.id"))  # 上级部门
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    manager = relationship("User")
    parent = relationship("Department", remote_side=[id])


class StockIn(Base):
    """入库单表"""
    __tablename__ = "stock_in"
    
    id = Column(Integer, primary_key=True, index=True)
    in_code = Column(String(20), unique=True, index=True, nullable=False)  # 入库单号
    in_type = Column(String(20), nullable=False)  # 入库类型: purchase, return, transfer, inventory
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    order_id = Column(Integer, ForeignKey("purchase_orders_new.id"))  # 关联订单
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    total_qty = Column(Integer, default=0)  # 总数量
    total_amount = Column(Float, default=0)  # 总金额
    status = Column(String(20), default="draft")  # draft, pending, approved, rejected
    in_date = Column(DateTime)  # 入库日期
    operator_id = Column(Integer, ForeignKey("users.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    supplier = relationship("Supplier")
    warehouse = relationship("Warehouse")
    operator = relationship("User", foreign_keys=[operator_id])
    approver = relationship("User", foreign_keys=[approver_id])
    items = relationship("StockInItem", back_populates="stock_in")


class StockInItem(Base):
    """入库单明细表"""
    __tablename__ = "stock_in_items"
    
    id = Column(Integer, primary_key=True, index=True)
    stock_in_id = Column(Integer, ForeignKey("stock_in.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    batch_no = Column(String(30))  # 批次号
    production_date = Column(DateTime)  # 生产日期
    expiry_date = Column(DateTime)  # 有效期
    quality_status = Column(String(20), default="ok")  # ok, rejected
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    stock_in = relationship("StockIn", back_populates="items")
    product = relationship("Product")


class StockOut(Base):
    """出库单表"""
    __tablename__ = "stock_out"
    
    id = Column(Integer, primary_key=True, index=True)
    out_code = Column(String(20), unique=True, index=True, nullable=False)  # 出库单号
    out_type = Column(String(20), nullable=False)  # 出库类型: consume, transfer, damage, return
    department_id = Column(Integer, ForeignKey("departments.id"))  # 领用部门
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    total_qty = Column(Integer, default=0)
    total_amount = Column(Float, default=0)
    status = Column(String(20), default="draft")
    applicant_id = Column(Integer, ForeignKey("users.id"))  # 申请人
    approver_id = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    out_date = Column(DateTime)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    department = relationship("Department")
    warehouse = relationship("Warehouse")
    applicant = relationship("User", foreign_keys=[applicant_id])
    approver = relationship("User", foreign_keys=[approver_id])
    items = relationship("StockOutItem", back_populates="stock_out")


class StockOutItem(Base):
    """出库单明细表"""
    __tablename__ = "stock_out_items"
    
    id = Column(Integer, primary_key=True, index=True)
    stock_out_id = Column(Integer, ForeignKey("stock_out.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    stock_out = relationship("StockOut", back_populates="items")
    product = relationship("Product")


class StockAlert(Base):
    """库存预警表"""
    __tablename__ = "stock_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    alert_type = Column(String(20), nullable=False)  # low_stock, expiry, overstock
    current_qty = Column(Integer, nullable=False)
    threshold = Column(Integer)
    status = Column(String(20), default="pending")  # pending, resolved
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    
    # 关系
    product = relationship("Product")


class AutomationRule(Base):
    """自动化规则表"""
    __tablename__ = "automation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 规则名称
    description = Column(Text)  # 规则描述
    trigger_type = Column(String(50), nullable=False)  # 触发类型: time, device_state, sensor
    trigger_condition = Column(JSON, nullable=False)  # 触发条件
    actions = Column(JSON, nullable=False)  # 执行动作
    priority = Column(Integer, default=10)  # 优先级
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class EnergyRecord(Base):
    """能耗记录表"""
    __tablename__ = "energy_records"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    device_type = Column(String(50), nullable=False)  # 设备类型
    power = Column(Float, default=0)  # 功率 (W)
    energy = Column(Float, default=0)  # 能耗 (kWh)
    duration = Column(Integer, default=0)  #运行时长(秒)
    recorded_at = Column(DateTime, server_default=func.now())


class UpgradeType(str, enum.Enum):
    """变更类型"""
    UPGRADE = 1
    DOWNGRADE = 2


class UpgradeReason(str, enum.Enum):
    """升级原因"""
    PAID = 1        # 付费升级
    VIP = 2         # 会员权益
    COMPENSATION = 3  # 投诉补偿
    OVERBOOKING = 4   # 超售安排


class RoomUpgrade(Base):
    """房型变更记录表"""
    __tablename__ = "room_upgrades"
    
    id = Column(Integer, primary_key=True, index=True)
    upgrade_no = Column(String(32), unique=True, index=True, nullable=False)  # 变更单号
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=False)
    upgrade_type = Column(Integer, nullable=False)  # 1=升级, 2=降级
    old_room_type = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    new_room_type = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    old_room = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    new_room = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    old_rate = Column(Float, nullable=False, default=0)  # 原房价
    new_rate = Column(Float, nullable=False, default=0)  # 新房价
    rate_diff = Column(Float, nullable=False, default=0)  # 差价/晚
    nights = Column(Integer, nullable=False, default=0)  # 剩余晚数
    total_diff = Column(Float, nullable=False, default=0)  # 总差价
    upgrade_reason = Column(Integer, nullable=False, default=1)  # 升级原因
    is_free = Column(Integer, nullable=False, default=0)  # 是否免费
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    status = Column(String(20), default="completed")  # 状态: pending, completed, cancelled
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MenuItem(Base):
    """菜单项表"""
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # 菜单名称
    path = Column(String(100))  # 路由路径（顶级菜单为空）
    icon = Column(String(50))  # 图标名称
    sort_order = Column(Integer, default=0)  # 排序
    parent_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)  # 父菜单ID
    is_visible = Column(Boolean, default=True)  # 是否可见
    is_expandable = Column(Boolean, default=False)  # 是否可展开（包含子菜单）
    default_expanded = Column(Boolean, default=False)  # 默认是否展开
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 自关联
    children = relationship("MenuItem", backref="parent", remote_side=[id])


class RoleMenu(Base):
    """角色菜单关联表"""
    __tablename__ = "role_menus"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False)  # 角色: admin, manager, staff
    menu_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    can_access = Column(Boolean, default=True)  # 是否有权限访问
    created_at = Column(DateTime, server_default=func.now())

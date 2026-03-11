"""
Hotel Edge System - Supply Chain & Purchase API
本地供应链和采购管理模块
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.config import get_settings
from app.models.models import (
    Supplier, Warehouse, InventoryItem, PurchaseOrder, PurchaseOrderItem, StockRecord,
    SupplierCategory, PurchaseOrderStatus, InventoryItemCategory, StockRecordType
)
from app.schemas.schemas import (
    SupplierCreate, SupplierUpdate, SupplierResponse,
    WarehouseCreate, WarehouseUpdate, WarehouseResponse,
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse, InventoryItemWithStock,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse,
    StockRecordCreate, StockRecordResponse,
    PurchaseStatistics, InventoryStatistics
)
from app.api.auth import get_current_user
from app.models.models import User

router = APIRouter()
settings = get_settings()


# ==================== 供应商管理 ====================

@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建供应商"""
    # 检查编码是否已存在
    existing = db.query(Supplier).filter(Supplier.code == supplier.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="供应商编码已存在")
    
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("/suppliers", response_model=List[SupplierResponse])
def list_suppliers(
    skip: int = 0, 
    limit: int = 100, 
    category: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取供应商列表"""
    query = db.query(Supplier)
    if category:
        query = query.filter(Supplier.category == category)
    if is_active is not None:
        query = query.filter(Supplier.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取供应商详情"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier: SupplierUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """更新供应商"""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    for key, value in supplier.model_dump(exclude_unset=True).items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """删除供应商（软删除）"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    supplier.is_active = False
    db.commit()
    return {"message": "供应商已删除"}


# ==================== 仓库管理 ====================

@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建仓库"""
    existing = db.query(Warehouse).filter(Warehouse.code == warehouse.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="仓库编码已存在")
    
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


@router.get("/warehouses", response_model=List[WarehouseResponse])
def list_warehouses(
    skip: int = 0, 
    limit: int = 100, 
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取仓库列表"""
    query = db.query(Warehouse)
    if is_active is not None:
        query = query.filter(Warehouse.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取仓库详情"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="仓库不存在")
    return warehouse


@router.put("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: int, warehouse: WarehouseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """更新仓库"""
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="仓库不存在")
    
    for key, value in warehouse.model_dump(exist_unset=True).items():
        setattr(db_warehouse, key, value)
    
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


# ==================== 库存物品管理 ====================

@router.post("/inventory", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: InventoryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建库存物品"""
    existing = db.query(InventoryItem).filter(InventoryItem.code == item.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="物品编码已存在")
    
    db_item = InventoryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/inventory", response_model=List[InventoryItemResponse])
def list_inventory_items(
    skip: int = 0, 
    limit: int = 100, 
    category: str = None,
    is_active: bool = None,
    low_stock: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取库存物品列表"""
    query = db.query(InventoryItem)
    if category:
        query = query.filter(InventoryItem.category == category)
    if is_active is not None:
        query = query.filter(InventoryItem.is_active == is_active)
    if low_stock:
        query = query.filter(InventoryItem.current_stock <= InventoryItem.warning_level)
    
    return query.offset(skip).limit(limit).all()


@router.get("/inventory/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取库存物品详情"""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    return item


@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(item_id: int, item: InventoryItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """更新库存物品"""
    db_item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="物品不存在")
    
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/inventory/low-stock/list", response_model=List[InventoryItemResponse])
def list_low_stock_items(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取低库存物品列表"""
    return db.query(InventoryItem).filter(
        InventoryItem.is_active == True,
        InventoryItem.current_stock <= InventoryItem.warning_level
    ).offset(skip).limit(limit).all()


# ==================== 采购订单管理 ====================

def generate_order_no(db: Session):
    """生成订单编号"""
    from datetime import datetime
    now = datetime.now()
    count = db.query(PurchaseOrder).filter(
        PurchaseOrder.order_date >= now.replace(hour=0, minute=0, second=0)
    ).count() + 1
    return f"PO{now.strftime('%Y%m%d')}{count:03d}"


@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(order: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建采购订单"""
    # 生成订单编号
    order_no = generate_order_no(db)
    
    # 计算总金额
    total_amount = sum(item.quantity * item.unit_price for item in order.items)
    
    db_order = PurchaseOrder(
        order_no=order_no,
        supplier_id=order.supplier_id,
        warehouse_id=order.warehouse_id,
        order_date=datetime.now(),
        expected_date=order.expected_date,
        total_amount=total_amount,
        status=PurchaseOrderStatus.DRAFT,
        ordered_by=current_user.id,
        notes=order.notes
    )
    db.add(db_order)
    db.flush()
    
    # 添加订单明细
    for item in order.items:
        db_item = PurchaseOrderItem(
            order_id=db_order.id,
            item_id=item.item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.quantity * item.unit_price,
            notes=item.notes
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    skip: int = 0, 
    limit: int = 100, 
    status: str = None,
    supplier_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采购订单列表"""
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    
    return query.order_by(PurchaseOrder.order_date.desc()).offset(skip).limit(limit).all()


@router.get("/purchase-orders/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取采购订单详情"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.put("/purchase-orders/{order_id}/submit", response_model=PurchaseOrderResponse)
def submit_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """提交采购订单（待审批）"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status != PurchaseOrderStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只有草稿状态的订单可以提交")
    
    order.status = PurchaseOrderStatus.PENDING
    db.commit()
    db.refresh(order)
    return order


@router.put("/purchase-orders/{order_id}/approve", response_model=PurchaseOrderResponse)
def approve_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """审批采购订单"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status != PurchaseOrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="只有待审批状态的订单可以审批")
    
    order.status = PurchaseOrderStatus.APPROVED
    order.approver_id = current_user.id
    order.approved_at = datetime.now()
    db.commit()
    db.refresh(order)
    return order


@router.put("/purchase-orders/{order_id}/reject", response_model=PurchaseOrderResponse)
def reject_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """拒绝采购订单"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status != PurchaseOrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="只有待审批状态的订单可以拒绝")
    
    order.status = PurchaseOrderStatus.REJECTED
    db.commit()
    db.refresh(order)
    return order


@router.put("/purchase-orders/{order_id}/order", response_model=PurchaseOrderResponse)
def order_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """下达采购订单"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status != PurchaseOrderStatus.APPROVED:
        raise HTTPException(status_code=400, detail="只有已审批状态的订单可以下达")
    
    order.status = PurchaseOrderStatus.ORDERED
    db.commit()
    db.refresh(order)
    return order


@router.put("/purchase-orders/{order_id}/receive", response_model=PurchaseOrderResponse)
def receive_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """入库采购订单"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status != PurchaseOrderStatus.ORDERED:
        raise HTTPException(status_code=400, detail="只有已下达状态的订单可以入库")
    
    # 获取默认仓库
    warehouse_id = order.warehouse_id
    if not warehouse_id:
        warehouse = db.query(Warehouse).first()
        if not warehouse:
            raise HTTPException(status_code=400, detail="请先创建仓库")
        warehouse_id = warehouse.id
    
    # 为每个订单项创建入库记录
    for item in order.items:
        # 更新物品库存
        inventory_item = db.query(InventoryItem).filter(InventoryItem.id == item.item_id).first()
        if inventory_item:
            new_stock = inventory_item.current_stock + item.quantity
            inventory_item.current_stock = new_stock
            
            # 创建库存记录
            stock_record = StockRecord(
                item_id=item.item_id,
                warehouse_id=warehouse_id,
                record_type=StockRecordType.PURCHASE,
                quantity=item.quantity,
                balance=new_stock,
                unit_price=item.unit_price,
                total_amount=item.total_amount,
                reference_type="purchase_order",
                reference_id=order_id,
                operator_id=current_user.id,
                notes="采购入库"
            )
            db.add(stock_record)
        
        # 更新已入库数量
        item.received_quantity = item.quantity
    
    order.status = PurchaseOrderStatus.RECEIVED
    db.commit()
    db.refresh(order)
    return order


@router.delete("/purchase-orders/{order_id}")
def cancel_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """取消采购订单"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status not in [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING]:
        raise HTTPException(status_code=400, detail="该状态无法取消")
    
    order.status = PurchaseOrderStatus.CANCELLED
    db.commit()
    return {"message": "订单已取消"}


@router.delete("/purchase-orders/{order_id}/delete")
def delete_purchase_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """删除采购订单（草稿或已拒绝状态）"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status not in [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="只有草稿或已拒绝状态的订单可以删除")
    
    # 删除订单明细
    db.query(PurchaseOrderItem).filter(PurchaseOrderItem.order_id == order_id).delete()
    # 删除订单
    db.delete(order)
    db.commit()
    return {"message": "订单已删除"}


# ==================== 库存记录 ====================

@router.post("/stock-records", response_model=StockRecordResponse, status_code=status.HTTP_201_CREATED)
def create_stock_record(record: StockRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建库存记录（手动入库/出库）"""
    item = db.query(InventoryItem).filter(InventoryItem.id == record.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    
    # 计算新库存
    new_balance = item.current_stock + record.quantity
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="库存不足")
    
    # 更新库存
    item.current_stock = new_balance
    
    # 计算金额
    if record.unit_price:
        total_amount = abs(record.quantity) * record.unit_price
    else:
        total_amount = abs(record.quantity) * item.unit_price
    
    # 创建库存记录
    db_record = StockRecord(
        item_id=record.item_id,
        warehouse_id=record.warehouse_id,
        record_type=StockRecordType(record.record_type),
        quantity=record.quantity,
        balance=new_balance,
        unit_price=record.unit_price or item.unit_price,
        total_amount=total_amount,
        operator_id=current_user.id,
        notes=record.notes
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/stock-records", response_model=List[StockRecordResponse])
def list_stock_records(
    skip: int = 0, 
    limit: int = 100, 
    item_id: int = None,
    warehouse_id: int = None,
    record_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取库存记录列表"""
    query = db.query(StockRecord)
    if item_id:
        query = query.filter(StockRecord.item_id == item_id)
    if warehouse_id:
        query = query.filter(StockRecord.warehouse_id == warehouse_id)
    if record_type:
        query = query.filter(StockRecord.record_type == record_type)
    
    return query.order_by(StockRecord.created_at.desc()).offset(skip).limit(limit).all()


# ==================== 统计报表 ====================

@router.get("/purchase-statistics", response_model=PurchaseStatistics)
def get_purchase_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取采购统计"""
    orders = db.query(PurchaseOrder).all()
    
    stats = PurchaseStatistics(
        total_orders=len(orders),
        pending_orders=sum(1 for o in orders if o.status == PurchaseOrderStatus.PENDING),
        approved_orders=sum(1 for o in orders if o.status == PurchaseOrderStatus.APPROVED),
        received_orders=sum(1 for o in orders if o.status == PurchaseOrderStatus.RECEIVED),
        total_amount=sum(o.total_amount for o in orders if o.status in [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.RECEIVED]),
        approved_amount=sum(o.total_amount for o in orders if o.status in [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.RECEIVED])
    )
    return stats


@router.get("/inventory-statistics", response_model=InventoryStatistics)
def get_inventory_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取库存统计"""
    items = db.query(InventoryItem).filter(InventoryItem.is_active == True).all()
    
    stats = InventoryStatistics(
        total_items=len(items),
        low_stock_items=sum(1 for i in items if i.current_stock <= i.warning_level),
        out_of_stock_items=sum(1 for i in items if i.current_stock <= 0),
        total_value=sum(i.current_stock * i.unit_price for i in items)
    )
    return stats

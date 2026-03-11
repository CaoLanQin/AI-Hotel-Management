"""
Hotel Edge System - Procurement & Supply Chain API
智能采购商城 + 库存管理模块
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.core.database import get_db
from app.core.config import get_settings
from app.models.models import (
    Product, ShoppingCart, ProcurementRequest, ProcurementRequestItem,
    PurchaseOrderNew, PurchaseOrderNewItem,
    Department, StockIn, StockInItem, StockOut, StockOutItem, StockAlert,
    ProductCategory, ProcurementRequestStatus, OrderStatus, Supplier
)
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    CartItemCreate, CartItemResponse,
    DepartmentBase, DepartmentResponse,
    ProcurementRequestCreate, ProcurementRequestResponse,
    PurchaseOrderNewCreate, PurchaseOrderNewResponse,
    StockInCreate, StockInResponse,
    StockOutCreate, StockOutResponse,
    StockAlertResponse
)
from app.api.auth import get_current_user
from app.models.models import User

router = APIRouter()
settings = get_settings()


# ==================== 部门管理 ====================

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept: DepartmentBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建部门"""
    existing = db.query(Department).filter(Department.code == dept.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="部门编码已存在")
    
    db_dept = Department(**dept.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept


@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取部门列表"""
    return db.query(Department).filter(Department.is_active == True).offset(skip).limit(limit).all()


# ==================== 供应商管理 ====================

from app.models.models import ProductSupplierPrice
from pydantic import BaseModel
from typing import Optional

class SupplierBase(BaseModel):
    name: str
    code: str
    category: str = "other"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    rating: int = 5

class SupplierResponse(BaseModel):
    id: int
    name: str
    code: str
    category: str = "other"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    rating: int = 5
    is_active: bool
    
    class Config:
        from_attributes = True


@router.get("/suppliers", response_model=List[SupplierResponse])
def list_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取供应商列表"""
    return db.query(Supplier).filter(Supplier.is_active == True).offset(skip).limit(limit).all()


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建供应商"""
    existing = db.query(Supplier).filter(Supplier.code == supplier.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="供应商编码已存在")
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


# ==================== 供应商报价（价格比较）====================

class ProductSupplierPriceBase(BaseModel):
    product_id: int
    supplier_id: int
    price: float
    min_order_qty: int = 1
    discount_rate: float = 0

class ProductSupplierPriceResponse(BaseModel):
    id: int
    product_id: int
    supplier_id: int
    price: float
    min_order_qty: int
    discount_rate: float
    supplier: Optional[SupplierResponse] = None
    
    class Config:
        from_attributes = True


@router.get("/products/{product_id}/supplier-prices", response_model=List[ProductSupplierPriceResponse])
def get_product_supplier_prices(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取商品的供应商报价列表（价格比较）"""
    return db.query(ProductSupplierPrice).filter(
        ProductSupplierPrice.product_id == product_id,
        ProductSupplierPrice.is_active == True
    ).all()


@router.post("/supplier-prices", response_model=ProductSupplierPriceResponse, status_code=status.HTTP_201_CREATED)
def create_supplier_price(price: ProductSupplierPriceBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建供应商报价"""
    # 检查商品和供应商是否存在
    product = db.query(Product).filter(Product.id == price.product_id).first()
    if not product:
        raise HTTPException(status_code=400, detail="商品不存在")
    supplier = db.query(Supplier).filter(Supplier.id == price.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=400, detail="供应商不存在")
    
    # 检查是否已存在报价
    existing = db.query(ProductSupplierPrice).filter(
        ProductSupplierPrice.product_id == price.product_id,
        ProductSupplierPrice.supplier_id == price.supplier_id
    ).first()
    if existing:
        # 更新已有报价
        existing.price = price.price
        existing.min_order_qty = price.min_order_qty
        existing.discount_rate = price.discount_rate
        db.commit()
        db.refresh(existing)
        return existing
    
    db_price = ProductSupplierPrice(**price.model_dump())
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price


@router.get("/products/compare-prices")
def compare_product_prices(
    keyword: str = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """价格比较 - 获取所有商品的多供应商报价"""
    # 查询商品
    query = db.query(Product).filter(Product.status == True)
    if keyword:
        query = query.filter(Product.product_name.contains(keyword))
    if category:
        query = query.filter(Product.category == category)
    
    products = query.limit(50).all()
    
    result = []
    for product in products:
        # 获取该商品的所有供应商报价
        prices = db.query(ProductSupplierPrice).filter(
            ProductSupplierPrice.product_id == product.id,
            ProductSupplierPrice.is_active == True
        ).all()
        
        # 构建报价列表
        price_list = []
        for p in prices:
            supplier = db.query(Supplier).filter(Supplier.id == p.supplier_id).first()
            price_list.append({
                "supplier_id": p.supplier_id,
                "supplier_name": supplier.name if supplier else "未知",
                "price": p.price,
                "min_order_qty": p.min_order_qty,
                "discount_rate": p.discount_rate
            })
        
        # 如果没有供应商报价，使用商品默认价格
        if not price_list and product.supplier:
            price_list.append({
                "supplier_id": product.supplier.id,
                "supplier_name": product.supplier.name,
                "price": product.price,
                "min_order_qty": product.min_order,
                "discount_rate": 0
            })
        
        # 按价格排序
        price_list.sort(key=lambda x: x["price"])
        
        result.append({
            "product_id": product.id,
            "product_name": product.product_name,
            "product_code": product.product_code,
            "category": product.category,
            "brand": product.brand,
            "default_price": product.price,
            "lowest_price": price_list[0]["price"] if price_list else product.price,
            "supplier_count": len(price_list),
            "prices": price_list
        })
    
    return result


# ==================== 商品管理 ====================

def generate_product_code():
    """生成商品编码"""
    count = db.query(Product).count() + 1
    return f"PRD{count:05d}"


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """创建商品"""
    existing = db.query(Product).filter(Product.product_code == product.product_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="商品编码已存在")
    
    if not product.product_code:
        product.product_code = f"PRD{datetime.now().strftime('%Y%m%d')}{db.query(Product).count() + 1:03d}"
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/products", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 20,
    category: str = None,
    keyword: str = None,
    status: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取商品列表（支持搜索和筛选）"""
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    if keyword:
        query = query.filter(
            (Product.product_name.contains(keyword)) | 
            (Product.brand.contains(keyword)) |
            (Product.product_code.contains(keyword))
        )
    if status is not None:
        query = query.filter(Product.status == status)
    
    return query.order_by(Product.is_featured.desc(), Product.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/products/featured", response_model=List[ProductResponse])
def list_featured_products(limit: int = 8, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取推荐商品"""
    return db.query(Product).filter(Product.status == True, Product.is_featured == True).limit(limit).all()


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取商品详情"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """更新商品"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """删除商品（下架）"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    product.status = False
    db.commit()
    return {"message": "商品已下架"}


# ==================== 购物车管理 ====================

@router.get("/cart", response_model=List[CartItemResponse])
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取购物车"""
    return db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).all()


@router.post("/cart", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """添加商品到购物车"""
    # 检查商品是否存在
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    # 检查购物车是否已有该商品
    existing = db.query(ShoppingCart).filter(
        ShoppingCart.user_id == current_user.id,
        ShoppingCart.product_id == item.product_id
    ).first()
    
    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
        return existing
    
    # 新增购物车项
    cart_item = ShoppingCart(
        user_id=current_user.id,
        product_id=item.product_id,
        quantity=item.quantity
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.put("/cart/{item_id}", response_model=CartItemResponse)
def update_cart_item(item_id: int, item: CartItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """更新购物车商品数量"""
    cart_item = db.query(ShoppingCart).filter(
        ShoppingCart.id == item_id,
        ShoppingCart.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="购物车商品不存在")
    
    cart_item.quantity = item.quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.delete("/cart/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """从购物车移除"""
    cart_item = db.query(ShoppingCart).filter(
        ShoppingCart.id == item_id,
        ShoppingCart.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="购物车商品不存在")
    
    db.delete(cart_item)
    db.commit()
    return {"message": "已从购物车移除"}


@router.delete("/cart")
def clear_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """清空购物车"""
    db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).delete()
    db.commit()
    return {"message": "购物车已清空"}


# ==================== 采购申请 ====================

def generate_request_no(db: Session):
    """生成申请单号"""
    now = datetime.now()
    count = db.query(ProcurementRequest).filter(
        ProcurementRequest.created_at >= now.replace(hour=0, minute=0, second=0)
    ).count() + 1
    return f"PR{now.strftime('%Y%m%d')}{count:03d}"


@router.post("/procurement-requests", response_model=ProcurementRequestResponse, status_code=status.HTTP_201_CREATED)
def create_procurement_request(
    request: ProcurementRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建采购申请"""
    request_no = generate_request_no(db)
    
    # 计算总金额
    total_amount = sum(item.quantity * item.unit_price for item in request.items)
    
    db_request = ProcurementRequest(
        request_no=request_no,
        applicant_id=current_user.id,
        dept_id=request.dept_id,
        total_amount=total_amount,
        expected_date=request.expected_date,
        urgency=request.urgency,
        purpose=request.purpose,
        status=ProcurementRequestStatus.DRAFT
    )
    db.add(db_request)
    db.flush()
    
    # 添加明细
    for item in request.items:
        db_item = ProcurementRequestItem(
            request_id=db_request.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.quantity * item.unit_price
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_request)
    return db_request


@router.get("/procurement-requests", response_model=List[ProcurementRequestResponse])
def list_procurement_requests(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采购申请列表"""
    query = db.query(ProcurementRequest)
    if status:
        query = query.filter(ProcurementRequest.status == status)
    return query.order_by(ProcurementRequest.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/procurement-requests/{request_id}", response_model=ProcurementRequestResponse)
def get_procurement_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取采购申请详情"""
    request = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")
    return request


@router.put("/procurement-requests/{request_id}/submit", response_model=ProcurementRequestResponse)
def submit_procurement_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """提交采购申请"""
    request = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")
    
    if request.status != ProcurementRequestStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只有草稿状态可以提交")
    
    request.status = ProcurementRequestStatus.PENDING
    db.commit()
    db.refresh(request)
    return request


@router.put("/procurement-requests/{request_id}/approve", response_model=ProcurementRequestResponse)
def approve_procurement_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """审批采购申请"""
    request = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")
    
    if request.status != ProcurementRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="待审批状态才能审批")
    
    request.status = ProcurementRequestStatus.APPROVED
    request.approver_id = current_user.id
    request.approved_at = datetime.now()
    db.commit()
    db.refresh(request)
    return request


@router.put("/procurement-requests/{request_id}/reject", response_model=ProcurementRequestResponse)
def reject_procurement_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """拒绝采购申请"""
    request = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")
    
    request.status = ProcurementRequestStatus.REJECTED
    db.commit()
    db.refresh(request)
    return request


# ==================== 订单管理 ====================

def generate_order_no(db: Session):
    """生成订单号"""
    now = datetime.now()
    count = db.query(PurchaseOrderNew).filter(
        PurchaseOrderNew.created_at >= now.replace(hour=0, minute=0, second=0)
    ).count() + 1
    return f"PO{now.strftime('%Y%m%d')}{count:03d}"


@router.post("/orders", response_model=PurchaseOrderNewResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order: PurchaseOrderNewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建采购订单"""
    order_no = generate_order_no(db)
    total_amount = sum(item.quantity * item.unit_price for item in order.items) + order.freight
    
    db_order = PurchaseOrderNew(
        order_no=order_no,
        request_id=order.request_id,
        supplier_id=order.supplier_id,
        warehouse_id=order.warehouse_id,
        total_amount=total_amount,
        freight=order.freight,
        logistics_no=order.logistics_no,
        estimated_arrival=order.estimated_arrival,
        contact_phone=order.contact_phone,
        delivery_address=order.delivery_address,
        notes=order.notes,
        status=OrderStatus.PENDING
    )
    db.add(db_order)
    db.flush()
    
    for item in order.items:
        db_item = PurchaseOrderNewItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.quantity * item.unit_price
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/orders", response_model=List[PurchaseOrderNewResponse])
def list_orders(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取订单列表"""
    query = db.query(PurchaseOrderNew)
    if status:
        query = query.filter(PurchaseOrderNew.status == status)
    return query.order_by(PurchaseOrderNew.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/orders/{order_id}", response_model=PurchaseOrderNewResponse)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取订单详情"""
    order = db.query(PurchaseOrderNew).filter(PurchaseOrderNew.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.put("/orders/{order_id}/confirm", response_model=PurchaseOrderNewResponse)
def confirm_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """确认订单"""
    order = db.query(PurchaseOrderNew).filter(PurchaseOrderNew.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order.status = OrderStatus.CONFIRMED
    db.commit()
    db.refresh(order)
    return order


@router.put("/orders/{order_id}/ship", response_model=PurchaseOrderNewResponse)
def ship_order(order_id: int, logistics_no: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """发货"""
    order = db.query(PurchaseOrderNew).filter(PurchaseOrderNew.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if logistics_no:
        order.logistics_no = logistics_no
    order.status = OrderStatus.SHIPPED
    db.commit()
    db.refresh(order)
    return order


@router.put("/orders/{order_id}/deliver", response_model=PurchaseOrderNewResponse)
def deliver_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """送达"""
    order = db.query(PurchaseOrderNew).filter(PurchaseOrderNew.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order.status = OrderStatus.DELIVERED
    order.actual_arrival = datetime.now()
    db.commit()
    db.refresh(order)
    return order


@router.put("/orders/{order_id}/complete", response_model=PurchaseOrderNewResponse)
def complete_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """完成订单"""
    order = db.query(PurchaseOrderNew).filter(PurchaseOrderNew.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order.status = OrderStatus.COMPLETED
    db.commit()
    db.refresh(order)
    return order


# ==================== 入库管理 ====================

def generate_in_code(db: Session):
    """生成入库单号"""
    now = datetime.now()
    count = db.query(StockIn).filter(
        StockIn.created_at >= now.replace(hour=0, minute=0, second=0)
    ).count() + 1
    return f"RK{now.strftime('%Y%m%d')}{count:03d}"


@router.post("/stock-in", response_model=StockInResponse, status_code=status.HTTP_201_CREATED)
def create_stock_in(
    stock_in: StockInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建入库单"""
    in_code = generate_in_code(db)
    
    total_qty = sum(item.quantity for item in stock_in.items)
    total_amount = sum(item.quantity * item.unit_price for item in stock_in.items)
    
    db_stock_in = StockIn(
        in_code=in_code,
        in_type=stock_in.in_type,
        supplier_id=stock_in.supplier_id,
        order_id=stock_in.order_id,
        warehouse_id=stock_in.warehouse_id,
        total_qty=total_qty,
        total_amount=total_amount,
        in_date=stock_in.in_date or datetime.now(),
        operator_id=current_user.id,
        status="draft"
    )
    db.add(db_stock_in)
    db.flush()
    
    for item in stock_in.items:
        db_item = StockInItem(
            stock_in_id=db_stock_in.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.quantity * item.unit_price,
            batch_no=item.batch_no,
            production_date=item.production_date,
            expiry_date=item.expiry_date,
            quality_status=item.quality_status
        )
        db.add(db_item)
        
        # 更新商品库存
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity
    
    db.commit()
    db.refresh(db_stock_in)
    return db_stock_in


@router.get("/stock-in", response_model=List[StockInResponse])
def list_stock_in(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取入库单列表"""
    query = db.query(StockIn)
    if status:
        query = query.filter(StockIn.status == status)
    return query.order_by(StockIn.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stock-in/{in_id}", response_model=StockInResponse)
def get_stock_in(in_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取入库单详情"""
    stock_in = db.query(StockIn).filter(StockIn.id == in_id).first()
    if not stock_in:
        raise HTTPException(status_code=404, detail="入库单不存在")
    return stock_in


@router.put("/stock-in/{in_id}/approve", response_model=StockInResponse)
def approve_stock_in(in_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """审核入库单"""
    stock_in = db.query(StockIn).filter(StockIn.id == in_id).first()
    if not stock_in:
        raise HTTPException(status_code=404, detail="入库单不存在")
    
    stock_in.status = "approved"
    stock_in.approver_id = current_user.id
    stock_in.approved_at = datetime.now()
    db.commit()
    db.refresh(stock_in)
    return stock_in


# ==================== 出库管理 ====================

def generate_out_code(db: Session):
    """生成出库单号"""
    now = datetime.now()
    count = db.query(StockOut).filter(
        StockOut.created_at >= now.replace(hour=0, minute=0, second=0)
    ).count() + 1
    return f"CK{now.strftime('%Y%m%d')}{count:03d}"


@router.post("/stock-out", response_model=StockOutResponse, status_code=status.HTTP_201_CREATED)
def create_stock_out(
    stock_out: StockOutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建出库单"""
    out_code = generate_out_code(db)
    
    total_qty = sum(item.quantity for item in stock_out.items)
    total_amount = sum(item.quantity * item.unit_price for item in stock_out.items)
    
    db_stock_out = StockOut(
        out_code=out_code,
        out_type=stock_out.out_type,
        department_id=stock_out.department_id,
        warehouse_id=stock_out.warehouse_id,
        total_qty=total_qty,
        total_amount=total_amount,
        out_date=stock_out.out_date or datetime.now(),
        applicant_id=current_user.id,
        status="draft"
    )
    db.add(db_stock_out)
    db.flush()
    
    for item in stock_out.items:
        db_item = StockOutItem(
            stock_out_id=db_stock_out.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.quantity * item.unit_price
        )
        db.add(db_item)
        
        # 检查库存并扣减
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and product.stock >= item.quantity:
            product.stock -= item.quantity
        else:
            raise HTTPException(status_code=400, detail=f"商品 {product.product_name if product else item.product_id} 库存不足")
    
    db.commit()
    db.refresh(db_stock_out)
    return db_stock_out


@router.get("/stock-out", response_model=List[StockOutResponse])
def list_stock_out(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取出库单列表"""
    query = db.query(StockOut)
    if status:
        query = query.filter(StockOut.status == status)
    return query.order_by(StockOut.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stock-out/{out_id}", response_model=StockOutResponse)
def get_stock_out(out_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取出库单详情"""
    stock_out = db.query(StockOut).filter(StockOut.id == out_id).first()
    if not stock_out:
        raise HTTPException(status_code=404, detail="出库单不存在")
    return stock_out


@router.put("/stock-out/{out_id}/approve", response_model=StockOutResponse)
def approve_stock_out(out_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """审核出库单"""
    stock_out = db.query(StockOut).filter(StockOut.id == out_id).first()
    if not stock_out:
        raise HTTPException(status_code=404, detail="出库单不存在")
    
    stock_out.status = "approved"
    stock_out.approver_id = current_user.id
    stock_out.approved_at = datetime.now()
    db.commit()
    db.refresh(stock_out)
    return stock_out


# ==================== 库存预警 ====================

@router.get("/stock-alerts", response_model=List[StockAlertResponse])
def list_stock_alerts(
    alert_type: str = None,
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取库存预警列表"""
    query = db.query(StockAlert)
    if alert_type:
        query = query.filter(StockAlert.alert_type == alert_type)
    if status:
        query = query.filter(StockAlert.status == status)
    return query.order_by(StockAlert.created_at.desc()).all()


@router.post("/stock-alerts/check")
def check_stock_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """检查库存并生成预警"""
    products = db.query(Product).filter(Product.status == True).all()
    
    created_count = 0
    for product in products:
        # 检查是否已有未处理的预警
        existing = db.query(StockAlert).filter(
            StockAlert.product_id == product.id,
            StockAlert.status == "pending"
        ).first()
        
        if existing:
            continue
        
        # 低库存预警 (低于起订量)
        if product.min_order and product.stock < product.min_order:
            alert = StockAlert(
                product_id=product.id,
                alert_type="low_stock",
                current_qty=product.stock,
                threshold=product.min_order,
                status="pending"
            )
            db.add(alert)
            created_count += 1
    
    db.commit()
    return {"message": f"检查完成，新增 {created_count} 条预警"}


@router.put("/stock-alerts/{alert_id}/resolve")
def resolve_stock_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """处理预警"""
    alert = db.query(StockAlert).filter(StockAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="预警不存在")
    
    alert.status = "resolved"
    alert.resolved_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return alert


# ==================== 统计报表 ====================

@router.get("/procurement/statistics")
def get_procurement_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取采购统计"""
    products = db.query(Product).filter(Product.status == True).all()
    requests = db.query(ProcurementRequest).all()
    orders = db.query(PurchaseOrderNew).all()
    alerts = db.query(StockAlert).filter(StockAlert.status == "pending").all()
    
    # 计算入库/出库金额
    stock_ins = db.query(StockIn).filter(StockIn.status == "approved").all()
    stock_outs = db.query(StockOut).filter(StockOut.status == "approved").all()
    
    return {
        "total_products": len(products),
        "total_requests": len(requests),
        "pending_requests": sum(1 for r in requests if r.status == "pending"),
        "total_orders": len(orders),
        "pending_orders": sum(1 for o in orders if o.status in ["pending", "confirmed"]),
        "active_alerts": len(alerts),
        "total_stock_value": sum(p.stock * p.price for p in products),
        # 新增：入库出库统计
        "total_stock_in_amount": sum(i.total_amount for i in stock_ins),
        "total_stock_in_qty": sum(i.total_qty for i in stock_ins),
        "total_stock_out_amount": sum(o.total_amount for o in stock_outs),
        "total_stock_out_qty": sum(o.total_qty for o in stock_outs),
    }


@router.get("/procurement/statistics/dashboard")
def get_procurement_dashboard(
    period: str = "month",  # day, week, month, year
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """获取采购仪表盘数据"""
    from datetime import timedelta
    from sqlalchemy import func
    
    # 计算日期范围
    now = datetime.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # 商品统计（按分类）
    products = db.query(Product).filter(Product.status == True).all()
    category_stats = {}
    for p in products:
        cat = p.category or "other"
        if cat not in category_stats:
            category_stats[cat] = {"count": 0, "stock_value": 0}
        category_stats[cat]["count"] += 1
        category_stats[cat]["stock_value"] += p.stock * p.price
    
    # 入库统计（按类型）
    stock_ins = db.query(StockIn).filter(
        StockIn.status == "approved",
        StockIn.created_at >= start_date
    ).all()
    in_by_type = {"purchase": 0, "return": 0, "transfer": 0, "inventory": 0}
    for si in stock_ins:
        t = si.in_type or "purchase"
        in_by_type[t] = in_by_type.get(t, 0) + float(si.total_amount or 0)
    
    # 出库统计（按类型）
    stock_outs = db.query(StockOut).filter(
        StockOut.status == "approved",
        StockOut.created_at >= start_date
    ).all()
    out_by_type = {"consume": 0, "requisition": 0, "transfer": 0, "damage": 0, "return": 0}
    for so in stock_outs:
        t = so.out_type or "consume"
        out_by_type[t] = out_by_type.get(t, 0) + float(so.total_amount or 0)
    
    # 订单统计（按状态）
    orders = db.query(PurchaseOrderNew).filter(
        PurchaseOrderNew.created_at >= start_date
    ).all()
    order_by_status = {}
    for o in orders:
        s = o.status or "pending"
        if s not in order_by_status:
            order_by_status[s] = {"count": 0, "amount": 0}
        order_by_status[s]["count"] += 1
        order_by_status[s]["amount"] += float(o.total_amount or 0)
    
    # 采购申请统计（按状态）
    requests = db.query(ProcurementRequest).filter(
        ProcurementRequest.created_at >= start_date
    ).all()
    request_by_status = {}
    for r in requests:
        s = r.status or "draft"
        if s not in request_by_status:
            request_by_status[s] = {"count": 0, "amount": 0}
        request_by_status[s]["count"] += 1
        request_by_status[s]["amount"] += float(r.total_amount or 0)
    
    # 供应商统计
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    
    # 库存预警Top5（按商品价值）
    low_stock_products = sorted(
        [p for p in products if p.stock < (p.min_order or 10)],
        key=lambda x: x.stock * x.price,
        reverse=True
    )[:5]
    
    return {
        "period": period,
        "period_start": start_date.isoformat(),
        "period_end": now.isoformat(),
        "summary": {
            "total_products": len(products),
            "total_suppliers": len(suppliers),
            "total_orders": len(orders),
            "total_requests": len(requests),
            "total_stock_in": sum(float(si.total_amount or 0) for si in stock_ins),
            "total_stock_out": sum(float(so.total_amount or 0) for so in stock_outs),
            "net_flow": sum(float(si.total_amount or 0) for si in stock_ins) - sum(float(so.total_amount or 0) for so in stock_outs),
        },
        "by_category": category_stats,
        "stock_in_by_type": in_by_type,
        "stock_out_by_type": out_by_type,
        "orders_by_status": order_by_status,
        "requests_by_status": request_by_status,
        "low_stock_products": [
            {
                "id": p.id,
                "product_name": p.product_name,
                "stock": p.stock,
                "min_order": p.min_order,
                "stock_value": p.stock * p.price
            }
            for p in low_stock_products
        ]
    }

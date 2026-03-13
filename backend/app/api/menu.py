"""
Menu API - 菜单管理
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import MenuItem, RoleMenu, User
from app.api.auth import get_current_user

router = APIRouter(tags=["menu"])


# Pydantic 模型
class MenuItemCreate(BaseModel):
    name: str
    path: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0
    parent_id: Optional[int] = None
    is_visible: bool = True
    is_expandable: bool = False
    default_expanded: bool = False


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    parent_id: Optional[int] = None
    is_visible: Optional[bool] = None
    is_expandable: Optional[bool] = None
    default_expanded: Optional[bool] = None


class MenuItemResponse(BaseModel):
    id: int
    name: str
    path: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0
    parent_id: Optional[int] = None
    is_visible: bool = True
    is_expandable: bool = False
    default_expanded: bool = False
    children: List["MenuItemResponse"] = []

    class Config:
        from_attributes = True


class RoleMenuCreate(BaseModel):
    role: str
    menu_id: int
    can_access: bool = True


# 辅助函数：构建菜单树
def build_menu_tree(items: List[MenuItem], parent_id: Optional[int] = None) -> List[MenuItemResponse]:
    tree = []
    for item in items:
        if item.parent_id == parent_id:
            children = build_menu_tree(items, item.id)
            item_dict = MenuItemResponse(
                id=item.id,
                name=item.name,
                path=item.path,
                icon=item.icon,
                sort_order=item.sort_order,
                parent_id=item.parent_id,
                is_visible=item.is_visible,
                is_expandable=item.is_expandable,
                default_expanded=item.default_expanded,
                children=children
            )
            tree.append(item_dict)
    return tree


# 获取当前用户的菜单
@router.get("/", response_model=List[MenuItemResponse])
def get_user_menus(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户角色的菜单"""
    # 获取用户角色
    user_role = current_user.role or "staff"
    
    # 查询该角色可见的菜单ID
    role_menus = db.query(RoleMenu).filter(
        RoleMenu.role == user_role,
        RoleMenu.can_access == True
    ).all()
    
    menu_ids = [rm.menu_id for rm in role_menus]
    
    # 如果有配置菜单权限，需要包含子菜单
    if menu_ids:
        # 获取所有父菜单ID和它们的子菜单ID
        parent_ids = set(menu_ids)
        for parent_id in list(parent_ids):
            children = db.query(MenuItem).filter(MenuItem.parent_id == parent_id).all()
            for child in children:
                menu_ids.append(child.id)
        
        menus = db.query(MenuItem).filter(
            MenuItem.id.in_(menu_ids),
            MenuItem.is_visible == True
        ).order_by(MenuItem.sort_order).all()
    else:
        # 默认返回所有可见菜单
        menus = db.query(MenuItem).filter(
            MenuItem.is_visible == True
        ).order_by(MenuItem.sort_order).all()
    
    # 构建菜单树
    return build_menu_tree(menus)


# 获取所有菜单（树形结构）
@router.get("/tree", response_model=List[MenuItemResponse])
def get_menu_tree(db: Session = Depends(get_db)):
    """获取所有菜单（树形结构）"""
    menus = db.query(MenuItem).order_by(MenuItem.sort_order).all()
    return build_menu_tree(menus)


# 获取菜单列表（扁平）
@router.get("/list", response_model=List[MenuItemResponse])
def get_menu_list(db: Session = Depends(get_db)):
    """获取菜单列表"""
    menus = db.query(MenuItem).order_by(MenuItem.sort_order).all()
    return menus


# 创建菜单
@router.post("/", response_model=MenuItemResponse)
def create_menu(menu: MenuItemCreate, db: Session = Depends(get_db)):
    """创建菜单"""
    db_menu = MenuItem(**menu.dict())
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    # 返回时设置空子列表
    result = MenuItemResponse(
        id=db_menu.id,
        name=db_menu.name,
        path=db_menu.path,
        icon=db_menu.icon,
        sort_order=db_menu.sort_order,
        parent_id=db_menu.parent_id,
        is_visible=db_menu.is_visible,
        is_expandable=db_menu.is_expandable,
        default_expanded=db_menu.default_expanded,
        children=[]
    )
    return result


# 更新菜单
@router.put("/{menu_id}", response_model=MenuItemResponse)
def update_menu(menu_id: int, menu: MenuItemUpdate, db: Session = Depends(get_db)):
    """更新菜单"""
    db_menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="菜单不存在")
    
    for key, value in menu.dict(exclude_unset=True).items():
        setattr(db_menu, key, value)
    
    db.commit()
    db.refresh(db_menu)
    return MenuItemResponse(
        id=db_menu.id,
        name=db_menu.name,
        path=db_menu.path,
        icon=db_menu.icon,
        sort_order=db_menu.sort_order,
        parent_id=db_menu.parent_id,
        is_visible=db_menu.is_visible,
        is_expandable=db_menu.is_expandable,
        default_expanded=db_menu.default_expanded,
        children=[]
    )


# 删除菜单
@router.delete("/{menu_id}")
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    """删除菜单"""
    db_menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="菜单不存在")
    
    # 删除子菜单
    db.query(MenuItem).filter(MenuItem.parent_id == menu_id).delete()
    db.delete(db_menu)
    db.commit()
    return {"message": "删除成功"}


# 角色菜单配置
@router.get("/roles/{role}")
def get_role_menus(role: str, db: Session = Depends(get_db)):
    """获取角色的菜单权限"""
    role_menus = db.query(RoleMenu).filter(RoleMenu.role == role).all()
    return [{"menu_id": rm.menu_id, "can_access": rm.can_access} for rm in role_menus]


@router.post("/roles")
def set_role_menus(config: List[RoleMenuCreate], db: Session = Depends(get_db)):
    """设置角色的菜单权限"""
    role = config[0].role if config else None
    if not role:
        raise HTTPException(status_code=400, detail="角色不能为空")
    
    # 删除原有配置
    db.query(RoleMenu).filter(RoleMenu.role == role).delete()
    
    # 添加新配置
    for item in config:
        db_role_menu = RoleMenu(role=item.role, menu_id=item.menu_id, can_access=item.can_access)
        db.add(db_role_menu)
    
    db.commit()
    return {"message": "配置成功"}


# 初始化默认菜单
@router.post("/init")
def init_default_menus(db: Session = Depends(get_db)):
    """初始化默认菜单数据"""
    
    # 检查是否已有菜单
    existing = db.query(MenuItem).first()
    if existing:
        return {"message": "菜单已存在"}
    
    # 创建菜单
    menus_data = [
        # 顶级菜单
        {"name": "运营驾驶舱", "path": "/", "icon": "LayoutDashboard", "sort_order": 1},
        {"name": "房间管理", "path": "/rooms", "icon": "DoorOpen", "sort_order": 2},
        {"name": "预订管理", "path": "/bookings", "icon": "CalendarDays", "sort_order": 3},
        {"name": "入住管理", "path": "/checkin", "icon": "UserCheck", "sort_order": 4},
        {"name": "升级降级", "path": "/upgrade", "icon": "FileText", "sort_order": 5},
        {"name": "设备控制", "path": "/devices", "icon": "Settings", "sort_order": 6},
        {"name": "客房智控", "path": "/room-control", "icon": "Home", "sort_order": 7},
        {"name": "设备拓扑", "path": "/device-topology", "icon": "Settings", "sort_order": 8},
        {"name": "场景管理", "path": "/scenes", "icon": "Home", "sort_order": 9},
        {"name": "安防监控", "path": "/security", "icon": "AlertTriangle", "sort_order": 10},
        {"name": "维修管理", "path": "/maintenance", "icon": "Settings", "sort_order": 11},
        {"name": "规则引擎", "path": "/rules", "icon": "Zap", "sort_order": 12},
        {"name": "能耗管理", "path": "/energy", "icon": "Zap", "sort_order": 13},
        # 采购管理（可展开）
        {"name": "采购管理", "icon": "Store", "sort_order": 14, "is_expandable": True, "default_expanded": False},
        # 基建与系统管理（可展开）
        {"name": "基建与系统管理", "icon": "HardDrive", "sort_order": 15, "is_expandable": True, "default_expanded": False},
    ]
    
    # 采购子菜单
    procurement_submenus = [
        {"name": "商品浏览", "path": "/procurement/products", "sort_order": 1},
        {"name": "购物车", "path": "/procurement/cart", "sort_order": 2},
        {"name": "订单跟踪", "path": "/procurement/orders", "sort_order": 3},
        {"name": "入库管理", "path": "/procurement/stock-in", "sort_order": 4},
        {"name": "出库管理", "path": "/procurement/stock-out", "sort_order": 5},
        {"name": "库存预警", "path": "/procurement/inventory", "sort_order": 6},
    ]
    
    # 基建与系统管理子菜单
    infrastructure_submenus = [
        # 设备接入管理
        {"name": "零接触入网", "path": "/infrastructure/onboarding", "sort_order": 1, "parent_name": "设备接入管理"},
        {"name": "设备配置管理", "path": "/infrastructure/devices", "sort_order": 2, "parent_name": "设备接入管理"},
        {"name": "网关管理", "path": "/infrastructure/gateways", "sort_order": 3, "parent_name": "设备接入管理"},
        # 基础设施监控
        {"name": "边缘服务器监控", "path": "/infrastructure/servers", "sort_order": 4, "parent_name": "基础设施监控"},
        {"name": "网络质量监控", "path": "/infrastructure/network", "sort_order": 5, "parent_name": "基础设施监控"},
        {"name": "本地API网关", "path": "/infrastructure/api-gateway", "sort_order": 6, "parent_name": "基础设施监控"},
        # 系统管理
        {"name": "门店基础配置", "path": "/infrastructure/store-config", "sort_order": 7, "parent_name": "系统管理"},
        {"name": "用户与权限", "path": "/infrastructure/users", "sort_order": 8, "parent_name": "系统管理"},
        {"name": "日志审计", "path": "/infrastructure/logs", "sort_order": 9, "parent_name": "系统管理"},
        {"name": "数据备份与恢复", "path": "/infrastructure/backup", "sort_order": 10, "parent_name": "系统管理"},
    ]
    
    # 基建子菜单的父菜单
    infrastructure_parents = {
        "设备接入管理": {"icon": "Cpu", "sort_order": 1},
        "基础设施监控": {"icon": "Activity", "sort_order": 2},
        "系统管理": {"icon": "Shield", "sort_order": 3},
    }
    
    menu_ids = {}
    for menu_data in menus_data:
        db_menu = MenuItem(**menu_data)
        db.add(db_menu)
        db.flush()
        menu_ids[menu_data["name"]] = db_menu.id
    
    # 添加采购子菜单
    procurement_parent_id = menu_ids.get("采购管理")
    for submenu in procurement_submenus:
        db_menu = MenuItem(
            name=submenu["name"],
            path=submenu["path"],
            icon="Store",
            sort_order=submenu["sort_order"],
            parent_id=procurement_parent_id
        )
        db.add(db_menu)
    
    # 添加基建与系统管理子菜单的父菜单
    infra_parent_ids = {}
    for parent_name, parent_data in infrastructure_parents.items():
        db_menu = MenuItem(
            name=parent_name,
            icon=parent_data["icon"],
            sort_order=parent_data["sort_order"],
            parent_id=menu_ids.get("基建与系统管理"),
            is_expandable=True,
            is_visible=True
        )
        db.add(db_menu)
        db.flush()
        infra_parent_ids[parent_name] = db_menu.id
    
    # 添加基建子菜单
    for submenu in infrastructure_submenus:
        parent_id = infra_parent_ids.get(submenu.get("parent_name"))
        if parent_id:
            db_menu = MenuItem(
                name=submenu["name"],
                path=submenu["path"],
                icon="Circle",
                sort_order=submenu["sort_order"],
                parent_id=parent_id
            )
            db.add(db_menu)
    
    # 为所有角色设置默认权限（全部可见）
    all_menu_ids = list(menu_ids.values())
    for role in ["admin", "manager", "staff"]:
        for menu_id in all_menu_ids:
            db_role_menu = RoleMenu(role=role, menu_id=menu_id, can_access=True)
            db.add(db_role_menu)
    
    db.commit()
    return {"message": "菜单初始化成功"}

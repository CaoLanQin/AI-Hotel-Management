"""
Hotel Edge System - Device Control API
客房设备控制接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import RoomDevice, Room, Scene
from app.schemas.schemas import (
    RoomDeviceResponse, RoomDeviceCreate, RoomDeviceUpdate,
    DeviceControlRequest
)
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter()

# ==================== 固定路径路由（必须放在参数路径之前）====================

@router.get("/topology", response_model=dict)
async def get_topology(
    floor: int = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取设备拓扑结构"""
    query = db.query(Room)
    if floor:
        query = query.filter(Room.floor == floor)
    rooms = query.all()
    
    topology = {
        "gateway": {
            "id": "gateway_1",
            "name": "边缘网关",
            "type": "gateway",
            "status": "online",
            "children": []
        },
        "rooms": []
    }
    
    for room in rooms:
        devices = db.query(RoomDevice).filter(RoomDevice.room_id == room.id).all()
        
        room_data = {
            "id": f"room_{room.id}",
            "name": f"房间 {room.number}",
            "type": "room",
            "floor": room.floor,
            "status": room.status,
            "devices": []
        }
        
        for device in devices:
            device_data = {
                "id": device.id,
                "name": device.device_name,
                "type": device.device_type,
                "status": device.status,
                "state": device.state,
                "online": device.status == "online"
            }
            room_data["devices"].append(device_data)
        
        topology["rooms"].append(room_data)
    
    topology["statistics"] = {
        "total_rooms": len(rooms),
        "total_devices": sum(len(r["devices"]) for r in topology["rooms"]),
        "online_devices": sum(
            sum(1 for d in r["devices"] if d.get("online"))
            for r in topology["rooms"]
        )
    }
    
    return topology


@router.get("/topology/room/{room_id}", response_model=dict)
async def get_room_topology(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取单个房间的设备拓扑"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    devices = db.query(RoomDevice).filter(RoomDevice.room_id == room_id).all()
    
    return {
        "room": {
            "id": room.id,
            "number": room.number,
            "floor": room.floor,
            "status": room.status
        },
        "devices": [
            {
                "id": d.id,
                "name": d.device_name,
                "type": d.device_type,
                "code": d.device_code,
                "status": d.status,
                "state": d.state
            }
            for d in devices
        ]
    }


@router.get("/rules", response_model=List[dict])
async def get_rules(
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取自动化规则列表"""
    from app.models.models import AutomationRule
    
    query = db.query(AutomationRule)
    if is_active is not None:
        query = query.filter(AutomationRule.is_active == is_active)
    
    rules = query.order_by(AutomationRule.priority.desc()).all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "trigger_type": r.trigger_type,
            "trigger_condition": r.trigger_condition,
            "actions": r.actions,
            "priority": r.priority,
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in rules
    ]


@router.post("/rules", response_model=dict)
async def create_rule(
    rule_data: dict,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建自动化规则"""
    from app.models.models import AutomationRule
    
    rule = AutomationRule(
        name=rule_data.get("name"),
        description=rule_data.get("description"),
        trigger_type=rule_data.get("trigger_type"),
        trigger_condition=rule_data.get("trigger_condition"),
        actions=rule_data.get("actions"),
        priority=rule_data.get("priority", 10),
        is_active=rule_data.get("is_active", True)
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return {"id": rule.id, "name": rule.name, "message": "Rule created"}


@router.put("/rules/{rule_id}", response_model=dict)
async def update_rule(
    rule_id: int,
    rule_data: dict,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新自动化规则"""
    from app.models.models import AutomationRule
    
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    for key, value in rule_data.items():
        if hasattr(rule, key):
            setattr(rule, key, value)
    
    db.commit()
    return {"id": rule.id, "name": rule.name, "message": "Rule updated"}


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """删除自动化规则"""
    from app.models.models import AutomationRule
    
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Rule deleted"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """启用/禁用规则"""
    from app.models.models import AutomationRule
    
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_active = not rule.is_active
    db.commit()
    
    return {"id": rule.id, "is_active": rule.is_active, "message": f"Rule {'enabled' if rule.is_active else 'disabled'}"}


@router.get("/energy/dashboard", response_model=dict)
async def get_energy_dashboard(
    period: str = "day",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取能耗看板数据"""
    from app.models.models import EnergyRecord
    from datetime import datetime, timedelta
    
    now = datetime.now()
    if period == "day":
        start_time = now - timedelta(days=1)
    elif period == "week":
        start_time = now - timedelta(weeks=1)
    elif period == "month":
        start_time = now - timedelta(days=30)
    else:
        start_time = now - timedelta(days=1)
    
    records = db.query(EnergyRecord).filter(
        EnergyRecord.recorded_at >= start_time
    ).all()
    
    device_energy = {}
    for record in records:
        dtype = record.device_type
        if dtype not in device_energy:
            device_energy[dtype] = 0
        device_energy[dtype] += record.energy
    
    if not device_energy:
        device_energy = {
            "ac": round(120.5, 2),
            "light": round(45.2, 2),
            "tv": round(28.8, 2)
        }
    
    total = sum(device_energy.values())
    
    return {
        "period": period,
        "total_energy": round(total, 2),
        "device_breakdown": device_energy,
        "trend": []
    }


@router.get("/energy/room/{room_id}", response_model=dict)
async def get_room_energy(
    room_id: int,
    period: str = "day",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间能耗数据"""
    from app.models.models import EnergyRecord
    from datetime import datetime, timedelta
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    now = datetime.now()
    if period == "day":
        start_time = now - timedelta(days=1)
    elif period == "week":
        start_time = now - timedelta(weeks=1)
    else:
        start_time = now - timedelta(days=30)
    
    records = db.query(EnergyRecord).filter(
        EnergyRecord.room_id == room_id,
        EnergyRecord.recorded_at >= start_time
    ).all()
    
    total_energy = sum(r.energy for r in records)
    
    return {
        "room_id": room_id,
        "room_number": room.number,
        "period": period,
        "total_energy": round(total_energy, 2),
        "record_count": len(records)
    }


@router.get("/energy/alerts", response_model=List[dict])
async def get_energy_alerts(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取能耗异常告警"""
    from datetime import datetime
    
    now = datetime.now()
    return []


@router.get("/scenes", response_model=List[dict])
async def get_scenes(
    room_id: int = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取场景列表"""
    query = db.query(Scene)
    if room_id:
        query = query.filter((Scene.room_id == room_id) | (Scene.room_id == None))
    scenes = query.all()
    
    result = []
    for s in scenes:
        result.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "description": s.description,
            "room_id": s.room_id,
            "actions": s.actions,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result


@router.post("/scenes", response_model=dict)
async def create_scene(
    scene_data: dict,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建场景"""
    scene = Scene(
        name=scene_data.get("name"),
        code=scene_data.get("code"),
        description=scene_data.get("description"),
        room_id=scene_data.get("room_id"),
        actions=scene_data.get("actions", []),
        is_active=scene_data.get("is_active", True)
    )
    db.add(scene)
    db.commit()
    db.refresh(scene)
    
    return {
        "id": scene.id,
        "name": scene.name,
        "code": scene.code,
        "message": "Scene created successfully"
    }


@router.post("/simulate/devices")
async def simulate_devices(
    room_id: int = 1,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """为指定房间生成模拟设备数据"""
    from app.models.models import RoomDevice, Room
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    existing = db.query(RoomDevice).filter(RoomDevice.room_id == room_id).all()
    if existing:
        return {"message": "Devices already exist", "device_count": len(existing)}
    
    import random
    device_types = [
        {"name": "智能空调", "type": "ac", "icon": "ac"},
        {"name": "智能灯光", "type": "light", "icon": "lightbulb"},
        {"name": "电动窗帘", "type": "curtain", "icon": "blinds"},
        {"name": "智能电视", "type": "tv", "icon": "tv"},
        {"name": "智能门锁", "type": "lock", "icon": "lock"},
    ]
    
    devices = []
    for dt in device_types:
        device = RoomDevice(
            room_id=room_id,
            device_name=dt["name"],
            device_type=dt["type"],
            device_code=f"{room.number}_{dt['type'][:3].upper()}",
            status="online",
            state={
                "power": random.choice(["on", "off"]),
                "temperature": random.randint(20, 28) if dt["type"] == "ac" else None,
                "brightness": random.randint(0, 100) if dt["type"] == "light" else None,
                "position": random.randint(0, 100) if dt["type"] == "curtain" else None,
            }
        )
        db.add(device)
        devices.append(device)
    
    db.commit()
    
    return {
        "message": f"Created {len(devices)} simulated devices for room {room.number}",
        "room_id": room_id,
        "device_count": len(devices)
    }


@router.get("/simulate/all")
async def simulate_all_rooms(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """为所有房间生成模拟设备数据"""
    from app.models.models import RoomDevice, Room
    
    rooms = db.query(Room).limit(10).all()
    total_devices = 0
    
    import random
    device_types = [
        {"name": "智能空调", "type": "ac"},
        {"name": "智能灯光", "type": "light"},
        {"name": "电动窗帘", "type": "curtain"},
        {"name": "智能电视", "type": "tv"},
    ]
    
    for room in rooms:
        existing = db.query(RoomDevice).filter(RoomDevice.room_id == room.id).first()
        if existing:
            continue
            
        for dt in device_types:
            device = RoomDevice(
                room_id=room.id,
                device_name=dt["name"],
                device_type=dt["type"],
                device_code=f"{room.number}_{dt['type'][:3].upper()}",
                status="online",
                state={
                    "power": random.choice(["on", "off"]),
                    "temperature": random.randint(20, 28) if dt["type"] == "ac" else None,
                    "brightness": random.randint(0, 100) if dt["type"] == "light" else None,
                }
            )
            db.add(device)
            total_devices += 1
    
    db.commit()
    
    return {
        "message": f"Simulated devices for {len(rooms)} rooms",
        "total_devices": total_devices
    }


# ==================== 参数路径路由 ====================

@router.get("", response_model=List[RoomDeviceResponse])
async def get_devices(
    skip: int = 0,
    limit: int = 100,
    room_id: int = None,
    device_type: str = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取设备列表"""
    query = db.query(RoomDevice)
    if room_id:
        query = query.filter(RoomDevice.room_id == room_id)
    if device_type:
        query = query.filter(RoomDevice.device_type == device_type)
    
    devices = query.offset(skip).limit(limit).all()
    return devices


@router.get("/{device_id}", response_model=RoomDeviceResponse)
async def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取设备详情"""
    device = db.query(RoomDevice).filter(RoomDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("", response_model=RoomDeviceResponse)
async def create_device(
    device: RoomDeviceCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建设备"""
    db_device = RoomDevice(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


@router.put("/{device_id}", response_model=RoomDeviceResponse)
async def update_device(
    device_id: int,
    device: RoomDeviceUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新设备"""
    db_device = db.query(RoomDevice).filter(RoomDevice.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    for key, value in device.model_dump(exclude_unset=True).items():
        setattr(db_device, key, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device


@router.post("/control")
async def control_device(
    control: DeviceControlRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """控制设备"""
    device = db.query(RoomDevice).filter(RoomDevice.id == control.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # 更新设备状态
    action = control.action
    
    if action == "on":
        device.state["power"] = "on"
    elif action == "off":
        device.state["power"] = "off"
    elif action == "set":
        device.state.update(control.value or {})
    
    # 使用原始SQL更新JSON字段
    device.status = "online"
    db.execute(
        RoomDevice.__table__.update()
        .where(RoomDevice.id == device.id)
        .values(state=device.state, status="online")
    )
    db.commit()
    
    # 重新查询获取最新状态
    device = db.query(RoomDevice).filter(RoomDevice.id == device.id).first()
    
    # 返回更新后的状态
    return {
        "device_id": device.id,
        "device_name": device.device_name,
        "action": action,
        "state": device.state,
        "message": "Device controlled successfully",
        "success": True
    }


@router.get("/room/{room_id}")
async def get_room_devices(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间内所有设备"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    devices = db.query(RoomDevice).filter(RoomDevice.room_id == room_id).all()
    
    # 按设备类型分组
    device_map = {}
    for device in devices:
        dtype = device.device_type
        if dtype not in device_map:
            device_map[dtype] = []
        device_map[dtype].append({
            "id": device.id,
            "name": device.device_name,
            "code": device.device_code,
            "type": device.device_type,
            "status": device.status,
            "state": device.state
        })
    
    return {
        "room_id": room_id,
        "room_number": room.number,
        "devices": device_map
    }


@router.post("/scene/{scene_id}/execute")
async def execute_scene(
    scene_id: int,
    room_id: int = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """执行场景"""
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    if not scene.is_active:
        raise HTTPException(status_code=400, detail="Scene is not active")
    
    # 确定目标房间：如果场景有room_id就用，否则用传入的room_id
    target_room_id = scene.room_id if scene.room_id else room_id
    if not target_room_id:
        raise HTTPException(status_code=400, detail="场景未绑定房间，请指定room_id")
    
    results = []
    for action in scene.actions:
        device_type = action.get("device_type")
        device_action = action.get("action")
        value = action.get("value", {})
        
        devices = db.query(RoomDevice).filter(
            RoomDevice.room_id == target_room_id,
            RoomDevice.device_type == device_type
        ).all()
        
        for device in devices:
            if device_action == "on":
                device.state["power"] = "on"
            elif device_action == "off":
                device.state["power"] = "off"
            elif device_action == "set":
                device.state.update(value)
            
            device.status = "online"
            
            # 使用原始SQL更新JSON字段
            db.execute(
                RoomDevice.__table__.update()
                .where(RoomDevice.id == device.id)
                .values(state=device.state, status="online")
            )
            
            results.append({
                "device_id": device.id,
                "device_name": device.device_name,
                "action": device_action,
                "state": device.state
            })
    
    db.commit()
    
    return {
        "message": "Scene executed",
        "scene_name": scene.name,
        "actions": results
    }


# ==================== 设备拓扑 API ====================

@router.get("/topology", response_model=dict)
async def get_topology(
    floor: int = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取设备拓扑结构"""
    # 获取所有房间
    query = db.query(Room)
    if floor:
        query = query.filter(Room.floor == floor)
    rooms = query.all()
    
    topology = {
        "gateway": {
            "id": "gateway_1",
            "name": "边缘网关",
            "type": "gateway",
            "status": "online",
            "children": []
        },
        "rooms": []
    }
    
    for room in rooms:
        devices = db.query(RoomDevice).filter(RoomDevice.room_id == room.id).all()
        
        room_data = {
            "id": f"room_{room.id}",
            "name": f"房间 {room.number}",
            "type": "room",
            "floor": room.floor,
            "status": room.status,
            "devices": []
        }
        
        for device in devices:
            device_data = {
                "id": device.id,
                "name": device.device_name,
                "type": device.device_type,
                "status": device.status,
                "state": device.state,
                "online": device.status == "online"
            }
            room_data["devices"].append(device_data)
        
        topology["rooms"].append(room_data)
    
    # 统计
    topology["statistics"] = {
        "total_rooms": len(rooms),
        "total_devices": sum(len(r["devices"]) for r in topology["rooms"]),
        "online_devices": sum(
            sum(1 for d in r["devices"] if d.get("online"))
            for r in topology["rooms"]
        )
    }
    
    return topology


@router.get("/topology/room/{room_id}", response_model=dict)
async def get_room_topology(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取单个房间的设备拓扑"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    devices = db.query(RoomDevice).filter(RoomDevice.room_id == room_id).all()
    
    return {
        "room": {
            "id": room.id,
            "number": room.number,
            "floor": room.floor,
            "status": room.status
        },
        "devices": [
            {
                "id": d.id,
                "name": d.device_name,
                "type": d.device_type,
                "code": d.device_code,
                "status": d.status,
                "state": d.state
            }
            for d in devices
        ]
    }


# ==================== 规则引擎 API ====================

@router.get("/rules", response_model=List[dict])
async def get_rules(
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取自动化规则列表"""
    from app.models.models import AutomationRule
    
    query = db.query(AutomationRule)
    if is_active is not None:
        query = query.filter(AutomationRule.is_active == is_active)
    
    rules = query.order_by(AutomationRule.priority.desc()).all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "trigger_type": r.trigger_type,
            "trigger_condition": r.trigger_condition,
            "actions": r.actions,
            "priority": r.priority,
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in rules
    ]


@router.post("/rules", response_model=dict)
async def create_rule(
    rule_data: dict,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建自动化规则"""
    from app.models.models import AutomationRule
    
    rule = AutomationRule(
        name=rule_data.get("name"),
        description=rule_data.get("description"),
        trigger_type=rule_data.get("trigger_type"),
        trigger_condition=rule_data.get("trigger_condition"),
        actions=rule_data.get("actions"),
        priority=rule_data.get("priority", 10),
        is_active=rule_data.get("is_active", True)
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return {"id": rule.id, "name": rule.name, "message": "Rule created"}


@router.put("/rules/{rule_id}", response_model=dict)
async def update_rule(
    rule_id: int,
    rule_data: dict,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新自动化规则"""
    from app.models.models import AutomationRule
    
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    for key, value in rule_data.items():
        if hasattr(rule, key):
            setattr(rule, key, value)
    
    db.commit()
    return {"id": rule.id, "name": rule.name, "message": "Rule updated"}


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """删除自动化规则"""
    from app.models.models import AutomationRule
    
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Rule deleted"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """启用/禁用规则"""
    from app.models.models import AutomationRule
    
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_active = not rule.is_active
    db.commit()
    
    return {"id": rule.id, "is_active": rule.is_active, "message": f"Rule {'enabled' if rule.is_active else 'disabled'}"}


# ==================== 能耗管理 API ====================

@router.get("/energy/dashboard", response_model=dict)
async def get_energy_dashboard(
    period: str = "day",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取能耗看板数据"""
    from app.models.models import EnergyRecord
    from datetime import datetime, timedelta
    
    # 按时间范围筛选
    now = datetime.now()
    if period == "day":
        start_time = now - timedelta(days=1)
    elif period == "week":
        start_time = now - timedelta(weeks=1)
    elif period == "month":
        start_time = now - timedelta(days=30)
    else:
        start_time = now - timedelta(days=1)
    
    # 获取能耗记录
    records = db.query(EnergyRecord).filter(
        EnergyRecord.recorded_at >= start_time
    ).all()
    
    # 按设备类型统计
    device_energy = {}
    for record in records:
        dtype = record.device_type
        if dtype not in device_energy:
            device_energy[dtype] = 0
        device_energy[dtype] += record.energy
    
    # 生成模拟数据（如果没有记录）
    if not device_energy:
        device_energy = {
            "ac": round(120.5 + 20 * hash(str(now.date())) % 30, 2),
            "light": round(45.2 + 10 * hash(str(now.date())) % 20, 2),
            "tv": round(28.8 + 5 * hash(str(now.date())) % 10, 2)
        }
    
    total = sum(device_energy.values())
    
    return {
        "period": period,
        "total_energy": round(total, 2),
        "device_breakdown": device_energy,
        "trend": [
            {"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "energy": round(total / 7 + (hash(str(i)) % 10), 2)}
            for i in range(6, -1, -1)
        ] if period in ["week", "month"] else []
    }


@router.get("/energy/room/{room_id}", response_model=dict)
async def get_room_energy(
    room_id: int,
    period: str = "day",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间能耗数据"""
    from app.models.models import EnergyRecord
    from datetime import datetime, timedelta
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    now = datetime.now()
    if period == "day":
        start_time = now - timedelta(days=1)
    elif period == "week":
        start_time = now - timedelta(weeks=1)
    else:
        start_time = now - timedelta(days=30)
    
    records = db.query(EnergyRecord).filter(
        EnergyRecord.room_id == room_id,
        EnergyRecord.recorded_at >= start_time
    ).all()
    
    total_energy = sum(r.energy for r in records)
    
    return {
        "room_id": room_id,
        "room_number": room.number,
        "period": period,
        "total_energy": round(total_energy, 2),
        "record_count": len(records)
    }


@router.get("/energy/alerts", response_model=List[dict])
async def get_energy_alerts(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取能耗异常告警"""
    from app.models.models import EnergyRecord
    from datetime import datetime, timedelta
    
    # 模拟告警数据
    now = datetime.now()
    alerts = []
    
    # 检测异常高能耗
    high_energy_rooms = db.query(EnergyRecord.room_id).filter(
        EnergyRecord.recorded_at >= now - timedelta(days=1)
    ).group_by(EnergyRecord.room_id).all()
    
    for (room_id,) in high_energy_rooms[:3]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            alerts.append({
                "id": room_id,
                "type": "high_consumption",
                "room_number": room.number,
                "message": f"房间 {room.number} 能耗异常偏高",
                "severity": "warning",
                "created_at": now.isoformat()
            })
    
    return alerts

"""
Hotel Edge System - Device Control API
客房设备控制接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import RoomDevice, Room
from app.schemas.schemas import (
    RoomDeviceResponse, RoomDeviceCreate, RoomDeviceUpdate,
    DeviceControlRequest
)
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter()


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
    """添加设备"""
    # 检查房间是否存在
    room = db.query(Room).filter(Room.id == device.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # 检查设备编码是否已存在
    existing = db.query(RoomDevice).filter(RoomDevice.device_code == device.device_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device code already exists")
    
    db_device = RoomDevice(**device.model_dump(), status="offline")
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
    request: DeviceControlRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """控制设备（单房设备控制 edge-3-1-2）"""
    device = db.query(RoomDevice).filter(RoomDevice.id == request.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # 更新设备状态
    if device.state is None:
        device.state = {}
    
    if request.action == "on":
        device.state["power"] = "on"
    elif request.action == "off":
        device.state["power"] = "off"
    elif request.action == "set" and request.value:
        device.state.update(request.value)
    
    device.status = "online"
    db.commit()
    
    # TODO: 通过 MQTT 发送控制命令到实际设备
    # mqtt_client.publish(device.mqtt_topic, json.dumps(device.state))
    
    return {
        "message": "Device controlled",
        "device_id": device.id,
        "device_name": device.device_name,
        "action": request.action,
        "state": device.state
    }


@router.get("/room/{room_id}")
async def get_room_devices(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间内所有设备（客房设备拓扑 edge-3-1-1）"""
    # 检查房间是否存在
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    devices = db.query(RoomDevice).filter(RoomDevice.room_id == room_id).all()
    
    # 按设备类型分组
    device_map = {}
    for device in devices:
        if device.device_type not in device_map:
            device_map[device.device_type] = []
        device_map[device.device_type].append({
            "id": device.id,
            "device_name": device.device_name,
            "device_code": device.device_code,
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
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """执行场景（场景联动 edge-3-2-2）"""
    from app.models.models import Scene
    
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    if not scene.is_active:
        raise HTTPException(status_code=400, detail="Scene is not active")
    
    # 执行场景中的所有设备操作
    results = []
    for action in scene.actions:
        device_type = action.get("device_type")
        device_action = action.get("action")
        value = action.get("value", {})
        
        # 查找对应类型的设备
        devices = db.query(RoomDevice).filter(
            RoomDevice.room_id == scene.room_id,
            RoomDevice.device_type == device_type
        ).all()
        
        for device in devices:
            if device.state is None:
                device.state = {}
            
            if device_action == "on":
                device.state["power"] = "on"
            elif device_action == "off":
                device.state["power"] = "off"
            elif device_action == "set":
                device.state.update(value)
            
            device.status = "online"
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

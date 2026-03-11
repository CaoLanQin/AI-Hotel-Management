"""
Hotel Edge System - Room Management API
客房管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Room, RoomType, RoomStatus
from app.schemas.schemas import (
    RoomResponse, RoomCreate, RoomUpdate,
    RoomTypeResponse, RoomTypeCreate, RoomTypeUpdate
)
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter()


# ========== Room Type APIs ==========
@router.get("/types", response_model=List[RoomTypeResponse])
async def get_room_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房型列表"""
    room_types = db.query(RoomType).offset(skip).limit(limit).all()
    return room_types


@router.get("/types/{type_id}", response_model=RoomTypeResponse)
async def get_room_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房型详情"""
    room_type = db.query(RoomType).filter(RoomType.id == type_id).first()
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    return room_type


@router.post("/types", response_model=RoomTypeResponse)
async def create_room_type(
    room_type: RoomTypeCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建房型"""
    # 检查房型代码是否已存在
    existing = db.query(RoomType).filter(RoomType.code == room_type.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room type code already exists")
    
    db_room_type = RoomType(**room_type.model_dump())
    db.add(db_room_type)
    db.commit()
    db.refresh(db_room_type)
    return db_room_type


@router.put("/types/{type_id}", response_model=RoomTypeResponse)
async def update_room_type(
    type_id: int,
    room_type: RoomTypeUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新房型"""
    db_room_type = db.query(RoomType).filter(RoomType.id == type_id).first()
    if not db_room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    for key, value in room_type.model_dump(exclude_unset=True).items():
        setattr(db_room_type, key, value)
    
    db.commit()
    db.refresh(db_room_type)
    return db_room_type


# ========== Room APIs ==========
@router.get("", response_model=List[RoomResponse])
async def get_rooms(
    skip: int = 0,
    limit: int = 100,
    status: RoomStatus = None,
    room_type_id: int = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间列表"""
    query = db.query(Room)
    if status:
        query = query.filter(Room.status == status)
    if room_type_id:
        query = query.filter(Room.room_type_id == room_type_id)
    
    rooms = query.offset(skip).limit(limit).all()
    return rooms


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间详情"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.post("", response_model=RoomResponse)
async def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建房间"""
    # 检查房间号是否已存在
    existing = db.query(Room).filter(Room.number == room.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")
    
    # 检查房型是否存在
    room_type = db.query(RoomType).filter(RoomType.id == room.room_type_id).first()
    if not room_type:
        raise HTTPException(status_code=400, detail="Room type not found")
    
    db_room = Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: int,
    room: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新房间"""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    for key, value in room.model_dump(exclude_unset=True).items():
        setattr(db_room, key, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room


@router.get("/available/list")
async def get_available_rooms(
    check_in_date: str = None,
    check_out_date: str = None,
    room_type_id: int = None,
    db: Session = Depends(get_db)
):
    """获取可预订房间列表（核心功能）"""
    # 获取可用状态房间
    query = db.query(Room).filter(Room.status == RoomStatus.AVAILABLE)
    
    if room_type_id:
        query = query.filter(Room.room_type_id == room_type_id)
    
    rooms = query.all()
    
    result = []
    for room in rooms:
        room_type = db.query(RoomType).filter(RoomType.id == room.room_type_id).first()
        result.append({
            "id": room.id,
            "number": room.number,
            "floor": room.floor,
            "status": room.status.value,
            "room_type": {
                "id": room_type.id,
                "name": room_type.name,
                "code": room_type.code,
                "base_price": room_type.base_price,
                "max_occupancy": room_type.max_occupancy
            } if room_type else None
        })
    
    return result

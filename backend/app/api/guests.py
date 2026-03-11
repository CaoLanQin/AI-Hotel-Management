"""
Hotel Edge System - Guest API
客人管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Guest
from app.schemas.schemas import GuestResponse, GuestCreate, GuestUpdate
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter()


@router.get("", response_model=List[GuestResponse])
async def get_guests(
    skip: int = 0,
    limit: int = 100,
    phone: str = None,
    name: str = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取客人列表"""
    query = db.query(Guest)
    if phone:
        query = query.filter(Guest.phone == phone)
    if name:
        query = query.filter(Guest.name.like(f"%{name}%"))
    
    guests = query.order_by(Guest.created_at.desc()).offset(skip).limit(limit).all()
    return guests


@router.get("/{guest_id}", response_model=GuestResponse)
async def get_guest(
    guest_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取客人详情"""
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest


@router.post("", response_model=GuestResponse)
async def create_guest(
    guest: GuestCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建客人档案"""
    # 检查手机号是否已存在
    if guest.phone:
        existing = db.query(Guest).filter(Guest.phone == guest.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already exists")
    
    db_guest = Guest(**guest.model_dump())
    db.add(db_guest)
    db.commit()
    db.refresh(db_guest)
    return db_guest


@router.put("/{guest_id}", response_model=GuestResponse)
async def update_guest(
    guest_id: int,
    guest: GuestUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新客人信息"""
    db_guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not db_guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    
    for key, value in guest.model_dump(exclude_unset=True).items():
        setattr(db_guest, key, value)
    
    db.commit()
    db.refresh(db_guest)
    return db_guest


@router.get("/search/by-phone/{phone}", response_model=GuestResponse)
async def search_guest_by_phone(
    phone: str,
    db: Session = Depends(get_db)
):
    """根据手机号搜索客人（快速入住用）"""
    guest = db.query(Guest).filter(Guest.phone == phone).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest

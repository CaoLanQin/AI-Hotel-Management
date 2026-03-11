"""
Hotel Edge System - Booking API
预订管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Booking, Guest, Room, RoomType, BookingStatus
from app.schemas.schemas import (
    BookingResponse, BookingCreate, BookingUpdate
)
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse
from app.api.auth import get_password_hash

router = APIRouter()


def generate_booking_no() -> str:
    """生成预订编号"""
    return f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}"


@router.get("", response_model=List[BookingResponse])
async def get_bookings(
    skip: int = 0,
    limit: int = 100,
    status: BookingStatus = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取预订列表"""
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    
    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取预订详情"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("", response_model=BookingResponse)
async def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建预订（预订录入 edge-2-1-1）"""
    # 检查客人是否存在
    guest = db.query(Guest).filter(Guest.id == booking.guest_id).first()
    if not guest:
        raise HTTPException(status_code=400, detail="Guest not found")
    
    # 计算入住晚数
    nights = (booking.check_out_date - booking.check_in_date).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Invalid check-out date")
    
    # 计算总价
    total_amount = booking.room_rate * nights
    
    # 检查是否有指定房间
    room = None
    if booking.room_id:
        room = db.query(Room).filter(Room.id == booking.room_id).first()
        if not room:
            raise HTTPException(status_code=400, detail="Room not found")
    
    db_booking = Booking(
        booking_no=generate_booking_no(),
        guest_id=booking.guest_id,
        room_type_id=booking.room_type_id,
        room_id=booking.room_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        expected_arrival_time=booking.expected_arrival_time,
        nights=nights,
        room_rate=booking.room_rate,
        total_amount=total_amount,
        deposit=booking.deposit,
        status=BookingStatus.PENDING,
        source=booking.source,
        special_requests=booking.special_requests
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新预订"""
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # 如果更改日期，重新计算晚数和总价
    if booking.check_in_date or booking.check_out_date:
        check_in = booking.check_in_date or db_booking.check_in_date
        check_out = booking.check_out_date or db_booking.check_out_date
        nights = (check_out - check_in).days
        room_rate = booking.room_rate or db_booking.room_rate
        db_booking.nights = nights
        db_booking.total_amount = room_rate * nights
    
    for key, value in booking.model_dump(exclude_unset=True).items():
        setattr(db_booking, key, value)
    
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.post("/{booking_id}/confirm")
async def confirm_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """确认预订（预订确认 edge-2-1-3）"""
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if db_booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking cannot be confirmed")
    
    db_booking.status = BookingStatus.CONFIRMED
    db.commit()
    
    return {"message": "Booking confirmed", "booking_no": db_booking.booking_no}


@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """取消预订"""
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if db_booking.status in [BookingStatus.CHECKED_IN, BookingStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Cannot cancel checked-in or completed booking")
    
    db_booking.status = BookingStatus.CANCELLED
    db.commit()
    
    return {"message": "Booking cancelled", "booking_no": db_booking.booking_no}

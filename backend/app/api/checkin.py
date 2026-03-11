"""
Hotel Edge System - Check-In/Check-Out API
入住与退房管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import (
    CheckIn, Booking, Room, Guest, RoomStatus, 
    BookingStatus, CheckInStatus, OperationLog
)
from app.schemas.schemas import (
    CheckInResponse, CheckInCreate, CheckInUpdate
)
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter()


def generate_check_in_no() -> str:
    """生成入住编号"""
    return f"CI{datetime.now().strftime('%Y%m%d%H%M%S')}"


@router.get("", response_model=List[CheckInResponse])
async def get_check_ins(
    skip: int = 0,
    limit: int = 100,
    status: CheckInStatus = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取入住列表"""
    query = db.query(CheckIn)
    if status:
        query = query.filter(CheckIn.status == status)
    
    check_ins = query.order_by(CheckIn.created_at.desc()).offset(skip).limit(limit).all()
    return check_ins


@router.get("/{check_in_id}", response_model=CheckInResponse)
async def get_check_in(
    check_in_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取入住详情"""
    check_in = db.query(CheckIn).filter(CheckIn.id == check_in_id).first()
    if not check_in:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return check_in


@router.post("", response_model=CheckInResponse)
async def create_check_in(
    check_in: CheckInCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建入住（快速入住 edge-2-2-1）"""
    # 检查房间是否存在
    room = db.query(Room).filter(Room.id == check_in.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # 检查房间是否可用
    if room.status != RoomStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Room is not available")
    
    # 检查客人是否存在
    guest = db.query(Guest).filter(Guest.id == check_in.guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    
    # 如果有预订，验证预订
    booking = None
    if check_in.booking_id:
        booking = db.query(Booking).filter(Booking.id == check_in.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Booking is not confirmed")
    
    # 计算实际入住时间
    actual_check_in = datetime.now()
    
    # 创建入住记录
    db_check_in = CheckIn(
        check_in_no=generate_check_in_no(),
        booking_id=check_in.booking_id,
        guest_id=check_in.guest_id,
        room_id=check_in.room_id,
        check_in_time=check_in.check_in_time,
        check_out_time=check_in.check_out_time,
        actual_check_in_time=actual_check_in,
        room_rate=check_in.room_rate,
        deposit=check_in.deposit,
        pay_method=check_in.pay_method,
        operator_id=current_user.id,
        notes=check_in.notes,
        status=CheckInStatus.CHECKED_IN
    )
    
    # 更新房间状态
    room.status = RoomStatus.OCCUPIED
    room.current_check_in_id = None  # 暂时不关联
    
    # 如果有预订，更新预订状态
    if booking:
        booking.status = BookingStatus.CHECKED_IN
    
    db.add(db_check_in)
    db.commit()
    db.refresh(db_check_in)
    
    # 记录操作日志
    log = OperationLog(
        user_id=current_user.id,
        module="frontdesk",
        operation="check_in",
        target_type="check_in",
        target_id=db_check_in.id,
        details={
            "check_in_no": db_check_in.check_in_no,
            "room_number": room.number,
            "guest_name": guest.name
        }
    )
    db.add(log)
    db.commit()
    
    return db_check_in


@router.post("/{check_in_id}/check-out")
async def check_out(
    check_in_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """退房（快速退房 edge-2-4-1）"""
    check_in = db.query(CheckIn).filter(CheckIn.id == check_in_id).first()
    if not check_in:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    if check_in.status == CheckInStatus.CHECKED_OUT:
        raise HTTPException(status_code=400, detail="Already checked out")
    
    # 获取房间
    room = db.query(Room).filter(Room.id == check_in.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # 计算实际退房时间
    actual_check_out = datetime.now()
    
    # 计算消费金额（迷你吧等）
    from app.models.models import Consumption
    consumptions = db.query(Consumption).filter(
        Consumption.check_in_id == check_in_id,
        Consumption.status == "pending"
    ).all()
    
    total_consumption = sum(c.total_amount for c in consumptions)
    
    # 计算结算金额
    check_out_balance = total_consumption  # 消费金额
    
    # 更新入住记录
    check_in.actual_check_out_time = actual_check_out
    check_in.status = CheckInStatus.CHECKED_OUT
    check_in.check_out_balance = check_out_balance
    
    # 更新房间状态为清洁中
    room.status = RoomStatus.CLEANING
    
    # 如果有预订，更新预订状态
    if check_in.booking_id:
        booking = db.query(Booking).filter(Booking.id == check_in.booking_id).first()
        if booking:
            booking.status = BookingStatus.COMPLETED
    
    # 更新消费记录状态
    for c in consumptions:
        c.status = "paid"
    
    # 记录操作日志
    log = OperationLog(
        user_id=current_user.id,
        module="frontdesk",
        operation="check_out",
        target_type="check_in",
        target_id=check_in.id,
        details={
            "check_in_no": check_in.check_in_no,
            "room_number": room.number,
            "consumption_amount": total_consumption,
            "balance": check_out_balance
        }
    )
    db.add(log)
    db.commit()
    
    return {
        "message": "Check-out successful",
        "check_in_no": check_in.check_in_no,
        "room_number": room.number,
        "consumption_amount": total_consumption,
        "balance": check_out_balance
    }


@router.post("/{check_in_id}/extend")
async def extend_stay(
    check_in_id: int,
    new_check_out_time: datetime,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """续住处理（续住 edge-2-3-2）"""
    check_in = db.query(CheckIn).filter(CheckIn.id == check_in_id).first()
    if not check_in:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    if check_in.status == CheckInStatus.CHECKED_OUT:
        raise HTTPException(status_code=400, detail="Already checked out")
    
    if new_check_out_time <= check_in.actual_check_in_time:
        raise HTTPException(status_code=400, detail="Invalid check-out time")
    
    # 更新退房时间
    check_in.check_out_time = new_check_out_time
    db.commit()
    
    return {
        "message": "Stay extended",
        "new_check_out_time": new_check_out_time
    }

"""
Hotel Edge System - Dashboard API
运营驾驶舱接口
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import (
    Room, RoomType, CheckIn, Booking, Guest,
    RoomStatus, BookingStatus, CheckInStatus, Consumption
)
from app.schemas.schemas import DashboardStats
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取运营驾驶舱统计数据（实时运营驾驶舱 edge-1-1-1）"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    # 今日入住
    today_check_in = db.query(CheckIn).filter(
        CheckIn.actual_check_in_time >= today,
        CheckIn.actual_check_in_time < tomorrow
    ).count()
    
    # 今日退房
    today_check_out = db.query(CheckIn).filter(
        CheckIn.actual_check_out_time >= today,
        CheckIn.actual_check_out_time < tomorrow
    ).count()
    
    # 房间统计
    total_rooms = db.query(Room).count()
    available_rooms = db.query(Room).filter(Room.status == RoomStatus.AVAILABLE).count()
    occupied_rooms = db.query(Room).filter(Room.status == RoomStatus.OCCUPIED).count()
    maintenance_rooms = db.query(Room).filter(
        Room.status.in_([RoomStatus.MAINTENANCE, RoomStatus.CLEANING])
    ).count()
    
    # 计算入住率
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # 今日营收（入住房间的房费 + 消费）
    today_check_ins = db.query(CheckIn).filter(
        CheckIn.actual_check_in_time >= today,
        CheckIn.actual_check_in_time < tomorrow
    ).all()
    
    today_revenue = sum(c.room_rate for c in today_check_ins)
    
    # 今日消费
    today_consumptions = db.query(Consumption).filter(
        Consumption.created_at >= today,
        Consumption.created_at < tomorrow,
        Consumption.status == "paid"
    ).all()
    
    today_revenue += sum(c.total_amount for c in today_consumptions)
    
    # 待确认预订
    pending_bookings = db.query(Booking).filter(
        Booking.status == BookingStatus.PENDING
    ).count()
    
    return DashboardStats(
        today_check_in=today_check_in,
        today_check_out=today_check_out,
        available_rooms=available_rooms,
        occupied_rooms=occupied_rooms,
        maintenance_rooms=maintenance_rooms,
        total_rooms=total_rooms,
        occupancy_rate=round(occupancy_rate, 2),
        today_revenue=round(today_revenue, 2),
        pending_bookings=pending_bookings
    )


@router.get("/room-status")
async def get_room_status_matrix(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取房间状态矩阵（客房全息矩阵 edge-1-1-2）"""
    rooms = db.query(Room).join(RoomType).all()
    
    result = []
    for room in rooms:
        # 获取当前入住信息
        current_check_in = None
        if room.status == RoomStatus.OCCUPIED:
            check_in = db.query(CheckIn).filter(
                CheckIn.room_id == room.id,
                CheckIn.status == CheckInStatus.CHECKED_IN
            ).first()
            if check_in:
                guest = db.query(Guest).filter(Guest.id == check_in.guest_id).first()
                current_check_in = {
                    "check_in_no": check_in.check_in_no,
                    "guest_name": guest.name if guest else None,
                    "check_in_time": check_in.actual_check_in_time.isoformat() if check_in.actual_check_in_time else None,
                    "check_out_time": check_in.check_out_time.isoformat()
                }
        
        result.append({
            "room_id": room.id,
            "room_number": room.number,
            "floor": room.floor,
            "status": room.status.value,
            "room_type": room.room_type.name if room.room_type else None,
            "current_check_in": current_check_in
        })
    
    # 按楼层分组
    floors = {}
    for r in result:
        floor = r["floor"] or 0
        if floor not in floors:
            floors[floor] = []
        floors[floor].append(r)
    
    return {
        "total_rooms": len(rooms),
        "floors": floors
    }


@router.get("/revenue/today")
async def get_today_revenue(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取今日营收明细"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    # 房费收入
    room_revenue = db.query(func.sum(CheckIn.room_rate)).filter(
        CheckIn.actual_check_in_time >= today,
        CheckIn.actual_check_in_time < tomorrow,
        CheckIn.status == CheckInStatus.CHECKED_OUT
    ).scalar() or 0
    
    # 消费收入
    consumption_revenue = db.query(func.sum(Consumption.total_amount)).filter(
        Consumption.created_at >= today,
        Consumption.created_at < tomorrow,
        Consumption.status == "paid"
    ).scalar() or 0
    
    return {
        "date": today.strftime("%Y-%m-%d"),
        "room_revenue": float(room_revenue),
        "consumption_revenue": float(consumption_revenue),
        "total_revenue": float(room_revenue) + float(consumption_revenue)
    }


@router.get("/alerts")
async def get_alerts(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取实时告警（实时告警中心 edge-1-1-3）"""
    alerts = []
    
    # 房间维修告警
    maintenance_rooms = db.query(Room).filter(Room.status == RoomStatus.MAINTENANCE).all()
    if maintenance_rooms:
        alerts.append({
            "type": "maintenance",
            "level": "warning",
            "message": f"{len(maintenance_rooms)} 间房间正在维修中",
            "count": len(maintenance_rooms)
        })
    
    # 待确认预订告警
    pending_count = db.query(Booking).filter(Booking.status == BookingStatus.PENDING).count()
    if pending_count > 10:
        alerts.append({
            "type": "pending_bookings",
            "level": "info",
            "message": f"{pending_count} 个预订待确认",
            "count": pending_count
        })
    
    # 退房告警（超时未退房）
    now = datetime.now()
    overdue_check_outs = db.query(CheckIn).filter(
        CheckIn.status == CheckInStatus.CHECKED_IN,
        CheckIn.check_out_time < now
    ).all()
    if overdue_check_outs:
        alerts.append({
            "type": "overdue_checkout",
            "level": "warning",
            "message": f"{len(overdue_check_outs)} 间房间超时未退房",
            "count": len(overdue_check_outs)
        })
    
    return alerts

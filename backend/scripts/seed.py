"""
Database Seeder - 初始化测试数据
"""
from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.models.models import User, Guest, RoomType, Room, BookingStatus, RoomStatus
from app.api.auth import get_password_hash
from datetime import datetime, timedelta
import random


def seed_database():
    """初始化数据库测试数据"""
    # 创建表
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 检查是否已有数据
        if db.query(User).first():
            print("数据库已有数据，跳过初始化")
            return
        
        # 1. 创建管理员用户
        admin = User(
            username="admin",
            email="admin@hotel.com",
            hashed_password=get_password_hash("admin123"),
            full_name="系统管理员",
            role="admin",
            is_active=True
        )
        db.add(admin)
        
        # 创建前台用户
        frontdesk = User(
            username="frontdesk",
            email="frontdesk@hotel.com",
            hashed_password=get_password_hash("front123"),
            full_name="前台小李",
            role="staff",
            is_active=True
        )
        db.add(frontdesk)
        
        # 2. 创建房型
        room_types = [
            {"name": "标准大床房", "code": "STD", "base_price": 299, "max_occupancy": 2, "bed_count": 1},
            {"name": "标准双床房", "code": "TWIN", "base_price": 299, "max_occupancy": 2, "bed_count": 2},
            {"name": "豪华大床房", "code": "DELUXE", "base_price": 499, "max_occupancy": 2, "bed_count": 1},
            {"name": "豪华套房", "code": "SUITE", "base_price": 899, "max_occupancy": 4, "bed_count": 2},
            {"name": "商务单人间", "code": "SINGLE", "base_price": 199, "max_occupancy": 1, "bed_count": 1},
        ]
        
        db_room_types = []
        for rt in room_types:
            room_type = RoomType(**rt)
            db.add(room_type)
            db_room_types.append(room_type)
        
        db.flush()
        
        # 3. 创建房间 (每层10间房，共5层)
        floors = [1, 2, 3, 4, 5]
        rooms = []
        for floor in floors:
            for i in range(1, 11):
                room_num = floor * 100 + i
                room_type = db_room_types[i % len(db_room_types)]
                
                # 随机状态
                status = random.choice([
                    RoomStatus.AVAILABLE,
                    RoomStatus.AVAILABLE,
                    RoomStatus.AVAILABLE,
                    RoomStatus.OCCUPIED,
                    RoomStatus.CLEANING,
                ])
                
                room = Room(
                    number=str(room_num),
                    floor=floor,
                    room_type_id=room_type.id,
                    status=status
                )
                db.add(room)
                rooms.append(room)
        
        db.flush()
        
        # 4. 创建客人
        guests_data = [
            {"name": "张三", "phone": "13800138000", "vip_level": 2},
            {"name": "李四", "phone": "13900139000", "vip_level": 1},
            {"name": "王五", "phone": "13700137000", "vip_level": 3},
            {"name": "赵六", "phone": "13600136000", "vip_level": 0},
            {"name": "钱七", "phone": "13500135000", "vip_level": 1},
        ]
        
        db_guests = []
        for g in guests_data:
            guest = Guest(**g)
            db.add(guest)
            db_guests.append(guest)
        
        db.flush()
        
        # 5. 创建预订
        for i, guest in enumerate(db_guests[:3]):
            check_in = datetime.now() + timedelta(days=random.randint(0, 3))
            check_out = check_in + timedelta(days=random.randint(1, 3))
            room_type = db_room_types[i % len(db_room_types)]
            
            booking = Booking(
                booking_no=f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}{i}",
                guest_id=guest.id,
                room_type_id=room_type.id,
                check_in_date=check_in,
                check_out_date=check_out,
                nights=(check_out - check_in).days,
                room_rate=room_type.base_price,
                total_amount=room_type.base_price * (check_out - check_in).days,
                status=BookingStatus.CONFIRMED,
                source="walk-in"
            )
            db.add(booking)
        
        # 6. 创建入住记录 (2个房间有客人)
        occupied_rooms = [r for r in rooms if r.status == RoomStatus.OCCUPIED][:2]
        for room in occupied_rooms:
            check_in_time = datetime.now() - timedelta(days=random.randint(1, 3))
            check_out_time = datetime.now() + timedelta(days=random.randint(1, 2))
            
            check_in = CheckIn(
                check_in_no=f"CI{datetime.now().strftime('%Y%m%d%H%M%S')}{room.id}",
                guest_id=random.choice(db_guests).id,
                room_id=room.id,
                check_in_time=check_in_time,
                check_out_time=check_out_time,
                actual_check_in_time=check_in_time,
                room_rate=room.room_type.base_price,
                deposit=500,
                operator_id=1,
                status="checked_in"
            )
            db.add(check_in)
        
        db.commit()
        print("✅ 测试数据初始化完成!")
        print(f"   - 用户: admin / admin123, frontdesk / front123")
        print(f"   - 房型: {len(room_types)} 个")
        print(f"   - 房间: {len(rooms)} 间")
        print(f"   - 客人: {len(guests_data)} 位")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    from app.models.models import Booking, CheckIn
    seed_database()

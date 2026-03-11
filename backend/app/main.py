"""
Hotel Edge System - Main Application
基于 SPECIFICATION.md 开发规范
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import auth, users, rooms, bookings, checkin, guests, devices, dashboard, purchase, procurement

settings = get_settings()

# 创建FastAPI应用
app = FastAPI(
    title="Hotel Edge System",
    description="酒店边端管理系统 API",
    version="1.0.0",
    debug=settings.debug
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    # 创建数据库表
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


@app.get("/")
async def root():
    """根路由"""
    return {
        "message": "Hotel Edge System API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/v1/users", tags=["用户"])
app.include_router(guests.router, prefix="/api/v1/guests", tags=["客人"])
app.include_router(rooms.router, prefix="/api/v1/rooms", tags=["房间"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["预订"])
app.include_router(checkin.router, prefix="/api/v1/checkin", tags=["入住"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["设备"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["驾驶舱"])
# app.include_router(purchase.router, prefix="/api/v1/purchase", tags=["供应链采购"])
app.include_router(procurement.router, prefix="/api/v1/procurement", tags=["智能采购商城"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

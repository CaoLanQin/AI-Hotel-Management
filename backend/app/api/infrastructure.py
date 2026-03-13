"""
Infrastructure API - 基建与系统管理
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.models import User
from app.api.auth import get_current_user
from app.schemas.schemas import UserResponse

router = APIRouter(tags=["infrastructure"])

# ==================== 设备配置管理 ====================

class InfrastructureDeviceCreate(BaseModel):
    device_name: str
    device_type: str
    location: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    config_json: Optional[dict] = None
    status: str = "offline"


class InfrastructureDeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    config_json: Optional[dict] = None
    status: Optional[str] = None


class InfrastructureDeviceResponse(BaseModel):
    id: int
    device_name: str
    device_type: str
    location: Optional[str]
    ip_address: Optional[str]
    mac_address: Optional[str]
    config_json: Optional[dict]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# 模拟数据存储（生产环境应使用数据库）
infrastructure_devices = [
    {"id": 1, "device_name": "边缘服务器-1", "device_type": "edge_server", "location": "机房-1", "ip_address": "192.168.1.10", "mac_address": "00:11:22:33:44:55", "status": "online", "config_json": {"cpu": "Intel i7", "ram": "32GB"}, "created_at": "2024-01-01T00:00:00"},
    {"id": 2, "device_name": "边缘服务器-2", "device_type": "edge_server", "location": "机房-2", "ip_address": "192.168.1.11", "mac_address": "00:11:22:33:44:56", "status": "online", "config_json": {"cpu": "Intel i5", "ram": "16GB"}, "created_at": "2024-01-02T00:00:00"},
    {"id": 3, "device_name": "核心交换机", "device_type": "switch", "location": "弱电井", "ip_address": "192.168.1.1", "mac_address": "00:11:22:33:44:57", "status": "online", "config_json": {"ports": 48}, "created_at": "2024-01-03T00:00:00"},
    {"id": 4, "device_name": "无线AP-1", "device_type": "ap", "location": "大堂", "ip_address": "192.168.1.20", "mac_address": "00:11:22:33:44:58", "status": "online", "config_json": {"ssid": "Hotel-WiFi"}, "created_at": "2024-01-04T00:00:00"},
    {"id": 5, "device_name": "无线AP-2", "device_type": "ap", "location": "客房-5F", "ip_address": "192.168.1.21", "mac_address": "00:11:22:33:44:59", "status": "offline", "config_json": {"ssid": "Hotel-WiFi"}, "created_at": "2024-01-05T00:00:00"},
    {"id": 6, "device_name": "温湿度传感器-1", "device_type": "sensor", "location": "大堂", "ip_address": "192.168.1.30", "mac_address": "00:11:22:33:44:5A", "status": "online", "config_json": {"temp": 22, "humidity": 45}, "created_at": "2024-01-06T00:00:00"},
    {"id": 7, "device_name": "温湿度传感器-2", "device_type": "sensor", "location": "客房-501", "ip_address": "192.168.1.31", "mac_address": "00:11:22:33:44:5B", "status": "online", "config_json": {"temp": 24, "humidity": 50}, "created_at": "2024-01-07T00:00:00"},
    {"id": 8, "device_name": "智能电表-1", "device_type": "meter", "location": "配电室", "ip_address": "192.168.1.40", "mac_address": "00:11:22:33:44:5C", "status": "online", "config_json": {"voltage": 220, "current": 100}, "created_at": "2024-01-08T00:00:00"},
]

next_device_id = 9


@router.get("/devices", response_model=List[InfrastructureDeviceResponse])
def get_infrastructure_devices(
    device_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取基建设备列表"""
    devices = infrastructure_devices.copy()
    
    if device_type:
        devices = [d for d in devices if d["device_type"] == device_type]
    if status:
        devices = [d for d in devices if d["status"] == status]
    if search:
        search = search.lower()
        devices = [d for d in devices if search in d["device_name"].lower() or search in (d.get("location") or "").lower()]
    
    return devices


@router.get("/devices/{device_id}", response_model=InfrastructureDeviceResponse)
def get_infrastructure_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取单个设备详情"""
    for device in infrastructure_devices:
        if device["id"] == device_id:
            return device
    raise HTTPException(status_code=404, detail="设备不存在")


@router.post("/devices", response_model=InfrastructureDeviceResponse)
def create_infrastructure_device(
    device: InfrastructureDeviceCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建设备"""
    global next_device_id
    new_device = {
        "id": next_device_id,
        **device.dict(),
        "created_at": datetime.now().isoformat()
    }
    infrastructure_devices.append(new_device)
    next_device_id += 1
    return new_device


@router.put("/devices/{device_id}", response_model=InfrastructureDeviceResponse)
def update_infrastructure_device(
    device_id: int,
    device: InfrastructureDeviceUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """更新设备"""
    for i, d in enumerate(infrastructure_devices):
        if d["id"] == device_id:
            update_data = device.dict(exclude_unset=True)
            infrastructure_devices[i] = {**d, **update_data}
            return infrastructure_devices[i]
    raise HTTPException(status_code=404, detail="设备不存在")


@router.delete("/devices/{device_id}")
def delete_infrastructure_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """删除设备"""
    global infrastructure_devices
    for i, d in enumerate(infrastructure_devices):
        if d["id"] == device_id:
            infrastructure_devices.pop(i)
            return {"message": "删除成功"}
    raise HTTPException(status_code=404, detail="设备不存在")


@router.post("/devices/{device_id}/restart")
def restart_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """重启设备"""
    for device in infrastructure_devices:
        if device["id"] == device_id:
            return {"message": f"设备 {device['device_name']} 重启成功", "status": "restarting"}
    raise HTTPException(status_code=404, detail="设备不存在")


# ==================== 网关管理 ====================

class GatewayResponse(BaseModel):
    id: int
    gateway_name: str
    gateway_type: str
    location: str
    ip_address: str
    firmware_version: str
    device_count: int
    status: str
    cpu_usage: float
    memory_usage: float


gateways = [
    {"id": 1, "gateway_name": "边缘网关-1", "gateway_type": "edge", "location": "机房-1", "ip_address": "192.168.1.100", "firmware_version": "v2.1.0", "device_count": 128, "status": "online", "cpu_usage": 35.5, "memory_usage": 62.0},
    {"id": 2, "gateway_name": "边缘网关-2", "gateway_type": "edge", "location": "机房-2", "ip_address": "192.168.1.101", "firmware_version": "v2.1.0", "device_count": 96, "status": "online", "cpu_usage": 28.2, "memory_usage": 45.5},
    {"id": 3, "gateway_name": "IoT网关-1", "gateway_type": "iot", "location": "弱电井", "ip_address": "192.168.1.102", "firmware_version": "v1.8.5", "device_count": 64, "status": "warning", "cpu_usage": 75.0, "memory_usage": 80.0},
]


@router.get("/gateways", response_model=List[GatewayResponse])
def get_gateways(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取网关列表"""
    return gateways


@router.get("/gateways/{gateway_id}", response_model=GatewayResponse)
def get_gateway(
    gateway_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取网关详情"""
    for gateway in gateways:
        if gateway["id"] == gateway_id:
            return gateway
    raise HTTPException(status_code=404, detail="网关不存在")


# ==================== 边缘服务器监控 ====================

class ServerMonitorResponse(BaseModel):
    id: int
    server_name: str
    ip_address: str
    status: str
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_in: int
    network_out: int
    uptime: int


servers = [
    {"id": 1, "server_name": "Edge-Server-01", "ip_address": "192.168.1.10", "status": "online", "cpu_usage": 45.2, "memory_usage": 62.5, "disk_usage": 78.3, "network_in": 12500000, "network_out": 8300000, "uptime": 2592000},
    {"id": 2, "server_name": "Edge-Server-02", "ip_address": "192.168.1.11", "status": "online", "cpu_usage": 32.1, "memory_usage": 45.8, "disk_usage": 56.2, "network_in": 9800000, "network_out": 6500000, "uptime": 2592000},
]


@router.get("/servers", response_model=List[ServerMonitorResponse])
def get_servers(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取边缘服务器列表"""
    return servers


@router.get("/servers/{server_id}", response_model=ServerMonitorResponse)
def get_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取服务器详情"""
    for server in servers:
        if server["id"] == server_id:
            return server
    raise HTTPException(status_code=404, detail="服务器不存在")


# ==================== 零接触入网 ====================

class OnboardingTaskResponse(BaseModel):
    id: int
    device_mac: str
    device_type: str
    device_name: str
    signal_strength: int
    status: str
    progress: int
    create_time: str


onboarding_tasks = [
    {"id": 1, "device_mac": "A4:34:F1:22:11", "device_type": "温控器", "device_name": "温控器-001", "signal_strength": -45, "status": "success", "progress": 100, "create_time": "2024-02-06T10:00:00"},
    {"id": 2, "device_mac": "B5:45:A2:33:22", "device_type": "门磁", "device_name": "门磁-001", "signal_strength": -52, "status": "success", "progress": 100, "create_time": "2024-02-06T11:00:00"},
    {"id": 3, "device_mac": "C6:56:B3:44:33", "device_type": "人体感应", "device_name": "人体感应-001", "signal_strength": -38, "status": "running", "progress": 60, "create_time": "2024-02-06T14:00:00"},
]


@router.get("/onboarding/tasks", response_model=List[OnboardingTaskResponse])
def get_onboarding_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取入网任务列表"""
    tasks = onboarding_tasks.copy()
    if status:
        tasks = [t for t in tasks if t["status"] == status]
    return tasks


@router.post("/onboarding/scan")
def start_device_scan(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """开始扫描新设备"""
    return {"message": "设备扫描已启动", "scan_id": "scan_001"}


@router.post("/onboarding/tasks/{task_id}/approve")
def approve_onboarding(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """批准入网"""
    for task in onboarding_tasks:
        if task["id"] == task_id:
            task["status"] = "success"
            task["progress"] = 100
            return {"message": "入网批准成功"}
    raise HTTPException(status_code=404, detail="任务不存在")


# ==================== 门店基础配置 ====================

class BuildingResponse(BaseModel):
    id: int
    building_name: str
    building_code: str
    floor_count: int
    room_count: int
    status: str


buildings = [
    {"id": 1, "building_name": "主楼", "building_code": "A", "floor_count": 12, "room_count": 156, "status": "active"},
    {"id": 2, "building_name": "附楼", "building_code": "B", "floor_count": 3, "room_count": 45, "status": "active"},
]


@router.get("/buildings", response_model=List[BuildingResponse])
def get_buildings(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取楼栋列表"""
    return buildings


# ==================== 日志审计 ====================

class LogEntryResponse(BaseModel):
    id: int
    action: str
    user: str
    module: str
    detail: str
    ip_address: str
    create_time: str


logs = [
    {"id": 1, "action": "用户登录", "user": "admin", "module": "系统", "detail": "登录成功", "ip_address": "192.168.1.50", "create_time": "2024-02-06T10:00:00"},
    {"id": 2, "action": "设备配置修改", "user": "admin", "module": "设备管理", "detail": "修改了温控器-001的配置", "ip_address": "192.168.1.50", "create_time": "2024-02-06T10:30:00"},
    {"id": 3, "action": "订单创建", "user": "manager", "module": "采购管理", "detail": "创建采购订单 #1234", "ip_address": "192.168.1.51", "create_time": "2024-02-06T11:00:00"},
    {"id": 4, "action": "菜单访问", "user": "staff", "module": "客房管理", "detail": "访问了房间管理页面", "ip_address": "192.168.1.52", "create_time": "2024-02-06T11:30:00"},
    {"id": 5, "action": "数据导出", "user": "manager", "module": "报表", "detail": "导出了日报表", "ip_address": "192.168.1.51", "create_time": "2024-02-06T12:00:00"},
]


@router.get("/logs", response_model=List[LogEntryResponse])
def get_logs(
    user: Optional[str] = None,
    module: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取操作日志"""
    result = logs.copy()
    if user:
        result = [l for l in result if l["user"] == user]
    if module:
        result = [l for l in result if l["module"] == module]
    if action:
        result = [l for l in result if action in l["action"]]
    return result[:limit]


# ==================== 数据备份 ====================

class BackupResponse(BaseModel):
    id: int
    backup_name: str
    backup_type: str
    size: str
    status: str
    create_time: str


backups = [
    {"id": 1, "backup_name": "全量备份-20240206", "backup_type": "full", "size": "2.5GB", "status": "completed", "create_time": "2024-02-06T02:00:00"},
    {"id": 2, "backup_name": "增量备份-20240207", "backup_type": "incremental", "size": "320MB", "status": "completed", "create_time": "2024-02-07T02:00:00"},
    {"id": 3, "backup_name": "全量备份-20240208", "backup_type": "full", "size": "2.6GB", "status": "completed", "create_time": "2024-02-08T02:00:00"},
]


@router.get("/backups", response_model=List[BackupResponse])
def get_backups(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """获取备份列表"""
    return backups


@router.post("/backups")
def create_backup(
    backup_type: str = "full",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """创建备份"""
    backup_id = len(backups) + 1
    new_backup = {
        "id": backup_id,
        "backup_name": f"{'全量' if backup_type == 'full' else '增量'}备份-{datetime.now().strftime('%Y%m%d')}",
        "backup_type": backup_type,
        "size": "0MB",
        "status": "running",
        "create_time": datetime.now().isoformat()
    }
    backups.append(new_backup)
    return {"message": "备份已启动", "backup_id": backup_id}

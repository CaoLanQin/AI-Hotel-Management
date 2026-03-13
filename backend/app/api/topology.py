from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/topology", tags=["topology"])

# 模拟拓扑数据
topology_data = {
    "gateways": [
        {
            "gatewayId": "GW-1F-01",
            "gatewayName": "1楼网关01",
            "onlineStatus": 1,
            "deviceCount": 45,
            "floor": "1F",
            "position": {"x": 500, "y": 200},
            "rooms": [
                {
                    "roomNo": "101",
                    "roomStatus": "occupied",
                    "healthScore": 95,
                    "devices": [
                        {"deviceId": "AC-101-01", "deviceName": "空调控制器", "deviceType": "AC", "onlineStatus": 1, "signalStrength": -65},
                        {"deviceId": "LT-101-01", "deviceName": "卧室灯", "deviceType": "LT", "onlineStatus": 1, "signalStrength": -55},
                        {"deviceId": "CT-101-01", "deviceName": "窗帘电机", "deviceType": "CT", "onlineStatus": 1, "signalStrength": -70},
                        {"deviceId": "DR-101-01", "deviceName": "门锁", "deviceType": "DR", "onlineStatus": 1, "signalStrength": -60},
                    ]
                },
                {
                    "roomNo": "102",
                    "roomStatus": "vacant",
                    "healthScore": 100,
                    "devices": [
                        {"deviceId": "AC-102-01", "deviceName": "空调控制器", "deviceType": "AC", "onlineStatus": 1, "signalStrength": -68},
                        {"deviceId": "LT-102-01", "deviceName": "卧室灯", "deviceType": "LT", "onlineStatus": 0, "signalStrength": -85},
                    ]
                }
            ]
        },
        {
            "gatewayId": "GW-2F-01",
            "gatewayName": "2楼网关01",
            "onlineStatus": 1,
            "deviceCount": 38,
            "floor": "2F",
            "position": {"x": 300, "y": 400},
            "rooms": [
                {
                    "roomNo": "201",
                    "roomStatus": "occupied",
                    "healthScore": 88,
                    "devices": [
                        {"deviceId": "AC-201-01", "deviceName": "空调控制器", "deviceType": "AC", "onlineStatus": 1, "signalStrength": -62},
                        {"deviceId": "LT-201-01", "deviceName": "卧室灯", "deviceType": "LT", "onlineStatus": 1, "signalStrength": -58},
                    ]
                }
            ]
        }
    ],
    "statistics": {
        "totalDevices": 1275,
        "onlineCount": 1247,
        "offlineCount": 23,
        "alarmCount": 5,
        "gatewayCount": 12,
        "floorCount": 12
    }
}

@router.get("/device")
async def get_device_topology(floor: str = None, room: str = None, device_type: str = None):
    return {
        "code": 200,
        "data": topology_data
    }

@router.get("/device/{device_id}")
async def get_device_detail(device_id: str):
    # 查找设备详情
    for gateway in topology_data["gateways"]:
        for room in gateway.get("rooms", []):
            for device in room.get("devices", []):
                if device["deviceId"] == device_id:
                    return {"code": 200, "data": device}
    return {"code": 404, "detail": "Device not found"}

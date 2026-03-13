from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/v1/energy", tags=["energy"])

# 能耗看板数据
@router.get("/dashboard")
async def get_energy_dashboard():
    return {
        "code": 200,
        "data": {
            "today": {
                "total_kwh": 1250.5,
                "cost": 1250.5,
                "trend": "+5.2%"
            },
            "this_month": {
                "total_kwh": 37500.0,
                "cost": 37500.0,
                "trend": "-3.1%"
            },
            "rooms": [
                {"room_no": "1201", "kwh": 45.2, "cost": 45.2},
                {"room_no": "1202", "kwh": 38.5, "cost": 38.5},
                {"room_no": "1203", "kwh": 52.1, "cost": 52.1},
            ],
            "devices": [
                {"type": "空调", "kwh": 650.0, "percent": 52},
                {"type": "照明", "kwh": 280.0, "percent": 22},
                {"type": "热水器", "kwh": 200.0, "percent": 16},
                {"type": "其他", "kwh": 120.5, "percent": 10},
            ]
        }
    }

# 能耗告警
alerts_db = [
    {"id": 1, "room_no": "805", "type": "异常高耗", "value": 85.5, "threshold": 50.0, "time": "2026-03-13 14:30", "status": "pending"},
    {"id": 2, "room_no": "1203", "type": "设备故障", "value": 0, "threshold": 10.0, "time": "2026-03-13 12:15", "status": "resolved"},
]

@router.get("/alerts")
async def get_energy_alerts():
    return {
        "code": 200,
        "data": alerts_db
    }

@router.post("/alerts/{alert_id}/process")
async def process_alert(alert_id: int):
    for alert in alerts_db:
        if alert["id"] == alert_id:
            alert["status"] = "resolved"
            return {"code": 200, "message": "Alert processed"}
    return {"code": 404, "message": "Alert not found"}

# 能耗历史数据
@router.get("/history")
async def get_energy_history(days: int = 7):
    data = []
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i-1)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "kwh": random.uniform(1000, 1500),
            "cost": random.uniform(1000, 1500)
        })
    return {"code": 200, "data": data}

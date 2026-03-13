from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/rules", tags=["rules"])

# 模拟数据
rules_db = [
    {"id": 1, "name": "无人自动关灯", "description": "房间无人超过10分钟自动关闭灯光", "condition": "room_occupied=false", "action": "light_off", "enabled": True, "priority": 1},
    {"id": 2, "name": "开门自动开灯", "description": "开门检测到客人进入自动开灯", "condition": "door_open=true", "action": "light_on", "enabled": True, "priority": 2},
    {"id": 3, "name": "温度自动调节", "description": "根据室外温度自动调节空调", "condition": "outdoor_temp>30", "action": "ac_on", "enabled": True, "priority": 3},
    {"id": 4, "name": "夜间节能模式", "description": "23:00-06:00 进入节能模式", "condition": "time_range=23:00-06:00", "action": "eco_mode", "enabled": True, "priority": 4},
    {"id": 5, "name": "烟雾告警联动", "description": "检测到烟雾立即报警并开窗", "condition": "smoke_detected=true", "action": "alarm_window_open", "enabled": True, "priority": 1},
]

@router.get("")
async def get_rules():
    return rules_db

@router.get("/{rule_id}")
async def get_rule(rule_id: int):
    for rule in rules_db:
        if rule["id"] == rule_id:
            return rule
    return {"detail": "Rule not found"}

class RuleCreate(BaseModel):
    name: str
    description: str
    condition: str
    action: str
    enabled: bool = True
    priority: int = 5

@router.post("")
async def create_rule(rule: RuleCreate):
    new_id = max([r["id"] for r in rules_db]) + 1
    new_rule = {"id": new_id, **rule.dict()}
    rules_db.append(new_rule)
    return new_rule

@router.put("/{rule_id}")
async def update_rule(rule_id: int, rule: RuleCreate):
    for i, r in enumerate(rules_db):
        if r["id"] == rule_id:
            rules_db[i] = {"id": rule_id, **rule.dict()}
            return rules_db[i]
    return {"detail": "Rule not found"}

@router.delete("/{rule_id}")
async def delete_rule(rule_id: int):
    global rules_db
    rules_db = [r for r in rules_db if r["id"] != rule_id]
    return {"status": "deleted"}

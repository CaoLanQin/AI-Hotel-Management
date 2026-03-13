from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/scenes", tags=["scenes"])

# 模拟数据
scenes_db = [
    {"id": 1, "name": "入住模式", "description": "客人入住时自动启用", "trigger": "门卡插入", "actions": ["打开灯光", "调节空调26°C", "打开窗帘"], "enabled": True, "icon": "key"},
    {"id": 2, "name": "睡眠模式", "description": "夜间休息时启用", "trigger": "手动触发", "actions": ["关闭所有灯光", "空调调至24°C", "关闭窗帘"], "enabled": True, "icon": "moon"},
    {"id": 3, "name": "退房模式", "description": "客人退房后自动执行", "trigger": "退房触发", "actions": ["关闭所有设备", "空调调至节能模式"], "enabled": False, "icon": "logout"},
    {"id": 4, "name": "清洁模式", "description": "客房清洁时使用", "trigger": "手动触发", "actions": ["打开所有灯光", "关闭空调"], "enabled": True, "icon": "broom"},
    {"id": 5, "name": "迎宾模式", "description": "贵宾入住时启用", "trigger": "VIP入住", "actions": ["灯光渐亮", "空调24°C", "播放轻音乐"], "enabled": True, "icon": "star"},
]

@router.get("", response_model=List[dict])
async def get_scenes():
    return scenes_db

@router.get("/{scene_id}")
async def get_scene(scene_id: int):
    for scene in scenes_db:
        if scene["id"] == scene_id:
            return scene
    return {"detail": "Scene not found"}

class SceneCreate(BaseModel):
    name: str
    description: str
    trigger: str
    actions: List[str]
    enabled: bool = True
    icon: str = "star"

@router.post("")
async def create_scene(scene: SceneCreate):
    new_id = max([s["id"] for s in scenes_db]) + 1
    new_scene = {"id": new_id, **scene.dict()}
    scenes_db.append(new_scene)
    return new_scene

@router.put("/{scene_id}")
async def update_scene(scene_id: int, scene: SceneCreate):
    for i, s in enumerate(scenes_db):
        if s["id"] == scene_id:
            scenes_db[i] = {"id": scene_id, **scene.dict()}
            return scenes_db[i]
    return {"detail": "Scene not found"}

@router.delete("/{scene_id}")
async def delete_scene(scene_id: int):
    global scenes_db
    scenes_db = [s for s in scenes_db if s["id"] != scene_id]
    return {"status": "deleted"}

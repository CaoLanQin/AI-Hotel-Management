"""
Hotel Edge System - Core Configuration
基于 SPECIFICATION.md 的开发规范
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://hotel:hotel123@db:5432/hotel_edge"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # MQTT
    mqtt_broker_url: str = "mqtt://mqtt:1883"
    mqtt_username: str = ""
    mqtt_password: str = ""
    
    # System
    log_level: str = "INFO"
    timezone: str = "Asia/Shanghai"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()

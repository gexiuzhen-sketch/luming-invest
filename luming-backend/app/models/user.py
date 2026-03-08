"""
用户认证模型
存储用户名和哈希密码，支持跨设备登录
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.models.database import Base


class User(Base):
    __tablename__ = "user_auth"

    username = Column(String(100), primary_key=True)
    password_hash = Column(String(300), nullable=False)  # PBKDF2 salt:hash
    created_at = Column(DateTime(timezone=True), server_default=func.now())

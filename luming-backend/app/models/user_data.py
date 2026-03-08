"""
用户数据同步模型
存储用户的自选、持仓、模拟盘数据，支持跨设备同步
"""
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from app.models.database import Base


class UserSyncData(Base):
    __tablename__ = "user_sync_data"

    username = Column(String(100), primary_key=True)
    data = Column(Text, nullable=False, default='{}')   # JSON string
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "username": self.username,
            "data": self.data,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

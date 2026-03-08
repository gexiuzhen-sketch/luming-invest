"""
股票数据模型
"""
from sqlalchemy import Column, String, DateTime, Date, Index
from sqlalchemy.sql import func
from app.models.database import Base

class Stock(Base):
    __tablename__ = "stocks"

    code = Column(String(20), primary_key=True)
    name = Column(String(100), nullable=False)
    market = Column(String(10), nullable=False)  # SH/SZ/HK/US/FUND
    sector = Column(String(50))
    industry = Column(String(100))
    list_date = Column(Date)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 索引
    __table_args__ = (
        Index('idx_market', 'market'),
        Index('idx_name', 'name'),
    )

    def to_dict(self):
        return {
            "code": self.code,
            "name": self.name,
            "market": self.market,
            "sector": self.sector,
            "industry": self.industry
        }

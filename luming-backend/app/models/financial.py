"""
财务数据缓存模型
存储从 AKShare 获取的基本面、K线、市场指数数据
"""
from sqlalchemy import Column, String, Float, BigInteger, Integer, Date, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.models.database import Base


class StockFundamentals(Base):
    """股票基本面数据（每日更新）"""
    __tablename__ = "stock_fundamentals"

    code = Column(String(20), primary_key=True)
    market = Column(String(10), nullable=False)  # SH/SZ/HK/US
    pe_ttm = Column(Float)          # 市盈率(TTM)
    pb = Column(Float)              # 市净率
    roe = Column(Float)             # 净资产收益率 %
    dividend_yield = Column(Float)  # 股息率 %
    market_cap = Column(Float)      # 总市值（亿元）
    revenue_growth_yoy = Column(Float)      # 营收同比增速 %
    net_income_growth_yoy = Column(Float)   # 归母净利同比增速 %
    eps = Column(Float)             # 每股收益
    net_margin = Column(Float)      # 净利率 %
    debt_ratio = Column(Float)      # 资产负债率 %
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "code": self.code,
            "market": self.market,
            "pe_ttm": self.pe_ttm,
            "pb": self.pb,
            "roe": self.roe,
            "dividend_yield": self.dividend_yield,
            "market_cap": self.market_cap,
            "revenue_growth_yoy": self.revenue_growth_yoy,
            "net_income_growth_yoy": self.net_income_growth_yoy,
            "eps": self.eps,
            "net_margin": self.net_margin,
            "debt_ratio": self.debt_ratio,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StockKline(Base):
    """股票日K线数据（保留120个交易日）"""
    __tablename__ = "stock_kline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), nullable=False)
    market = Column(String(10), nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(BigInteger)

    __table_args__ = (
        UniqueConstraint('code', 'date', name='uq_kline_code_date'),
    )

    def to_dict(self):
        return {
            "date": self.date.isoformat(),
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
        }


class MarketIndex(Base):
    """市场指数数据（用于全局牛熊判断）"""
    __tablename__ = "market_index"

    id = Column(Integer, primary_key=True, autoincrement=True)
    index_code = Column(String(20), nullable=False)  # "000001.SH", "HSI", "SPX"
    date = Column(Date, nullable=False)
    close = Column(Float)
    ma20 = Column(Float)
    trend = Column(String(10))  # "bull", "bear", "neutral"
    volatility = Column(String(10))  # "low", "medium", "high"

    __table_args__ = (
        UniqueConstraint('index_code', 'date', name='uq_index_code_date'),
    )

    def to_dict(self):
        return {
            "index_code": self.index_code,
            "date": self.date.isoformat(),
            "close": self.close,
            "ma20": self.ma20,
            "trend": self.trend,
            "volatility": self.volatility or "medium",
        }

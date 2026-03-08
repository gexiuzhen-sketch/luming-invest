"""
数据库配置和连接管理
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# 数据库配置
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://luming:luming_password@localhost/luming_db"
)

# 异步数据库引擎
async_engine = create_async_engine(
    DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,
    pool_size=10,
    max_overflow=20
)

# 异步Session工厂
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 同步引擎（用于初始数据导入）
sync_engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=sync_engine, autoflush=False)

# Base模型
Base = declarative_base()

# 依赖项
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

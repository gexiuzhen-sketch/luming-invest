"""
数据库初始化脚本
创建表结构并导入初始股票数据
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.models.database import async_engine, Base, AsyncSessionLocal
from app.models.stock import Stock
from app.models.user_data import UserSyncData  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.financial import StockFundamentals, StockKline, MarketIndex  # noqa: F401
from app.services.stock_fetcher import stock_fetcher
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_database():
    """初始化数据库"""
    logger.info("开始初始化数据库...")

    # 创建所有表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ 数据表创建完成")

    # 导入股票数据
    logger.info("开始导入股票数据...")
    await import_stock_data()

    logger.info("✅ 数据库初始化完成")

async def import_stock_data():
    """导入股票数据"""
    async with AsyncSessionLocal() as db:
        # 检查是否已有数据
        existing = await db.execute(select(Stock).limit(1))
        if existing.scalars().first():
            logger.info("数据库已有数据，跳过导入")
            return

        # 导入A股
        logger.info("导入A股数据...")
        a_stocks = await stock_fetcher.get_a_stock_list()
        for stock_data in a_stocks:
            stock = Stock(**stock_data)
            db.add(stock)
        logger.info(f"✅ A股导入完成: {len(a_stocks)} 只")

        # 导入港股
        logger.info("导入港股数据...")
        hk_stocks = await stock_fetcher.get_hk_stock_list()
        for stock_data in hk_stocks:
            stock = Stock(**stock_data)
            db.add(stock)
        logger.info(f"✅ 港股导入完成: {len(hk_stocks)} 只")

        # 导入美股
        logger.info("导入美股数据...")
        us_stocks = await stock_fetcher.get_us_stock_list()
        for stock_data in us_stocks:
            stock = Stock(**stock_data)
            db.add(stock)
        logger.info(f"✅ 美股导入完成: {len(us_stocks)} 只")

        # 导入基金
        logger.info("导入基金数据...")
        fund_stocks = await stock_fetcher.get_fund_list()
        for stock_data in fund_stocks:
            stock = Stock(**stock_data)
            db.add(stock)
        logger.info(f"✅ 基金导入完成: {len(fund_stocks)} 只")

        await db.commit()

        # 统计
        total = await db.execute(select(Stock))
        total_count = len(total.scalars().all())
        logger.info(f"📊 总计导入: {total_count} 只股票")

if __name__ == "__main__":
    asyncio.run(init_database())

"""
市场数据API路由
"""
from fastapi import APIRouter, HTTPException
from app.services.stock_fetcher import stock_fetcher
from app.models.database import AsyncSessionLocal
from app.models.stock import Stock
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/update")
async def update_market_data():
    """
    手动触发市场数据更新
    抓取全市场股票列表并更新到数据库
    """
    try:
        logger.info("开始更新市场数据...")

        async with AsyncSessionLocal() as db:
            # 1. 获取A股列表
            a_stocks = await stock_fetcher.get_a_stock_list()
            for stock_data in a_stocks:
                stock = await db.get(Stock, stock_data['code'])
                if stock:
                    stock.name = stock_data['name']
                else:
                    stock = Stock(**stock_data)
                    db.add(stock)

            # 2. 获取港股列表
            hk_stocks = await stock_fetcher.get_hk_stock_list()
            for stock_data in hk_stocks:
                stock = await db.get(Stock, stock_data['code'])
                if not stock:
                    stock = Stock(**stock_data)
                    db.add(stock)

            # 3. 获取美股列表
            us_stocks = await stock_fetcher.get_us_stock_list()
            for stock_data in us_stocks:
                stock = await db.get(Stock, stock_data['code'])
                if not stock:
                    stock = Stock(**stock_data)
                    db.add(stock)

            # 4. 获取基金列表
            fund_stocks = await stock_fetcher.get_fund_list()
            for stock_data in fund_stocks:
                stock = await db.get(Stock, stock_data['code'])
                if not stock:
                    stock = Stock(**stock_data)
                    db.add(stock)

            await db.commit()

            return {
                "status": "success",
                "message": "市场数据更新完成",
                "stats": {
                    "a_stocks": len(a_stocks),
                    "hk_stocks": len(hk_stocks),
                    "us_stocks": len(us_stocks),
                    "funds": len(fund_stocks)
                }
            }

    except Exception as e:
        logger.error(f"更新市场数据失败: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_market_stats():
    """
    获取市场统计信息
    """
    try:
        async with AsyncSessionLocal() as db:

            def count_market(markets):
                return len(db.scalars(select(Stock).where(Stock.market.in_(markets))).all())

            stats = {
                "a_stocks": count_market(['SH', 'SZ']),
                "hk_stocks": count_market(['HK']),
                "us_stocks": count_market(['US']),
                "funds": count_market(['FUND']),
            }
            stats["total"] = sum(stats.values())

            return stats

    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

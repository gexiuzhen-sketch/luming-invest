"""
股票API路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.database import AsyncSessionLocal
from app.models.stock import Stock
from app.services.stock_fetcher import stock_fetcher
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/search")
async def search_stocks(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(10, ge=1, le=50, description="返回数量"),
    market: Optional[str] = Query(None, description="市场筛选")
):
    """
    全市场股票搜索

    支持按股票代码或名称搜索
    """
    try:
        async with AsyncSessionLocal() as db:
            query = select(Stock).where(
                or_(
                    Stock.code.ilike(f"%{q}%"),
                    Stock.name.ilike(f"%{q}%")
                )
            )

            if market:
                query = query.where(Stock.market == market.upper())

            query = query.limit(limit)
            result = await db.execute(query)
            stocks = result.scalars().all()

            return [s.to_dict() for s in stocks]

    except Exception as e:
        logger.error(f"搜索失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prices")
async def get_stock_prices(
    codes: str = Query(..., description="股票代码，逗号分隔")
):
    """
    批量获取股票实时价格
    """
    try:
        code_list = [c.strip() for c in codes.split(",") if c.strip()]

        # 先尝试从Redis缓存获取（TODO）
        # 缓存miss则调用实时接口
        prices = await stock_fetcher.get_realtime_price(code_list)

        return {
            "data": prices,
            "cached": False
        }

    except Exception as e:
        logger.error(f"获取价格失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_stock_list(
    market: str = Query(..., description="市场: A/HK/US/FUND"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量")
):
    """
    获取股票列表
    """
    try:
        async with AsyncSessionLocal() as db:
            market_map = {
                'A': ['SH', 'SZ'],
                'HK': ['HK'],
                'US': ['US'],
                'FUND': ['FUND']
            }

            markets = market_map.get(market.upper(), ['SH'])
            query = select(Stock).where(Stock.market.in_(markets)).limit(limit)
            result = await db.execute(query)
            stocks = result.scalars().all()

            return [s.to_dict() for s in stocks]

    except Exception as e:
        logger.error(f"获取股票列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{code}")
async def get_stock_detail(code: str):
    """
    获取股票详情

    包含基础信息和实时价格
    """
    try:
        async with AsyncSessionLocal() as db:
            stock = await db.get(Stock, code)
            if not stock:
                raise HTTPException(status_code=404, detail="股票不存在")

            result = stock.to_dict()

            # 获取实时价格
            prices = await stock_fetcher.get_realtime_price([code])
            if code in prices:
                result.update(prices[code])

            return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取股票详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

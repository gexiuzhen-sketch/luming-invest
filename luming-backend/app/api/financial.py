"""
财务数据 API 端点
提供基本面、K线、市场环境数据
"""
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, delete
from datetime import datetime, date, timedelta
import logging

from app.models.database import AsyncSessionLocal
from app.models.financial import StockFundamentals, StockKline, MarketIndex
from app.services.financial_data import financial_data_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/fundamentals/{code}")
async def get_fundamentals(code: str):
    """
    获取股票基本面数据（含股息率、已清洗极端值）
    优先从数据库缓存读取，缓存过期(>1天)或不存在则实时获取
    """
    from app.services.financial_data import FinancialDataService

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(StockFundamentals).where(StockFundamentals.code == code)
        )
        cached = result.scalars().first()

        # 缓存有效（1天内）直接返回（清洗后）
        if cached and cached.updated_at:
            age = datetime.now(cached.updated_at.tzinfo) - cached.updated_at
            if age < timedelta(hours=24):
                return FinancialDataService.sanitize_fundamentals(cached.to_dict())

        # 缓存不存在或过期 → 实时获取
        data = {}

        # 判断市场类型
        is_a_stock = len(code) == 6 and code.isdigit()
        is_hk_stock = len(code) <= 5 and code.isdigit()
        is_us_stock = not code.isdigit()

        if is_a_stock:
            # A股: AKShare获取完整财务数据
            stock_info = await financial_data_service.get_individual_stock_info(code)
            if stock_info:
                data.update({k: v for k, v in stock_info.items() if v is not None})

            indicators = await financial_data_service.get_financial_indicators(code)
            if indicators:
                data.update({k: v for k, v in indicators.items() if v is not None})

            try:
                dy_map = await financial_data_service.get_dividend_yield_batch()
                if code in dy_map:
                    data["dividend_yield"] = dy_map[code]
            except Exception:
                pass

        elif is_hk_stock or is_us_stock:
            # 港股/美股: 腾讯财经API获取PE/市值/EPS
            market = "HK" if is_hk_stock else "US"
            tencent_data = await financial_data_service.get_us_hk_fundamentals_tencent([code], market)
            if code in tencent_data:
                data.update(tencent_data[code])

        if data:
            market = "SH" if code.startswith("6") else "SZ" if is_a_stock else "HK" if is_hk_stock else "US"
            if cached:
                for key, val in data.items():
                    if val is not None:
                        setattr(cached, key, val)
                await db.commit()
                await db.refresh(cached)
                return FinancialDataService.sanitize_fundamentals(cached.to_dict())
            else:
                new_record = StockFundamentals(
                    code=code,
                    market=market,
                    **data,
                )
                db.add(new_record)
                await db.commit()
                await db.refresh(new_record)
                return FinancialDataService.sanitize_fundamentals(new_record.to_dict())

        # 有缓存就返回旧数据（清洗后）
        if cached:
            return FinancialDataService.sanitize_fundamentals(cached.to_dict())

        raise HTTPException(status_code=404, detail=f"No fundamentals data for {code}")


@router.get("/kline/{code}")
async def get_kline(code: str, days: int = Query(default=60, le=120)):
    """
    获取股票K线数据
    优先从数据库读取，不够则实时获取并缓存
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(StockKline)
            .where(StockKline.code == code)
            .order_by(StockKline.date.desc())
            .limit(days)
        )
        cached_rows = result.scalars().all()

        if len(cached_rows) >= days * 0.8:  # 有80%以上的数据就直接返回
            return [row.to_dict() for row in reversed(cached_rows)]

        # 判断市场
        if len(code) == 6 and code.isdigit():
            market = "SH" if code.startswith("6") else "SZ"
        elif len(code) <= 5 and code.isdigit():
            market = "HK"
        else:
            market = "US"

        # 实时获取
        kline_data = await financial_data_service.get_kline(code, market, days)
        if not kline_data:
            if cached_rows:
                return [row.to_dict() for row in reversed(cached_rows)]
            raise HTTPException(status_code=404, detail=f"No K-line data for {code}")

        # 写入缓存（upsert）
        for bar in kline_data:
            try:
                bar_date = date.fromisoformat(bar["date"])
                existing = await db.execute(
                    select(StockKline).where(
                        StockKline.code == code,
                        StockKline.date == bar_date
                    )
                )
                if not existing.scalars().first():
                    db.add(StockKline(
                        code=code,
                        market=market,
                        date=bar_date,
                        open=bar["open"],
                        high=bar["high"],
                        low=bar["low"],
                        close=bar["close"],
                        volume=bar["volume"],
                    ))
            except Exception:
                continue
        await db.commit()

        return kline_data[-days:]


@router.get("/market-regime")
async def get_market_regime():
    """
    获取当前市场环境（牛/熊/中性）
    基于上证指数 MA20 判断
    """
    async with AsyncSessionLocal() as db:
        # 从缓存读取最新的市场指数
        result = await db.execute(
            select(MarketIndex)
            .where(MarketIndex.index_code == "sh000001")
            .order_by(MarketIndex.date.desc())
            .limit(1)
        )
        cached = result.scalars().first()

        if cached and cached.date >= date.today() - timedelta(days=3):
            return cached.to_dict()

    # 缓存过期或不存在，实时获取
    kline = await financial_data_service.get_index_kline("sh000001", days=30)
    if not kline:
        return {"trend": "neutral", "volatility": "medium", "ma20": None, "index_code": "sh000001"}

    regime = financial_data_service.compute_market_regime(kline)

    # 写入缓存
    async with AsyncSessionLocal() as db:
        today = date.today()
        existing = await db.execute(
            select(MarketIndex).where(
                MarketIndex.index_code == "sh000001",
                MarketIndex.date == today,
            )
        )
        if not existing.scalars().first():
            db.add(MarketIndex(
                index_code="sh000001",
                date=today,
                close=kline[-1]["close"],
                ma20=regime.get("ma20"),
                trend=regime["trend"],
                volatility=regime.get("volatility", "medium"),
            ))
            await db.commit()

    return {
        "index_code": "sh000001",
        "date": today.isoformat(),
        "close": kline[-1]["close"],
        "ma20": regime.get("ma20"),
        "trend": regime["trend"],
        "volatility": regime["volatility"],
    }


@router.post("/refresh")
async def refresh_fundamentals(codes: list[str] = None):
    """
    手动触发数据刷新
    不传 codes 则刷新推荐列表中的常用股票
    """
    if not codes:
        # 默认刷新前端所有A股
        codes = [
            "600519", "000858", "300750", "600036", "000001",
            "601166", "601398", "601288", "600000", "002142",
            "601318", "601336", "600276", "000661", "300124",
            "002415", "002594", "000333", "600030", "601888",
            "600690", "000568", "603259", "300015", "688111",
            "002475", "300059", "300174", "688256", "300367",
        ]

    results = {"success": [], "failed": []}

    # 批量获取A股 PE/PB/市值
    a_spot = await financial_data_service.get_a_stock_spot_batch()

    # 批量获取股息率
    dy_map = await financial_data_service.get_dividend_yield_batch()

    async with AsyncSessionLocal() as db:
        for code in codes:
            try:
                # 合并批量数据和个股财务指标
                data = {}
                if code in a_spot:
                    data.update(a_spot[code])

                # A股：批量失败时用 individual_info_em 逐只获取 PE/PB/市值
                if len(code) == 6 and code.isdigit():
                    if code not in a_spot:
                        stock_info = await financial_data_service.get_individual_stock_info(code)
                        if stock_info:
                            data.update({k: v for k, v in stock_info.items() if v is not None})

                    # 获取 ROE/增速等财务指标
                    indicators = await financial_data_service.get_financial_indicators(code)
                    if indicators:
                        data.update({k: v for k, v in indicators.items() if v is not None})

                    # 股息率
                    if code in dy_map:
                        data["dividend_yield"] = dy_map[code]

                if not data:
                    results["failed"].append(code)
                    continue

                market = "SH" if code.startswith("6") else "SZ"

                # Upsert
                existing = await db.execute(
                    select(StockFundamentals).where(StockFundamentals.code == code)
                )
                record = existing.scalars().first()
                if record:
                    for k, v in data.items():
                        if v is not None:
                            setattr(record, k, v)
                else:
                    db.add(StockFundamentals(code=code, market=market, **data))

                results["success"].append(code)

            except Exception as e:
                logger.warning(f"刷新 {code} 失败: {e}")
                results["failed"].append(code)

        await db.commit()

    return {
        "refreshed": len(results["success"]),
        "failed": len(results["failed"]),
        "details": results,
    }

"""
定时数据刷新任务
每日收盘后自动更新基本面和K线数据
"""
import logging
from datetime import datetime, date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, delete

from app.models.database import AsyncSessionLocal
from app.models.financial import StockFundamentals, StockKline, MarketIndex
from app.services.financial_data import financial_data_service

logger = logging.getLogger(__name__)

# 前端推荐列表中的A股
DEFAULT_TRACKED_CODES = {
    # A股 — 与前端 MOCK_STOCKS 保持一致
    "600519", "000858", "300750", "600036", "000001",  # 茅台 五粮液 宁德时代 招行 平安银行
    "601166", "601398", "601288", "600000", "002142",  # 兴业 工行 农行 浦发 宁波银行
    "601318", "601336", "600276", "000661", "300124",  # 中国平安 新华保险 恒瑞医药 长春高新 汇川技术
    "002415", "002594", "000333", "600030", "601888",  # 海康威视 比亚迪 美的 中信证券 中国中免
    "600690", "000568", "603259", "300015", "688111",  # 海尔智家 泸州老窖 药明康德 爱尔眼科 金山办公
    "002475", "300059", "300174", "688256", "300367",  # 立讯精密 东方财富 元力股份 寒武纪 网力通信
}

# 港股推荐列表
DEFAULT_HK_CODES = [
    "00700", "09988", "01810", "03690", "02318",  # 腾讯 阿里 小米 美团 平安
    "00941", "01919", "09618", "09888", "01024",  # 中移动 中远 京东 百度 快手
    "00388", "02020", "00772", "00981",            # 港交所 安踏 阅文 中芯
]

# 美股推荐列表
DEFAULT_US_CODES = [
    "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL",   # 苹果 英伟达 特斯拉 微软 谷歌
    "AMZN", "META", "BRK.B", "TSM", "AVGO",     # 亚马逊 Meta 伯克希尔 台积电 博通
    "NFLX", "ADBE", "CRM", "NOK",               # 奈飞 Adobe Salesforce 诺基亚
]


async def refresh_a_stock_fundamentals():
    """刷新A股基本面数据（PE/PB/市值 批量 + ROE/增速 逐只）"""
    logger.info("⏰ 开始刷新A股基本面数据...")

    # 1. 批量获取 PE/PB/市值
    a_spot = await financial_data_service.get_a_stock_spot_batch()
    # 2. 批量获取股息率
    dy_map = await financial_data_service.get_dividend_yield_batch()
    a_codes = [c for c in DEFAULT_TRACKED_CODES if len(c) == 6 and c.isdigit()]

    updated = 0
    async with AsyncSessionLocal() as db:
        for code in a_codes:
            try:
                data = a_spot.get(code, {})

                # 2. 批量失败时逐只获取 PE/PB/市值
                if not data:
                    stock_info = await financial_data_service.get_individual_stock_info(code)
                    if stock_info:
                        data.update({k: v for k, v in stock_info.items() if v is not None})

                # 3. 逐只获取 ROE/净利率/增速
                indicators = await financial_data_service.get_financial_indicators(code)
                if indicators:
                    data.update({k: v for k, v in indicators.items() if v is not None})

                # 4. 股息率
                if code in dy_map:
                    data["dividend_yield"] = dy_map[code]

                if not data:
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
                updated += 1

            except Exception as e:
                logger.warning(f"刷新 {code} 基本面失败: {e}")

        await db.commit()

    logger.info(f"✅ A股基本面刷新完成: {updated}/{len(a_codes)}")


async def refresh_hk_stock_fundamentals():
    """刷新港股基本面数据"""
    logger.info("⏰ 开始刷新港股基本面数据...")
    hk_spot = await financial_data_service.get_hk_stock_spot_batch()
    hk_codes = [c for c in DEFAULT_TRACKED_CODES if len(c) <= 5 and c.isdigit()]

    updated = 0
    async with AsyncSessionLocal() as db:
        for code in hk_codes:
            try:
                data = hk_spot.get(code, {})
                if not data:
                    continue

                existing = await db.execute(
                    select(StockFundamentals).where(StockFundamentals.code == code)
                )
                record = existing.scalars().first()
                if record:
                    for k, v in data.items():
                        if v is not None:
                            setattr(record, k, v)
                else:
                    db.add(StockFundamentals(code=code, market="HK", **data))
                updated += 1
            except Exception as e:
                logger.warning(f"刷新 {code} 港股基本面失败: {e}")

        await db.commit()
    logger.info(f"✅ 港股基本面刷新完成: {updated}/{len(hk_codes)}")


async def refresh_us_hk_fundamentals():
    """通过腾讯财经API刷新美股/港股基本面数据（PE/市值/EPS）"""
    logger.info("⏰ 开始刷新美股/港股基本面数据...")
    updated = 0

    for market, codes in [("HK", DEFAULT_HK_CODES), ("US", DEFAULT_US_CODES)]:
        try:
            data_map = await financial_data_service.get_us_hk_fundamentals_tencent(codes, market)
            if not data_map:
                continue

            async with AsyncSessionLocal() as db:
                for code, data in data_map.items():
                    try:
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
                        updated += 1
                    except Exception as e:
                        logger.warning(f"刷新 {code} {market}基本面失败: {e}")
                await db.commit()
        except Exception as e:
            logger.warning(f"刷新{market}基本面批量失败: {e}")

    logger.info(f"✅ 美股/港股基本面刷新完成: {updated} 只")


async def refresh_kline_data():
    """刷新K线数据（追加最新数据）— 仅A股（HK/US接口被封）"""
    logger.info("⏰ 开始刷新K线数据...")
    a_codes = [c for c in DEFAULT_TRACKED_CODES if len(c) == 6 and c.isdigit()]
    updated = 0

    for code in a_codes:
        try:
            market = "SH" if code.startswith("6") else "SZ"

            kline = await financial_data_service.get_kline(code, market, days=10)  # 只取最近10天追加
            if not kline:
                continue

            async with AsyncSessionLocal() as db:
                for bar in kline:
                    bar_date = date.fromisoformat(bar["date"])
                    existing = await db.execute(
                        select(StockKline).where(
                            StockKline.code == code,
                            StockKline.date == bar_date
                        )
                    )
                    if not existing.scalars().first():
                        db.add(StockKline(
                            code=code, market=market, date=bar_date,
                            open=bar["open"], high=bar["high"],
                            low=bar["low"], close=bar["close"],
                            volume=bar["volume"],
                        ))
                await db.commit()
            updated += 1
        except Exception as e:
            logger.warning(f"刷新 {code} K线失败: {e}")

    logger.info(f"✅ K线刷新完成: {updated}/{len(a_codes)}")


async def refresh_market_index():
    """刷新市场指数"""
    logger.info("⏰ 开始刷新市场指数...")
    kline = await financial_data_service.get_index_kline("sh000001", days=30)
    if not kline:
        logger.warning("上证指数K线获取失败")
        return

    regime = financial_data_service.compute_market_regime(kline)
    today = date.today()

    async with AsyncSessionLocal() as db:
        existing = await db.execute(
            select(MarketIndex).where(
                MarketIndex.index_code == "sh000001",
                MarketIndex.date == today,
            )
        )
        record = existing.scalars().first()
        if record:
            record.close = kline[-1]["close"]
            record.ma20 = regime.get("ma20")
            record.trend = regime["trend"]
            record.volatility = regime.get("volatility", "medium")
        else:
            db.add(MarketIndex(
                index_code="sh000001",
                date=today,
                close=kline[-1]["close"],
                ma20=regime.get("ma20"),
                trend=regime["trend"],
                volatility=regime.get("volatility", "medium"),
            ))
        await db.commit()

    logger.info(f"✅ 市场指数刷新完成: 趋势={regime['trend']}, MA20={regime.get('ma20')}")


async def cleanup_old_kline():
    """清理120天前的旧K线数据"""
    cutoff = date.today() - timedelta(days=180)
    async with AsyncSessionLocal() as db:
        await db.execute(
            delete(StockKline).where(StockKline.date < cutoff)
        )
        await db.commit()
    logger.info(f"✅ 清理 {cutoff} 之前的旧K线数据")


def setup_scheduler(scheduler: AsyncIOScheduler):
    """配置定时任务"""
    # 每个交易日 16:00 刷新基本面（A股+港股）
    scheduler.add_job(refresh_a_stock_fundamentals, "cron", hour=16, minute=0,
                      day_of_week="mon-fri", id="refresh_a_fundamentals")
    # 每个交易日 16:15 刷新美股/港股基本面（通过腾讯财经API）
    scheduler.add_job(refresh_us_hk_fundamentals, "cron", hour=16, minute=15,
                      day_of_week="mon-fri", id="refresh_us_hk_fundamentals")

    # 每个交易日 16:30 刷新K线（仅A股）
    scheduler.add_job(refresh_kline_data, "cron", hour=16, minute=30,
                      day_of_week="mon-fri", id="refresh_kline")

    # 每个交易日 16:00 刷新市场指数
    scheduler.add_job(refresh_market_index, "cron", hour=16, minute=0,
                      day_of_week="mon-fri", id="refresh_index")

    # 每周日清理旧K线
    scheduler.add_job(cleanup_old_kline, "cron", day_of_week="sun", hour=3,
                      id="cleanup_kline")

    logger.info("✅ 定时任务配置完成")

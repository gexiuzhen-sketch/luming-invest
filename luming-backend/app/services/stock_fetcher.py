"""
股票数据抓取服务
集成 AkShare 和 Tushare Pro
"""
import asyncio
import logging
from typing import List, Dict, Optional
from datetime import datetime
import akshare as ak
import tushare as ts

logger = logging.getLogger(__name__)

# Tushare配置
TUSHARE_TOKEN = "17e9e62a75b8d0a3efd3761944b7c8cf10847f94c86152b5258d385a"
ts.set_token(TUSHARE_TOKEN)
ts_pro = ts.pro_api()

class StockFetcher:
    """股票数据抓取器"""

    def __init__(self):
        self.tushare_token = TUSHARE_TOKEN

    async def get_a_stock_list(self) -> List[Dict]:
        """获取A股股票列表"""
        try:
            logger.info("开始获取A股股票列表...")
            df = ak.stock_info_a_code_name()

            stocks = []
            for _, row in df.iterrows():
                code = row['code']
                name = row['name']

                # 判断市场
                if code.startswith('6'):
                    market = 'SH'
                elif code.startswith('0') or code.startswith('3'):
                    market = 'SZ'
                else:
                    market = 'OTHER'

                stocks.append({
                    'code': code,
                    'name': name,
                    'market': market,
                    'sector': None,
                    'industry': None
                })

            logger.info(f"A股列表获取完成，共 {len(stocks)} 只")
            return stocks

        except Exception as e:
            logger.error(f"获取A股列表失败: {e}")
            # 降级到Tushare
            return await self._get_a_stock_from_tushare()

    async def _get_a_stock_from_tushare(self) -> List[Dict]:
        """从Tushare获取A股列表（备用）"""
        try:
            logger.info("使用Tushare获取A股列表...")
            df = ts_pro.stock_basic(
                exchange='',
                list_status='L',
                fields='ts_code,symbol,name,area,industry,list_date'
            )

            stocks = []
            for _, row in df.iterrows():
                ts_code = row['ts_code']

                # ts_code格式: 000001.SZ
                code = ts_code.split('.')[0]
                market = 'SH' if ts_code.endswith('.SH') else 'SZ'

                stocks.append({
                    'code': code,
                    'name': row['name'],
                    'market': market,
                    'sector': row.get('area'),
                    'industry': row.get('industry')
                })

            logger.info(f"Tushare A股列表获取完成，共 {len(stocks)} 只")
            return stocks

        except Exception as e:
            logger.error(f"Tushare获取A股列表失败: {e}")
            return []

    async def get_hk_stock_list(self) -> List[Dict]:
        """获取港股列表"""
        try:
            logger.info("开始获取港股列表...")
            # 从东方财富获取港股列表
            df = ak.stock_hk_spot_em()

            stocks = []
            for _, row in df.iterrows():
                # 港股代码通常是5位数字
                code = str(row.get('代码', ''))
                if not code or len(code) > 5:
                    continue

                stocks.append({
                    'code': code,
                    'name': row.get('名称', ''),
                    'market': 'HK',
                    'sector': None,
                    'industry': None
                })

            logger.info(f"港股列表获取完成，共 {len(stocks)} 只")
            return stocks

        except Exception as e:
            logger.error(f"获取港股列表失败: {e}")
            return []

    async def get_us_stock_list(self) -> List[Dict]:
        """获取美股列表（主要股票）"""
        try:
            logger.info("开始获取美股列表...")
            # 热门美股
            df = ak.stock_us_spot_em()

            stocks = []
            for _, row in df.iterrows():
                code = str(row.get('代码', '')).replace('.', '')
                if not code:
                    continue

                stocks.append({
                    'code': code,
                    'name': row.get('名称', ''),
                    'market': 'US',
                    'sector': None,
                    'industry': None
                })

            logger.info(f"美股列表获取完成，共 {len(stocks)} 只")
            return stocks

        except Exception as e:
            logger.error(f"获取美股列表失败: {e}")
            return []

    async def get_fund_list(self) -> List[Dict]:
        """获取基金列表"""
        try:
            logger.info("开始获取基金列表...")
            # 获取ETF基金列表
            df = ak.fund_etf_spot_em()

            stocks = []
            for _, row in df.iterrows():
                code = str(row.get('代码', ''))
                if not code:
                    continue

                stocks.append({
                    'code': code,
                    'name': row.get('名称', ''),
                    'market': 'FUND',
                    'sector': None,
                    'industry': None
                })

            logger.info(f"基金列表获取完成，共 {len(stocks)} 只")
            return stocks

        except Exception as e:
            logger.error(f"获取基金列表失败: {e}")
            return []

    async def get_realtime_price(self, codes: List[str]) -> Dict[str, Dict]:
        """获取实时价格"""
        import httpx
        prices = {}

        # 按市场分组
        a_codes = [c for c in codes if c.isdigit() and len(c) == 6]
        hk_codes = [c for c in codes if c.isdigit() and len(c) <= 5]
        us_codes = [c for c in codes if not c.isdigit()]

        # A股：使用腾讯财经API
        if a_codes:
            try:
                formatted = ','.join([f"{'sh' if c.startswith('6') else 'sz'}{c}" for c in a_codes])
                url = f"https://qt.gtimg.cn/q={formatted}"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        for line in resp.text.split('\n'):
                            if '~' in line and '=' in line:
                                try:
                                    code_match = line.split('=')[0].split('_')[-1]
                                    code = code_match[2:]
                                    data = line.split('"')[1].split('~')
                                    if len(data) > 4 and data[3]:
                                        prices[code] = {
                                            'price': float(data[3]),
                                            'changePct': float(data[-2]) if data[-2] else 0
                                        }
                                except (ValueError, IndexError):
                                    continue
            except Exception as e:
                logger.warning(f"A股价格获取失败: {e}")

        # 港股：使用腾讯财经API（备用新浪被禁用）
        if hk_codes:
            for code in hk_codes:
                try:
                    code_padded = code.zfill(5)
                    url = f"https://qt.gtimg.cn/q=hk{code_padded}"
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            data = resp.text
                            if '~' in data:
                                parts = data.split('"')[1].split('~')
                                if len(parts) > 32:
                                    price = float(parts[3]) if parts[3] else 0
                                    change_pct = float(parts[32]) if len(parts) > 32 and parts[32] else 0
                                    prices[code] = {
                                        'price': price,
                                        'changePct': change_pct
                                    }
                except Exception as e:
                    logger.warning(f"港股 {code} 价格获取失败: {e}")

        # 美股：使用腾讯财经美股API（需加 us 前缀）
        if us_codes:
            try:
                # 批量请求：usNVDA,usAAPL,...
                formatted = ','.join([f"us{c}" for c in us_codes])
                url = f"https://qt.gtimg.cn/q={formatted}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        for line in resp.text.split('\n'):
                            if '~' in line and '=' in line:
                                try:
                                    # 响应格式: v_usNVDA="200~英伟达~NVDA.OQ~177.82~183.34~..."
                                    key = line.split('=')[0].strip()
                                    # 提取代码: v_usNVDA → NVDA
                                    code = key.split('_')[-1]
                                    if code.startswith('us'):
                                        code = code[2:]
                                    parts = line.split('"')[1].split('~')
                                    if len(parts) > 32 and parts[3]:
                                        price = float(parts[3])
                                        change_pct = float(parts[32]) if parts[32] else 0
                                        if price > 0:
                                            prices[code] = {
                                                'price': price,
                                                'changePct': change_pct
                                            }
                                except (ValueError, IndexError):
                                    continue
            except Exception as e:
                logger.warning(f"美股价格批量获取失败: {e}")

        return prices


# 全局实例
stock_fetcher = StockFetcher()

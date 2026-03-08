"""
财务数据服务
通过 AKShare 获取真实的基本面、K线、市场指数数据

已验证可用的 AKShare 接口（腾讯云服务器）：
  ✅ stock_financial_abstract_ths  — ROE/净利率/资产负债率/增速/EPS
  ✅ stock_individual_info_em      — PE/PB/总市值/流通市值
  ✅ stock_zh_a_hist               — A股日K线
  ✅ stock_hk_hist                 — 港股日K线
  ✅ stock_us_hist                 — 美股日K线
  ✅ stock_zh_index_daily_em       — 指数日K线
  ❌ stock_zh_a_spot_em            — 被限流/封禁
  ❌ stock_financial_analysis_indicator — 返回空
"""
import logging
import statistics
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import akshare as ak
import pandas as pd

logger = logging.getLogger(__name__)


class FinancialDataService:
    """财务数据获取器 — 封装 AKShare 调用"""

    # 腾讯云服务器上 em 系列接口被封，直接跳过以避免连接超时
    SKIP_EM_ENDPOINTS = True

    # ===================== 个股基本信息（PE/PB/市值）=====================

    async def get_individual_stock_info(self, code: str) -> Optional[Dict]:
        """
        获取A股个股基本信息（PE/PB/总市值等）
        优先 stock_individual_info_em，失败则用 stock_zh_valuation_baidu
        """
        # 方法1: stock_individual_info_em（腾讯云被封，可跳过）
        if not self.SKIP_EM_ENDPOINTS:
            try:
                df = ak.stock_individual_info_em(symbol=code)
                if df is not None and not df.empty:
                    info = {}
                    for _, row in df.iterrows():
                        item = str(row.get("item", ""))
                        value = row.get("value")
                        if item == "市盈率(动态)":
                            info["pe_ttm"] = float(value) if pd.notna(value) and value != "-" else None
                        elif item == "市净率":
                            info["pb"] = float(value) if pd.notna(value) and value != "-" else None
                        elif item == "总市值":
                            info["market_cap"] = round(float(value) / 1e8, 2) if pd.notna(value) and value else None
                    if info:
                        logger.info(f"获取 {code} 个股信息成功(em): PE={info.get('pe_ttm')}")
                        return info
            except Exception as e:
                logger.warning(f"获取 {code} em个股信息失败: {e}")

        # 方法2: stock_zh_valuation_baidu（PE/PB/市值 分别调用）
        try:
            info = {}
            for indicator, key in [("市盈率(静)", "pe_ttm"), ("市净率", "pb"), ("总市值", "market_cap")]:
                try:
                    df = ak.stock_zh_valuation_baidu(symbol=code, indicator=indicator, period="近一年")
                    if df is not None and not df.empty:
                        val = df.iloc[-1].get("value")
                        if pd.notna(val):
                            info[key] = round(float(val), 2)
                except Exception:
                    continue
            if info:
                logger.info(f"获取 {code} 个股信息成功(baidu): PE={info.get('pe_ttm')}, PB={info.get('pb')}")
                return info
        except Exception as e:
            logger.warning(f"获取 {code} baidu估值也失败: {e}")

        return None

    # ===================== A股批量数据 =====================

    async def get_a_stock_spot_batch(self) -> Dict[str, Dict]:
        """
        批量获取全A股实时行情 + 基本面（PE/PB/市值等）
        优先尝试 stock_zh_a_spot_em（速度快），失败则返回空（逐只用 valuation_baidu）
        """
        if self.SKIP_EM_ENDPOINTS:
            logger.info("跳过A股批量接口(em被封)，将逐只获取")
            return {}
        try:
            logger.info("批量获取A股行情数据...")
            df = ak.stock_zh_a_spot_em()
            result = {}
            for _, row in df.iterrows():
                code = str(row.get("代码", ""))
                if not code:
                    continue
                pe = row.get("市盈率-动态")
                pb = row.get("市净率")
                cap = row.get("总市值")
                result[code] = {
                    "pe_ttm": float(pe) if pd.notna(pe) and pe != "-" else None,
                    "pb": float(pb) if pd.notna(pb) and pb != "-" else None,
                    "market_cap": round(float(cap) / 1e8, 2) if pd.notna(cap) and cap else None,
                }
            logger.info(f"A股批量数据获取完成: {len(result)} 只")
            return result
        except Exception as e:
            logger.warning(f"A股批量接口失败({e}), 将在逐只刷新时用 individual_info_em")
            return {}

    async def get_hk_stock_spot_batch(self) -> Dict[str, Dict]:
        """批量获取港股行情 + 基本面"""
        if self.SKIP_EM_ENDPOINTS:
            return {}
        try:
            logger.info("批量获取港股行情数据...")
            df = ak.stock_hk_spot_em()
            result = {}
            for _, row in df.iterrows():
                code = str(row.get("代码", ""))
                if not code:
                    continue
                pe = row.get("市盈率")
                pb = row.get("市净率")
                cap = row.get("总市值")
                result[code] = {
                    "pe_ttm": float(pe) if pd.notna(pe) and pe != "-" else None,
                    "pb": float(pb) if pd.notna(pb) and pb != "-" else None,
                    "market_cap": round(float(cap) / 1e8, 2) if pd.notna(cap) and cap else None,
                }
            logger.info(f"港股批量数据获取完成: {len(result)} 只")
            return result
        except Exception as e:
            logger.error(f"港股批量数据获取失败: {e}")
            return {}

    async def get_us_stock_spot_batch(self) -> Dict[str, Dict]:
        """批量获取美股行情 + 基本面"""
        if self.SKIP_EM_ENDPOINTS:
            return {}
        try:
            logger.info("批量获取美股行情数据...")
            df = ak.stock_us_spot_em()
            result = {}
            for _, row in df.iterrows():
                code = str(row.get("代码", "")).replace(".", "")
                if not code:
                    continue
                pe = row.get("市盈率")
                cap = row.get("总市值")
                result[code] = {
                    "pe_ttm": float(pe) if pd.notna(pe) and pe != "-" else None,
                    "pb": None,
                    "market_cap": round(float(cap) / 1e8, 2) if pd.notna(cap) and cap else None,
                }
            logger.info(f"美股批量数据获取完成: {len(result)} 只")
            return result
        except Exception as e:
            logger.error(f"美股批量数据获取失败: {e}")
            return {}

    # ===================== 个股财务指标 =====================

    async def get_financial_indicators(self, code: str) -> Optional[Dict]:
        """
        获取A股个股财务分析指标（ROE/净利率/资产负债率/增速/EPS）
        主要接口: ak.stock_financial_abstract_ths (同花顺财务摘要)
        备用接口: ak.stock_financial_analysis_indicator
        """
        # 方法1: stock_financial_abstract_ths（已验证在腾讯云可用）
        try:
            df = ak.stock_financial_abstract_ths(symbol=code, indicator="按年度")
            if df is not None and not df.empty:
                # 数据按年份升序排列，取最后一行（最新年度）
                latest = df.iloc[-1]
                result = self._parse_ths_abstract(latest)
                if result:
                    logger.info(f"获取 {code} 财务指标成功(ths): ROE={result.get('roe')}, 净利率={result.get('net_margin')}")
                    return result
        except Exception as e:
            logger.warning(f"获取 {code} 同花顺财务摘要失败: {e}")

        # 方法2: stock_financial_analysis_indicator（备用）
        try:
            df = ak.stock_financial_analysis_indicator(symbol=code)
            if df is not None and not df.empty:
                latest = df.iloc[0]
                result = self._parse_analysis_indicator(latest, df)
                if result:
                    logger.info(f"获取 {code} 财务指标成功(analysis): ROE={result.get('roe')}")
                    return result
        except Exception as e:
            logger.warning(f"获取 {code} 财务分析指标也失败: {e}")

        return None

    def _parse_ths_abstract(self, row) -> Optional[Dict]:
        """解析同花顺财务摘要数据（值可能是 '21.29%', 'False', '5.4400', '6.42亿' 等）"""
        try:
            def safe_float(val):
                if val is None or val is False or (isinstance(val, bool) and not val):
                    return None
                if pd.isna(val):
                    return None
                s = str(val).strip()
                if s in ("-", "", "False", "false", "--"):
                    return None
                # 去掉 % 后缀
                s = s.rstrip("%")
                # 去掉 亿/万 后缀（仅在需要时）
                if s.endswith("亿"):
                    try:
                        return float(s[:-1]) * 10000  # 转为万
                    except (ValueError, TypeError):
                        return None
                if s.endswith("万"):
                    try:
                        return float(s[:-1])
                    except (ValueError, TypeError):
                        return None
                try:
                    return float(s)
                except (ValueError, TypeError):
                    return None

            roe = safe_float(row.get("净资产收益率"))
            net_margin = safe_float(row.get("销售净利率"))
            debt_ratio = safe_float(row.get("资产负债率"))
            revenue_growth = safe_float(row.get("营业总收入同比增长率"))
            net_income_growth = safe_float(row.get("净利润同比增长率"))
            eps = safe_float(row.get("基本每股收益"))

            # 至少要有 ROE 或净利率之一才算有效
            if roe is None and net_margin is None:
                return None

            return {
                "roe": roe,
                "net_margin": net_margin,
                "debt_ratio": debt_ratio,
                "revenue_growth_yoy": revenue_growth,
                "net_income_growth_yoy": net_income_growth,
                "eps": eps,
            }
        except Exception as e:
            logger.warning(f"解析同花顺财务摘要失败: {e}")
            return None

    def _parse_analysis_indicator(self, latest, df) -> Optional[Dict]:
        """解析 stock_financial_analysis_indicator 数据"""
        try:
            def safe_float(val):
                if pd.notna(val) and val != "-" and val != "" and val is not None:
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        return None
                return None

            roe = safe_float(latest.get("净资产收益率(%)"))
            net_margin = safe_float(latest.get("销售净利率(%)"))
            debt_ratio = safe_float(latest.get("资产负债率(%)"))

            revenue_growth = None
            net_income_growth = None
            if len(df) >= 2:
                curr_rev = safe_float(latest.get("营业总收入(万元)"))
                prev_rev = safe_float(df.iloc[1].get("营业总收入(万元)"))
                if curr_rev is not None and prev_rev is not None and prev_rev > 0:
                    revenue_growth = round((curr_rev - prev_rev) / prev_rev * 100, 2)

                curr_profit = safe_float(latest.get("净利润(万元)"))
                prev_profit = safe_float(df.iloc[1].get("净利润(万元)"))
                if curr_profit is not None and prev_profit is not None and prev_profit > 0:
                    net_income_growth = round((curr_profit - prev_profit) / prev_profit * 100, 2)

            if roe is None and net_margin is None:
                return None

            return {
                "roe": roe,
                "net_margin": net_margin,
                "debt_ratio": debt_ratio,
                "revenue_growth_yoy": revenue_growth,
                "net_income_growth_yoy": net_income_growth,
            }
        except Exception as e:
            logger.warning(f"解析财务分析指标失败: {e}")
            return None

    # ===================== 股息率 =====================

    # 分红数据缓存（全量获取一次，多只共用）
    _dividend_cache: Dict[str, float] = {}
    _dividend_cache_ts: float = 0

    async def get_dividend_yield_batch(self) -> Dict[str, float]:
        """
        批量获取A股股息率（stock_fhps_em）
        返回 {code: dividend_yield_pct}，如 {"600519": 1.93}
        缓存24小时
        """
        import time
        if self._dividend_cache and time.time() - self._dividend_cache_ts < 86400:
            return self._dividend_cache

        try:
            df = ak.stock_fhps_em(date="20241231")
            if df is None or df.empty:
                return self._dividend_cache

            result = {}
            for _, row in df.iterrows():
                code = str(row.get("代码", ""))
                dy = row.get("现金分红-股息率")
                if code and pd.notna(dy) and dy is not None:
                    result[code] = round(float(dy) * 100, 2)  # 转为百分比

            self._dividend_cache = result
            self._dividend_cache_ts = time.time()
            logger.info(f"股息率批量获取完成: {len(result)} 只有分红")
            return result
        except Exception as e:
            logger.warning(f"股息率获取失败: {e}")
            return self._dividend_cache

    # ===================== 美股/港股基本面（腾讯财经API） =====================

    async def get_us_hk_fundamentals_tencent(self, codes: list, market: str) -> Dict[str, Dict]:
        """
        通过腾讯财经API批量获取美股/港股基本面数据（PE/市值/EPS）
        AKShare 的 em 系列接口在腾讯云被封，此方法作为替代数据源

        腾讯API字段映射（0-based index）:
          [3]  现价
          [39] PE(TTM)
          [44] 流通市值（美股:亿美元, 港股:亿港元）
          [45] 总市值（美股:亿美元, 港股:亿港元）
          [47] EPS
        """
        import httpx

        if not codes:
            return {}

        # 构造查询代码: 美股加 us 前缀, 港股加 hk 前缀(补零到5位)
        if market == "US":
            formatted = ','.join([f"us{c}" for c in codes])
        elif market == "HK":
            formatted = ','.join([f"hk{c.zfill(5)}" for c in codes])
        else:
            return {}

        result = {}
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"https://qt.gtimg.cn/q={formatted}")
                if resp.status_code != 200:
                    return {}

                # 汇率：市值统一转为亿人民币
                usd_cny = 7.2   # USD -> CNY
                hkd_cny = 0.93  # HKD -> CNY

                for line in resp.text.split(';'):
                    line = line.strip()
                    if '~' not in line or '=' not in line:
                        continue
                    try:
                        key = line.split('=')[0].strip()
                        # 提取代码: v_usNVDA → NVDA, v_hk00700 → 00700
                        raw_code = key.split('_')[-1]
                        if market == "US" and raw_code.startswith('us'):
                            code = raw_code[2:]
                        elif market == "HK" and raw_code.startswith('hk'):
                            code = raw_code[2:]
                        else:
                            continue

                        data_str = line.split('"')[1] if '"' in line else ''
                        parts = data_str.split('~')
                        if len(parts) < 48:
                            continue

                        def safe_float(s):
                            try:
                                v = float(s)
                                return v if v != 0 else None
                            except (ValueError, TypeError):
                                return None

                        pe = safe_float(parts[39])
                        cap_raw = safe_float(parts[45])  # 总市值(亿，本币)
                        eps = safe_float(parts[47])

                        # 转为亿人民币
                        market_cap = None
                        if cap_raw is not None:
                            if market == "US":
                                market_cap = round(cap_raw * usd_cny, 2)
                            elif market == "HK":
                                market_cap = round(cap_raw * hkd_cny, 2)

                        entry = {}
                        if pe is not None:
                            entry["pe_ttm"] = round(pe, 2)
                        if market_cap is not None:
                            entry["market_cap"] = market_cap
                        if eps is not None:
                            entry["eps"] = round(eps, 2)

                        if entry:
                            result[code] = entry
                    except (IndexError, ValueError):
                        continue

            logger.info(f"腾讯API获取{market}基本面: {len(result)}/{len(codes)} 只")
        except Exception as e:
            logger.warning(f"腾讯API获取{market}基本面失败: {e}")

        return result

    # ===================== 数据清洗 =====================

    @staticmethod
    def sanitize_fundamentals(data: Dict) -> Dict:
        """
        清洗极端值，防止异常数据污染评分
        - 净利率超过 ±100% 视为异常（金融行业数据口径问题）
        - 资产负债率超过 100% 视为 ST/问题股
        - 增速超过 ±200% 截断
        - 负 PE 标记为 None（亏损股）
        """
        cleaned = dict(data)

        # PE: 负值=亏损，设为 None
        pe = cleaned.get("pe_ttm")
        if pe is not None and pe < 0:
            cleaned["pe_ttm"] = None

        # 净利率: 超过 ±100% 截断到 ±100
        nm = cleaned.get("net_margin")
        if nm is not None:
            if nm > 100:
                cleaned["net_margin"] = 100.0
            elif nm < -100:
                cleaned["net_margin"] = -100.0

        # 资产负债率: 超过 100% 截断
        dr = cleaned.get("debt_ratio")
        if dr is not None and dr > 100:
            cleaned["debt_ratio"] = 100.0

        # 增速: 超过 ±200% 截断
        for key in ("revenue_growth_yoy", "net_income_growth_yoy"):
            val = cleaned.get(key)
            if val is not None:
                if val > 200:
                    cleaned[key] = 200.0
                elif val < -100:
                    cleaned[key] = -100.0

        return cleaned

    # ===================== K线数据 =====================

    async def get_a_stock_kline(self, code: str, days: int = 120) -> List[Dict]:
        """获取A股日K线，优先 stock_zh_a_daily，失败用 stock_zh_a_hist"""
        # 方法1: stock_zh_a_daily（新浪源，英文列名，稳定）
        try:
            # 需要 sh/sz 前缀
            prefix = "sh" if code.startswith("6") else "sz"
            df = ak.stock_zh_a_daily(symbol=f"{prefix}{code}", adjust="qfq")
            if df is not None and not df.empty:
                df = df.tail(days)
                return [
                    {
                        "date": str(row["date"]),
                        "open": float(row["open"]),
                        "high": float(row["high"]),
                        "low": float(row["low"]),
                        "close": float(row["close"]),
                        "volume": int(row["volume"]),
                    }
                    for _, row in df.iterrows()
                ]
        except Exception as e:
            logger.warning(f"获取 {code} A股K线(daily)失败: {e}")

        # 方法2: stock_zh_a_hist（东财源，中文列名）
        try:
            end_date = datetime.now().strftime("%Y%m%d")
            start_date = (datetime.now() - timedelta(days=days * 2)).strftime("%Y%m%d")
            df = ak.stock_zh_a_hist(symbol=code, period="daily", start_date=start_date, end_date=end_date, adjust="qfq")
            if df is not None and not df.empty:
                df = df.tail(days)
                return [
                    {
                        "date": str(row["日期"]),
                        "open": float(row["开盘"]),
                        "high": float(row["最高"]),
                        "low": float(row["最低"]),
                        "close": float(row["收盘"]),
                        "volume": int(row["成交量"]),
                    }
                    for _, row in df.iterrows()
                ]
        except Exception as e:
            logger.warning(f"获取 {code} A股K线(hist)也失败: {e}")

        return []

    async def get_hk_stock_kline(self, code: str, days: int = 120) -> List[Dict]:
        """获取港股日K线"""
        try:
            df = ak.stock_hk_hist(symbol=code, period="daily", adjust="qfq")
            if df is None or df.empty:
                return []
            df = df.tail(days)
            return [
                {
                    "date": str(row["日期"]),
                    "open": float(row["开盘"]),
                    "high": float(row["最高"]),
                    "low": float(row["最低"]),
                    "close": float(row["收盘"]),
                    "volume": int(row["成交量"]),
                }
                for _, row in df.iterrows()
            ]
        except Exception as e:
            logger.warning(f"获取 {code} 港股K线失败: {e}")
            return []

    async def get_us_stock_kline(self, code: str, days: int = 120) -> List[Dict]:
        """获取美股日K线"""
        try:
            df = ak.stock_us_hist(symbol=code, period="daily", adjust="qfq")
            if df is None or df.empty:
                return []
            df = df.tail(days)
            return [
                {
                    "date": str(row["日期"]),
                    "open": float(row["开盘"]),
                    "high": float(row["最高"]),
                    "low": float(row["最低"]),
                    "close": float(row["收盘"]),
                    "volume": int(row["成交量"]),
                }
                for _, row in df.iterrows()
            ]
        except Exception as e:
            logger.warning(f"获取 {code} 美股K线失败: {e}")
            return []

    async def get_kline(self, code: str, market: str, days: int = 120) -> List[Dict]:
        """统一K线入口"""
        if market in ("SH", "SZ"):
            return await self.get_a_stock_kline(code, days)
        elif market == "HK":
            return await self.get_hk_stock_kline(code, days)
        elif market == "US":
            return await self.get_us_stock_kline(code, days)
        return []

    # ===================== 市场指数 =====================

    async def get_index_kline(self, index_code: str, days: int = 60) -> List[Dict]:
        """
        获取市场指数K线
        index_code: "sh000001"(上证), "sz399001"(深证)
        优先 stock_zh_index_daily，失败用 stock_zh_index_daily_em
        """
        if not (index_code.startswith("sh") or index_code.startswith("sz")):
            return []

        # 方法1: stock_zh_index_daily（新浪源，稳定）
        try:
            df = ak.stock_zh_index_daily(symbol=index_code)
            if df is not None and not df.empty:
                df = df.tail(days)
                return [
                    {
                        "date": str(row["date"]),
                        "close": float(row["close"]),
                    }
                    for _, row in df.iterrows()
                ]
        except Exception as e:
            logger.warning(f"获取指数 {index_code} K线(daily)失败: {e}")

        # 方法2: stock_zh_index_daily_em（东财源）
        try:
            df = ak.stock_zh_index_daily_em(symbol=index_code)
            if df is not None and not df.empty:
                df = df.tail(days)
                return [
                    {
                        "date": str(row["date"]),
                        "close": float(row["close"]),
                    }
                    for _, row in df.iterrows()
                ]
        except Exception as e:
            logger.warning(f"获取指数 {index_code} K线(em)也失败: {e}")

        return []

    def compute_market_regime(self, kline_data: List[Dict]) -> Dict:
        """根据指数K线计算市场趋势"""
        if len(kline_data) < 20:
            return {"trend": "neutral", "volatility": "medium", "ma20": None}

        closes = [d["close"] for d in kline_data]
        ma20 = sum(closes[-20:]) / 20
        latest_close = closes[-1]

        pct_diff = (latest_close - ma20) / ma20 * 100
        if pct_diff > 2:
            trend = "bull"
        elif pct_diff < -2:
            trend = "bear"
        else:
            trend = "neutral"

        if len(closes) >= 6:
            daily_returns = [(closes[i] - closes[i - 1]) / closes[i - 1] * 100 for i in range(-5, 0)]
            vol = statistics.stdev(daily_returns)
            if vol > 2.0:
                volatility = "high"
            elif vol > 1.0:
                volatility = "medium"
            else:
                volatility = "low"
        else:
            volatility = "medium"

        return {"trend": trend, "volatility": volatility, "ma20": round(ma20, 2)}


# 全局实例
financial_data_service = FinancialDataService()

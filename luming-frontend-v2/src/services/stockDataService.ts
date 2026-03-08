/**
 * 股票数据服务 - 支持全市场股票动态获取
 * 优先使用后端API（绕过CORS），备用腾讯财经、新浪财经等API
 */

import { INDUSTRY_CLASSIFICATION } from '../data/industryClassification';
import { getStockDetailFromBackend } from './backendRealtime';
import { calculateRSI, calculateMACD, type KLineData } from './technicalIndicators';

// 股票信息接口
export interface StockInfo {
  code: string;
  name: string;
  market: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  turnover: string;
  pe: number;
  pb?: number;
  roe: number;
  rsi: number;
  macd: string;
  cap: string;
  why: string;
  concepts?: string[];
  // Phase 1 新增：真实财务数据
  dividendYield?: number;
  revenueGrowthYoy?: number;
  netIncomeGrowthYoy?: number;
  netMargin?: number;
  debtRatio?: number;
  eps?: number;
  marketCap?: number;        // 真实市值（亿元）
}

/**
 * 根据股票代码判断市场类型
 */
export function detectMarket(code: string): string {
  // A股：6位数字
  if (/^\d{6}$/.test(code)) {
    if (code.startsWith('6') || code.startsWith('5')) return 'SH';
    if (code.startsWith('0') || code.startsWith('3')) return 'SZ';
    return 'SH';
  }
  // 港股：5位数字或0开头
  if (/^\d{5}$/.test(code) || code.startsWith('0')) return 'HK';
  // 美股：字母
  if (/^[A-Z]+$/i.test(code)) return 'US';
  // 基金：6位数字
  if (/^\d{6}$/.test(code)) return 'FUND';
  return 'UNKNOWN';
}

/**
 * 从腾讯财经API获取A股实时数据
 */
async function getAStockFromTencent(code: string): Promise<Partial<StockInfo> | null> {
  try {
    const market = detectMarket(code);
    const stockId = market === 'SH' ? `sh${code}` : `sz${code}`;

    const response = await fetch(`https://qt.gtimg.cn/q=${stockId}`);
    const text = await response.text();

    // 解析腾讯返回的数据格式: v_sh600036="1~招商银行~..."
    const match = text.match(new RegExp(`v_${stockId}="(.+?)"`));
    if (!match) return null;

    const data = match[1].split('~');
    if (data.length < 10) return null;

    const price = parseFloat(data[3]) || 0;
    const prevClose = parseFloat(data[4]) || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      code,
      name: data[1] || '',
      market,
      price,
      change,
      changePct,
      volume: formatVolume(data[6] || '0'),
      turnover: formatTurnover(data[37] || '0'),
    };
  } catch (error) {
    console.warn('Tencent API failed for A-stock:', code, error);
    return null;
  }
}

/**
 * 从新浪财经API获取A股数据（备用）
 */
async function getAStockFromSina(code: string): Promise<Partial<StockInfo> | null> {
  try {
    const market = detectMarket(code);
    const symbol = market === 'SH' ? `sh${code}` : `sz${code}`;

    const response = await fetch(
      `https://hq.sinajs.cn/list=${symbol}`
    );
    const text = await response.text();

    const match = text.match(/="(.+?)"/);
    if (!match) return null;

    const data = match[1].split(',');
    if (data.length < 10) return null;

    const price = parseFloat(data[3]) || 0;
    const prevClose = parseFloat(data[2]) || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      code,
      name: data[0],
      market,
      price,
      change,
      changePct,
      volume: formatVolume(data[8] || '0'),
      turnover: formatTurnover(data[9] || '0'),
    };
  } catch (error) {
    console.warn('Sina API failed for A-stock:', code, error);
    return null;
  }
}

/**
 * 从腾讯财经API获取港股数据
 * 注意：腾讯API港股数据格式与A股不同
 */
async function getHKStockFromTencent(code: string): Promise<Partial<StockInfo> | null> {
  try {
    // 港股代码格式：hk01138
    const stockId = `hk${code}`;
    const response = await fetch(`https://qt.gtimg.cn/q=${stockId}`);
    const text = await response.text();

    // 解析腾讯返回的数据格式: v_hk01138="1~中远海控~01138~16.29~15.49~0.80~..."
    const match = text.match(new RegExp(`v_${stockId}="(.+?)"`));
    if (!match) return null;

    const data = match[1].split('~');
    if (data.length < 6) return null;

    const price = parseFloat(data[3]) || 0;
    const preClose = parseFloat(data[4]) || 0; // 昨收价

    if (price <= 0 || preClose <= 0) return null;

    // 自己计算涨跌额和涨跌幅
    const change = price - preClose;
    const changePct = (change / preClose) * 100;

    // 数据合理性验证
    if (Math.abs(changePct) > 30) {
      console.warn(`⚠️ Tencent HK ${code}: 异常涨幅 ${changePct.toFixed(2)}%, price=${price}, preClose=${preClose}`);
      return null;
    }

    return {
      code,
      name: data[1] || code,
      market: 'HK',
      price,
      change,
      changePct: parseFloat(changePct.toFixed(2)),
      volume: formatVolume(data[6] || '0'),
      turnover: formatTurnover(data[37] || '0'),
    };
  } catch (error) {
    console.warn('Tencent API failed for HK-stock:', code, error);
    return null;
  }
}

/**
 * 从腾讯财经API获取美股数据
 * 注意：腾讯API美股数据格式与A股、港股不同
 */
async function getUSStockFromTencent(code: string): Promise<Partial<StockInfo> | null> {
  try {
    // 美股代码格式：直接使用股票代码，如 NFLX
    const response = await fetch(`https://qt.gtimg.cn/q=${code}`);
    const text = await response.text();

    // 解析腾讯返回的数据格式: v_NFLX="Netflix~96.24~-0.85~-0.88%~..."
    const match = text.match(new RegExp(`v_${code}="(.+?)"`));
    if (!match) return null;

    const data = match[1].split('~');
    if (data.length < 4) return null;

    const name = data[0] || code;
    const price = parseFloat(data[1]) || 0;
    const change = parseFloat(data[2]) || 0;
    const changePct = parseFloat(data[3]) || 0;

    if (price <= 0) return null;

    // 数据合理性验证
    if (Math.abs(changePct) > 30) {
      console.warn(`⚠️ Tencent US ${code}: 异常涨幅 ${changePct}%, price=${price}`);
      return null;
    }

    return {
      code,
      name: name,
      market: 'US',
      price: price,
      change: change,
      changePct: changePct,
      volume: formatVolume(data[5] || '0'),
    };
  } catch (error) {
    console.warn('Tencent API failed for US-stock:', code, error);
    return null;
  }
}

// ===================== 真实财务数据缓存 =====================

// Session 级缓存，避免重复请求
const fundamentalsCache: Record<string, { data: Record<string, unknown>; ts: number }> = {};
const klineCache: Record<string, { data: KLineData[]; ts: number }> = {};
const CACHE_TTL = 3600_000; // 1小时

/**
 * 从后端获取真实财务数据（PE/PB/ROE/增速等）
 */
async function fetchFundamentals(code: string): Promise<Record<string, unknown> | null> {
  const cached = fundamentalsCache[code];
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const resp = await fetch(`/api/financial/fundamentals/${code}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    fundamentalsCache[code] = { data, ts: Date.now() };
    return data;
  } catch {
    return null;
  }
}

/**
 * 从后端获取K线数据并计算真实RSI/MACD
 */
async function fetchKlineAndIndicators(code: string): Promise<{ rsi: number; macd: string; kline: KLineData[] } | null> {
  const cached = klineCache[code];
  let kline: KLineData[];

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    kline = cached.data;
  } else {
    try {
      const resp = await fetch(`/api/financial/kline/${code}?days=60`);
      if (!resp.ok) return null;
      kline = await resp.json();
      if (!Array.isArray(kline) || kline.length < 15) return null;
      klineCache[code] = { data: kline, ts: Date.now() };
    } catch {
      return null;
    }
  }

  // 计算真实 RSI(14)
  const rsiValues = calculateRSI(kline, 14);
  const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;

  // 计算真实 MACD(12,26,9)
  let macd = 'neutral';
  if (kline.length >= 30) {
    const macdResult = calculateMACD(kline, 12, 26, 9);
    if (macdResult.macd && macdResult.macd.length >= 2) {
      const latest = macdResult.macd[macdResult.macd.length - 1];
      const prev = macdResult.macd[macdResult.macd.length - 2];
      if (latest > 0 && prev <= 0) macd = 'golden_cross';
      else if (latest < 0 && prev >= 0) macd = 'death_cross';
      else if (latest > 0) macd = 'golden_cross';
      else if (latest < 0) macd = 'death_cross';
    }
  }

  return { rsi: Math.round(rsi * 100) / 100, macd, kline };
}

/**
 * 用真实数据填充股票信息（Phase 1 核心）
 * 优先从后端获取真实 PE/ROE/增速 + 真实 RSI/MACD
 * 后端不可用时 fallback 到 mock 数据
 */
async function fillRealData(baseInfo: Partial<StockInfo>): Promise<StockInfo> {
  const code = baseInfo.code!;
  const changePct = baseInfo.changePct || 0;
  const industryInfo = INDUSTRY_CLASSIFICATION[code];

  // 并行获取财务数据和K线指标
  const [fundamentals, indicators] = await Promise.all([
    fetchFundamentals(code),
    fetchKlineAndIndicators(code),
  ]);

  // 真实PE/ROE/PB/增速（后端数据优先）
  const pe = (fundamentals?.pe_ttm as number) ?? baseInfo.pe ?? 20;
  const pb = (fundamentals?.pb as number) ?? undefined;
  const roe = (fundamentals?.roe as number) ?? industryInfo?.roe ?? baseInfo.roe ?? 12;
  const marketCapValue = fundamentals?.market_cap as number | undefined;

  // 真实RSI/MACD（K线计算优先）
  const rsi = indicators?.rsi ?? Math.min(75, Math.max(25, 50 + changePct * 5));
  const macd = indicators?.macd ?? (changePct > 2 ? 'golden_cross' : changePct < -2 ? 'death_cross' : 'neutral');

  // 市值格式化
  let cap = baseInfo.cap || '1000亿';
  if (marketCapValue) {
    if (marketCapValue >= 10000) cap = `${(marketCapValue / 10000).toFixed(2)}万亿`;
    else if (marketCapValue >= 1000) cap = `${Math.round(marketCapValue)}亿`;
    else cap = `${Math.round(marketCapValue)}亿`;
  }

  const result: StockInfo = {
    ...baseInfo,
    sector: industryInfo?.sector || '其他',
    pe,
    pb,
    roe,
    rsi,
    macd,
    cap,
    why: generateDefaultReason(baseInfo.name!, changePct),
    concepts: industryInfo?.concepts || [],
    // 新增财务字段
    dividendYield: fundamentals?.dividend_yield as number | undefined,
    revenueGrowthYoy: fundamentals?.revenue_growth_yoy as number | undefined,
    netIncomeGrowthYoy: fundamentals?.net_income_growth_yoy as number | undefined,
    netMargin: fundamentals?.net_margin as number | undefined,
    debtRatio: fundamentals?.debt_ratio as number | undefined,
    eps: fundamentals?.eps as number | undefined,
    marketCap: marketCapValue,
  } as StockInfo;

  // 日志：标记数据来源
  const source = fundamentals ? 'REAL' : 'MOCK';
  const techSource = indicators ? 'REAL' : 'MOCK';
  console.log(`📊 ${code} 数据填充 [基本面:${source}] [技术指标:${techSource}] PE=${pe} ROE=${roe} RSI=${rsi.toFixed(1)}`);

  return result;
}

/**
 * 填充技术指标和推荐理由（Fallback：用于后端不可用时）
 */
function fillMockData(baseInfo: Partial<StockInfo>): StockInfo {
  const code = baseInfo.code!;
  const changePct = baseInfo.changePct || 0;
  const industryInfo = INDUSTRY_CLASSIFICATION[code];

  const rsi = Math.min(75, Math.max(25, 50 + changePct * 5));
  const macd = changePct > 2 ? 'golden_cross' : changePct < -2 ? 'death_cross' : 'neutral';

  return {
    ...baseInfo,
    sector: industryInfo?.sector || '其他',
    pe: baseInfo.pe || 20,
    roe: industryInfo?.roe ?? baseInfo.roe ?? 12,
    rsi,
    macd,
    cap: baseInfo.cap || '1000亿',
    why: generateDefaultReason(baseInfo.name!, changePct),
    concepts: industryInfo?.concepts || [],
  } as StockInfo;
}

/**
 * 生成默认推荐理由
 */
function generateDefaultReason(name: string, changePct: number): string {
  if (changePct > 3) {
    return `${name}今日表现强势，涨幅达${changePct.toFixed(2)}%，关注上涨持续性，注意风险控制。`;
  } else if (changePct < -3) {
    return `${name}今日回调${Math.abs(changePct).toFixed(2)}%，可能带来配置机会，建议关注基本面变化。`;
  } else {
    return `${name}今日表现平稳，建议结合基本面和技术面综合分析，寻找合适的入场时机。`;
  }
}

/**
 * 格式化成交量
 */
function formatVolume(volume: string): string {
  const num = parseInt(volume.replace(/,/g, ''));
  if (num > 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num > 10000) return `${(num / 10000).toFixed(1)}万`;
  return volume;
}

/**
 * 格式化成交额
 */
function formatTurnover(turnover: string): string {
  const num = parseFloat(turnover);
  if (num > 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num > 10000) return `${(num / 10000).toFixed(1)}万`;
  return turnover;
}

/**
 * 获取单只股票的完整信息（动态获取）
 * 支持A股、港股、美股的任意股票代码
 * A股和港股优先使用后端API（绕过CORS）
 */
export async function getStockInfo(code: string): Promise<StockInfo | null> {
  console.log('🔍 Fetching stock info for:', code);

  const market = detectMarket(code);
  let stockData: Partial<StockInfo> | null = null;

  // 根据市场类型选择API
  if (market === 'SH' || market === 'SZ' || market === 'HK') {
    // A股和港股：优先使用后端API（绕过CORS）
    try {
      const backendData = await getStockDetailFromBackend(code);
      if (backendData && backendData.name) {
        stockData = {
          code: backendData.code,
          name: backendData.name,
          market: backendData.market || market,
          price: backendData.price,
          change: backendData.change || 0,
          changePct: backendData.changePct || 0,
          volume: formatVolume((backendData.volume || 0).toString()),
          turnover: formatTurnover((backendData.turnover || backendData.amount || 0).toString()),
        };
        console.log(`✅ 从后端API获取: ${stockData.name} 价格=${stockData.price}`);
      }
    } catch (error) {
      console.warn(`后端API失败，尝试备用方案: ${error}`);
    }

    // 备用方案：直接调用外部API
    if (!stockData) {
      if (market === 'SH' || market === 'SZ') {
        stockData = await getAStockFromTencent(code);
        if (!stockData) {
          stockData = await getAStockFromSina(code);
        }
      } else if (market === 'HK') {
        stockData = await getHKStockFromTencent(code);
      }
    }
  } else if (market === 'US') {
    // 美股：使用腾讯财经API（避免CORS问题）
    stockData = await getUSStockFromTencent(code);
  }

  if (!stockData || !stockData.name) {
    console.warn('❌ Failed to fetch stock info:', code);
    return null;
  }

  console.log('✅ Stock info fetched:', stockData.name, stockData.price);

  // 用真实数据填充（后端不可用时自动 fallback 到 mock）
  try {
    return await fillRealData(stockData);
  } catch {
    console.warn('⚠️ fillRealData failed, fallback to mock for', code);
    return fillMockData(stockData);
  }
}

/**
 * 批量获取股票信息
 */
export async function getMultipleStockInfo(codes: string[]): Promise<StockInfo[]> {
  const results = await Promise.allSettled(
    codes.map(code => getStockInfo(code))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<StockInfo> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

/**
 * 搜索股票（支持全市场搜索）
 */
export async function searchStocksDynamic(
  query: string
): Promise<Array<{ code: string; name: string; market: string }>> {
  if (!query || query.length < 1) {
    return [];
  }

  // 如果是有效的股票代码格式，直接返回
  const market = detectMarket(query);
  if (market !== 'UNKNOWN') {
    try {
      const stockInfo = await getStockInfo(query);
      if (stockInfo) {
        return [{
          code: stockInfo.code,
          name: stockInfo.name,
          market: stockInfo.market,
        }];
      }
    } catch (error) {
      console.warn('Search failed for code:', query);
    }
  }

  // TODO: 实现按名称搜索（需要后端支持或使用第三方API）
  return [];
}

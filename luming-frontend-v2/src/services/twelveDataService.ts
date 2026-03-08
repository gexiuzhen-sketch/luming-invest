/**
 * Twelve Data API Service
 * 免费额度: 每天800次API请求
 * 文档: https://twelvedata.com/docs
 *
 * 使用说明:
 * 1. 注册账号: https://twelvedata.com/
 * 2. 获取API Key
 * 3. 设置环境变量或在代码中配置
 */

// API配置 - 建议使用环境变量
const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY || 'demo'; // 替换为你的API Key
const BASE_URL = 'https://api.twelvedata.com';

/**
 * 获取单只美股实时报价
 */
export async function getUSStockQuote(symbol: string): Promise<StockQuote | null> {
  if (API_KEY === 'demo') {
    console.warn('⚠️ Twelve Data API Key未配置，使用demo模式');
    return null;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // 检查API错误
    if (data.status === 'error') {
      console.warn(`Twelve Data API error for ${symbol}:`, data.message);
      return null;
    }

    return {
      symbol: data.symbol,
      name: data.name || symbol,
      price: parseFloat(data.close) || parseFloat(data.price) || 0,
      change: parseFloat(data.change) || 0,
      changePct: parseFloat(data.percent_change) || 0,
      volume: parseInt(data.volume) || 0,
      high: parseFloat(data.high) || 0,
      low: parseFloat(data.low) || 0,
      open: parseFloat(data.open) || 0,
      previousClose: parseFloat(data.previous_close) || 0,
      marketCap: data.market_cap || '',
      fiftyTwoWeekHigh: parseFloat(data.fifty_two_week_high) || 0,
      fiftyTwoWeekLow: parseFloat(data.fifty_two_week_low) || 0,
    };
  } catch (error) {
    console.warn(`Twelve Data failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量获取美股实时报价
 * Twelve Data支持批量请求，但免费版有限制
 */
export async function getUSStockBatchQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  if (API_KEY === 'demo') {
    console.warn('⚠️ Twelve Data API Key未配置');
    return {};
  }

  const stocks: Record<string, StockQuote> = {};
  const batchSize = 8; // 批量大小，避免超时

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    // 并发请求
    const promises = batch.map(symbol => getUSStockQuote(symbol));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        stocks[batch[index]] = result.value;
      }
    });

    // 避免速率限制
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (Object.keys(stocks).length > 0) {
    console.log(`✅ Twelve Data: 获取 ${Object.keys(stocks).length} 只美股数据`);
  }

  return stocks;
}

/**
 * 获取美股实时时间序列数据（用于K线图）
 */
export async function getUSStockTimeSeries(
  symbol: string,
  interval: '1min' | '5min' | '15min' | '30min' | '1h' | '4h' | '1d' | '1w' | '1m' = '1d',
  outputsize: number = 30
): Promise<TimeSeriesData[]> {
  if (API_KEY === 'demo') {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      console.warn(`Twelve Data time series error for ${symbol}:`, data.message);
      return [];
    }

    return (data.values || []).map((item: any) => ({
      datetime: item.datetime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume),
    }));
  } catch (error) {
    console.warn(`Twelve Data time series failed for ${symbol}:`, error);
    return [];
  }
}

/**
 * 获取ETF数据
 */
export async function getETFQuote(symbol: string): Promise<StockQuote | null> {
  // ETF与股票使用相同的API
  return getUSStockQuote(symbol);
}

/**
 * 搜索美股（支持股票代码和公司名）
 */
export async function searchUSStocks(query: string): Promise<StockSearchResult[]> {
  if (API_KEY === 'demo') {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/symbol_search?symbol=${query}&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      return [];
    }

    return (data.data || []).map((item: any) => ({
      symbol: item.symbol,
      name: item.instrument_name,
      type: item.instrument_type,
      exchange: item.exchange,
      currency: item.currency,
    }));
  } catch (error) {
    console.warn(`Twelve Data search failed for ${query}:`, error);
    return [];
  }
}

// 类型定义
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface TimeSeriesData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
}

// 导出API配置状态
export const TWELVEDATA_CONFIG = {
  isConfigured: API_KEY !== 'demo',
  dailyLimit: 800,
  requiresKey: true,
};

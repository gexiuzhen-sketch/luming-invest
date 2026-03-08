/**
 * 后端API代理服务
 * 通过后端API获取实时行情，绕过CORS限制
 * 后端使用AKShare库获取数据，支持A股和港股
 */

const BACKEND_API_BASE = '/api'; // Nginx反向代理到后端

/**
 * 从后端API获取单只股票实时行情
 * @param code 股票代码
 * @param market 市场 (A=A股, HK=港股)
 */
export async function getStockQuoteFromBackend(code: string, market: string = 'A'): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/quote?code=${code}&market=${market}`);

    if (!response.ok) {
      console.warn(`Backend API returned ${response.status} for ${code}`);
      return null;
    }

    const result = await response.json();

    if (result.data) {
      console.log(`✅ 后端API: ${code}(${result.data.name}) 价格=${result.data.price}, 涨跌=${result.data.change_pct}%`);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error(`Backend API error for ${code}:`, error);
    return null;
  }
}

/**
 * 批量获取A股实时行情
 * @param codes A股代码列表 (不含市场前缀)
 */
export async function getAStockRealtimeFromBackend(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  const stocks: Record<string, any> = {};

  // 并发请求，限制并发数为10
  const batchSize = 10;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const promises = batch.map(code => getStockQuoteFromBackend(code, 'A'));
    const results = await Promise.all(promises);

    results.forEach((data, index) => {
      if (data) {
        const code = batch[index];
        stocks[code] = {
          code,
          name: data.name,
          price: data.price,
          preClose: data.price / (1 + data.change_pct / 100),
          change: data.price * data.change_pct / (100 + data.change_pct),
          changePct: data.change_pct,
          volume: data.volume || 0,
          turnover: data.amount || 0,
        };
      }
    });

    // 避免请求过快
    if (i + batchSize < codes.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (Object.keys(stocks).length > 0) {
    console.log(`✅ 后端API: 成功获取 ${Object.keys(stocks).length}/${codes.length} 只A股数据`);
  }

  return stocks;
}

/**
 * 批量获取港股实时行情
 * @param codes 港股代码列表 (5位数字)
 */
export async function getHKStockRealtimeFromBackend(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  const stocks: Record<string, any> = {};

  // 并发请求，限制并发数为5
  const batchSize = 5;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const promises = batch.map(code => getStockQuoteFromBackend(code, 'HK'));
    const results = await Promise.all(promises);

    results.forEach((data, index) => {
      if (data) {
        const code = batch[index];
        stocks[code] = {
          code,
          name: data.name,
          price: data.price,
          preClose: data.price / (1 + data.change_pct / 100),
          change: data.price * data.change_pct / (100 + data.change_pct),
          changePct: data.change_pct,
          volume: data.volume || 0,
        };
      }
    });

    // 避免请求过快
    if (i + batchSize < codes.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  if (Object.keys(stocks).length > 0) {
    console.log(`✅ 后端API: 成功获取 ${Object.keys(stocks).length}/${codes.length} 只港股数据`);
  }

  return stocks;
}

/**
 * 批量获取美股实时行情
 * @param codes 美股代码列表 (如: NFLX, AAPL)
 */
export async function getUSStockRealtimeFromBackend(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  const stocks: Record<string, any> = {};

  // 使用后端批量API: /api/stocks/prices?codes=NFLX,AAPL,...
  try {
    const response = await fetch(`${BACKEND_API_BASE}/stocks/prices?codes=${codes.join(',')}`);

    if (!response.ok) {
      console.warn(`Backend API returned ${response.status} for US stocks`);
      return {};
    }

    const result = await response.json();

    if (result.data && typeof result.data === 'object') {
      // 后端返回格式: { "NFLX": { price, changePct, ... }, "AAPL": { ... } }
      Object.entries(result.data).forEach(([code, data]: [string, any]) => {
        stocks[code] = {
          code,
          name: data.name || code,
          price: data.price,
          preClose: data.price / (1 + data.changePct / 100),
          change: data.price * data.changePct / (100 + data.changePct),
          changePct: data.changePct,
          volume: data.volume || 0,
        };
      });

      if (Object.keys(stocks).length > 0) {
        console.log(`✅ 后端API: 成功获取 ${Object.keys(stocks).length}/${codes.length} 只美股数据`);
      }
    }

    return stocks;
  } catch (error) {
    console.error('Backend API error for US stocks:', error);
    return {};
  }
}

/**
 * 获取单只股票详情（用于模拟交易）
 * @param code 股票代码
 */
export async function getStockDetailFromBackend(code: string): Promise<Record<string, any> | null> {
  // 自动判断市场
  let market = 'A';
  if (code.startsWith('0') || code.startsWith('3')) {
    market = 'A'; // 深市
  } else if (code.startsWith('6')) {
    market = 'A'; // 沪市
  } else if (/^\d{5}$/.test(code)) {
    market = 'HK'; // 港股5位数字
  } else if (/^[A-Z]+$/.test(code)) {
    market = 'US'; // 美股字母代码
  }

  return getStockQuoteFromBackend(code, market);
}

/**
 * 腾讯财经实时数据服务
 * 优先使用后端API（绕过CORS），备用腾讯财经API
 * 免费，延迟约1-3秒
 */

import { getAStockRealtimeFromBackend, getHKStockRealtimeFromBackend, getUSStockRealtimeFromBackend } from './backendRealtime';

// 腾讯财经API地址
const TENCENT_API = 'https://qt.gtimg.cn';

/**
 * 获取A股实时行情
 * 优先使用后端API（绕过CORS），备用腾讯财经
 * 代码格式：sh600519, sz000858
 */
export async function getAStockRealtime(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  // 优先使用后端API（绕过CORS，数据更准确）
  try {
    console.log('🔍 A股数据获取: 优先使用后端API');
    const backendStocks = await getAStockRealtimeFromBackend(codes);
    if (Object.keys(backendStocks).length > 0) {
      console.log(`✅ 后端API: 成功获取 ${Object.keys(backendStocks).length}/${codes.length} 只A股数据`);
      return backendStocks;
    }
  } catch (error) {
    console.warn('⚠️ 后端API失败，尝试腾讯财经:', error);
  }

  // 备用：腾讯财经API
  console.log('⚠️ 使用腾讯财经API作为备用');
  const formattedCodes = codes.map(code => {
    const market = code.startsWith('6') ? 'sh' : 'sz';
    return `${market}${code}`;
  }).join(',');

  try {
    const response = await fetch(`${TENCENT_API}/q=${formattedCodes}`);
    const text = await response.text();

    const stocks: Record<string, any> = {};
    const lines = text.split('\n').filter(line => line.includes('~'));

    lines.forEach(line => {
      // 腾讯财经返回格式: v_sh600519="1~贵州茅台~..."
      // 移除引号和开头/结尾
      const cleanLine = line.trim();
      const match = cleanLine.match(/v_(sh|sz)(\d+)="(.+)"/);
      if (match) {
        const code = match[2];
        let dataStr = match[3];

        // 移除末尾的分号和引号
        dataStr = dataStr.replace(/";$/, '');
        const parts = dataStr.split('~');

        if (parts.length > 40) {  // 确保有足够的数据字段
          const price = parseFloat(parts[3]) || 0;
          const preClose = parseFloat(parts[4]) || 0;
          const change = price - preClose;
          const changePct = preClose > 0 ? (change / preClose) * 100 : 0;

          if (price > 0) {
            stocks[code] = {
              code,
              name: parts[1],
              price: price,
              preClose: preClose,
              change: change,
              changePct: parseFloat(changePct.toFixed(2)),
              volume: parseInt(parts[6]) || 0,
              turnover: parseFloat(parts[37]) || 0,  // 成交额字段
            };
          }
        }
      }
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 腾讯API: 成功获取 ${Object.keys(stocks).length} 只股票数据`);
    }

    return stocks;
  } catch (error) {
    console.error('Tencent API error:', error);
    return {};
  }
}

/**
 * 从新浪财经获取港股数据（备用）
 */
async function getHKFromSina(codes: string[]): Promise<Record<string, any>> {
  const stocks: Record<string, any> = {};

  // 新浪港股API格式：rt_hk01138
  const formattedCodes = codes.map(code => `rt_hk${code}`).join(',');

  try {
    const response = await fetch(`https://hq.sinajs.cn/list=${formattedCodes}`);
    const text = await response.text();

    const lines = text.split('\n').filter(line => line.includes('hq_str_rt_hk'));

    lines.forEach(line => {
      const match = line.match(/hq_str_rt_hk(\d+)="(.+)"/);
      if (match) {
        const code = match[1];
        const dataStr = match[2];
        const parts = dataStr.split(',');

        if (parts.length > 3) {
          const name = parts[0] || '';
          const price = parseFloat(parts[1]) || 0;
          const preClose = parseFloat(parts[2]) || 0;

          if (price > 0 && preClose > 0) {
            const change = price - preClose;
            const changePct = (change / preClose) * 100;

            // 数据合理性验证
            if (Math.abs(changePct) < 30) {
              stocks[code] = {
                code,
                name: name,
                price: price,
                preClose: preClose,
                change: parseFloat(change.toFixed(2)),
                changePct: parseFloat(changePct.toFixed(2)),
              };
              console.log(`📊 新浪港股 ${code}(${name}): 价格=${price}, 昨收=${preClose}, 涨跌=${change.toFixed(2)}, 涨幅=${changePct.toFixed(2)}%`);
            } else {
              console.warn(`⚠️ 新浪港股 ${code}(${name}): 计算涨幅异常 (${changePct.toFixed(2)}%), price=${price}, preClose=${preClose}`);
            }
          } else {
            console.warn(`⚠️ 新浪港股 ${code}: 价格数据无效 (price=${price}, preClose=${preClose})`);
          }
        }
      }
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 新浪港股API: 获取 ${Object.keys(stocks).length} 只港股数据`);
    }
  } catch (error) {
    console.error('❌ 新浪港股API error:', error);
  }

  return stocks;
}

/**
 * 获取港股实时行情
 * 数据源优先级: 后端API > 新浪财经 > 腾讯财经
 * 后端API使用AKShare，绕过CORS且数据更准确
 */
export async function getHKStockRealtime(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  const stocks: Record<string, any> = {};
  const remainingCodes = [...codes];

  // 1. 优先使用后端API（绕过CORS，使用AKShare）
  console.log('🔍 港股数据获取: 优先使用后端API');
  try {
    const backendStocks = await getHKStockRealtimeFromBackend(remainingCodes);

    Object.entries(backendStocks).forEach(([code, data]: [string, any]) => {
      stocks[code] = data;
      const idx = remainingCodes.indexOf(code);
      if (idx > -1) remainingCodes.splice(idx, 1);
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 后端API: 成功获取 ${Object.keys(stocks).length}/${codes.length} 只港股数据`);
    }
  } catch (error) {
    console.warn('⚠️ 后端API失败，尝试新浪财经:', error);
  }

  // 2. 备用: 新浪财经API（针对尚未获取的股票）
  if (remainingCodes.length > 0) {
    console.log(`⚠️ 还有 ${remainingCodes.length} 只港股未获取，尝试新浪财经API`);
    const sinaStocks = await getHKFromSina(remainingCodes);

    Object.entries(sinaStocks).forEach(([code, data]: [string, any]) => {
      stocks[code] = data;
      const idx = remainingCodes.indexOf(code);
      if (idx > -1) remainingCodes.splice(idx, 1);
    });

    if (Object.keys(sinaStocks).length > 0) {
      console.log(`✅ 新浪港股API: 补充获取 ${Object.keys(sinaStocks).length} 只港股数据`);
    }
  }

  // 3. 最后备用: 腾讯财经（针对尚未获取的股票）
  if (remainingCodes.length > 0) {
    console.log(`⚠️ 还有 ${remainingCodes.length} 只港股未获取，尝试腾讯财经`);
    const formattedCodes = remainingCodes.map(code => `hk${code}`).join(',');

    try {
      const response = await fetch(`${TENCENT_API}/q=${formattedCodes}`);
      const text = await response.text();

      const lines = text.split('\n').filter(line => line.includes('~'));

      lines.forEach(line => {
        const match = line.match(/v_(hk)(\d+)="(.+)"/);
        if (match) {
          const code = match[2];
          const dataStr = match[3].replace(/";$/, '');
          const parts = dataStr.split('~');

          if (parts.length > 5) {
            const name = parts[1];
            const price = parseFloat(parts[3]);
            const preClose = parseFloat(parts[4]);

            if (price > 0 && preClose > 0) {
              const calculatedChange = price - preClose;
              const calculatedPct = (calculatedChange / preClose) * 100;

              if (Math.abs(calculatedPct) < 30) {
                stocks[code] = {
                  code,
                  name: name,
                  price: price,
                  preClose: preClose,
                  change: parseFloat(calculatedChange.toFixed(2)),
                  changePct: parseFloat(calculatedPct.toFixed(2)),
                };
                const idx = remainingCodes.indexOf(code);
                if (idx > -1) remainingCodes.splice(idx, 1);
              } else {
                console.warn(`⚠️ 腾讯港股 ${code}(${name}): 计算涨幅异常 (${calculatedPct.toFixed(2)}%)`);
              }
            }
          }
        }
      });

      if (Object.keys(stocks).length > 0) {
        console.log(`✅ 腾讯港股API: 补充获取数据`);
      }
    } catch (error) {
      console.error('❌ 腾讯港股API error:', error);
    }
  }

  if (remainingCodes.length > 0) {
    console.warn(`⚠️ 以下 ${remainingCodes.length} 只港股未能获取实时数据:`, remainingCodes.join(', '));
  }

  return stocks;
}

/**
 * 获取美股实时行情
 * 优先使用后端API（绕过CORS，使用Twelve Data服务端）
 * 备用: Yahoo Finance > 腾讯财经
 */
export async function getUSStockRealtime(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  const stocks: Record<string, any> = {};
  const remainingCodes = [...codes];

  // 1. 优先使用后端API（绕过CORS，由后端处理Twelve Data调用）
  console.log('🔍 美股数据获取: 优先使用后端API');
  try {
    const backendStocks = await getUSStockRealtimeFromBackend(remainingCodes);

    Object.entries(backendStocks).forEach(([code, data]: [string, any]) => {
      stocks[code] = data;
      const idx = remainingCodes.indexOf(code);
      if (idx > -1) remainingCodes.splice(idx, 1);
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 后端API: 成功获取 ${Object.keys(stocks).length}/${codes.length} 只美股数据`);
    }
  } catch (error) {
    console.warn('⚠️ 后端API失败，尝试备用方案:', error);
  }

  // 2. 备用: Yahoo Finance（针对尚未获取的股票）
  if (remainingCodes.length > 0) {
    console.log(`⚠️ 还有 ${remainingCodes.length} 只美股未获取，尝试 Yahoo Finance`);
    const yahooStocks = await getFromYahooFinance(remainingCodes);
    Object.entries(yahooStocks).forEach(([code, data]: [string, any]) => {
      stocks[code] = data;
      const idx = remainingCodes.indexOf(code);
      if (idx > -1) remainingCodes.splice(idx, 1);
    });
  }

  // 3. 最后备用: 腾讯财经（针对尚未获取的股票）
  if (remainingCodes.length > 0) {
    console.log(`⚠️ 还有 ${remainingCodes.length} 只美股未获取，尝试腾讯财经`);
    const tencentStocks = await getFromTencentUS(remainingCodes);
    Object.entries(tencentStocks).forEach(([code, data]: [string, any]) => {
      stocks[code] = data;
      const idx = remainingCodes.indexOf(code);
      if (idx > -1) remainingCodes.splice(idx, 1);
    });
  }

  if (remainingCodes.length > 0) {
    console.warn(`⚠️ 以下 ${remainingCodes.length} 只美股未能获取实时数据:`, remainingCodes.join(', '));
  }

  return stocks;
}

/**
 * 从Yahoo Finance获取美股数据
 */
async function getFromYahooFinance(codes: string[]): Promise<Record<string, any>> {
  const stocks: Record<string, any> = {};

  // 使用Yahoo的query接口（较稳定）
  for (const code of codes) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${code}?interval=1d&range=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = data.chart?.result?.[0];
        const meta = result?.meta;
        const quote = result?.indicators?.quote?.[0];

        if (meta && quote) {
          const price = meta.regularMarketPrice || quote.close?.[quote.close.length - 1] || 0;
          const preClose = meta.previousClose || 0;

          if (price > 0) {
            const change = price - preClose;
            const changePct = preClose > 0 ? (change / preClose) * 100 : 0;

            stocks[code] = {
              code,
              name: meta.longName || code,
              price: price,
              preClose: preClose,
              change: change,
              changePct: parseFloat(changePct.toFixed(2)),
            };
          }
        }
      }
    } catch (e) {
      console.warn(`Yahoo Finance failed for ${code}:`, e);
    }
  }

  if (Object.keys(stocks).length > 0) {
    console.log(`✅ Yahoo Finance: 获取 ${Object.keys(stocks).length} 只美股数据`);
  }

  return stocks;
}

/**
 * 从腾讯财经获取美股数据（备用）
 */
async function getFromTencentUS(codes: string[]): Promise<Record<string, any>> {
  // 腾讯美股API需要加 us 前缀: usNVDA, usAAPL
  const formattedCodes = codes.map(c => `us${c}`).join(',');

  try {
    console.log(`🔍 腾讯美股API: 获取 ${codes.length} 只美股: ${codes.join(', ')}`);
    const response = await fetch(`${TENCENT_API}/q=${formattedCodes}`);
    const text = await response.text();

    const stocks: Record<string, any> = {};
    const lines = text.split('\n').filter(line => line.includes('~'));

    lines.forEach(line => {
      // 响应格式: v_usNVDA="200~英伟达~NVDA.OQ~177.82~183.34~..."
      const match = line.match(/v_us([A-Za-z.]+)="(.+)"/);
      if (match) {
        const code = match[1];
        let dataStr = match[2];
        dataStr = dataStr.replace(/";$/, '');
        const parts = dataStr.split('~');

        // 美股字段: [0]=200, [1]=中文名, [2]=代码.交易所, [3]=现价, [4]=昨收,
        //          [31]=涨跌额, [32]=涨跌幅
        if (parts.length > 32 && parts[3]) {
          const price = parseFloat(parts[3]);
          const preClose = parseFloat(parts[4]) || 0;
          const change = parseFloat(parts[31]) || 0;
          const changePct = parseFloat(parts[32]) || 0;

          if (price > 0) {
            stocks[code] = {
              code,
              name: parts[1] || code,
              price: price,
              preClose: preClose,
              change: change,
              changePct: changePct,
            };
            console.log(`✅ 腾讯美股 ${code}: 价格=${price}, 涨跌=${changePct}%`);
          }
        }
      }
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 腾讯美股API: 获取 ${Object.keys(stocks).length} 只股票`);
    } else {
      console.warn(`⚠️ 腾讯美股API: 未获取到有效数据`);
    }

    return stocks;
  } catch (error) {
    console.error('❌ 腾讯美股API error:', error);
    return {};
  }
}

/**
 * 更新股票价格到mock数据
 */
export async function updateStockPrices(market: string, codes: string[]): Promise<void> {
  try {
    let realtimeData: Record<string, any> = {};

    if (market === 'HK') {
      realtimeData = await getHKStockRealtime(codes);
    } else {
      realtimeData = await getAStockRealtime(codes);
    }

    // 将实时价格更新到 localStorage
    const priceCache = JSON.parse(localStorage.getItem('luming_price_cache') || '{}');

    Object.entries(realtimeData).forEach(([code, data]) => {
      priceCache[`${market}_${code}`] = {
        price: data.price,
        changePct: data.changePct,
        timestamp: Date.now()
      };
    });

    localStorage.setItem('luming_price_cache', JSON.stringify(priceCache));
    console.log(`Updated ${Object.keys(realtimeData).length} stock prices from Tencent`);

  } catch (error) {
    console.error('Failed to update prices from Tencent:', error);
  }
}

/**
 * 获取缓存的实时价格
 */
export function getCachedPrices(): Record<string, {price: number; changePct: number}> {
  try {
    const cache = JSON.parse(localStorage.getItem('luming_price_cache') || '{}');

    // 清理5分钟前的缓存
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    Object.keys(cache).forEach(key => {
      if (cache[key].timestamp && now - cache[key].timestamp > FIVE_MINUTES) {
        delete cache[key];
      }
    });

    localStorage.setItem('luming_price_cache', JSON.stringify(cache));
    return cache;

  } catch (error) {
    return {};
  }
}

/**
 * 从新浪财经获取数据（备用方案）
 * 新浪财经API通常更稳定，支持CORS
 */
async function getFromSina(codes: string[]): Promise<Record<string, any>> {
  const formattedCodes = codes.map(code => {
    const market = code.startsWith('6') ? 'sh' : 'sz';
    return `${market}${code}`;
  }).join(',');

  try {
    const response = await fetch(`https://hq.sinajs.cn/list=${formattedCodes}`);
    const text = await response.text();

    const stocks: Record<string, any> = {};
    const lines = text.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const match = line.match(/var hq_str_(.+)="(.+)"/);
      if (match) {
        const code = match[1].replace(/^sh|sz/, '');
        const data = match[2].split(',');

        if (data.length > 30 && data[0]) {
          const name = data[0];
          const preClose = parseFloat(data[2]) || 0;
          const price = parseFloat(data[3]) || 0;

          if (price > 0 && name) {
            const change = price - preClose;
            const changePct = preClose > 0 ? (change / preClose) * 100 : 0;

            stocks[code] = {
              code,
              name: name,
              price: price,
              preClose: preClose,
              change: change,
              changePct: parseFloat(changePct.toFixed(2)),
              volume: parseInt(data[8]) || 0,
              turnover: parseFloat(data[9]) || 0,
            };
          }
        }
      }
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 新浪API: 成功获取 ${Object.keys(stocks).length} 只股票数据`);
    }

    return stocks;
  } catch (error) {
    console.error('Sina API error:', error);
    return {};
  }
}

/**
 * 优化的A股实时行情获取 - 优先腾讯财经，失败则使用新浪财经
 */
export async function getAStockRealtimeOptimized(codes: string[]): Promise<Record<string, any>> {
  if (codes.length === 0) return {};

  // 首先尝试腾讯财经
  const formattedCodes = codes.map(code => {
    const market = code.startsWith('6') ? 'sh' : 'sz';
    return `${market}${code}`;
  }).join(',');

  const stocks: Record<string, any> = {};

  // 尝试腾讯财经
  try {
    const response = await fetch(`${TENCENT_API}/q=${formattedCodes}`);
    const text = await response.text();

    const lines = text.split('\n').filter(line => line.includes('~'));

    lines.forEach(line => {
      const cleanLine = line.trim();
      const match = cleanLine.match(/v_(sh|sz)(\d+)="(.+)"/);
      if (match) {
        const code = match[2];
        let dataStr = match[3];
        dataStr = dataStr.replace(/";$/, '');
        const parts = dataStr.split('~');

        if (parts.length > 40) {
          const price = parseFloat(parts[3]) || 0;
          const preClose = parseFloat(parts[4]) || 0;

          if (price > 0) {
            const change = price - preClose;
            const changePct = preClose > 0 ? (change / preClose) * 100 : 0;

            stocks[code] = {
              code,
              name: parts[1],
              price: price,
              preClose: preClose,
              change: change,
              changePct: parseFloat(changePct.toFixed(2)),
              volume: parseInt(parts[6]) || 0,
              turnover: parseFloat(parts[37]) || 0,
            };
          }
        }
      }
    });

    if (Object.keys(stocks).length > 0) {
      console.log(`✅ 腾讯API: 获取 ${Object.keys(stocks).length} 只股票`);
    }
  } catch (error) {
    console.error('Tencent API error:', error);
  }

  // 如果腾讯财经数据不足，尝试新浪财经
  if (Object.keys(stocks).length < codes.length * 0.5) {
    console.log('⚠️ 腾讯API数据不足，尝试新浪财经API');
    const sinaStocks = await getFromSina(codes);
    // 合并数据，新浪的数据补充缺失部分
    Object.keys(sinaStocks).forEach(code => {
      if (!stocks[code]) {
        stocks[code] = sinaStocks[code];
      }
    });
  }

  return stocks;
}

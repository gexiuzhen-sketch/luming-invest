/**
 * 技术指标计算库
 * 支持BOLL、OBV、KDJ等常用技术指标
 */

export interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 布林带 (BOLL)
 * @param data K线数据
 * @param period 周期，默认20
 * @param multiplier 标准差倍数，默认2
 */
export function calculateBOLL(data: KLineData[], period: number = 20, multiplier: number = 2) {
  if (data.length < period) {
    return {
      upper: [],
      middle: [],
      lower: [],
    };
  }

  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map(d => d.close);

    // 计算中轨（MA）
    const ma = closes.reduce((sum, val) => sum + val, 0) / period;

    // 计算标准差
    const squaredDiffs = closes.map(val => Math.pow(val - ma, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
    const stdDev = Math.sqrt(variance);

    // 计算上下轨
    upper.push(ma + multiplier * stdDev);
    middle.push(ma);
    lower.push(ma - multiplier * stdDev);
  }

  return { upper, middle, lower };
}

/**
 * 能量潮 (OBV - On Balance Volume)
 */
export function calculateOBV(data: KLineData[]): number[] {
  const obv: number[] = [0];

  for (let i = 1; i < data.length; i++) {
    const today = data[i];
    const yesterday = data[i - 1];

    let obvChange = 0;
    if (today.close > yesterday.close) {
      obvChange = today.volume;
    } else if (today.close < yesterday.close) {
      obvChange = -today.volume;
    }

    obv.push(obv[i - 1] + obvChange);
  }

  return obv;
}

/**
 * 随机指标 (KDJ)
 * @param data K线数据
 * @param n K周期，默认9
 */
export function calculateKDJ(data: KLineData[], n: number = 9) {
  if (data.length < n + 1) {
    return { k: [], d: [], j: [] };
  }

  const k: number[] = [];
  const d: number[] = [];
  const j: number[] = [];

  let prevK = 50;
  let prevD = 50;

  for (let i = n - 1; i < data.length; i++) {
    const slice = data.slice(i - n + 1, i + 1);

    // 计算RSV
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;

    const rsv = high === low ? 100 : ((close - low) / (high - low)) * 100;

    // 计算K值
    const currentK = (2 / 3) * prevK + (1 / 3) * rsv;

    // 计算D值
    const currentD = (2 / 3) * prevD + (1 / 3) * currentK;

    // 计算J值
    const currentJ = 3 * currentK - 2 * currentD;

    k.push(Number(currentK.toFixed(2)));
    d.push(Number(currentD.toFixed(2)));
    j.push(Number(currentJ.toFixed(2)));

    prevK = currentK;
    prevD = currentD;
  }

  return { k, d, j };
}

/**
 * 移动平均线 (MA)
 */
export function calculateMA(data: KLineData[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const ma: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, d) => sum + d.close, 0) / period;
    ma.push(Number(avg.toFixed(2)));
  }

  return ma;
}

/**
 * 相对强弱指标 (RSI)
 */
export function calculateRSI(data: KLineData[], period: number = 14): number[] {
  if (data.length < period + 1) {
    return [];
  }

  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  // 初始平均涨跌幅
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 计算后续RSI
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;

    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const currentRSI = 100 - (100 / (1 + rs));
    rsi.push(Number(currentRSI.toFixed(2)));
  }

  return rsi;
}

/**
 * 成交量加权平均价 (VWAP)
 */
export function calculateVWAP(data: KLineData[]): number[] {
  const vwap: number[] = [];
  let cumulativeTPV = 0;  // 累计典型价格 × 成交量
  let cumulativeVolume = 0;

  for (const candle of data) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    vwap.push(Number((cumulativeTPV / cumulativeVolume).toFixed(2)));
  }

  return vwap;
}

/**
 * MACD指标
 */
export function calculateMACD(data: KLineData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  // 计算EMA
  const ema = (data: number[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const result: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
    }

    return result;
  };

  const closes = data.map(d => d.close);

  // 计算快线和慢线
  const emaFast = ema(closes, fastPeriod);
  const emaSlow = ema(closes, slowPeriod);

  // 计算DIF线
  const dif: number[] = [];
  for (let i = slowPeriod - 1; i < data.length; i++) {
    dif.push(emaFast[i] - emaSlow[i]);
  }

  // 计算DEA线（信号线）
  const dea = ema(dif, signalPeriod);

  // 计算MACD柱状图
  const macd: number[] = [];
  for (let i = 0; i < dif.length; i++) {
    macd.push(Number((2 * (dif[i] - dea[i + signalPeriod - 1] || 0)).toFixed(4)));
  }

  return {
    dif: dif.slice(signalPeriod - 1),
    dea: dea.slice(signalPeriod - 1),
    macd,
  };
}

/**
 * 获取技术指标信号
 */
export function getTechnicalSignal(data: KLineData[]): {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;  // 0-100
  reasons: string[];
} {
  if (data.length < 20) {
    return {
      signal: 'neutral',
      strength: 0,
      reasons: ['数据不足'],
    };
  }

  const reasons: string[] = [];
  let buyScore = 0;
  let sellScore = 0;

  // 1. RSI判断
  const rsi = calculateRSI(data);
  if (rsi.length > 0) {
    const latestRSI = rsi[rsi.length - 1];
    if (latestRSI < 30) {
      buyScore += 25;
      reasons.push(`RSI超卖(${latestRSI.toFixed(1)})`);
    } else if (latestRSI > 70) {
      sellScore += 25;
      reasons.push(`RSI超买(${latestRSI.toFixed(1)})`);
    }
  }

  // 2. KDJ判断
  const kdj = calculateKDJ(data);
  if (kdj.k.length > 0) {
    const latestK = kdj.k[kdj.k.length - 1];
    const latestD = kdj.d[kdj.d.length - 1];
    const latestJ = kdj.j[kdj.j.length - 1];

    if (latestK < 20 && latestD < 20 && latestJ < 20) {
      buyScore += 20;
      reasons.push('KDJ低位金叉信号');
    } else if (latestK > 80 && latestD > 80 && latestJ > 80) {
      sellScore += 20;
      reasons.push('KDJ高位死叉信号');
    }

    // K上穿D
    if (kdj.k.length >= 2) {
      const prevK = kdj.k[kdj.k.length - 2];
      const prevD = kdj.d[kdj.d.length - 2];
      if (prevK <= prevD && latestK > latestD && latestK < 50) {
        buyScore += 15;
        reasons.push('KDJ低位金叉');
      }
      if (prevK >= prevD && latestK < latestD && latestK > 50) {
        sellScore += 15;
        reasons.push('KDJ高位死叉');
      }
    }
  }

  // 3. 布林带判断
  const boll = calculateBOLL(data);
  if (boll.lower.length > 0) {
    const latestClose = data[data.length - 1].close;
    const latestLower = boll.lower[boll.lower.length - 1];
    const latestUpper = boll.upper[boll.upper.length - 1];

    if (latestClose <= latestLower * 1.01) {
      buyScore += 20;
      reasons.push('触及布林带下轨');
    } else if (latestClose >= latestUpper * 0.99) {
      sellScore += 20;
      reasons.push('触及布林带上轨');
    }
  }

  // 4. MACD判断
  const macd = calculateMACD(data);
  if (macd.dif.length >= 2 && macd.dea.length >= 2) {
    const prevDif = macd.dif[macd.dif.length - 2];
    const latestDif = macd.dif[macd.dif.length - 1];
    const prevDea = macd.dea[macd.dea.length - 2];
    const latestDea = macd.dea[macd.dea.length - 1];

    if (prevDif <= prevDea && latestDif > latestDea && latestDif < 0) {
      buyScore += 20;
      reasons.push('MACD水下金叉');
    } else if (prevDif >= prevDea && latestDif < latestDea && latestDif > 0) {
      sellScore += 20;
      reasons.push('MACD水上死叉');
    }
  }

  // 综合判断
  let signal: 'buy' | 'sell' | 'neutral';
  let strength = 0;

  if (buyScore > sellScore + 30) {
    signal = 'buy';
    strength = Math.min(100, buyScore);
  } else if (sellScore > buyScore + 30) {
    signal = 'sell';
    strength = Math.min(100, sellScore);
  } else {
    signal = 'neutral';
    strength = Math.abs(buyScore - sellScore);
  }

  return { signal, strength, reasons };
}

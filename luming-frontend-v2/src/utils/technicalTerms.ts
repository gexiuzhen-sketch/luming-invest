/**
 * 技术术语翻译工具
 * 将英文技术术语翻译成中文大白话
 */

/**
 * MACD 信号翻译
 */
export function translateMACDSignal(signal: string): string {
  const translations: Record<string, string> = {
    'golden_cross': '金叉（快线上穿慢线，可能上涨）',
    'death_cross': '死叉（快线下穿慢线，可能下跌）',
    'neutral': '中性（无明显信号）',
  };
  return translations[signal] || signal;
}

/**
 * RSI 信号翻译
 */
export function translateRSISignal(signal: string): string {
  const translations: Record<string, string> = {
    'overbought': '超买（价格可能过高，小心回调）',
    'oversold': '超卖（价格可能过低，关注反弹）',
    'neutral': '中性（正常区间）',
  };
  return translations[signal] || signal;
}

/**
 * 趋势翻译
 */
export function translateTrend(trend: string): string {
  const translations: Record<string, string> = {
    'bullish': '看涨（上涨趋势）',
    'bearish': '看跌（下跌趋势）',
    'neutral': '震荡（无明确方向）',
  };
  return translations[trend] || trend;
}

/**
 * 综合技术面分析翻译
 */
export function translateTechnicalAnalysis(analysis: any): any {
  if (!analysis) return analysis;

  return {
    ...analysis,
    trend: {
      short: translateTrend(analysis.trend?.short),
      medium: translateTrend(analysis.trend?.medium),
      long: translateTrend(analysis.trend?.long),
    },
    indicators: {
      rsi: analysis.indicators?.rsi ? {
        ...analysis.indicators.rsi,
        signal: translateRSISignal(analysis.indicators.rsi.signal),
      } : undefined,
      macd: analysis.indicators?.macd ? {
        ...analysis.indicators.macd,
        signal: translateTrend(analysis.indicators.macd.signal),
      } : undefined,
    },
  };
}

/**
 * 简化版MACD翻译（用于列表显示）
 */
export function translateMACDSimple(signal: string): string {
  const translations: Record<string, string> = {
    'golden_cross': '金叉',
    'death_cross': '死叉',
    'neutral': '中性',
  };
  return translations[signal] || signal;
}

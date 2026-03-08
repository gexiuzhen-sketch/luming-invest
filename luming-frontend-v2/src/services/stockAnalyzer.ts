/**
 * 股票分析引擎
 * 提供详细的评分逻辑和深入分析
 */

export interface StockAnalysis {
  overallScore: number;          // 综合评分 0-100
  recommendation: string;         // 买入建议
  confidence: number;             // 信心程度 0-100

  // 评分维度
  scores: {
    value: number;                // 估值评分
    growth: number;               // 成长评分
    quality: number;              // 质量评分
    technical: number;            // 技术面评分
    sentiment: number;            // 市场情绪评分
  };

  // 详细分析
  analysis: {
    valuation: ValuationAnalysis;
    growth: GrowthAnalysis;
    risk: RiskAnalysis;
    technical: TechnicalAnalysis;
    catalyst: Catalyst[];
    concerns: string[];
  };

  // 投资建议
  advice: {
    action: string;               // 操作建议
    targetPrice: number;          // 目标价
    stopLoss: number;             // 止损价
    timeFrame: string;            // 投资周期
    positionSize: string;         // 建议仓位
  };
}

export interface ValuationAnalysis {
  pe: {
    current: number;
    industry: number;
    percentile: number;
    assessment: string;
  };
  pb: {
    current: number;
    industry: number;
    percentile: number;
    assessment: string;
  };
  ps?: {
    current: number;
    industry: number;
    assessment: string;
  };
  ev?: {
    current: number;
    assessment: string;
  };
  conclusion: string;
  attractive: boolean;
}

export interface GrowthAnalysis {
  revenue: {
    current: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
    assessment: string;
  };
  profit: {
    current: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
    assessment: string;
  };
  forecast: {
    nextYear: number;
    threeYear: number;
    reliability: string;
  };
  drivers: string[];
  risks: string[];
}

export interface RiskAnalysis {
  overall: 'low' | 'medium' | 'high' | 'very_high';
  factors: {
    category: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }[];
  beta?: number;
  volatility: string;
  leverage: string;
}

export interface TechnicalAnalysis {
  trend: {
    short: 'bullish' | 'bearish' | 'neutral';
    medium: 'bullish' | 'bearish' | 'neutral';
    long: 'bullish' | 'bearish' | 'neutral';
  };
  indicators: {
    rsi?: {
      value: number;
      signal: 'overbought' | 'oversold' | 'neutral';
    };
    macd?: {
      value: number;
      signal: 'bullish' | 'bearish' | 'neutral';
      histogram: number;
    };
    ma?: {
      ma5: number;
      ma10: number;
      ma20: number;
      ma60: number;
      signal: string;
    };
    volume?: {
      trend: string;
      signal: string;
    };
  };
  support: number[];
  resistance: number[];
  pattern?: string;
}

export interface Catalyst {
  type: 'positive' | 'negative';
  timeframe: 'short' | 'medium' | 'long';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

/**
 * 分析股票并生成完整报告
 */
export function analyzeStock(stock: any): StockAnalysis {
  const overallScore = calculateOverallScore(stock);

  return {
    overallScore,
    recommendation: getRecommendation(overallScore, stock),
    confidence: calculateConfidence(stock),
    scores: calculateDimensionScores(stock),
    analysis: generateDetailedAnalysis(stock),
    advice: generateAdvice(overallScore, stock),
  };
}

/**
 * 计算综合评分
 */
function calculateOverallScore(stock: any): number {
  let score = 50; // 基础分

  // 基于已有的评分字段
  if (stock.score) {
    score = stock.score;
  }

  // 根据涨跌幅调整
  if (stock.changePct > 3) score += 5;
  else if (stock.changePct > 1) score += 2;
  else if (stock.changePct < -3) score -= 5;
  else if (stock.changePct < -1) score -= 2;

  // 根据技术指标调整
  if (stock.rsi) {
    if (stock.rsi > 70) score -= 3; // 超买
    else if (stock.rsi < 30) score += 5; // 超卖
    else if (stock.rsi >= 40 && stock.rsi <= 60) score += 2; // 健康区间
  }

  // 根据MACD调整
  if (stock.macd === 'golden_cross') score += 5;
  else if (stock.macd === 'death_cross') score -= 5;

  // 根据ROE调整
  if (stock.roe) {
    if (stock.roe > 20) score += 5;
    else if (stock.roe > 15) score += 3;
    else if (stock.roe < 10) score -= 3;
  }

  // 根据PE调整
  if (stock.pe) {
    if (stock.pe < 15) score += 3;
    else if (stock.pe > 50) score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 获取操作建议
 */
function getRecommendation(score: number, _stock: any): string {
  if (score >= 85) return '强烈买入';
  if (score >= 70) return '买入';
  if (score >= 55) return '持有';
  if (score >= 40) return '减持';
  return '卖出';
}

/**
 * 计算信心程度
 */
function calculateConfidence(stock: any): number {
  let confidence = 70; // 基础信心

  // 如果有完整数据，提高信心
  const dataPoints = [
    stock.pe, stock.roe, stock.rsi, stock.macd,
    stock.volume, stock.turnover
  ].filter(Boolean).length;

  confidence += dataPoints * 3;

  // 根据市值调整（大公司数据更可靠）
  if (stock.cap) {
    if (stock.cap.includes('万亿') || stock.cap.includes('亿')) {
      confidence += 10;
    }
  }

  return Math.max(30, Math.min(95, confidence));
}

/**
 * 计算各维度评分
 */
function calculateDimensionScores(stock: any) {
  return {
    value: calculateValueScore(stock),
    growth: calculateGrowthScore(stock),
    quality: calculateQualityScore(stock),
    technical: calculateTechnicalScore(stock),
    sentiment: calculateSentimentScore(stock),
  };
}

/**
 * 估值评分
 */
function calculateValueScore(stock: any): number {
  let score = 50;

  if (stock.pe) {
    if (stock.pe < 15) score = 85;
    else if (stock.pe < 25) score = 70;
    else if (stock.pe < 40) score = 50;
    else score = 30;
  }

  return score;
}

/**
 * 成长评分
 */
function calculateGrowthScore(stock: any): number {
  let score = 50;

  if (stock.changePct > 5) score = 85;
  else if (stock.changePct > 2) score = 70;
  else if (stock.changePct > 0) score = 55;
  else if (stock.changePct > -2) score = 40;
  else score = 25;

  return score;
}

/**
 * 质量评分
 */
function calculateQualityScore(stock: any): number {
  let score = 50;

  if (stock.roe) {
    if (stock.roe > 20) score = 85;
    else if (stock.roe > 15) score = 70;
    else if (stock.roe > 10) score = 55;
    else score = 35;
  }

  return score;
}

/**
 * 技术面评分
 */
function calculateTechnicalScore(stock: any): number {
  let score = 50;

  // RSI
  if (stock.rsi) {
    if (stock.rsi >= 40 && stock.rsi <= 60) score += 15;
    else if (stock.rsi < 30) score += 10;
    else if (stock.rsi > 70) score -= 10;
  }

  // MACD
  if (stock.macd === 'golden_cross') score += 20;
  else if (stock.macd === 'death_cross') score -= 20;

  // 趋势
  if (stock.changePct > 2) score += 10;
  else if (stock.changePct < -2) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * 市场情绪评分
 */
function calculateSentimentScore(stock: any): number {
  let score = 50;

  // 基于成交量
  if (stock.volume && stock.turnover) {
    // 活跃交易表明关注度
    score += 10;
  }

  // 基于涨跌
  if (stock.changePct > 3) score = 75;
  else if (stock.changePct < -3) score = 35;

  return Math.max(0, Math.min(100, score));
}

/**
 * 生成详细分析
 */
function generateDetailedAnalysis(stock: any) {
  return {
    valuation: generateValuationAnalysis(stock),
    growth: generateGrowthAnalysis(stock),
    risk: generateRiskAnalysis(stock),
    technical: generateTechnicalAnalysis(stock),
    catalyst: generateCatalysts(stock),
    concerns: generateConcerns(stock),
  };
}

/**
 * 估值分析
 */
function generateValuationAnalysis(stock: any): ValuationAnalysis {
  const pe = stock.pe || 0;
  let peAssessment = '估值合理';
  let pePercentile = 50;
  const peIndustry = 20;

  if (pe > 0) {
    if (pe < 15) {
      peAssessment = '估值偏低，具备安全边际';
      pePercentile = 20;
    } else if (pe < 25) {
      peAssessment = '估值合理';
      pePercentile = 50;
    } else if (pe < 40) {
      peAssessment = '估值偏高';
      pePercentile = 70;
    } else {
      peAssessment = '估值过高，注意风险';
      pePercentile = 90;
    }
  }

  return {
    pe: {
      current: pe,
      industry: peIndustry,
      percentile: pePercentile,
      assessment: peAssessment,
    },
    pb: {
      current: stock.pb || 0,
      industry: 2.5,
      percentile: 50,
      assessment: '需结合行业分析',
    },
    conclusion: pe < 20 ? '当前估值处于合理区间，具备投资价值' : '估值偏高，等待更好入场时机',
    attractive: pe < 25,
  };
}

/**
 * 成长分析
 */
function generateGrowthAnalysis(stock: any): any {
  const changePct = stock.changePct || 0;

  let trend: 'accelerating' | 'stable' | 'decelerating' = 'stable';
  if (changePct > 3) trend = 'accelerating';
  else if (changePct < -2) trend = 'decelerating';

  return {
    revenue: {
      current: changePct,
      trend,
      assessment: changePct > 0 ? '收入保持增长' : '收入增长放缓',
    },
    profit: {
      current: stock.roe || 15,
      trend,
      assessment: stock.roe > 15 ? '盈利能力强劲' : '盈利能力一般',
    },
    forecast: {
      nextYear: 20,
      threeYear: 15,
      reliability: '中等',
    },
    drivers: stock.why ? [stock.why] : ['行业景气度', '公司竞争力'],
    risks: ['市场竞争', '宏观经济', '政策变化'],
  };
}

/**
 * 风险分析
 */
function generateRiskAnalysis(stock: any): RiskAnalysis {
  const changePct = Math.abs(stock.changePct || 0);

  let overall: 'low' | 'medium' | 'high' | 'very_high' = 'medium';
  if (changePct > 5) overall = 'high';
  else if (changePct < 2) overall = 'low';

  return {
    overall,
    factors: [
      {
        category: '市场风险',
        level: changePct > 3 ? 'high' : 'medium',
        description: '股价波动风险',
      },
      {
        category: '行业风险',
        level: 'medium',
        description: '行业竞争加剧',
      },
      {
        category: '流动性风险',
        level: 'low',
        description: '流动性充足',
      },
    ],
    volatility: changePct > 3 ? '高' : changePct > 1 ? '中' : '低',
    leverage: '适中',
  };
}

/**
 * 技术分析
 */
function generateTechnicalAnalysis(stock: any): TechnicalAnalysis {
  const changePct = stock.changePct || 0;

  let shortTerm: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (changePct > 2) shortTerm = 'bullish';
  else if (changePct < -2) shortTerm = 'bearish';

  return {
    trend: {
      short: shortTerm,
      medium: 'neutral',
      long: 'neutral',
    },
    indicators: {
      rsi: stock.rsi ? {
        value: stock.rsi,
        signal: stock.rsi > 70 ? 'overbought' : stock.rsi < 30 ? 'oversold' : 'neutral',
      } : undefined,
      macd: stock.macd ? {
        value: 0,
        signal: stock.macd === 'golden_cross' ? 'bullish' : stock.macd === 'death_cross' ? 'bearish' : 'neutral',
        histogram: 0,
      } : undefined,
    },
    support: [stock.price ? stock.price * 0.95 : 0],
    resistance: [stock.price ? stock.price * 1.05 : 0],
  };
}

/**
 * 生成催化剂
 */
function generateCatalysts(stock: any): Catalyst[] {
  const catalysts: Catalyst[] = [];

  const changePct = stock.changePct || 0;

  // 基于当前表现
  if (changePct > 3) {
    catalysts.push({
      type: 'positive',
      timeframe: 'short',
      description: '股价强势上涨，可能有利好消息',
      probability: 'medium',
      impact: 'medium',
    });
  } else if (changePct < -3) {
    catalysts.push({
      type: 'negative',
      timeframe: 'short',
      description: '股价大幅下跌，可能存在利空因素',
      probability: 'medium',
      impact: 'high',
    });
  }

  // 行业因素
  catalysts.push({
    type: 'positive',
    timeframe: 'medium',
    description: stock.why || '行业景气度提升',
    probability: 'medium',
    impact: 'medium',
  });

  return catalysts;
}

/**
 * 生成风险提示
 */
function generateConcerns(stock: any): string[] {
  const concerns: string[] = [];

  const changePct = stock.changePct || 0;

  if (changePct > 5) {
    concerns.push('短期涨幅较大，注意回调风险');
  }

  if (stock.pe && stock.pe > 50) {
    concerns.push('估值偏高，注意安全边际');
  }

  if (stock.rsi && stock.rsi > 70) {
    concerns.push('技术指标显示超买，短期可能调整');
  }

  if (!stock.macd || stock.macd === 'death_cross') {
    concerns.push('MACD死叉，短期趋势偏弱');
  }

  if (concerns.length === 0) {
    concerns.push('注意市场系统性风险');
  }

  return concerns;
}

/**
 * 生成投资建议
 */
function generateAdvice(score: number, stock: any) {
  const price = stock.price || 100;
  const changePct = stock.changePct || 0;

  let action = '持有观望';
  let targetPrice = price * 1.1;
  let stopLoss = price * 0.95;

  if (score >= 70) {
    action = '建议买入';
    targetPrice = price * 1.15;
    stopLoss = price * 0.92;
  } else if (score >= 55) {
    action = '继续持有';
  } else if (score < 40) {
    action = '建议减仓';
    targetPrice = price * 0.9;
  }

  // 根据涨跌调整
  if (changePct > 5) {
    action = '等待回调';
  } else if (changePct < -5) {
    action = '关注反弹';
  }

  return {
    action,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    timeFrame: score >= 70 ? '3-6个月' : '1-3个月',
    positionSize: score >= 70 ? '20-30%' : score >= 55 ? '10-20%' : '5-10%',
  };
}

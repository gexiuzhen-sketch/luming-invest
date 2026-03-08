/**
 * 宏观因子分析
 * 用于评估市场整体环境和投资时机
 */

export interface MarketEnvironment {
  // 估值水平
  valuation: {
    pePercentile: number;      // PE百分位（历史分位）
    pbPercentile: number;      // PB百分位
    valuationLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  // 市场情绪
  sentiment: {
    newInvestors: number;      // 新增投资者数（万人）
    marginTrading: number;     // 融资余额（亿元）
    sentimentLevel: 'fear' | 'neutral' | 'greed';
    recommendation: string;
  };
  // 资金流向
  flows: {
    northBound: number;        // 北向资金净流入（亿元）
    ipoFundraising: number;    // IPO募资（亿元）
    flowDirection: 'inflow' | 'outflow' | 'neutral';
    recommendation: string;
  };
  // 综合评分
  overallScore: number;       // 0-100
  timingAdvice: string;
}

/**
 * 获取市场估值水平
 * 基于历史数据计算当前估值分位
 */
function getValuationLevel(marketPE: number, marketPB: number): MarketEnvironment['valuation'] {
  // 历史估值分位数（简化版数据）
  // 实际应用中应该从数据库获取历史百分位
  const historicalPE = {
    low: 10,
    medium: 15,
    high: 25
  };

  const historicalPB = {
    low: 1.2,
    medium: 1.8,
    high: 3.0
  };

  // 计算PE百分位（0-100）
  let pePercentile = 50;
  if (marketPE <= historicalPE.low) {
    pePercentile = 10;
  } else if (marketPE <= historicalPE.medium) {
    pePercentile = 40;
  } else if (marketPE <= historicalPE.high) {
    pePercentile = 70;
  } else {
    pePercentile = 90;
  }

  // 计算PB百分位
  let pbPercentile = 50;
  if (marketPB <= historicalPB.low) {
    pbPercentile = 10;
  } else if (marketPB <= historicalPB.medium) {
    pbPercentile = 40;
  } else if (marketPB <= historicalPB.high) {
    pbPercentile = 70;
  } else {
    pbPercentile = 90;
  }

  // 综合估值水平
  const avgPercentile = (pePercentile + pbPercentile) / 2;
  let valuationLevel: 'low' | 'medium' | 'high';
  let recommendation: string;

  if (avgPercentile < 30) {
    valuationLevel = 'low';
    recommendation = '市场估值处于历史低位，适合长期布局';
  } else if (avgPercentile < 60) {
    valuationLevel = 'medium';
    recommendation = '市场估值处于合理区间，可正常配置';
  } else {
    valuationLevel = 'high';
    recommendation = '市场估值处于历史高位，建议谨慎控制仓位';
  }

  return {
    pePercentile,
    pbPercentile,
    valuationLevel,
    recommendation
  };
}

/**
 * 获取市场情绪水平
 */
function getSentimentLevel(
  newInvestors: number,
  marginTrading: number
): MarketEnvironment['sentiment'] {
  // 新增投资者数（周度，单位：万人）
  // 历史均值约30-50万人
  let investorLevel: 'low' | 'medium' | 'high';
  if (newInvestors < 20) {
    investorLevel = 'low';
  } else if (newInvestors < 50) {
    investorLevel = 'medium';
  } else {
    investorLevel = 'high';
  }

  // 融资余额（单位：亿元）
  // 历史均值约15000亿元
  let marginLevel: 'low' | 'medium' | 'high';
  if (marginTrading < 10000) {
    marginLevel = 'low';
  } else if (marginTrading < 18000) {
    marginLevel = 'medium';
  } else {
    marginLevel = 'high';
  }

  // 综合情绪判断
  let sentimentLevel: 'fear' | 'neutral' | 'greed';
  let recommendation: string;

  if (investorLevel === 'low' && marginLevel === 'low') {
    sentimentLevel = 'fear';
    recommendation = '市场情绪低迷，往往是布局良机';
  } else if (investorLevel === 'high' && marginLevel === 'high') {
    sentimentLevel = 'greed';
    recommendation = '市场情绪高涨，需警惕回调风险';
  } else {
    sentimentLevel = 'neutral';
    recommendation = '市场情绪中性，保持正常投资节奏';
  }

  return {
    newInvestors,
    marginTrading,
    sentimentLevel,
    recommendation
  };
}

/**
 * 获取资金流向评估
 */
function getFlowDirection(
  northBound: number,
  ipoFundraising: number
): MarketEnvironment['flows'] {
  // 北向资金净流入（单位：亿元）
  // 单日流入超过50亿为强势流入
  let flowDirection: 'inflow' | 'outflow' | 'neutral';
  let recommendation: string;

  if (northBound > 50) {
    flowDirection = 'inflow';
    recommendation = '外资大幅流入，市场有望企稳回升';
  } else if (northBound < -50) {
    flowDirection = 'outflow';
    recommendation = '外资持续流出，市场承压';
  } else {
    flowDirection = 'neutral';
    recommendation = '外资进出平衡，关注个股机会';
  }

  return {
    northBound,
    ipoFundraising,
    flowDirection,
    recommendation
  };
}

/**
 * 分析市场环境
 * @param marketData 市场数据
 */
export function analyzeMarketEnvironment(marketData?: {
  marketPE?: number;
  marketPB?: number;
  newInvestors?: number;
  marginTrading?: number;
  northBound?: number;
  ipoFundraising?: number;
}): MarketEnvironment {
  // 使用模拟数据（实际应用中从API获取）
  const data = {
    marketPE: marketData?.marketPE || 16.5,
    marketPB: marketData?.marketPB || 1.8,
    newInvestors: marketData?.newInvestors || 35,
    marginTrading: marketData?.marginTrading || 15500,
    northBound: marketData?.northBound || 30,
    ipoFundraising: marketData?.ipoFundraising || 50
  };

  // 分析各维度
  const valuation = getValuationLevel(data.marketPE, data.marketPB);
  const sentiment = getSentimentLevel(data.newInvestors, data.marginTrading);
  const flows = getFlowDirection(data.northBound, data.ipoFundraising);

  // 计算综合评分（0-100）
  let score = 50;

  // 估值评分（越低越好）
  if (valuation.valuationLevel === 'low') {
    score += 20;
  } else if (valuation.valuationLevel === 'high') {
    score -= 15;
  }

  // 情绪评分（恐惧时加分，贪婪时扣分）
  if (sentiment.sentimentLevel === 'fear') {
    score += 15;
  } else if (sentiment.sentimentLevel === 'greed') {
    score -= 10;
  }

  // 资金流向评分
  if (flows.flowDirection === 'inflow') {
    score += 10;
  } else if (flows.flowDirection === 'outflow') {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  // 生成投资时机建议
  let timingAdvice: string;
  if (score >= 70) {
    timingAdvice = '⭐ 市场环境优秀，适合积极配置';
  } else if (score >= 55) {
    timingAdvice = '✓ 市场环境良好，可正常配置';
  } else if (score >= 40) {
    timingAdvice = '⚠ 市场环境一般，建议控制仓位';
  } else {
    timingAdvice = '❌ 市场环境较差，建议观望或防御';
  }

  return {
    valuation,
    sentiment,
    flows,
    overallScore: score,
    timingAdvice
  };
}

/**
 * 获取行业轮动建议
 */
export function getSectorRotationAdvice(): {
  recommended: string[];
  neutral: string[];
  avoid: string[];
  reason: string;
} {
  // 简化版轮动建议
  // 实际应用中应该基于宏观环境和市场风格动态调整
  return {
    recommended: ['消费', '医药', '科技'],
    neutral: ['金融', '新能源'],
    avoid: ['周期性'],
    reason: '当前市场环境下，消费和医药等防御性行业表现较好，科技板块有政策支持'
  };
}

/**
 * 计算投资组合的宏观暴露
 */
export function calculateMacroExposure(
  sectors: string[]
): {
  defensive: number;  // 防御性行业占比
  cyclical: number;   // 周期性行业占比
  growth: number;    // 成长性行业占比
  advice: string;
} {
  const defensiveSectors = ['消费', '医药', '公用事业', '电信'];
  const cyclicalSectors = ['金融', '地产', '周期性'];
  const growthSectors = ['科技', '新能源', '半导体'];

  let defensive = 0;
  let cyclical = 0;
  let growth = 0;

  sectors.forEach(sector => {
    if (defensiveSectors.some(s => sector.includes(s))) {
      defensive += 1;
    } else if (cyclicalSectors.some(s => sector.includes(s))) {
      cyclical += 1;
    } else if (growthSectors.some(s => sector.includes(s))) {
      growth += 1;
    }
  });

  const total = sectors.length || 1;
  defensive = (defensive / total) * 100;
  cyclical = (cyclical / total) * 100;
  growth = (growth / total) * 100;

  let advice: string;
  if (defensive > 50) {
    advice = '持仓偏防御，适合震荡或下跌市场';
  } else if (growth > 50) {
    advice = '持仓偏成长，适合牛市或上涨市场';
  } else if (cyclical > 40) {
    advice = '持仓偏周期，需要密切关注宏观经济变化';
  } else {
    advice = '持仓配置较为均衡';
  }

  return {
    defensive,
    cyclical,
    growth,
    advice
  };
}

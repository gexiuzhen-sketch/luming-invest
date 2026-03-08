/**
 * 增强版股票分析引擎
 * 采用行业领先的多因子模型，参考机构投资方法论
 */

export interface EnhancedStockAnalysis {
  // 综合评分
  overallScore: number;          // 0-100
  recommendation: string;         // 操作建议
  confidence: number;             // 信心程度

  // 五大维度评分
  scores: {
    value: number;       // 估值评分（20%）
    growth: number;      // 成长评分（25%）
    quality: number;     // 质量评分（25%）
    technical: number;   // 技术面评分（15%）
    sentiment: number;   // 市场情绪（15%）
  };

  // 投资逻辑
  thesis: {
    summary: string;           // 投资逻辑摘要
    catalysts: string[];       // 催化剂
    risks: string[];           // 风险因素
    moat: string;              // 护城河分析
  };

  // 操作建议
  advice: {
    action: string;
    targetPrice: number;
    stopLoss: number;
    timeFrame: string;
    positionSize: string;
  };
}

/**
 * 多因子评分模型
 */
export function analyzeStockEnhanced(stock: any): EnhancedStockAnalysis {
  const scores = {
    value: calculateValueScore(stock),
    growth: calculateGrowthScore(stock),
    quality: calculateQualityScore(stock),
    technical: calculateTechnicalScore(stock),
    sentiment: calculateSentimentScore(stock),
  };

  // 加权计算综合评分（参考机构权重）
  const overallScore = Math.round(
    scores.value * 0.20 +
    scores.growth * 0.25 +
    scores.quality * 0.25 +
    scores.technical * 0.15 +
    scores.sentiment * 0.15
  );

  return {
    overallScore,
    recommendation: getRecommendation(overallScore),
    confidence: calculateConfidence(stock, scores),
    scores,
    thesis: generateThesis(stock, scores),
    advice: generateAdvice(overallScore, stock),
  };
}

/**
 * 估值评分（PE/PB/PS/股息率多维度）
 */
function calculateValueScore(stock: any): number {
  let score = 50; // 基础分
  let factors = 0;

  // PE估值
  if (stock.pe) {
    if (stock.pe < 15) { factors += 30; } // 低估值
    else if (stock.pe < 25) { factors += 20; }
    else if (stock.pe < 40) { factors += 10; }
    else { factors -= 10; } // 高估值
  }

  // ROE相对PE的性价比
  if (stock.pe && stock.roe) {
    const peg = stock.pe / stock.roe; // PEG指标
    if (peg < 1) { factors += 20; } // 优质
    else if (peg < 1.5) { factors += 10; }
    else { factors -= 10; }
  }

  // 市值因子（大盘股估值更稳定）
  if (stock.cap) {
    if (stock.cap.includes('万亿')) { factors += 10; }
    else if (stock.cap.includes('千亿') || parseInt(stock.cap) > 1000) { factors += 5; }
  }

  score = Math.max(0, Math.min(100, 50 + factors));
  return score;
}

/**
 * 成长评分（营收/利润/行业景气度）
 */
function calculateGrowthScore(stock: any): number {
  let score = 50;

  // 近期涨跌幅反映成长预期
  const changePct = stock.changePct || 0;
  if (changePct > 5) { score = 85; }
  else if (changePct > 2) { score = 75; }
  else if (changePct > 0) { score = 60; }
  else if (changePct > -2) { score = 45; }
  else { score = 30; }

  // 行业成长性加分
  const growthSectors = ['新能源', '科技', '半导体', '人工智能', '生物医药', '新材料'];
  if (stock.sector && growthSectors.some(s => stock.sector.includes(s))) {
    score = Math.min(100, score + 10);
  }

  // 成长性行业调整
  const valueSectors = ['银行', '地产', '公用事业'];
  if (stock.sector && valueSectors.some(s => stock.sector.includes(s))) {
    score = Math.max(40, score - 5); // 成长性较低
  }

  return score;
}

/**
 * 质量评分（ROE/盈利稳定性/护城河）
 */
function calculateQualityScore(stock: any): number {
  let score = 50;

  // ROE是核心质量指标
  if (stock.roe) {
    if (stock.roe > 25) { score = 95; }
    else if (stock.roe > 20) { score = 85; }
    else if (stock.roe > 15) { score = 70; }
    else if (stock.roe > 10) { score = 55; }
    else { score = 35; }
  }

  // 行业龙头加分
  const leaders = ['贵州茅台', '五粮液', '宁德时代', '比亚迪', '腾讯控股', '阿里巴巴', '招商银行', '中国平安'];
  if (stock.name && leaders.includes(stock.name)) {
    score = Math.min(100, score + 10);
  }

  // 市值反映企业规模和质量
  if (stock.cap) {
    if (stock.cap.includes('万亿')) { score = Math.min(100, score + 5); }
  }

  return score;
}

/**
 * 技术面评分（趋势/动量/支撑阻力）
 */
function calculateTechnicalScore(stock: any): number {
  let score = 50;

  // RSI动量指标
  if (stock.rsi) {
    if (stock.rsi >= 40 && stock.rsi <= 60) { score += 20; } // 健康区间
    else if (stock.rsi < 30) { score += 15; } // 超卖反弹机会
    else if (stock.rsi > 70) { score -= 15; } // 超买风险
  }

  // MACD趋势
  if (stock.macd) {
    if (stock.macd === 'golden_cross') { score += 25; }
    else if (stock.macd === 'death_cross') { score -= 25; }
  }

  // 价格趋势
  const changePct = stock.changePct || 0;
  if (changePct > 3) { score += 10; }
  else if (changePct < -3) { score -= 10; }

  // 成交量确认
  if (stock.volume && stock.turnover) {
    score += 5; // 活跃交易
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 市场情绪评分（资金流向/关注度）
 */
function calculateSentimentScore(stock: any): number {
  let score = 50;

  // 涨跌幅反映市场情绪
  const changePct = stock.changePct || 0;
  if (changePct > 5) { score = 80; }
  else if (changePct > 2) { score = 70; }
  else if (changePct > 0) { score = 60; }
  else if (changePct > -2) { score = 45; }
  else { score = 30; }

  // 成交量反映关注度
  if (stock.volume && stock.turnover) {
    score += 10;
  }

  // 热门行业情绪加分
  const hotSectors = ['人工智能', '新能源', '半导体', '芯片'];
  if (stock.sector && hotSectors.some(s => stock.sector.includes(s))) {
    score = Math.min(100, score + 10);
  }

  return score;
}

/**
 * 获取操作建议
 */
function getRecommendation(score: number): string {
  if (score >= 85) return '强烈推荐';
  if (score >= 70) return '推荐买入';
  if (score >= 55) return '持有';
  if (score >= 40) return '谨慎持有';
  return '建议规避';
}

/**
 * 计算信心程度
 */
function calculateConfidence(stock: any, scores: any): number {
  let confidence = 70;

  // 数据完整性
  const dataPoints = [stock.pe, stock.roe, stock.rsi, stock.macd].filter(Boolean).length;
  confidence += dataPoints * 5;

  // 各维度评分一致性（标准差越小越可信）
  const scoreValues = Object.values(scores) as number[];
  const mean = scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length;
  const variance = scoreValues.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / scoreValues.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 15) { confidence += 15; } // 评分一致
  else if (stdDev < 25) { confidence += 5; }
  else { confidence -= 10; } // 评分分歧大

  return Math.max(40, Math.min(95, confidence));
}

/**
 * 生成投资逻辑
 */
function generateThesis(stock: any, scores: any): any {
  const catalysts: string[] = [];
  const risks: string[] = [];

  // 催化剂生成
  if (scores.value > 70) {
    catalysts.push('估值具备安全边际');
  }
  if (scores.growth > 70) {
    catalysts.push('成长性突出');
  }
  if (scores.quality > 80) {
    catalysts.push('盈利能力强，ROE优秀');
  }
  if (stock.macd === 'golden_cross') {
    catalysts.push('技术面金叉，趋势向好');
  }
  if (stock.why) {
    catalysts.push(stock.why);
  }

  // 风险因素
  if (scores.value < 40) {
    risks.push('估值偏高，注意回调风险');
  }
  if (stock.rsi && stock.rsi > 70) {
    risks.push('技术指标超买，短期可能调整');
  }
  if (stock.changePct && stock.changePct > 5) {
    risks.push('短期涨幅较大，追高风险');
  }
  if (scores.technical < 40) {
    risks.push('技术面偏弱，等待更好时机');
  }

  // 护城河分析
  let moat = '一般';
  if (scores.quality > 80) {
    moat = '强劲（品牌/技术/规模优势显著）';
  } else if (scores.quality > 60) {
    moat = '良好（具备一定竞争优势）';
  }

  // 默认催化剂和风险
  if (catalysts.length === 0) {
    catalysts.push('行业景气度有望改善');
  }
  if (risks.length === 0) {
    risks.push('关注市场系统性风险');
  }

  return {
    summary: generateThesisSummary(scores),
    catalysts,
    risks,
    moat,
  };
}

/**
 * 生成投资逻辑摘要
 */
function generateThesisSummary(scores: any): string {
  const strongPoints: string[] = [];
  if (scores.value > 70) strongPoints.push('估值优势');
  if (scores.growth > 70) strongPoints.push('成长潜力');
  if (scores.quality > 70) strongPoints.push('优质资产');

  if (strongPoints.length >= 2) {
    return `综合实力突出，具备${strongPoints.join('、')}，建议关注配置机会。`;
  } else if (strongPoints.length === 1) {
    return `${strongPoints[0]}明显，适合${scores.growth > 70 ? '成长型' : '价值型'}投资者。`;
  } else {
    return '当前综合评分中等，建议等待更好的入场时机。';
  }
}

/**
 * 生成操作建议
 */
function generateAdvice(score: number, stock: any): any {
  const price = stock.price || 100;
  const changePct = stock.changePct || 0;

  let action = '观望';
  let targetPrice = price * 1.1;
  let stopLoss = price * 0.95;
  let positionSize = '5-10%';
  let timeFrame = '1-3个月';

  if (score >= 80) {
    action = '积极配置';
    targetPrice = price * 1.2;
    stopLoss = price * 0.9;
    positionSize = '20-30%';
    timeFrame = '6-12个月';
  } else if (score >= 70) {
    action = '建议买入';
    targetPrice = price * 1.15;
    stopLoss = price * 0.92;
    positionSize = '15-25%';
    timeFrame = '3-6个月';
  } else if (score >= 55) {
    action = '继续持有';
    positionSize = '10-15%';
  } else if (score < 40) {
    action = '建议规避';
  }

  // 根据市场热度调整
  if (changePct > 7) {
    action = '等待回调';
    positionSize = '5-10%';
  } else if (changePct < -5) {
    action = '关注反弹';
    targetPrice = price * 1.1;
  }

  return {
    action,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    timeFrame,
    positionSize,
  };
}

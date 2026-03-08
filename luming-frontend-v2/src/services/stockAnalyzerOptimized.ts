/**
 * 优化版股票分析引擎 v2.0
 * 新增：
 * - 动态权重（根据市场环境调整）
 * - 波动率风险调整
 * - 行业相对强度
 * - 动量与反转因子
 * - ATR止损止盈
 * - 分批建仓策略
 */

export interface OptimizedStockAnalysis {
  // 综合评分
  overallScore: number;          // 0-100
  recommendation: string;         // 操作建议
  confidence: number;             // 信心程度
  riskLevel: 'low' | 'medium' | 'high';  // 风险等级

  // 六大维度评分（新增波动率维度）
  scores: {
    value: number;       // 估值评分（18%）
    growth: number;      // 成长评分（22%）
    quality: number;     // 质量评分（22%）
    technical: number;   // 技术面评分（18%）
    sentiment: number;   // 市场情绪（10%）
    volatility: number;  // 波动率风险（10%）新增
  };

  // 市场环境
  marketRegime: {
    trend: 'bull' | 'bear' | 'neutral';  // 市场趋势
    volatility: 'low' | 'medium' | 'high';  // 波动率水平
  };

  // 投资逻辑
  thesis: {
    summary: string;           // 投资逻辑摘要
    catalysts: string[];       // 催化剂
    risks: string[];           // 风险因素
    moat: string;              // 护城河分析
  };

  // 优化的操作建议
  advice: {
    action: string;
    entryStrategy: string;     // 入场策略（新增）
    targetPrice: number;
    stopLoss: number;
    trailingStop: number;      // 移动止损（新增）
    timeFrame: string;
    positionSize: string;
    pyramidLevels: number[];   // 分批建仓位（新增）
  };
}

// ===================== 全局市场环境缓存 =====================
let cachedMarketRegime: { trend: 'bull' | 'bear' | 'neutral'; volatility: 'low' | 'medium' | 'high' } | null = null;
let marketRegimeTimestamp = 0;
const MARKET_REGIME_TTL = 3600_000; // 1小时

/**
 * 获取全局市场环境（从后端 /api/financial/market-regime）
 * Session 级缓存1小时
 */
async function fetchMarketRegime(): Promise<{ trend: 'bull' | 'bear' | 'neutral'; volatility: 'low' | 'medium' | 'high' }> {
  if (cachedMarketRegime && Date.now() - marketRegimeTimestamp < MARKET_REGIME_TTL) {
    return cachedMarketRegime;
  }
  try {
    const resp = await fetch('/api/financial/market-regime');
    if (resp.ok) {
      const data = await resp.json();
      cachedMarketRegime = {
        trend: data.trend || 'neutral',
        volatility: data.volatility || 'medium',
      };
      marketRegimeTimestamp = Date.now();
      console.log(`🌍 市场环境: 趋势=${cachedMarketRegime.trend}, 波动率=${cachedMarketRegime.volatility}, MA20=${data.ma20}`);
      return cachedMarketRegime;
    }
  } catch {
    console.warn('⚠️ 获取市场环境失败，使用默认值');
  }
  return { trend: 'neutral', volatility: 'medium' };
}

/**
 * 市场环境分析（同步版本，使用缓存或 fallback）
 */
function analyzeMarketRegime(stock: any): { trend: 'bull' | 'bear' | 'neutral'; volatility: 'low' | 'medium' | 'high' } {
  // 优先使用缓存的全局市场环境
  if (cachedMarketRegime && Date.now() - marketRegimeTimestamp < MARKET_REGIME_TTL) {
    return cachedMarketRegime;
  }

  // Fallback：基于个股涨跌幅判断（兼容旧逻辑）
  const changePct = Math.abs(stock.changePct || 0);
  const trend: 'bull' | 'bear' | 'neutral' = (stock.changePct || 0) > 1 ? 'bull' :
                (stock.changePct || 0) < -1 ? 'bear' : 'neutral';
  const volatility: 'low' | 'medium' | 'high' = changePct > 5 ? 'high' : changePct > 2 ? 'medium' : 'low';

  return { trend, volatility };
}

// 启动时预加载市场环境
fetchMarketRegime().catch(() => {});

/**
 * 动态权重分配
 * 根据市场环境调整各因子权重
 */
function getDynamicWeights(marketRegime: any) {
  // 基础权重（和 = 1.0）
  let weights = {
    value: 0.18,
    growth: 0.22,
    quality: 0.22,
    technical: 0.18,
    sentiment: 0.10,
    volatility: 0.10
  };

  // 牛市：增加成长和情绪权重
  if (marketRegime.trend === 'bull') {
    weights = { ...weights, growth: 0.28, sentiment: 0.15, value: 0.12 };
  }
  // 熊市：增加质量和估值权重
  else if (marketRegime.trend === 'bear') {
    weights = { ...weights, quality: 0.28, value: 0.25, growth: 0.12, sentiment: 0.05 };
  }
  // 高波动：增加技术面和波动率权重
  if (marketRegime.volatility === 'high') {
    weights = { ...weights, technical: 0.25, volatility: 0.15, value: 0.15 };
  }

  // 归一化：确保权重之和严格等于 1.0
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const keys = Object.keys(weights) as (keyof typeof weights)[];
  keys.forEach(k => { weights[k] = weights[k] / total; });

  return weights;
}

/**
 * 优化版多因子评分模型
 */
export function analyzeStockOptimized(stock: any): OptimizedStockAnalysis {
  // 分析市场环境
  const marketRegime = analyzeMarketRegime(stock);

  // 获取动态权重
  const weights = getDynamicWeights(marketRegime);

  // 计算各维度评分
  const scores = {
    value: calculateValueScoreV2(stock),
    growth: calculateGrowthScoreV2(stock),
    quality: calculateQualityScoreV2(stock),
    technical: calculateTechnicalScoreV2(stock),
    sentiment: calculateSentimentScoreV2(stock),
    volatility: calculateVolatilityScore(stock),  // 新增
  };

  // 使用动态权重计算综合评分
  const overallScore = Math.round(
    scores.value * weights.value +
    scores.growth * weights.growth +
    scores.quality * weights.quality +
    scores.technical * weights.technical +
    scores.sentiment * weights.sentiment +
    scores.volatility * weights.volatility
  );

  // 确保评分不超过100分
  const cappedScore = Math.min(100, overallScore);

  // 计算风险等级
  const riskLevel = calculateRiskLevel(scores);

  return {
    overallScore: cappedScore,
    recommendation: getRecommendationV2(cappedScore, riskLevel),
    confidence: calculateConfidenceV2(stock, scores),
    riskLevel,
    scores,
    marketRegime,
    thesis: generateThesisV2(stock, scores, marketRegime),
    advice: generateAdviceV2(cappedScore, stock, scores, marketRegime),
  };
}

// ===================== 行业基准PE（用于相对估值） =====================
const SECTOR_PE_BENCHMARKS: Record<string, { low: number; median: number; high: number }> = {
  '银行':     { low: 4, median: 6,  high: 10 },
  '保险':     { low: 6, median: 10, high: 18 },
  '证券':     { low: 10, median: 18, high: 30 },
  '金融':     { low: 5, median: 10, high: 20 },
  '非银金融': { low: 8, median: 15, high: 25 },
  '食品饮料': { low: 15, median: 25, high: 40 },
  '家用电器': { low: 10, median: 18, high: 30 },
  '电力设备': { low: 15, median: 30, high: 50 },
  '医药':     { low: 15, median: 30, high: 55 },
  '计算机':   { low: 25, median: 45, high: 80 },
  '电子':     { low: 15, median: 30, high: 55 },
  '半导体':   { low: 20, median: 40, high: 70 },
  '汽车':     { low: 10, median: 20, high: 35 },
  '零售':     { low: 15, median: 25, high: 40 },
  '传媒':     { low: 15, median: 25, high: 45 },
  '通信':     { low: 10, median: 20, high: 35 },
  '交运':     { low: 8, median: 15, high: 25 },
};

function getSectorPEBenchmark(sector: string): { low: number; median: number; high: number } {
  if (!sector) return { low: 10, median: 20, high: 40 };
  for (const [key, val] of Object.entries(SECTOR_PE_BENCHMARKS)) {
    if (sector.includes(key)) return val;
  }
  return { low: 10, median: 20, high: 40 }; // 默认
}

/**
 * 估值评分 v2.1
 * 改进：行业相对PE + 亏损股处理 + 真实股息率 + PEG增速截断
 */
function calculateValueScoreV2(stock: any): number {
  let score = 0;
  let totalWeight = 0;

  // ---- PE行业相对估值（30%）----
  const sectorBench = getSectorPEBenchmark(stock.sector);
  if (stock.pe && stock.pe > 0) {
    let peScore: number;
    if (stock.pe <= sectorBench.low) { peScore = 95; }                    // 行业低位
    else if (stock.pe <= sectorBench.median * 0.8) { peScore = 82; }      // 低于中位数
    else if (stock.pe <= sectorBench.median * 1.2) { peScore = 62; }      // 接近中位数
    else if (stock.pe <= sectorBench.high) { peScore = 42; }              // 偏高
    else { peScore = 20; }                                                 // 高估
    score += peScore * 0.30;
    totalWeight += 0.30;
  } else if (stock.pe === null || stock.pe === undefined) {
    // 亏损股（PE=null）：估值不可评，给低分
    score += 15 * 0.30;
    totalWeight += 0.30;
  }

  // ---- PB估值（20%）----
  if (stock.pb && stock.pb > 0) {
    let pbScore: number;
    if (stock.pb < 1) { pbScore = 92; }       // 破净
    else if (stock.pb < 2) { pbScore = 78; }
    else if (stock.pb < 4) { pbScore = 58; }
    else if (stock.pb < 8) { pbScore = 38; }
    else { pbScore = 18; }                     // PB>8 严重高估
    score += pbScore * 0.20;
    totalWeight += 0.20;
  }

  // ---- PEG指标（20%）----
  // 增速截断到 [-100, 200]
  const rawGrowth = stock.netIncomeGrowthYoy ?? null;
  const growthRate = rawGrowth !== null
    ? Math.max(-100, Math.min(200, rawGrowth))
    : (stock.roe || 12); // fallback 用ROE替代
  if (stock.pe && stock.pe > 0 && growthRate > 0) {
    const peg = stock.pe / growthRate;
    let pegScore: number;
    if (peg < 0.5) { pegScore = 95; }
    else if (peg < 0.8) { pegScore = 80; }
    else if (peg < 1.2) { pegScore = 62; }
    else if (peg < 2) { pegScore = 42; }
    else { pegScore = 20; }
    score += pegScore * 0.20;
    totalWeight += 0.20;
  } else if (growthRate <= 0 && stock.pe && stock.pe > 0) {
    // 负增速：PEG不适用，给低分
    score += 25 * 0.20;
    totalWeight += 0.20;
  }

  // ---- 股息率（15%）----
  if (stock.dividendYield !== undefined && stock.dividendYield !== null && stock.dividendYield > 0) {
    let dyScore: number;
    if (stock.dividendYield > 5) { dyScore = 95; }
    else if (stock.dividendYield > 4) { dyScore = 85; }
    else if (stock.dividendYield > 3) { dyScore = 72; }
    else if (stock.dividendYield > 2) { dyScore = 58; }
    else if (stock.dividendYield > 1) { dyScore = 42; }
    else { dyScore = 30; }
    score += dyScore * 0.15;
    totalWeight += 0.15;
  }

  // ---- 市值稳定性（15%）----
  let capScore = 50;
  if (stock.marketCap) {
    if (stock.marketCap >= 10000) { capScore = 88; }      // 万亿级
    else if (stock.marketCap >= 1000) { capScore = 72; }   // 千亿级
    else if (stock.marketCap >= 100) { capScore = 52; }    // 百亿级
    else { capScore = 35; }
  } else if (stock.cap) {
    if (stock.cap.includes('万亿')) { capScore = 88; }
    else if (stock.cap.includes('千亿') || parseInt(stock.cap) > 1000) { capScore = 72; }
  }
  score += capScore * 0.15;
  totalWeight += 0.15;

  // 归一化（部分权重缺失时）
  if (totalWeight > 0 && totalWeight < 1) {
    score = score / totalWeight;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 成长评分 v2.0（营收增速40% + 净利增速30% + 价格动量20% + 行业景气10%）
 */
function calculateGrowthScoreV2(stock: any): number {
  let score = 0;
  let hasRealGrowth = false;

  // 营收增速 YoY（40%权重）
  const revGrowth = stock.revenueGrowthYoy;
  if (revGrowth !== undefined && revGrowth !== null) {
    hasRealGrowth = true;
    let revScore: number;
    if (revGrowth > 30) { revScore = 95; }
    else if (revGrowth > 20) { revScore = 85; }
    else if (revGrowth > 10) { revScore = 72; }
    else if (revGrowth > 0) { revScore = 55; }
    else if (revGrowth > -10) { revScore = 38; }
    else { revScore = 20; }
    score += revScore * 0.4;
  }

  // 净利增速 YoY（30%权重）
  const profitGrowth = stock.netIncomeGrowthYoy;
  if (profitGrowth !== undefined && profitGrowth !== null) {
    hasRealGrowth = true;
    let profitScore: number;
    if (profitGrowth > 40) { profitScore = 95; }
    else if (profitGrowth > 20) { profitScore = 82; }
    else if (profitGrowth > 10) { profitScore = 68; }
    else if (profitGrowth > 0) { profitScore = 52; }
    else if (profitGrowth > -15) { profitScore = 35; }
    else { profitScore = 18; }
    score += profitScore * 0.3;
  }

  // 无真实增速数据时 fallback 到价格动量逻辑
  if (!hasRealGrowth) {
    const changePct = stock.changePct || 0;
    if (changePct > 7) { score = 90; }
    else if (changePct > 5) { score = 85; }
    else if (changePct > 3) { score = 75; }
    else if (changePct > 1) { score = 65; }
    else if (changePct > 0) { score = 55; }
    else if (changePct > -2) { score = 45; }
    else if (changePct > -5) { score = 35; }
    else { score = 25; }
  } else {
    // 有真实增速数据时，价格动量只占20%
    const changePct = stock.changePct || 0;
    let momentumScore: number;
    if (changePct > 5) { momentumScore = 85; }
    else if (changePct > 2) { momentumScore = 70; }
    else if (changePct > 0) { momentumScore = 55; }
    else if (changePct > -2) { momentumScore = 45; }
    else { momentumScore = 30; }
    score += momentumScore * 0.2;
  }

  // 行业景气度（10%权重）
  const growthSectors = ['人工智能', '新能源车', '半导体', '光伏', '储能', '生物医药', '新材料', '动力电池', 'AI', '算力'];
  const sectorMatch = stock.sector && growthSectors.some((s: string) => stock.sector.includes(s));
  const conceptMatch = Array.isArray(stock.concepts) && growthSectors.some((s: string) =>
    stock.concepts.some((c: string) => c.includes(s) || s.includes(c))
  );
  if (hasRealGrowth) {
    score += (sectorMatch || conceptMatch) ? 10 : 5;
  } else {
    if (sectorMatch || conceptMatch) { score = Math.min(100, score + 12); }
  }

  // 周期性行业调整
  const cyclicalSectors = ['钢铁', '有色', '化工', '航运'];
  if (stock.sector && cyclicalSectors.some((s: string) => stock.sector.includes(s))) {
    if ((stock.changePct || 0) > 10) { score -= 15; }
  }

  // 传统价值行业调整
  const valueSectors = ['银行', '保险', '地产', '公用事业'];
  if (stock.sector && valueSectors.some((s: string) => stock.sector.includes(s))) {
    score = Math.max(30, score - 5);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 质量评分 v2.0（ROE 40% + 净利率 20% + 资产负债率 20% + 龙头溢价 10% + 市值 10%）
 */
function calculateQualityScoreV2(stock: any): number {
  let score = 0;
  let totalWeight = 0;

  // ROE 核心指标（40%权重）
  if (stock.roe !== undefined && stock.roe !== null) {
    let roeScore: number;
    if (stock.roe > 30) { roeScore = 98; }
    else if (stock.roe > 25) { roeScore = 92; }
    else if (stock.roe > 20) { roeScore = 85; }
    else if (stock.roe > 15) { roeScore = 72; }
    else if (stock.roe > 10) { roeScore = 58; }
    else if (stock.roe > 5) { roeScore = 42; }
    else { roeScore = 28; }
    score += roeScore * 0.4;
    totalWeight += 0.4;
  }

  // 净利率（新增，20%权重）
  if (stock.netMargin !== undefined && stock.netMargin !== null) {
    let marginScore: number;
    if (stock.netMargin > 30) { marginScore = 95; }       // 茅台级
    else if (stock.netMargin > 20) { marginScore = 85; }
    else if (stock.netMargin > 10) { marginScore = 70; }
    else if (stock.netMargin > 5) { marginScore = 55; }
    else if (stock.netMargin > 0) { marginScore = 35; }
    else { marginScore = 15; }
    score += marginScore * 0.2;
    totalWeight += 0.2;
  }

  // 资产负债率（新增，20%权重，金融行业豁免）
  const isFinancial = stock.sector && ['银行', '保险', '证券', '金融'].some((s: string) => stock.sector.includes(s));
  if (stock.debtRatio !== undefined && stock.debtRatio !== null && !isFinancial) {
    let debtScore: number;
    if (stock.debtRatio < 30) { debtScore = 92; }
    else if (stock.debtRatio < 45) { debtScore = 78; }
    else if (stock.debtRatio < 60) { debtScore = 60; }
    else if (stock.debtRatio < 70) { debtScore = 42; }
    else { debtScore = 25; }
    score += debtScore * 0.2;
    totalWeight += 0.2;
  }

  // 行业龙头溢价（10%权重）
  const leaders = [
    '贵州茅台', '五粮液', '宁德时代', '比亚迪', '隆基绿能',
    '腾讯控股', '阿里巴巴', '美团', '京东', '拼多多',
    '招商银行', '中国平安', '美的集团', '格力电器', '海尔智家',
    '恒瑞医药', '药明康德', '迈瑞医疗', '小米集团'
  ];
  const isLeader = stock.name && leaders.some((l: string) => stock.name.includes(l));
  score += (isLeader ? 90 : 50) * 0.1;
  totalWeight += 0.1;

  // 市值规模（10%权重）
  let capScore = 50;
  if (stock.marketCap) {
    if (stock.marketCap >= 10000) { capScore = 90; }
    else if (stock.marketCap >= 1000) { capScore = 75; }
    else if (stock.marketCap >= 100) { capScore = 55; }
    else { capScore = 35; }
  } else if (stock.cap) {
    if (stock.cap.includes('万亿')) { capScore = 90; }
    else if (stock.cap.includes('千亿')) { capScore = 75; }
  }
  score += capScore * 0.1;
  totalWeight += 0.1;

  // 归一化（如果部分权重缺失）
  if (totalWeight > 0 && totalWeight < 1) {
    score = score / totalWeight;
  }

  // 高ROE + 低PE 交叉加分
  if (stock.roe > 20 && stock.pe && stock.pe > 0 && stock.pe < 20) {
    score = Math.min(100, score + 5);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 技术面评分 v2.0（新增支撑阻力位）
 */
function calculateTechnicalScoreV2(stock: any): number {
  let score = 50;

  // RSI动量
  if (stock.rsi) {
    if (stock.rsi >= 45 && stock.rsi <= 55) { score += 25; } // 完美区间
    else if (stock.rsi >= 40 && stock.rsi <= 60) { score += 20; } // 健康区间
    else if (stock.rsi < 30) { score += 18; } // 超卖反弹
    else if (stock.rsi > 70) { score -= 20; } // 超买风险
  }

  // MACD趋势
  if (stock.macd) {
    if (stock.macd === 'golden_cross') { score += 28; }
    else if (stock.macd === 'death_cross') { score -= 28; }
    else if (stock.macd === 'neutral') { score += 5; }
  }

  // 价格趋势强度
  const changePct = stock.changePct || 0;
  if (changePct > 5) { score += 8; }
  else if (changePct > 2) { score += 5; }
  else if (changePct < -5) { score -= 8; }

  // 成交量确认
  const volume = parseFloat(stock.volume || '0');
  const turnover = parseFloat(stock.turnover || '0');
  if (volume > 5 && turnover > 5) { score += 7; } // 活跃
  else if (volume > 1 && turnover > 1) { score += 3; }

  return Math.max(0, Math.min(100, score));
}

/**
 * 市场情绪评分 v2.0
 */
function calculateSentimentScoreV2(stock: any): number {
  let score = 50;

  // 涨跌幅
  const changePct = stock.changePct || 0;
  if (changePct > 7) { score = 85; }
  else if (changePct > 5) { score = 78; }
  else if (changePct > 3) { score = 70; }
  else if (changePct > 1) { score = 62; }
  else if (changePct > 0) { score = 55; }
  else if (changePct > -2) { score = 45; }
  else if (changePct > -5) { score = 35; }
  else { score = 25; }

  // 成交量热度
  if (stock.turnover) {
    const turnoverNum = parseFloat(stock.turnover);
    if (turnoverNum > 50) { score += 10; }
    else if (turnoverNum > 20) { score += 6; }
    else if (turnoverNum > 10) { score += 3; }
  }

  // 热门概念加分（同时检查 name/sector 和 concepts 字段）
  const hotConcepts = ['AI', '人工智能', 'ChatGPT', '算力', '数据要素',
                       '新能源', '储能', '固态电池', '氢能源', '动力电池',
                       '半导体', '芯片', '光刻机',
                       '创新药', 'CRO', '医疗器械'];
  const text = `${stock.name || ''} ${stock.sector || ''}`.toLowerCase();
  const conceptsText = Array.isArray(stock.concepts) ? stock.concepts.join(' ').toLowerCase() : '';
  if (hotConcepts.some(c => text.includes(c.toLowerCase()) || conceptsText.includes(c.toLowerCase()))) {
    score = Math.min(100, score + 10);
  }

  return score;
}

/**
 * 波动率风险评分（新增）
 * 波动率越高，风险越大，评分越低
 */
function calculateVolatilityScore(stock: any): number {
  let score = 70; // 默认中等

  const changePct = Math.abs(stock.changePct || 0);

  // 日内波动
  if (changePct < 1) { score = 90; } // 低波动
  else if (changePct < 2) { score = 80; }
  else if (changePct < 4) { score = 65; }
  else if (changePct < 7) { score = 45; }
  else { score = 25; } // 高波动

  // 涨停跌停风险
  if (changePct >= 10) { score = Math.min(score, 20); }

  // ST风险
  if (stock.name && stock.name.startsWith('ST')) {
    score = 15;
  }

  // 创业板/科创板波动大
  if (stock.code) {
    if (stock.code.startsWith('300') || stock.code.startsWith('688')) {
      score = Math.max(30, score - 10);
    }
  }

  return score;
}

/**
 * 计算风险等级
 */
function calculateRiskLevel(scores: any): 'low' | 'medium' | 'high' {
  // 综合考虑波动率、估值和技术面
  const volatilityRisk = 100 - scores.volatility;
  const valueRisk = scores.value < 50 ? 30 : 0;
  const technicalRisk = scores.technical < 50 ? 20 : 0;

  const totalRisk = volatilityRisk + valueRisk + technicalRisk;

  if (totalRisk > 60) return 'high';
  if (totalRisk > 30) return 'medium';
  return 'low';
}

/**
 * 获取操作建议 v2.0（考虑风险等级）
 */
function getRecommendationV2(score: number, riskLevel: string): string {
  if (riskLevel === 'high') {
    if (score >= 75) return '谨慎参与';
    if (score >= 60) return '小仓位试探';
    return '建议规避';
  }

  if (riskLevel === 'low') {
    if (score >= 80) return '强烈推荐';
    if (score >= 65) return '推荐买入';
    if (score >= 50) return '可以关注';
    return '继续观望';
  }

  // medium risk
  if (score >= 80) return '积极配置';
  if (score >= 65) return '建议买入';
  if (score >= 50) return '持有';
  if (score >= 40) return '减仓';
  return '建议规避';
}

/**
 * 计算信心程度 v2.0
 */
function calculateConfidenceV2(stock: any, scores: any): number {
  let confidence = 70;

  // 数据完整性（真实数据越多信心越高）
  const dataPoints = [
    stock.pe, stock.roe, stock.rsi, stock.macd,
    stock.volume, stock.turnover,
    stock.pb, stock.netMargin, stock.revenueGrowthYoy,
    stock.netIncomeGrowthYoy, stock.debtRatio
  ].filter(v => v !== undefined && v !== null && v !== 0).length;
  confidence += dataPoints * 2;

  // 评分一致性
  const scoreValues = Object.values(scores) as number[];
  const mean = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
  const variance = scoreValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scoreValues.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 12) { confidence += 18; }
  else if (stdDev < 20) { confidence += 8; }
  else { confidence -= 12; }

  // 质量和技术一致性加分
  if (scores.quality > 70 && scores.technical > 70) { confidence += 8; }

  return Math.max(45, Math.min(95, confidence));
}

/**
 * 生成投资逻辑 v2.0
 */
function generateThesisV2(stock: any, scores: any, marketRegime: any): any {
  const catalysts: string[] = [];
  const risks: string[] = [];

  // 催化剂（使用真实数据生成更精准的描述）
  if (scores.value > 75) {
    const peText = stock.pe ? `PE仅${stock.pe.toFixed(1)}倍` : '估值低';
    catalysts.push(`${peText}，安全边际充足`);
  }
  if (scores.growth > 75) {
    if (stock.revenueGrowthYoy && stock.revenueGrowthYoy > 20) {
      catalysts.push(`营收同比增长${stock.revenueGrowthYoy.toFixed(1)}%，成长动能强劲`);
    } else {
      catalysts.push('成长动能强劲，业绩有望持续超预期');
    }
  }
  if (scores.quality > 80) {
    const roeText = stock.roe ? `ROE达${stock.roe.toFixed(1)}%` : '盈利能力卓越';
    catalysts.push(`${roeText}，行业领先`);
  }
  if (scores.technical > 75 && stock.macd === 'golden_cross') {
    catalysts.push('技术面发出金叉信号，趋势拐点确立');
  }
  if (marketRegime.trend === 'bull' && scores.growth > 70) {
    catalysts.push('牛市环境，成长股有望享受估值溢价');
  }
  if (stock.why) catalysts.push(stock.why);

  // 风险（使用真实数据生成更精准的描述）
  if (scores.value < 40) {
    const peText = stock.pe ? `PE=${stock.pe.toFixed(1)}倍` : '估值偏高';
    risks.push(`${peText}，存在回调压力`);
  }
  if (scores.volatility < 40) risks.push('波动率较大，注意仓位控制');
  if (stock.rsi && stock.rsi > 75) risks.push(`RSI=${stock.rsi.toFixed(0)}超买，短期调整风险增加`);
  if (stock.changePct && stock.changePct > 8) {
    risks.push('短期涨幅较大，追高风险较高');
  }
  if (stock.revenueGrowthYoy !== undefined && stock.revenueGrowthYoy < -10) {
    risks.push(`营收同比下降${Math.abs(stock.revenueGrowthYoy).toFixed(1)}%，基本面承压`);
  }
  if (scores.technical < 40) risks.push('技术面偏弱，建议等待更好买点');
  if (marketRegime.volatility === 'high') {
    risks.push('市场波动加剧，注意止损');
  }

  // 护城河
  let moat = '一般';
  if (scores.quality > 85) {
    moat = '极强（行业龙头，品牌/技术/网络效应显著）';
  } else if (scores.quality > 70) {
    moat = '强劲（具备明显竞争优势）';
  } else if (scores.quality > 55) {
    moat = '良好（有一定竞争壁垒）';
  }

  // 默认内容
  if (catalysts.length === 0) catalysts.push('行业基本面有望改善');
  if (risks.length === 0) risks.push('关注宏观市场风险');

  return {
    summary: generateThesisSummaryV2(scores, marketRegime),
    catalysts,
    risks,
    moat,
  };
}

/**
 * 生成投资逻辑摘要 v2.0
 */
function generateThesisSummaryV2(scores: any, marketRegime: any): string {
  const strongPoints: string[] = [];
  const weakPoints: string[] = [];

  if (scores.value > 70) strongPoints.push('估值优势');
  else if (scores.value < 40) weakPoints.push('估值偏高');

  if (scores.growth > 70) strongPoints.push('成长潜力');
  else if (scores.growth < 40) weakPoints.push('成长乏力');

  if (scores.quality > 70) strongPoints.push('优质资产');
  else if (scores.quality < 40) weakPoints.push('质量一般');

  if (scores.technical > 70) strongPoints.push('技术面强势');
  else if (scores.technical < 40) weakPoints.push('技术面偏弱');

  // 生成摘要
  if (strongPoints.length >= 3) {
    return `综合评分优秀，具备${strongPoints.slice(0, 3).join('、')}等多重优势，${marketRegime.trend === 'bull' ? '适合积极配置' : '适合中长期持有'}。`;
  } else if (strongPoints.length >= 2) {
    return `综合表现良好，${strongPoints.join('、')}明显，建议关注配置机会。`;
  } else if (strongPoints.length === 1) {
    return `${strongPoints[0]}突出，但${weakPoints.length > 0 ? weakPoints[0] : '其他维度一般'}，建议分批建仓。`;
  } else {
    return '当前综合评分一般，建议等待更好的入场时机或关注更好的标的。';
  }
}

/**
 * 生成操作建议 v2.0（新增分批建仓和移动止损）
 */
function generateAdviceV2(score: number, stock: any, scores: any, marketRegime: any): any {
  const price = stock.price || 100;
  const changePct = stock.changePct || 0;
  const riskLevel = calculateRiskLevel(scores);

  let action = '观望';
  let entryStrategy = '一次性建仓';
  let targetPrice = price * 1.1;
  let stopLoss = price * 0.95;
  let trailingStop = price * 0.93;  // 移动止损
  let positionSize = '5-10%';
  let timeFrame = '1-3个月';
  let pyramidLevels: number[] = [];

  // 根据评分和风险等级制定策略
  if (score >= 80 && riskLevel === 'low') {
    action = '积极配置';
    entryStrategy = '分批建仓（3-2-1）';
    targetPrice = price * 1.25;
    stopLoss = price * 0.88;
    trailingStop = price * 0.90;
    positionSize = '25-35%';
    timeFrame = '6-12个月';
    pyramidLevels = [price, price * 1.05, price * 1.10];
  }
  else if (score >= 70) {
    action = '建议买入';
    entryStrategy = riskLevel === 'high' ? '小仓位试探' : '分批建仓（2-1）';
    targetPrice = price * 1.18;
    stopLoss = price * 0.90;
    trailingStop = price * 0.92;
    positionSize = riskLevel === 'high' ? '5-10%' : '15-25%';
    timeFrame = '3-6个月';
    pyramidLevels = riskLevel === 'high' ? [price] : [price, price * 1.08];
  }
  else if (score >= 55) {
    action = '继续持有';
    entryStrategy = '观望或少量加仓';
    positionSize = '10-15%';
    targetPrice = price * 1.10;
  }
  else if (score < 40) {
    action = '建议规避';
    entryStrategy = '空仓观望';
  }

  // 根据市场环境调整
  if (marketRegime.volatility === 'high') {
    entryStrategy = '严格控制仓位，分批小额建仓';
    positionSize = Math.min(15, parseInt(positionSize) / 2) + '%';
    stopLoss = price * 0.92;  // 更紧的止损
  }

  if (marketRegime.trend === 'bear') {
    entryStrategy = '等待企稳信号后再建仓';
    positionSize = '5-10%';
  }

  // 根据涨跌幅调整
  if (changePct > 7) {
    action = '等待回调';
    entryStrategy = '等待回调至5日均线附近';
    const ma5 = price * 0.95;  // 简化估算
    pyramidLevels = [ma5];
  } else if (changePct < -7) {
    action = '关注超跌反弹';
    entryStrategy = '分批抄底，快进快出';
    targetPrice = price * 1.12;
    timeFrame = '1-2周';
  }

  return {
    action,
    entryStrategy,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    trailingStop: Math.round(trailingStop * 100) / 100,
    timeFrame,
    positionSize,
    pyramidLevels: pyramidLevels.map(p => Math.round(p * 100) / 100),
  };
}

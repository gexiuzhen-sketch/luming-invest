/**
 * 持仓诊断增强服务
 * 包含行业相关性、集中度、风险分析
 */

export interface Holding {
  code: string;
  name: string;
  sector: string;
  currentValue: number;
  profit: number;
  profitPct: number;
  purchaseDate: string;
}

export interface PortfolioDiagnosis {
  healthScore: number;        // 健康评分 0-100
  riskLevel: 'low' | 'medium' | 'high';
  concentration: {
    maxPosition: number;      // 最大持仓比例
    score: number;            // 集中度评分
    recommendation: string;
  };
  sector: {
    concentration: number;    // 行业集中度
    diversity: number;        // 行业多样性
    topSectors: string[];     // 前三大行业
    recommendation: string;
  };
  correlation: {
    avgCorrelation: number;   // 平均相关性
    risk: string;             // 相关性风险
    recommendation: string;
  };
  performance: {
    totalReturn: number;
    winRate: number;          // 盈利率
    avgHoldingDays: number;
    recommendation: string;
  };
  suggestions: string[];
}

/**
 * 获取行业分类（简化版）
 */
function getStockSector(code: string): string {
  const sectorMap: Record<string, string> = {
    // 银行
    '600036': '金融', '000001': '金融', '601166': '金融',
    // 科技
    '002594': '新能源', '300750': '新能源', '002415': '医药',
    // 消费
    '600519': '消费', '000858': '消费', '000333': '消费',
    // 医药
    '600276': '医药', '000661': '医药', '300015': '医药',
  };

  // 根据代码前缀推断
  if (code.startsWith('60') || code.startsWith('68')) {
    return sectorMap[code] || '沪市主板';
  } else if (code.startsWith('00') || code.startsWith('30')) {
    return sectorMap[code] || '深市主板';
  }
  return '其他';
}

/**
 * 计算行业相关性矩阵
 */
function calculateSectorCorrelation(holdings: Holding[]): {
  correlation: number;
  risk: 'low' | 'medium' | 'high';
} {
  if (holdings.length < 2) {
    return { correlation: 0, risk: 'low' };
  }

  // 统计行业分布
  const sectorCount: Record<string, number> = {};
  holdings.forEach(h => {
    const sector = h.sector || getStockSector(h.code);
    sectorCount[sector] = (sectorCount[sector] || 0) + 1;
  });

  // 计算赫芬达尔指数（衡量集中度）
  const total = holdings.length;
  let hhi = 0;
  Object.values(sectorCount).forEach(count => {
    const share = count / total;
    hhi += share * share;
  });

  // HHI < 0.3 分散良好
  // HHI 0.3-0.5 适中
  // HHI > 0.5 过于集中
  if (hhi < 0.3) {
    return { correlation: 0.2, risk: 'low' };
  } else if (hhi < 0.5) {
    return { correlation: 0.5, risk: 'medium' };
  } else {
    return { correlation: 0.8, risk: 'high' };
  }
}

/**
 * 增强版持仓诊断
 */
export function diagnosePortfolioEnhanced(
  holdings: Holding[],
  totalValue: number,
  totalProfitPct: number
): PortfolioDiagnosis {
  // 1. 计算基础健康评分
  let healthScore = 70;

  // 收益率评分
  if (totalProfitPct > 20) healthScore += 15;
  else if (totalProfitPct > 10) healthScore += 10;
  else if (totalProfitPct > 0) healthScore += 5;
  else if (totalProfitPct < -10) healthScore -= 15;
  else if (totalProfitPct < -5) healthScore -= 10;

  // 2. 集中度分析
  const maxValue = Math.max(...holdings.map(h => h.currentValue || 0));
  const maxPositionRatio = maxValue / totalValue;

  let concentrationScore = 100;
  if (maxPositionRatio > 0.5) {
    healthScore -= 15;
    concentrationScore = 40;
  } else if (maxPositionRatio > 0.3) {
    healthScore -= 8;
    concentrationScore = 60;
  } else if (maxPositionRatio < 0.15) {
    healthScore += 5;
    concentrationScore = 100;
  }

  // 3. 持仓数量评分
  if (holdings.length < 3) {
    healthScore -= 10;
  } else if (holdings.length >= 5 && holdings.length <= 10) {
    healthScore += 5;
  }

  // 4. 行业相关性分析
  const sectorCorrelation = calculateSectorCorrelation(holdings);
  if (sectorCorrelation.risk === 'high') {
    healthScore -= 15;
  } else if (sectorCorrelation.risk === 'medium') {
    healthScore -= 5;
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  // 5. 行业分布统计
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => {
    const sector = h.sector || getStockSector(h.code);
    sectorMap[sector] = (sectorMap[sector] || 0) + h.currentValue;
  });

  const sortedSectors = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, value]) => `${sector} ${((value / totalValue) * 100).toFixed(1)}%`);

  const sectorConcentration = Object.values(sectorMap)
    .reduce((max, val) => Math.max(max, val), 0) / totalValue;

  // 6. 生成建议
  const suggestions: string[] = [];

  // 集中度建议
  if (maxPositionRatio > 0.5) {
    suggestions.push(`单一持仓占比${(maxPositionRatio * 100).toFixed(1)}%过高，建议控制在30%以内`);
  }

  // 行业相关性建议
  if (sectorCorrelation.risk === 'high') {
    suggestions.push('持仓行业集中度较高，建议增加不同行业的资产分散风险');
  } else if (sectorCorrelation.risk === 'medium') {
    suggestions.push('持仓行业分布适中，可考虑增加防御性行业配置');
  }

  // 盈亏建议
  const profitCount = holdings.filter(h => (h.profitPct || 0) > 0).length;
  const lossCount = holdings.filter(h => (h.profitPct || 0) < 0).length;

  if (lossCount > profitCount) {
    suggestions.push(`亏损持仓(${lossCount}只)多于盈利持仓(${profitCount}只)，建议审视持仓逻辑`);
  }

  // 收益率建议
  if (totalProfitPct < 0) {
    suggestions.push('整体收益为负，建议评估市场环境，考虑止损或调整策略');
  } else if (totalProfitPct > 15) {
    suggestions.push('收益较好，建议适当止盈锁定部分收益');
  }

  // 持仓时间建议
  const avgHoldingDays = holdings.reduce((sum, h) => {
    const days = Math.floor((Date.now() - new Date(h.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0) / holdings.length;

  if (avgHoldingDays > 180 && totalProfitPct < 0) {
    suggestions.push(`长期持有(${avgHoldingDays.toFixed(0)}天)但仍亏损，建议评估基本面变化`);
  }

  if (suggestions.length === 0) {
    suggestions.push('当前持仓整体健康，继续保持稳健投资策略');
  }

  // 7. 确定风险等级
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (healthScore >= 75) {
    riskLevel = 'low';
  } else if (healthScore < 50) {
    riskLevel = 'high';
  }

  return {
    healthScore,
    riskLevel,
    concentration: {
      maxPosition: maxPositionRatio,
      score: concentrationScore,
      recommendation: maxPositionRatio > 0.4
        ? '建议分散持仓，单一股票不超过30%'
        : '持仓分散度良好',
    },
    sector: {
      concentration: sectorConcentration,
      diversity: Object.keys(sectorMap).length,
      topSectors: sortedSectors,
      recommendation: sectorConcentration > 0.6
        ? '行业过于集中，建议增加其他行业配置'
        : '行业分布较为均衡',
    },
    correlation: {
      avgCorrelation: sectorCorrelation.correlation,
      risk: sectorCorrelation.risk,
      recommendation: sectorCorrelation.risk === 'high'
        ? '行业相关性高，系统性风险较大'
        : '行业相关性适中',
    },
    performance: {
      totalReturn: totalProfitPct,
      winRate: (profitCount / holdings.length) * 100,
      avgHoldingDays,
      recommendation: totalProfitPct > 10
        ? '收益率优秀，继续保持'
        : totalProfitPct > 0
        ? '收益为正，稳步增长'
        : '收益为负，建议调整策略',
    },
    suggestions,
  };
}

/**
 * 计算投资组合Beta
 * 衡量相对于市场的系统性风险
 */
export function calculatePortfolioBeta(
  holdings: Holding[],
  marketReturn: number
): number {
  if (holdings.length === 0) return 1;

  // 简化版：使用等权重计算
  // 实际应用中应该使用各股票的Beta值
  const avgReturn = holdings.reduce((sum, h) => sum + (h.profitPct || 0), 0) / holdings.length;

  // Beta = 投资组合收益率 / 市场收益率
  if (Math.abs(marketReturn) < 0.01) {
    return 1;  // 市场波动很小时，默认Beta为1
  }

  return avgReturn / marketReturn;
}

/**
 * 计算最大回撤
 */
export function calculateMaxDrawdown(
  holdings: Holding[],
  totalValue: number
): {
  maxDrawdown: number;
  maxDrawdownPct: number;
  riskLevel: 'low' | 'medium' | 'high';
} {
  // 简化版：基于当前盈亏估算
  // 实际应用需要历史净值曲线

  const totalCost = holdings.reduce((sum, h) => {
    return sum + (h.currentValue || 0) - (h.profit || 0);
  }, 0);

  const peak = Math.max(totalCost, totalValue);
  const drawdown = peak > 0 ? (peak - totalValue) / peak : 0;
  const drawdownPct = drawdown * 100;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (drawdownPct > 20) {
    riskLevel = 'high';
  } else if (drawdownPct > 10) {
    riskLevel = 'medium';
  }

  return {
    maxDrawdown: peak - totalValue,
    maxDrawdownPct: drawdownPct,
    riskLevel,
  };
}

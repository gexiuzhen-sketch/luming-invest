import type { Market } from './stock';

// 持仓项
export interface Holding {
  id: string;
  code: string;
  name: string;
  market: Market;
  costPrice: number;      // 成本价
  quantity: number;       // 持有数量
  purchaseDate: string;   // 购买日期
}

// 持仓分析（带实时价格和收益）
export interface HoldingAnalysis extends Holding {
  currentPrice?: number;
  currentValue?: number;   // 当前市值
  costValue?: number;      // 成本市值
  profit?: number;         // 收益额
  profitPct?: number;      // 收益率
  prevClose?: number;      // 昨收价
  dailyProfit?: number;    // 今日盈亏
  dailyProfitPct?: number; // 今日涨跌幅
}

// 投资组合分析
export interface PortfolioAnalysis {
  totalValue: number;      // 总市值
  totalCost: number;       // 总成本
  totalProfit: number;     // 总收益
  totalProfitPct: number;  // 总收益率
  holdings: HoldingAnalysis[];
  advice: string;          // AI建议
  riskLevel: 'low' | 'medium' | 'high';
  diversification: string; // 分散度建议
}

// 添加持仓请求
export interface AddHoldingRequest {
  code: string;
  name: string;
  market: Market;
  costPrice: number;
  quantity: number;
  purchaseDate: string;
}

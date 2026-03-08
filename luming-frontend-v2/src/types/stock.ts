// 股票市场类型
export type Market = 'SH' | 'SZ' | 'HK' | 'US' | 'FUND';

// 交易时机类型
export type TimingType = 'buy_now' | 'strong_buy' | 'wait' | 'avoid';

// 股票基础信息
export interface Stock {
  code: string;
  name: string;
  market: Market;
  price: number;
  change: number;
  changePct: number;
  score: number;
  pe?: number;
  roe?: number;
  rsi?: number;
  macd?: string;
  sector?: string;
  industry?: string;
  cap?: string;
  timing?: TimingType;
  timingText?: string;
  timingWhy?: string;
  why?: string;
  tags?: string[];
}

// 交易信号
export interface TradingSignal {
  type: string;
  description: string;
  strength: number;
}

// 分批建仓建议
export interface BatchBuyAdvice {
  stopLoss: number;      // 止损位
  takeProfit: number;    // 止盈位
  holdPeriod: string;    // 持有周期
  batches: Batch[];      // 分批建仓方案
}

export interface Batch {
  batch: number;         // 批次
  priceRange: string;    // 价格区间
  ratio: number;         // 建仓比例(%)
}

// 完整交易信号响应
export interface TradingSignals {
  code: string;
  name: string;
  current_price: number;
  score: number;
  color: 'green' | 'red' | 'yellow';
  action_text: string;
  buy_signals: TradingSignal[];
  sell_signals: TradingSignal[];
  batch_buy_advice: BatchBuyAdvice | null;
  updated_at: string;
}

// API响应格式
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

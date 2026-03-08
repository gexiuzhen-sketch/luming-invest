/**
 * 真实交易成本计算
 * 支持A股、港股、美股不同费率
 */

export type MarketType = 'SH' | 'SZ' | 'HK' | 'US';

export interface TradingCost {
  stampDuty: number;      // 印花税
  commission: number;     // 佣金
  transferFee: number;    // 过户费/平台费
  totalCost: number;      // 总成本
  costRate: number;      // 费率（千分比）
}

export interface TradingRules {
  t1: boolean;            // T+1交易规则（false=T+0）
  limitUp: number;        // 涨跌停限制（0=无限制）
  limitDown: number;      // 跌停限制
  minUnit: number;        // 最小交易单位
}

// ===================== 各市场交易成本配置 =====================

const A_STOCK_COSTS = {
  STAMP_DUTY_SELL: 0.001,       // 印花税：卖出0.1%（2023年8月28日减半）
  STAMP_DUTY_BUY: 0,
  COMMISSION_RATE: 0.00025,     // 佣金：万2.5
  COMMISSION_MIN: 5,            // 佣金最低5元
  TRANSFER_FEE_RATE: 0.00001,  // 过户费：0.001%
};

const HK_STOCK_COSTS = {
  STAMP_DUTY_RATE: 0.0013,     // 印花税：买卖双向0.13%（2021年8月上调）
  COMMISSION_RATE: 0.0003,     // 佣金：万3（互联网券商）
  COMMISSION_MIN: 3,           // 佣金最低3港元
  TRANSACTION_LEVY: 0.0000027, // 交易征费：0.00027%
  TRADING_FEE: 0.00005,        // 交易费：0.005%
};

const US_STOCK_COSTS = {
  STAMP_DUTY: 0,               // 美股无印花税
  COMMISSION_PER_SHARE: 0.005, // 每股佣金（互联网券商如盈透）
  COMMISSION_MIN: 1,           // 最低佣金1美元
  SEC_FEE_RATE: 0.0000278,    // SEC费：卖出时0.00278%
  TAF_FEE_PER_SHARE: 0.000166,// TAF费：每股$0.000166
};

// ===================== 判断市场类型 =====================

export function detectMarket(code: string): MarketType {
  if (/^\d{6}$/.test(code)) return code.startsWith('6') ? 'SH' : 'SZ';
  if (/^\d{5}$/.test(code)) return 'HK';
  if (/[A-Za-z]/.test(code)) return 'US';
  return 'SH'; // 默认A股
}

// ===================== 交易成本计算 =====================

/**
 * 计算交易成本（支持A股/港股/美股）
 */
export function calculateTradingCost(
  amount: number,
  isBuy: boolean,
  market: string = 'SH'
): TradingCost {
  const m = market.toUpperCase();
  if (m === 'HK') return calculateHKCost(amount, isBuy);
  if (m === 'US') return calculateUSCost(amount, isBuy);
  return calculateACost(amount, isBuy);
}

function calculateACost(amount: number, isBuy: boolean): TradingCost {
  const stampDuty = isBuy ? 0 : amount * A_STOCK_COSTS.STAMP_DUTY_SELL;
  const commission = Math.max(amount * A_STOCK_COSTS.COMMISSION_RATE, A_STOCK_COSTS.COMMISSION_MIN);
  const transferFee = amount * A_STOCK_COSTS.TRANSFER_FEE_RATE;
  const totalCost = stampDuty + commission + transferFee;
  return {
    stampDuty,
    commission,
    transferFee,
    totalCost,
    costRate: amount > 0 ? Number(((totalCost / amount) * 10).toFixed(3)) : 0,
  };
}

function calculateHKCost(amount: number, _isBuy: boolean): TradingCost {
  // 港股印花税买卖双向
  const stampDuty = amount * HK_STOCK_COSTS.STAMP_DUTY_RATE;
  const commission = Math.max(amount * HK_STOCK_COSTS.COMMISSION_RATE, HK_STOCK_COSTS.COMMISSION_MIN);
  const transferFee = amount * (HK_STOCK_COSTS.TRANSACTION_LEVY + HK_STOCK_COSTS.TRADING_FEE);
  const totalCost = stampDuty + commission + transferFee;
  return {
    stampDuty,
    commission,
    transferFee,
    totalCost,
    costRate: amount > 0 ? Number(((totalCost / amount) * 10).toFixed(3)) : 0,
  };
}

function calculateUSCost(amount: number, isBuy: boolean): TradingCost {
  // 美股按固定低佣金估算（简化：取金额的万3，最低1美元≈7元人民币）
  const commission = Math.max(amount * 0.0003, 7);
  // SEC费仅卖出收取
  const stampDuty = isBuy ? 0 : amount * US_STOCK_COSTS.SEC_FEE_RATE;
  const transferFee = 0;
  const totalCost = stampDuty + commission + transferFee;
  return {
    stampDuty,
    commission,
    transferFee,
    totalCost,
    costRate: amount > 0 ? Number(((totalCost / amount) * 10).toFixed(3)) : 0,
  };
}

// ===================== 格式化 =====================

export function formatCostDetail(cost: TradingCost): string {
  const parts: string[] = [];
  if (cost.stampDuty > 0) {
    parts.push(`印花税/SEC费 ¥${cost.stampDuty.toFixed(2)}`);
  }
  parts.push(`佣金 ¥${cost.commission.toFixed(2)}`);
  if (cost.transferFee > 0.01) {
    parts.push(`其他费用 ¥${cost.transferFee.toFixed(3)}`);
  }
  parts.push(`总费率 ${cost.costRate}‰`);
  return parts.join(' | ');
}

// ===================== 交易规则检查 =====================

/**
 * 检查交易规则（根据市场自动适配）
 */
export function checkTradingRules(
  code: string,
  shares: number,
  _price: number,
  _sharesToSell?: number
): {
  canTrade: boolean;
  reason?: string;
} {
  const market = detectMarket(code);

  if (market === 'US') {
    // 美股：最小1股，允许任意整数
    if (shares < 1 || !Number.isInteger(shares)) {
      return { canTrade: false, reason: '美股交易数量必须为正整数（最小1股）' };
    }
    return { canTrade: true };
  }

  if (market === 'HK') {
    // 港股：最小1股（实际每手不同，简化处理允许任意整数）
    if (shares < 1 || !Number.isInteger(shares)) {
      return { canTrade: false, reason: '港股交易数量必须为正整数（最小1股）' };
    }
    return { canTrade: true };
  }

  // A股：必须100股整数倍
  const minUnit = 100;
  if (shares % minUnit !== 0) {
    return {
      canTrade: false,
      reason: `A股交易数量必须是100股的整数倍（1手）\n当前：${shares}股\n建议调整为：${Math.ceil(shares / 100) * 100}股`,
    };
  }

  return { canTrade: true };
}

// ===================== 获取交易规则 =====================

export function getTradingRules(market?: string): TradingRules {
  const m = (market || 'SH').toUpperCase();
  if (m === 'US') {
    return { t1: false, limitUp: 0, limitDown: 0, minUnit: 1 };
  }
  if (m === 'HK') {
    return { t1: false, limitUp: 0, limitDown: 0, minUnit: 1 };
  }
  return { t1: true, limitUp: 0.10, limitDown: -0.10, minUnit: 100 };
}

export function getTradingRulesDescription(market?: string): string[] {
  const m = (market || 'SH').toUpperCase();
  if (m === 'US') {
    return [
      '• T+0交易：买入后可立即卖出',
      '• 最小交易单位：1股',
      '• 无涨跌停限制',
      '• 交易费用：',
      '  - 佣金约万3，最低约¥7',
      '  - 卖出时收取SEC费（极低）',
    ];
  }
  if (m === 'HK') {
    return [
      '• T+0交易：买入后可立即卖出',
      '• 最小交易单位：1股（简化规则）',
      '• 无涨跌停限制',
      '• 交易费用：',
      '  - 印花税：买卖双向0.13%',
      '  - 佣金约万3，最低¥3',
      '  - 交易征费+交易费',
    ];
  }
  return [
    '• T+1交易规则：今日买入的股票，明日才能卖出',
    '• 最小交易单位：100股（1手）',
    '• 涨跌停限制：主板±10%，创业板/科创板±20%',
    '• 交易费用：',
    '  - 买入：佣金万2.5 + 过户费（约0.3‰）',
    '  - 卖出：佣金万2.5 + 过户费 + 印花税0.1%（约1.3‰）',
    '  - 佣金最低5元',
  ];
}

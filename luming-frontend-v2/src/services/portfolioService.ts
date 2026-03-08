import type { Holding, PortfolioAnalysis, AddHoldingRequest } from '../types';
import { schedulePush } from './syncService';

const STORAGE_KEY = 'lm_holdings';

export class PortfolioService {
  // 获取持仓列表
  getHoldings(): Holding[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load holdings:', error);
    }
    return [];
  }

  // 保存持仓列表（变更后自动同步到服务端）
  private saveHoldings(holdings: Holding[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    schedulePush();
  }

  // 添加持仓
  addHolding(request: AddHoldingRequest): Holding {
    const holdings = this.getHoldings();

    const newHolding: Holding = {
      id: `${request.code}_${Date.now()}`,
      code: request.code,
      name: request.name,
      market: request.market,
      costPrice: request.costPrice,
      quantity: request.quantity,
      purchaseDate: request.purchaseDate,
    };

    holdings.push(newHolding);
    this.saveHoldings(holdings);

    return newHolding;
  }

  // 更新持仓
  updateHolding(id: string, updates: Partial<Holding>): void {
    const holdings = this.getHoldings();
    const index = holdings.findIndex((h) => h.id === id);

    if (index !== -1) {
      holdings[index] = { ...holdings[index], ...updates };
      this.saveHoldings(holdings);
    }
  }

  // 删除持仓
  removeHolding(id: string): void {
    const holdings = this.getHoldings().filter((h) => h.id !== id);
    this.saveHoldings(holdings);
  }

  // 清空持仓
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // 计算持仓收益
  calculateProfit(holding: Holding, currentPrice: number): {
    profit: number;
    profitPct: number;
    currentValue: number;
    costValue: number;
  } {
    const costValue = holding.costPrice * holding.quantity;
    const currentValue = currentPrice * holding.quantity;
    const profit = currentValue - costValue;
    const profitPct = costValue > 0 ? (profit / costValue) * 100 : 0;

    return { profit, profitPct, currentValue, costValue };
  }

  // 获取投资组合分析
  async analyzePortfolio(holdings: Holding[]): Promise<PortfolioAnalysis | null> {
    // 统一使用相对路径
    try {
      const response = await fetch(`/api/portfolio/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to analyze portfolio:', error);
      return null;
    }
  }
}

export const portfolioService = new PortfolioService();

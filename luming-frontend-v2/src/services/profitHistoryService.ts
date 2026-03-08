/**
 * 收益历史追踪服务
 * 用于记录和查询投资组合价值变化历史
 */

export interface ProfitSnapshot {
  timestamp: number;        // 时间戳
  date: string;             // 格式化日期 MM-DD
  totalValue: number;       // 总资产
  totalCost: number;        // 总成本
  totalProfit: number;      // 总收益
  totalProfitPct: number;   // 收益率%
  holdingsCount: number;    // 持仓数量
}

const STORAGE_KEY = 'lm_profit_history';
const MAX_SNAPSHOTS = 90;   // 最多保存90天数据
const SNAPSHOT_INTERVAL = 1000 * 60 * 60; // 1小时快照间隔

class ProfitHistoryService {
  /**
   * 获取所有历史快照
   */
  getSnapshots(): ProfitSnapshot[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load profit history:', error);
    }
    return [];
  }

  /**
   * 保存快照列表
   */
  private saveSnapshots(snapshots: ProfitSnapshot[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }

  /**
   * 添加新的快照
   */
  addSnapshot(snapshot: Omit<ProfitSnapshot, 'timestamp' | 'date'>): void {
    const snapshots = this.getSnapshots();
    const now = Date.now();

    // 检查是否需要添加新快照（距离上次快照至少1小时）
    const lastSnapshot = snapshots[0];
    if (lastSnapshot && now - lastSnapshot.timestamp < SNAPSHOT_INTERVAL) {
      // 更新最新快照的数据
      snapshots[0] = {
        ...lastSnapshot,
        ...snapshot,
      };
      this.saveSnapshots(snapshots);
      return;
    }

    const newSnapshot: ProfitSnapshot = {
      ...snapshot,
      timestamp: now,
      date: new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    };

    // 添加到开头
    snapshots.unshift(newSnapshot);

    // 限制快照数量，保留最新的90天
    if (snapshots.length > MAX_SNAPSHOTS) {
      snapshots.splice(MAX_SNAPSHOTS);
    }

    this.saveSnapshots(snapshots);
  }

  /**
   * 获取最近N天的数据
   */
  getRecentDays(days: number = 7): ProfitSnapshot[] {
    const snapshots = this.getSnapshots();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // 过滤并按日期分组（每天只保留最后一个快照）
    const filtered = snapshots.filter(s => s.timestamp >= cutoff);

    // 按日期去重，保留每天最新的数据
    const byDate = new Map<string, ProfitSnapshot>();
    filtered.forEach(s => {
      const dateKey = new Date(s.timestamp).toDateString();
      const existing = byDate.get(dateKey);
      if (!existing || s.timestamp > existing.timestamp) {
        byDate.set(dateKey, s);
      }
    });

    return Array.from(byDate.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 获取图表数据（格式化为折线图所需格式）
   */
  getChartData(days: number = 7): Array<{ date: string; value: number }> {
    const snapshots = this.getRecentDays(days);

    if (snapshots.length === 0) {
      return [];
    }

    return snapshots.map(s => ({
      date: s.date,
      value: s.totalValue,
    }));
  }

  /**
   * 记录当前投资组合状态
   * 应该在每次加载持仓数据后调用
   */
  recordPortfolioState(stats: {
    totalValue: number;
    totalCost: number;
    totalProfit: number;
    totalProfitPct: number;
    holdingsCount: number;
  }): void {
    this.addSnapshot(stats);
  }

  /**
   * 清除所有历史数据
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSnapshots: number;
    dateRange: { start: string | null; end: string | null };
    bestDay: { date: string; value: number; profitPct: number } | null;
    worstDay: { date: string; value: number; profitPct: number } | null;
  } {
    const snapshots = this.getSnapshots();

    if (snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        dateRange: { start: null, end: null },
        bestDay: null,
        worstDay: null,
      };
    }

    const bestDay = snapshots.reduce((best, s) =>
      s.totalProfitPct > (best?.profitPct || -Infinity)
        ? { date: s.date, value: s.totalValue, profitPct: s.totalProfitPct }
        : best,
      null as { date: string; value: number; profitPct: number } | null
    );

    const worstDay = snapshots.reduce((worst, s) =>
      s.totalProfitPct < (worst?.profitPct || Infinity)
        ? { date: s.date, value: s.totalValue, profitPct: s.totalProfitPct }
        : worst,
      null as { date: string; value: number; profitPct: number } | null
    );

    return {
      totalSnapshots: snapshots.length,
      dateRange: {
        start: new Date(snapshots[snapshots.length - 1].timestamp).toLocaleDateString('zh-CN'),
        end: new Date(snapshots[0].timestamp).toLocaleDateString('zh-CN'),
      },
      bestDay,
      worstDay,
    };
  }
}

export const profitHistoryService = new ProfitHistoryService();

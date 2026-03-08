import type { WatchlistItem } from '../types';
import { schedulePush } from './syncService';

const STORAGE_KEY = 'lm_watchlist';

export class WatchlistService {
  // 获取自选股列表
  getItems(): WatchlistItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
    return [];
  }

  // 保存自选股列表（变更后自动同步到服务端）
  private saveItems(items: WatchlistItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    schedulePush();
  }

  // 添加自选股
  addItem(item: Omit<WatchlistItem, 'addedAt'>): void {
    const items = this.getItems();

    // 检查是否已存在
    const exists = items.some((i) => i.code === item.code);
    if (exists) {
      return; // 已存在，不重复添加
    }

    const newItem: WatchlistItem = {
      ...item,
      addedAt: Date.now(),
    };

    items.push(newItem);
    this.saveItems(items);
  }

  // 批量添加
  addItems(newItems: Array<Omit<WatchlistItem, 'addedAt'>>): void {
    const items = this.getItems();
    const existingCodes = new Set(items.map((i) => i.code));

    newItems.forEach((item) => {
      if (!existingCodes.has(item.code)) {
        items.push({
          ...item,
          addedAt: Date.now(),
        });
        existingCodes.add(item.code);
      }
    });

    this.saveItems(items);
  }

  // 移除自选股
  removeItem(code: string): void {
    const items = this.getItems().filter((i) => i.code !== code);
    this.saveItems(items);
  }

  // 检查是否在自选中
  isInWatchlist(code: string): boolean {
    return this.getItems().some((i) => i.code === code);
  }

  // 更新自选股（支持修改分组等）
  updateItem(code: string, updates: Partial<WatchlistItem>): void {
    const items = this.getItems();
    const index = items.findIndex((i) => i.code === code);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveItems(items);
    }
  }

  // 清空自选股
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const watchlistService = new WatchlistService();

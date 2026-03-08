import type { Market } from './stock';

// 自选股项
export interface WatchlistItem {
  code: string;
  name: string;
  market: Market;
  addedAt: number;  // 添加时间戳
  groupId?: string;  // 分组ID
}

// 自选股列表（带实时价格）
export interface WatchlistItemWithPrice extends WatchlistItem {
  price?: number;
  change?: number;
  changePct?: number;
}

// 添加自选股请求
export interface AddWatchlistRequest {
  code: string;
  name: string;
  market: Market;
}

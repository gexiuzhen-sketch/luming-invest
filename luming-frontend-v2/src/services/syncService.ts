/**
 * 数据同步服务
 * 将用户的自选、持仓、模拟盘数据同步到后端，支持跨设备/浏览器访问
 *
 * 同步策略：
 * - 拉取（pull）：登录后从服务器拉取数据，合并到本地（服务器数据优先）
 * - 推送（push）：数据发生变化后 debounce 1.5s 推送到服务器
 * - 离线降级：后端不可达时静默失败，数据仍存储在 localStorage
 */

const SYNC_BASE = '/api/user-data';
const SYNC_DEBOUNCE_MS = 1500;

export interface SyncPayload {
  watchlist: unknown[];
  watchlistGroups: unknown[];
  holdings: unknown[];
  simTrading: unknown;
  tradingDiary: unknown[];
  syncedAt: string;
}

// ─── 读取本地数据 ──────────────────────────────────────────────

export function getSyncPayload(): SyncPayload {
  const get = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  return {
    watchlist: get('lm_watchlist') ?? [],
    watchlistGroups: get('watchlist_groups') ?? [],
    holdings: get('lm_holdings') ?? [],
    simTrading: get('simulatedTrading') ?? null,
    tradingDiary: get('trading_diary') ?? [],
    syncedAt: new Date().toISOString(),
  };
}

// ─── 应用远端数据到本地 ────────────────────────────────────────

export function applySyncPayload(payload: SyncPayload): void {
  const set = (key: string, value: unknown) => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  if (Array.isArray(payload.watchlist) && payload.watchlist.length > 0) {
    set('lm_watchlist', payload.watchlist);
  }
  if (Array.isArray(payload.watchlistGroups) && payload.watchlistGroups.length > 0) {
    set('watchlist_groups', payload.watchlistGroups);
  }
  if (Array.isArray(payload.holdings) && payload.holdings.length > 0) {
    set('lm_holdings', payload.holdings);
  }
  if (payload.simTrading) {
    set('simulatedTrading', payload.simTrading);
  }
  if (Array.isArray(payload.tradingDiary) && payload.tradingDiary.length > 0) {
    set('trading_diary', payload.tradingDiary);
  }
}

// ─── 网络请求 ──────────────────────────────────────────────────

export async function pullSync(username: string): Promise<SyncPayload | null> {
  try {
    const res = await fetch(`${SYNC_BASE}/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as SyncPayload;
  } catch {
    return null;
  }
}

export async function pushSync(username: string, payload?: SyncPayload): Promise<boolean> {
  try {
    const data = payload ?? getSyncPayload();
    const res = await fetch(`${SYNC_BASE}/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Debounce 推送 ─────────────────────────────────────────────

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 安排一次延迟推送（数据变化后调用）
 * 自动从 localStorage 读取当前用户名，未登录时静默忽略
 */
export function schedulePush(username?: string) {
  const resolvedUsername = username ?? localStorage.getItem('lm_username');
  if (!resolvedUsername) return;  // 未登录，不同步

  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    pushSync(resolvedUsername);
  }, SYNC_DEBOUNCE_MS);
}

// LocalStorage utility functions
import type { User, WatchlistItem, Holding } from '../types';

const STORAGE_KEYS = {
  USER: 'lm_user',
  WATCHLIST: 'lm_watchlist',
  HOLDINGS: 'lm_holdings',
} as const;

export function getStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Storage get error:', error);
    return null;
  }
}

export function setStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Storage set error:', error);
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Storage remove error:', error);
  }
}

export const storage = {
  // User
  getUser: (): User | null => getStorage<User>(STORAGE_KEYS.USER),
  setUser: (user: User) => setStorage(STORAGE_KEYS.USER, user),
  removeUser: () => removeStorage(STORAGE_KEYS.USER),

  // Watchlist
  getWatchlist: (): WatchlistItem[] => getStorage<WatchlistItem[]>(STORAGE_KEYS.WATCHLIST) || [],
  setWatchlist: (list: WatchlistItem[]) => setStorage(STORAGE_KEYS.WATCHLIST, list),
  removeWatchlist: () => removeStorage(STORAGE_KEYS.WATCHLIST),

  // Holdings
  getHoldings: (): Holding[] => getStorage<Holding[]>(STORAGE_KEYS.HOLDINGS) || [],
  setHoldings: (list: Holding[]) => setStorage(STORAGE_KEYS.HOLDINGS, list),
  removeHoldings: () => removeStorage(STORAGE_KEYS.HOLDINGS),
};

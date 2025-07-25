/**
 * Search history management for void pallet
 */

export interface SearchHistoryItem {
  id: string;
  value: string;
  type: 'qr' | 'pallet_num';
  timestamp: Date;
  palletInfo?: {
    plt_num: string;
    product_code: string;
    product_qty: number;
  };
}

const STORAGE_KEY = 'void-pallet-search-history';
const MAX_HISTORY_ITEMS = 20;

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const rawItems = JSON.parse(stored) as unknown[];
    // Convert timestamp strings back to Date objects
    // 策略4: unknown + type narrowing - 安全轉換 localStorage 數據
    return rawItems.map((rawItem: unknown): SearchHistoryItem => {
      if (!rawItem || typeof rawItem !== 'object') {
        return {
          id: '',
          value: '',
          type: 'qr' as const,
          timestamp: new Date(),
        };
      }
      const item = rawItem as Record<string, unknown>;
      return {
        id: typeof item.id === 'string' ? item.id : '',
        value: typeof item.value === 'string' ? item.value : '',
        type:
          typeof item.type === 'string' && (item.type === 'qr' || item.type === 'pallet_num')
            ? (item.type as 'qr' | 'pallet_num')
            : 'qr',
        timestamp: item.timestamp ? new Date(item.timestamp as string) : new Date(),
        palletInfo:
          item.palletInfo && typeof item.palletInfo === 'object'
            ? (() => {
                const palletObj = item.palletInfo as Record<string, unknown>;
                return {
                  plt_num: typeof palletObj.plt_num === 'string' ? palletObj.plt_num : '',
                  product_code:
                    typeof palletObj.product_code === 'string' ? palletObj.product_code : '',
                  product_qty:
                    typeof palletObj.product_qty === 'number' ? palletObj.product_qty : 0,
                };
              })()
            : undefined,
      };
    });
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
}

/**
 * Add item to search history
 */
export function addToSearchHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();

    // Check if already exists
    const existingIndex = history.findIndex(h => h.value === item.value);
    if (existingIndex !== -1) {
      // Move to top
      history.splice(existingIndex, 1);
    }

    // Add new item at the beginning
    const newItem: SearchHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    history.unshift(newItem);

    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

/**
 * Remove item from search history
 */
export function removeFromSearchHistory(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from search history:', error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

/**
 * Get recent search suggestions based on input
 */
export function getSearchSuggestions(input: string, limit: number = 5): SearchHistoryItem[] {
  if (!input.trim()) return [];

  const history = getSearchHistory();
  const inputLower = input.toLowerCase();

  return history
    .filter(
      item =>
        item.value.toLowerCase().includes(inputLower) ||
        item.palletInfo?.product_code.toLowerCase().includes(inputLower)
    )
    .slice(0, limit);
}

/**
 * Get frequently searched items
 */
export function getFrequentSearches(limit: number = 5): Array<{
  value: string;
  count: number;
  lastUsed: Date;
}> {
  const history = getSearchHistory();
  const frequencyMap = new Map<string, { count: number; lastUsed: Date }>();

  history.forEach(item => {
    const existing = frequencyMap.get(item.value);
    if (existing) {
      existing.count++;
      if (item.timestamp > existing.lastUsed) {
        existing.lastUsed = item.timestamp;
      }
    } else {
      frequencyMap.set(item.value, {
        count: 1,
        lastUsed: item.timestamp,
      });
    }
  });

  return Array.from(frequencyMap.entries())
    .map(([value, data]) => ({ value, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

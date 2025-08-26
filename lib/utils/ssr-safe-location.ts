/**
 * SSR-Safe Location Utilities
 * 提供安全的 window.location 存取方法，防止 SSR 錯誤
 */

export interface SafeLocation {
  protocol?: string;
  host?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  href?: string;
  origin?: string;
}

/**
 * 安全地獲取 window.location 物件，在 SSR 環境中返回預設值
 */
export const getSafeLocation = (): SafeLocation => {
  if (typeof window === 'undefined' || !window.location) {
    // SSR 環境中返回空物件
    return {};
  }

  try {
    // 避免解構賦值，改為逐個屬性存取
    const location = window.location;
    return {
      protocol: location.protocol,
      host: location.host,
      hostname: location.hostname,
      port: location.port,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      href: location.href,
      origin: location.origin,
    };
  } catch (error) {
    console.warn('[SSR-Safe] Failed to access window.location:', error);
    return {};
  }
};

/**
 * 安全地解構 window.location 屬性
 * 使用方式: const { protocol, host } = destructureLocation();
 */
export const destructureLocation = (): SafeLocation => {
  return getSafeLocation();
};

/**
 * 獲取當前協議，在 SSR 中返回 'https'
 */
export const getSafeProtocol = (): string => {
  if (typeof window === 'undefined') {
    return 'https:'; // SSR 預設
  }
  return window.location.protocol;
};

/**
 * 獲取當前主機名，在 SSR 中返回空字串
 */
export const getSafeHostname = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hostname;
};

/**
 * 獲取當前完整 URL，在 SSR 中返回空字串
 */
export const getSafeHref = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href;
};

/**
 * 獲取當前路徑，在 SSR 中返回 '/'
 */
export const getSafePathname = (): string => {
  if (typeof window === 'undefined') {
    return '/';
  }
  return window.location.pathname;
};

/**
 * 安全地替換瀏覽器歷史記錄
 */
export const safeReplaceState = (url: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.history.replaceState({}, document.title, url);
  } catch (error) {
    console.warn('[SSR-Safe] Failed to replace state:', error);
  }
};

/**
 * 安全地重新載入頁面
 */
export const safeReload = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.location.reload();
  } catch (error) {
    console.warn('[SSR-Safe] Failed to reload:', error);
  }
};

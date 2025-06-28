/**
 * 智能緩存管理系統
 * 管理用戶數據、頭像和權限的緩存
 */

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  icon_url?: string | null;
  role?: string;
}

interface UserPermissions {
  navigationRestricted: boolean;
  allowedRoutes: string[];
  features: string[];
}

export class NavigationCacheManager {
  private userDataCache = new Map<string, CachedData<UserData>>();
  private avatarCache = new Map<string, string>();
  private permissionsCache = new Map<string, CachedData<UserPermissions>>();
  private avatarBlobCache = new Map<string, Blob>();
  
  // 默認 TTL 5分鐘
  private readonly DEFAULT_TTL = 5 * 60 * 1000;
  
  constructor() {
    // 定期清理過期緩存
    this.startCacheCleanup();
  }
  
  async getUserData(userId: string): Promise<UserData | null> {
    // 檢查緩存
    const cached = this.userDataCache.get(userId);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    // 緩存未命中或已過期
    return null;
  }
  
  setUserData(userId: string, data: UserData, ttl?: number): void {
    this.userDataCache.set(userId, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }
  
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    const cached = this.permissionsCache.get(userId);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    return null;
  }
  
  setUserPermissions(userId: string, permissions: UserPermissions, ttl?: number): void {
    this.permissionsCache.set(userId, {
      data: permissions,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }
  
  async getAvatarUrl(userId: string): Promise<string | null> {
    return this.avatarCache.get(userId) || null;
  }
  
  async setAvatarUrl(userId: string, url: string): Promise<void> {
    this.avatarCache.set(userId, url);
    
    // 預加載頭像到 Blob 緩存
    this.preloadAvatarBlob(url);
  }
  
  private async preloadAvatarBlob(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        this.avatarBlobCache.set(url, blob);
      }
    } catch (error) {
      console.error('Failed to preload avatar:', error);
    }
  }
  
  async getOptimizedAvatar(userId: string, size: number = 40): Promise<string> {
    const cachedUrl = await this.getAvatarUrl(userId);
    if (cachedUrl) {
      return cachedUrl;
    }
    
    // 檢測瀏覽器支援的圖片格式
    const supportsWebP = await this.checkWebPSupport();
    const supportsAvif = await this.checkAvifSupport();
    
    let format = 'png';
    if (supportsAvif) format = 'avif';
    else if (supportsWebP) format = 'webp';
    
    const optimizedUrl = `/api/avatars/${userId}.${format}?size=${size}&quality=80`;
    
    // 緩存優化後的 URL
    await this.setAvatarUrl(userId, optimizedUrl);
    
    return optimizedUrl;
  }
  
  private async checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
  
  private async checkAvifSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }
  
  private isExpired<T>(cached: CachedData<T>): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }
  
  private startCacheCleanup(): void {
    // 每分鐘清理一次過期緩存
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 1000);
  }
  
  private cleanupExpiredCache(): void {
    // 清理用戶數據緩存
    this.userDataCache.forEach((cached, key) => {
      if (this.isExpired(cached)) {
        this.userDataCache.delete(key);
      }
    });
    
    // 清理權限緩存
    this.permissionsCache.forEach((cached, key) => {
      if (this.isExpired(cached)) {
        this.permissionsCache.delete(key);
      }
    });
    
    // 頭像緩存根據大小限制清理
    if (this.avatarBlobCache.size > 50) {
      // 保留最近的 50 個頭像
      const entries = Array.from(this.avatarBlobCache.entries());
      const toRemove = entries.slice(0, entries.length - 50);
      toRemove.forEach(([key]) => {
        this.avatarBlobCache.delete(key);
      });
    }
  }
  
  // 預熱緩存
  async warmupCache(userIds: string[]): Promise<void> {
    const promises = userIds.map(async (userId) => {
      // 預加載頭像
      await this.getOptimizedAvatar(userId);
    });
    
    await Promise.all(promises);
  }
  
  // 清除特定用戶的緩存
  clearUserCache(userId: string): void {
    this.userDataCache.delete(userId);
    this.avatarCache.delete(userId);
    this.permissionsCache.delete(userId);
  }
  
  // 清除所有緩存
  clearAllCache(): void {
    this.userDataCache.clear();
    this.avatarCache.clear();
    this.permissionsCache.clear();
    this.avatarBlobCache.clear();
  }
  
  // 獲取緩存統計
  getCacheStats(): {
    userDataCount: number;
    avatarCount: number;
    permissionsCount: number;
    avatarBlobCount: number;
    totalSize: number;
  } {
    return {
      userDataCount: this.userDataCache.size,
      avatarCount: this.avatarCache.size,
      permissionsCount: this.permissionsCache.size,
      avatarBlobCount: this.avatarBlobCache.size,
      totalSize: this.estimateCacheSize()
    };
  }
  
  private estimateCacheSize(): number {
    // 粗略估計緩存大小（字節）
    let size = 0;
    
    // 用戶數據（假設每個約 1KB）
    size += this.userDataCache.size * 1024;
    
    // 權限數據（假設每個約 500B）
    size += this.permissionsCache.size * 500;
    
    // 頭像 URL（假設每個約 100B）
    size += this.avatarCache.size * 100;
    
    // 頭像 Blob（假設每個約 50KB）
    size += this.avatarBlobCache.size * 50 * 1024;
    
    return size;
  }
}

// 創建單例實例
export const navigationCacheManager = new NavigationCacheManager();
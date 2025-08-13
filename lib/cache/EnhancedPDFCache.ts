/**
 * Enhanced PDF Cache System
 * Improved caching for 40-50 PDFs/day with better hit tracking
 */

import * as crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
  hash: string;
  size: number;
}

interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  entries: number;
  totalSize: number;
  avgAccessTime: number;
}

export class EnhancedPDFCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0
  };
  
  // Configuration
  private readonly maxSize: number; // Max cache size in bytes
  private readonly maxEntries: number; // Max number of entries
  private readonly defaultTTL: number; // Default TTL in milliseconds
  
  constructor(options?: {
    maxSize?: number;
    maxEntries?: number;
    defaultTTL?: number;
  }) {
    this.maxSize = options?.maxSize || 100 * 1024 * 1024; // 100MB default
    this.maxEntries = options?.maxEntries || 200; // 200 entries default
    this.defaultTTL = options?.defaultTTL || 60 * 60 * 1000; // 1 hour default
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Generate hash for content
   */
  private generateHash(content: string | ArrayBuffer): string {
    const buffer = typeof content === 'string' 
      ? Buffer.from(content) 
      : Buffer.from(content);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: T): number {
    const str = JSON.stringify(data);
    return Buffer.byteLength(str, 'utf8');
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const startTime = Date.now();
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.recordAccessTime(Date.now() - startTime);
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      this.stats.misses++;
      this.recordAccessTime(Date.now() - startTime);
      return null;
    }

    // Update hit stats
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.recordAccessTime(Date.now() - startTime);
    
    return entry.data;
  }

  /**
   * Get by content hash (for duplicate detection)
   */
  getByContent(content: string | ArrayBuffer): T | null {
    const hash = this.generateHash(content);
    
    // Search for entry with matching hash
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hash === hash) {
        return this.get(key);
      }
    }
    
    return null;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, content?: string | ArrayBuffer): void {
    const size = this.calculateSize(data);
    
    // Check size limits
    if (size > this.maxSize) {
      console.warn(`Cache entry too large: ${size} bytes`);
      return;
    }

    // Evict if necessary
    this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
      hash: content ? this.generateHash(content) : '',
      size
    };

    this.cache.set(key, entry);
  }

  /**
   * Evict entries if needed (LRU strategy)
   */
  private evictIfNeeded(newSize: number): void {
    // Check entry count
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    // Check total size
    let totalSize = this.getTotalSize();
    while (totalSize + newSize > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
      totalSize = this.getTotalSize();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Get total cache size
   */
  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Record access time for statistics
   */
  private recordAccessTime(time: number): void {
    this.stats.totalAccessTime += time;
    this.stats.accessCount++;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const avgAccessTime = this.stats.accessCount > 0 
      ? this.stats.totalAccessTime / this.stats.accessCount 
      : 0;

    return {
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100),
      entries: this.cache.size,
      totalSize: this.getTotalSize(),
      avgAccessTime: Math.round(avgAccessTime)
    };
  }

  /**
   * Get detailed cache entries info
   */
  getEntriesInfo(): Array<{
    key: string;
    hits: number;
    age: number;
    size: number;
  }> {
    const now = Date.now();
    const entries: Array<{
      key: string;
      hits: number;
      age: number;
      size: number;
    }> = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        hits: entry.hits,
        age: Math.round((now - entry.timestamp) / 1000), // Age in seconds
        size: entry.size
      });
    }

    // Sort by hits (most used first)
    return entries.sort((a, b) => b.hits - a.hits);
  }

  /**
   * Clear expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        expired.push(key);
      }
    }

    for (const key of expired) {
      this.cache.delete(key);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Warm cache with frequently used patterns
   */
  async warmCache(patterns: Array<{ key: string; data: T; content?: string | ArrayBuffer }>): Promise<void> {
    for (const pattern of patterns) {
      this.set(pattern.key, pattern.data, pattern.content);
    }
  }

  /**
   * Export cache for persistence
   */
  export(): string {
    const exportData = {
      entries: Array.from(this.cache.entries()),
      stats: this.stats,
      timestamp: Date.now()
    };
    return JSON.stringify(exportData);
  }

  /**
   * Import cache from persistence
   */
  import(data: string): void {
    try {
      const importData = JSON.parse(data);
      
      // Clear existing cache
      this.cache.clear();
      
      // Import entries
      for (const [key, entry] of importData.entries) {
        this.cache.set(key, entry);
      }
      
      // Import stats
      if (importData.stats) {
        this.stats = importData.stats;
      }
    } catch (error) {
      console.error('Failed to import cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0
    };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton for PDF analysis results
export const pdfAnalysisCache = new EnhancedPDFCache({
  maxSize: 50 * 1024 * 1024, // 50MB for PDF analysis
  maxEntries: 100, // Store up to 100 analyses
  defaultTTL: 2 * 60 * 60 * 1000 // 2 hours TTL
});

// Export type
export type { CacheEntry, CacheStats };
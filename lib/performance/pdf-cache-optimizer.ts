/**
 * PDF Cache Optimizer
 * Advanced caching system for PDF extraction with LRU eviction and compression
 */

import * as crypto from 'crypto';
import { systemLogger } from '@/lib/logger';
import { ExtractedPDFData } from '@/app/services/pdfExtractionService';

export interface PDFCacheEntry {
  fileHash: string;
  fileName: string;
  fileSize: number;
  extractedData: ExtractedPDFData;
  orderData?: Record<string, unknown> | null;
  tokensUsed: number;
  extractionTime: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  compressed: boolean;
  compressionRatio?: number;
}

export interface CacheStatistics {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionSavingsBytes: number;
  averageAccessTime: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  maxSizeBytes: number;
  maxEntries: number;
  ttlSeconds: number;
  compressionThreshold: number;
  evictionStrategy: 'lru' | 'lfu' | 'fifo';
  enableCompression: boolean;
}

/**
 * PDF Cache Optimizer Class
 * Implements advanced caching with LRU eviction and compression
 */
export class PDFCacheOptimizer {
  private static instance: PDFCacheOptimizer;

  private cache: Map<string, PDFCacheEntry> = new Map();
  private accessOrder: string[] = [];
  private config: CacheConfig;
  private statistics: CacheStatistics;

  // Performance tracking
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private totalAccessTime = 0;
  private accessCount = 0;

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSizeBytes: 100 * 1024 * 1024, // 100MB default
      maxEntries: 100,
      ttlSeconds: 1800, // 30 minutes
      compressionThreshold: 10 * 1024, // Compress if > 10KB
      evictionStrategy: 'lru',
      enableCompression: true,
      ...config,
    };

    this.statistics = this.initializeStatistics();

    // Start cleanup timer
    this.startCleanupTimer();

    systemLogger.info(
      {
        config: this.config,
      },
      '[PDFCacheOptimizer] Cache optimizer initialized'
    );
  }

  public static getInstance(config?: Partial<CacheConfig>): PDFCacheOptimizer {
    if (!PDFCacheOptimizer.instance) {
      PDFCacheOptimizer.instance = new PDFCacheOptimizer(config);
    }
    return PDFCacheOptimizer.instance;
  }

  /**
   * Initialize statistics
   */
  private initializeStatistics(): CacheStatistics {
    return {
      totalEntries: 0,
      totalSizeBytes: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      compressionSavingsBytes: 0,
      averageAccessTime: 0,
      oldestEntry: 0,
      newestEntry: 0,
    };
  }

  /**
   * Generate file hash
   */
  public generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get cached PDF data
   */
  public get(fileHash: string): PDFCacheEntry | null {
    const startTime = Date.now();
    const entry = this.cache.get(fileHash);

    if (!entry) {
      this.misses++;
      this.updateStatistics();
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(fileHash);
      this.removeFromAccessOrder(fileHash);
      this.misses++;
      this.updateStatistics();

      systemLogger.debug(
        {
          fileHash,
          age: Date.now() - entry.createdAt,
        },
        '[PDFCacheOptimizer] Cache entry expired'
      );

      return null;
    }

    // Update access tracking
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.updateAccessOrder(fileHash);

    // Track performance
    this.hits++;
    const accessTime = Date.now() - startTime;
    this.totalAccessTime += accessTime;
    this.accessCount++;

    this.updateStatistics();

    systemLogger.debug(
      {
        fileHash,
        fileName: entry.fileName,
        accessCount: entry.accessCount,
        accessTime,
        compressed: entry.compressed,
      },
      '[PDFCacheOptimizer] Cache hit'
    );

    return this.decompressEntry(entry);
  }

  /**
   * Set cached PDF data
   */
  public set(
    fileHash: string,
    fileName: string,
    fileSize: number,
    extractedData: ExtractedPDFData,
    orderData: Record<string, unknown> | null,
    tokensUsed: number,
    extractionTime: number
  ): void {
    // Check if we need to evict entries
    this.enforceConstraints();

    // Create cache entry
    let entry: PDFCacheEntry = {
      fileHash,
      fileName,
      fileSize,
      extractedData,
      orderData: orderData || undefined,
      tokensUsed,
      extractionTime,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      compressed: false,
    };

    // Compress if needed
    if (this.config.enableCompression && this.shouldCompress(entry)) {
      entry = this.compressEntry(entry);
    }

    // Add to cache
    this.cache.set(fileHash, entry);
    this.updateAccessOrder(fileHash);

    this.updateStatistics();

    systemLogger.info(
      {
        fileHash,
        fileName,
        fileSize,
        tokensUsed,
        extractionTime,
        compressed: entry.compressed,
        compressionRatio: entry.compressionRatio,
        cacheSize: this.cache.size,
      },
      '[PDFCacheOptimizer] Cache entry added'
    );
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: PDFCacheEntry): boolean {
    const age = (Date.now() - entry.createdAt) / 1000;
    return age > this.config.ttlSeconds;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(fileHash: string): void {
    const index = this.accessOrder.indexOf(fileHash);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(fileHash);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(fileHash: string): void {
    const index = this.accessOrder.indexOf(fileHash);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Enforce cache constraints
   */
  private enforceConstraints(): void {
    // Check entry count
    while (this.cache.size >= this.config.maxEntries) {
      this.evictEntry();
    }

    // Check size constraint
    while (this.getCurrentSizeBytes() >= this.config.maxSizeBytes) {
      this.evictEntry();
    }
  }

  /**
   * Evict an entry based on strategy
   */
  private evictEntry(): void {
    let keyToEvict: string | undefined;

    switch (this.config.evictionStrategy) {
      case 'lru':
        keyToEvict = this.accessOrder[0];
        break;

      case 'lfu':
        keyToEvict = this.getLeastFrequentlyUsed();
        break;

      case 'fifo':
        keyToEvict = this.getOldestEntry();
        break;
    }

    if (keyToEvict) {
      const entry = this.cache.get(keyToEvict);
      this.cache.delete(keyToEvict);
      this.removeFromAccessOrder(keyToEvict);
      this.evictions++;

      systemLogger.debug(
        {
          fileHash: keyToEvict,
          fileName: entry?.fileName,
          strategy: this.config.evictionStrategy,
          accessCount: entry?.accessCount,
          age: entry ? Date.now() - entry.createdAt : 0,
        },
        '[PDFCacheOptimizer] Entry evicted'
      );
    }
  }

  /**
   * Get least frequently used entry
   */
  private getLeastFrequentlyUsed(): string | undefined {
    let minAccessCount = Infinity;
    let keyToEvict: string | undefined;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  /**
   * Get oldest entry
   */
  private getOldestEntry(): string | undefined {
    let oldestTime = Infinity;
    let keyToEvict: string | undefined;

    for (const [key, entry] of this.cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  /**
   * Get current cache size in bytes
   */
  private getCurrentSizeBytes(): number {
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += this.estimateEntrySize(entry);
    }

    return totalSize;
  }

  /**
   * Estimate entry size in bytes
   */
  private estimateEntrySize(entry: PDFCacheEntry): number {
    // Base size estimation
    let size = entry.fileSize;

    // Add extracted data size
    size += JSON.stringify(entry.extractedData).length * 2; // UTF-16

    // Add order data size
    if (entry.orderData) {
      size += JSON.stringify(entry.orderData).length * 2;
    }

    // Add metadata overhead
    size += 1024; // Approximate overhead

    return size;
  }

  /**
   * Check if entry should be compressed
   */
  private shouldCompress(entry: PDFCacheEntry): boolean {
    const size = this.estimateEntrySize(entry);
    return size > this.config.compressionThreshold;
  }

  /**
   * Compress cache entry (simulated)
   */
  private compressEntry(entry: PDFCacheEntry): PDFCacheEntry {
    // In a real implementation, you would use zlib or similar
    // For now, we'll simulate compression by reducing text content

    const originalSize = this.estimateEntrySize(entry);

    // Compress text content (simplified)
    if (entry.extractedData.text.length > 1000) {
      // Store only essential parts for compressed version
      const compressedData = {
        ...entry.extractedData,
        text: entry.extractedData.text.substring(0, 500) + '...[compressed]',
        pages: entry.extractedData.pages.map(p => ({
          ...p,
          text: p.text.substring(0, 100) + '...[compressed]',
        })),
      };

      entry.extractedData = compressedData as ExtractedPDFData;
      entry.compressed = true;

      const compressedSize = this.estimateEntrySize(entry);
      entry.compressionRatio = 1 - compressedSize / originalSize;

      this.statistics.compressionSavingsBytes += originalSize - compressedSize;
    }

    return entry;
  }

  /**
   * Decompress cache entry (simulated)
   */
  private decompressEntry(entry: PDFCacheEntry): PDFCacheEntry {
    // In a real implementation, you would decompress the data
    // For now, we return as-is since we're using simplified compression
    return entry;
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    this.statistics.totalEntries = this.cache.size;
    this.statistics.totalSizeBytes = this.getCurrentSizeBytes();
    this.statistics.hitRate = this.hits / (this.hits + this.misses) || 0;
    this.statistics.missRate = this.misses / (this.hits + this.misses) || 0;
    this.statistics.evictionCount = this.evictions;

    if (this.accessCount > 0) {
      this.statistics.averageAccessTime = this.totalAccessTime / this.accessCount;
    }

    // Find oldest and newest entries
    let oldest = Infinity;
    let newest = 0;

    for (const entry of this.cache.values()) {
      if (entry.createdAt < oldest) oldest = entry.createdAt;
      if (entry.createdAt > newest) newest = entry.createdAt;
    }

    this.statistics.oldestEntry = oldest === Infinity ? 0 : oldest;
    this.statistics.newestEntry = newest;
  }

  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Clear cache
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.totalAccessTime = 0;
    this.accessCount = 0;
    this.statistics = this.initializeStatistics();

    systemLogger.info(
      {
        entriesCleared: size,
      },
      '[PDFCacheOptimizer] Cache cleared'
    );
  }

  /**
   * Invalidate specific entry
   */
  public invalidate(fileHash: string): boolean {
    const deleted = this.cache.delete(fileHash);
    if (deleted) {
      this.removeFromAccessOrder(fileHash);
      this.updateStatistics();
    }
    return deleted;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.updateStatistics();

      systemLogger.info(
        {
          cleanedCount,
          remainingEntries: this.cache.size,
        },
        '[PDFCacheOptimizer] Expired entries cleaned'
      );
    }
  }

  /**
   * Get cache summary
   */
  public getCacheSummary(): {
    entries: number;
    sizeBytes: number;
    sizeMB: string;
    hitRate: string;
    evictions: number;
    compressionSavingsMB: string;
    averageAccessTimeMs: string;
    ageRange: {
      oldest: string;
      newest: string;
    };
  } {
    const stats = this.getStatistics();

    return {
      entries: stats.totalEntries,
      sizeBytes: stats.totalSizeBytes,
      sizeMB: (stats.totalSizeBytes / 1024 / 1024).toFixed(2),
      hitRate: (stats.hitRate * 100).toFixed(1) + '%',
      evictions: stats.evictionCount,
      compressionSavingsMB: (stats.compressionSavingsBytes / 1024 / 1024).toFixed(2),
      averageAccessTimeMs: stats.averageAccessTime.toFixed(2),
      ageRange: {
        oldest: stats.oldestEntry ? new Date(stats.oldestEntry).toISOString() : 'N/A',
        newest: stats.newestEntry ? new Date(stats.newestEntry).toISOString() : 'N/A',
      },
    };
  }

  /**
   * Preload cache with frequently accessed files
   */
  public async preload(
    entries: Array<{
      fileHash: string;
      fileName: string;
      fileSize: number;
      extractedData: ExtractedPDFData;
      orderData: Record<string, unknown> | null;
      tokensUsed: number;
    }>
  ): Promise<void> {
    systemLogger.info(
      {
        count: entries.length,
      },
      '[PDFCacheOptimizer] Preloading cache entries'
    );

    for (const entry of entries) {
      this.set(
        entry.fileHash,
        entry.fileName,
        entry.fileSize,
        entry.extractedData,
        entry.orderData,
        entry.tokensUsed,
        0 // No extraction time for preloaded
      );
    }

    systemLogger.info(
      {
        loaded: entries.length,
        totalEntries: this.cache.size,
      },
      '[PDFCacheOptimizer] Cache preload complete'
    );
  }
}

// Export singleton instance getter
export const pdfCacheOptimizer = PDFCacheOptimizer.getInstance();

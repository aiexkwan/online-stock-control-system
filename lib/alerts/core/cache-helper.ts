/**
 * Cache Helper for Alert System
 * Provides Redis-like operations using Apollo Cache
 */

import { CacheAdapter } from '@/lib/cache/base-cache-adapter';

export class AlertCacheHelper {
  constructor(private cache: CacheAdapter) {}

  // Set operations (Redis SADD/SREM)
  async addToSet(key: string, ...members: string[]): Promise<void> {
    const set = await this.cache.get<string[]>(key) || [];
    members.forEach(member => {
      if (!set.includes(member)) {
        set.push(member);
      }
    });
    await this.cache.set(key, set, 3600);
  }

  async removeFromSet(key: string, ...members: string[]): Promise<void> {
    const set = await this.cache.get<string[]>(key) || [];
    const filtered = set.filter(m => !members.includes(m));
    await this.cache.set(key, filtered, 3600);
  }

  // Hash operations (Redis HGET/HSET/HINCRBY)
  async hashGet(key: string, field: string): Promise<string | null> {
    const hash = await this.cache.get<Record<string, string>>(key) || {};
    return hash[field] || null;
  }

  async hashSet(key: string, field: string, value: string): Promise<void> {
    const hash = await this.cache.get<Record<string, string>>(key) || {};
    hash[field] = value;
    await this.cache.set(key, hash, 3600);
  }

  async hashIncrement(key: string, field: string, increment: number = 1): Promise<number> {
    const hash = await this.cache.get<Record<string, string>>(key) || {};
    const current = parseInt(hash[field] || '0', 10);
    const newValue = current + increment;
    hash[field] = newValue.toString();
    await this.cache.set(key, hash, 3600);
    return newValue;
  }

  async hashMultiGet(key: string, ...fields: string[]): Promise<(string | null)[]> {
    const hash = await this.cache.get<Record<string, string>>(key) || {};
    return fields.map(field => hash[field] || null);
  }

  // Pattern operations
  async findKeys(pattern: string): Promise<string[]> {
    // Use ApolloCacheAdapter's keys method if available
    if ('keys' in this.cache && typeof this.cache.keys === 'function') {
      const cacheWithKeys = this.cache as CacheAdapter & { keys: (pattern: string) => Promise<string[]> };
      return await cacheWithKeys.keys(pattern);
    }
    return [];
  }

  async deleteMultiple(...keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.cache.delete(key)));
  }
}
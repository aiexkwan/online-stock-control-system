import { NextRequest, NextResponse } from 'next/server';
import { testRedisConnection, getRedisClient } from '@/lib/redis';
import { redisCacheAdapter } from '@/lib/graphql/redis-cache-adapter';

export async function GET(request: NextRequest) {
  try {
    // 測試基本 Redis 連接
    const isConnected = await testRedisConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        status: 'error',
        message: 'Redis connection failed',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // 測試 Redis 基本操作
    const redis = getRedisClient();
    const testKey = 'oscs:test:connection';
    const testValue = { message: 'Hello from Redis!', timestamp: Date.now() };

    // 寫入測試
    await redis.set(testKey, JSON.stringify(testValue), 'EX', 60);
    
    // 讀取測試
    const retrieved = await redis.get(testKey);
    const parsedValue = retrieved ? JSON.parse(retrieved) : null;

    // 測試緩存適配器
    const cacheKey = 'test:cache:adapter';
    const cacheValue = { test: 'cache adapter working', time: new Date().toISOString() };
    
    await redisCacheAdapter.set(cacheKey, cacheValue, 30);
    const cachedValue = await redisCacheAdapter.get(cacheKey);

    // 測試 ping
    const pingResult = await redis.ping();

    // 獲取 Redis 資訊
    const info = await redis.info('server');
    const memoryInfo = await redis.info('memory');

    return NextResponse.json({
      status: 'success',
      message: 'Redis connection and operations successful',
      tests: {
        basicConnection: isConnected,
        ping: pingResult === 'PONG',
        writeRead: parsedValue?.message === testValue.message,
        cacheAdapter: cachedValue?.test === cacheValue.test,
      },
      redis: {
        url: process.env.REDIS_URL ? 'configured' : 'not configured',
        environment: process.env.VERCEL ? 'vercel' : 'local',
        serverInfo: info.split('\r\n').slice(0, 5), // 只顯示前 5 行
        memoryUsage: memoryInfo.match(/used_memory_human:([^\r\n]+)/)?.[1]?.trim(),
      },
      cacheStats: await redisCacheAdapter.getStats(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Redis test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// 允許 POST 請求進行更深入的測試
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'basic' } = body;

    if (testType === 'stress') {
      // 壓力測試
      const results = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const key = `stress:test:${i}`;
        const value = { iteration: i, data: 'x'.repeat(100) };

        await redisCacheAdapter.set(key, value, 10);
        const retrieved = await redisCacheAdapter.get(key);
        const duration = Date.now() - start;

        results.push({
          iteration: i,
          duration,
          success: retrieved?.iteration === i,
        });
      }

      return NextResponse.json({
        status: 'success',
        testType: 'stress',
        results,
        summary: {
          total: iterations,
          avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / iterations,
          successRate: results.filter(r => r.success).length / iterations,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: 'error',
      message: `Unknown test type: ${testType}`,
    }, { status: 400 });

  } catch (error) {
    console.error('Redis POST test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis POST test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 
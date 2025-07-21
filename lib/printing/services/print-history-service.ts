/**
 * Print History Service
 * Manages print job history and statistics
 */

import { createClient } from '@/lib/supabase';
import { DatabaseRecord } from '@/types/database/tables';
import {
  PrintHistory,
  PrintStatistics,
  PrintType,
  PrintData,
  PrintOptions,
  PrintMetadata,
  PrintResult,
  PrintPriority,
  PaperSize,
} from '../types';

export interface HistoryFilter {
  userId?: string;
  type?: PrintType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class PrintHistoryService {
  private supabase = createClient();

  /**
   * Record a print job in history
   */
  async record(history: Omit<PrintHistory, 'id'>): Promise<void> {
    try {
      // Note: print_history table may not exist in current schema
      // Using record_history as alternative or skip if table doesn't exist
      const { error } = await this.supabase
        .from('record_history')
        .insert({
          action: history.type, // Map type to action
          remark: JSON.stringify(history.data), // Store data as remark
          time: history.createdAt,
          uuid: crypto.randomUUID(),
        })
        .single();

      if (error) {
        console.warn('[PrintHistoryService] Failed to record history:', {
          message: error.message || 'Unknown error',
          code: error.code,
          details: error.details,
          hint: error.hint || 'Table might not exist - history recording is optional',
        });
        // Don't throw - history recording should not block printing
      }
    } catch (error) {
      console.error('[PrintHistoryService] Error recording history:', error);
    }
  }

  /**
   * Get print history by ID
   */
  async getById(id: string): Promise<PrintHistory | null> {
    try {
      const { data, error } = await this.supabase
        .from('print_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('[PrintHistoryService] Error fetching history:', error);
      return null;
    }
  }

  /**
   * Query print history
   */
  async getHistory(filter: HistoryFilter): Promise<PrintHistory[]> {
    try {
      let query = this.supabase
        .from('print_history')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.userId) {
        query = query.eq('metadata->>userId', filter.userId);
      }

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate.toISOString());
      }

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[PrintHistoryService] Query error:', error);
        return [];
      }

      return (data || []).map(row => this.mapFromDatabase(row));
    } catch (error) {
      console.error('[PrintHistoryService] Error querying history:', error);
      return [];
    }
  }

  /**
   * Get print statistics
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<PrintStatistics> {
    try {
      // Get all records in date range
      const { data, error } = await this.supabase
        .from('print_history')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error || !data) {
        return this.getEmptyStatistics();
      }

      // Calculate statistics
      const totalJobs = data.length;
      const successful = data.filter(row => {
        const result = row.result as Record<string, unknown> | null;
        return result?.success === true;
      }).length;
      const successRate = totalJobs > 0 ? (successful / totalJobs) * 100 : 0;

      // Group by type
      const byType: Record<PrintType, number> = {} as Record<PrintType, number>;
      Object.values(PrintType).forEach(type => {
        byType[type] = 0;
      });

      // Group by user
      const byUser: Record<string, number> = {};

      // Calculate average time and group data
      let totalTime = 0;
      let timeCount = 0;

      data.forEach(row => {
        // Count by type
        const typeValue = String(row.type || '');
        if (typeValue in byType) {
          byType[typeValue as PrintType]++;
        }

        // Count by user
        const metadata = row.metadata as Record<string, unknown> | null;
        const userId = metadata?.userId as string;
        if (userId) {
          byUser[userId] = (byUser[userId] || 0) + 1;
        }

        // Calculate time if available
        const result = row.result as Record<string, unknown> | null;
        if (row.created_at && result?.printedAt) {
          const duration =
            new Date(result.printedAt as string).getTime() -
            new Date(String(row.created_at || new Date())).getTime();
          if (duration > 0) {
            totalTime += duration;
            timeCount++;
          }
        }
      });

      const averageTime = timeCount > 0 ? totalTime / timeCount : 0;
      const errorRate = totalJobs > 0 ? ((totalJobs - successful) / totalJobs) * 100 : 0;

      return {
        totalJobs,
        successRate,
        averageTime,
        byType,
        byUser,
        errorRate,
      };
    } catch (error) {
      console.error('[PrintHistoryService] Error calculating statistics:', error);
      return this.getEmptyStatistics();
    }
  }

  /**
   * Delete old history records
   */
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.supabase
        .from('print_history')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('[PrintHistoryService] Cleanup error:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`[PrintHistoryService] Cleaned up ${deletedCount} old records`);

      return deletedCount;
    } catch (error) {
      console.error('[PrintHistoryService] Error during cleanup:', error);
      return 0;
    }
  }

  // Private helper methods
  private mapFromDatabase(row: DatabaseRecord): PrintHistory {
    // 策略4: unknown + type narrowing - 安全類型轉換
    return {
      id: typeof row.id === 'string' ? row.id : '',
      jobId: typeof row.job_id === 'string' ? row.job_id : '',
      type: (() => {
        const typeValue = row.type;
        // 檢查是否為有效的 PrintType
        const validTypes = Object.values(PrintType);
        return validTypes.includes(typeValue as PrintType)
          ? (typeValue as PrintType)
          : PrintType.CUSTOM_DOCUMENT;
      })(),
      data: (() => {
        // PrintData 可以是任何形狀的對象，使用安全轉換
        if (row.data && typeof row.data === 'object') {
          return row.data as PrintData;
        }
        return {} as PrintData;
      })(),
      options: (() => {
        // PrintOptions 處理 - 提供默認值避免 undefined
        if (row.options && typeof row.options === 'object') {
          return row.options as PrintOptions;
        }
        // 返回默認的 PrintOptions 而不是 undefined
        return {
          copies: 1,
          priority: PrintPriority.NORMAL,
          paperSize: PaperSize.A4,
          colorMode: false,
          duplexMode: false,
        } as unknown as PrintOptions;
      })(),
      metadata: (() => {
        // PrintMetadata 處理
        if (row.metadata && typeof row.metadata === 'object') {
          return row.metadata as PrintMetadata;
        }
        return undefined;
      })(),
      result: (() => {
        // PrintResult 處理
        if (row.result && typeof row.result === 'object') {
          return row.result as PrintResult;
        }
        return { success: false, error: 'No result data' } as PrintResult;
      })(),
      createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    };
  }

  private getEmptyStatistics(): PrintStatistics {
    const byType: Record<PrintType, number> = {} as Record<PrintType, number>;
    Object.values(PrintType).forEach(type => {
      byType[type] = 0;
    });

    return {
      totalJobs: 0,
      successRate: 0,
      averageTime: 0,
      byType,
      byUser: {},
      errorRate: 0,
    };
  }
}

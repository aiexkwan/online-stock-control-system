/**
 * Print History Service
 * Manages print job history and statistics
 */

import { createClient } from '@/lib/supabase';
import { PrintHistory, PrintStatistics, PrintType } from '../types';

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
      const { error } = await this.supabase.from('print_history').insert({
        job_id: history.jobId,
        type: history.type,
        data: history.data,
        options: history.options,
        metadata: history.metadata,
        result: history.result,
        created_at: history.createdAt,
      });

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
      const successful = data.filter(row => row.result?.success).length;
      const successRate = totalJobs > 0 ? (successful / totalJobs) * 100 : 0;

      // Group by type
      const byType: Record<PrintType, number> = {} as any;
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
        if (row.type in byType) {
          byType[row.type as PrintType]++;
        }

        // Count by user
        const userId = row.metadata?.userId;
        if (userId) {
          byUser[userId] = (byUser[userId] || 0) + 1;
        }

        // Calculate time if available
        if (row.created_at && row.result?.printedAt) {
          const duration =
            new Date(row.result.printedAt).getTime() - new Date(row.created_at).getTime();
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
  private mapFromDatabase(row: any): PrintHistory {
    return {
      id: row.id,
      jobId: row.job_id,
      type: row.type,
      data: row.data,
      options: row.options,
      metadata: row.metadata,
      result: row.result,
      createdAt: row.created_at,
    };
  }

  private getEmptyStatistics(): PrintStatistics {
    const byType: Record<PrintType, number> = {} as any;
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

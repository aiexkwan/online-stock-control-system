import { createClient } from '@/app/utils/supabase/server';

interface AnomalyCheckResult {
  hasAnomaly: boolean;
  type?: 'RAPID_SCANNING' | 'UNUSUAL_PATTERN' | 'HIGH_ERROR_RATE';
  message?: string;
  severity?: 'warning' | 'error';
}

/**
 * Check for anomalous operation patterns
 */
export async function checkOperationAnomaly(
  _userId: string,
  _orderRef: string
): Promise<AnomalyCheckResult> {
  const supabase = await createClient();

  try {
    // Check 1: Rapid scanning detection (more than 10 scans in 1 minute)
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const { data: recentScans, error: scanError } = await supabase
      .from('order_loading_history')
      .select('*')
      .eq('action_by', _userId)
      .gte('action_time', oneMinuteAgo.toISOString())
      .order('action_time', { ascending: false });

    if (!scanError && recentScans && recentScans.length > 10) {
      return {
        hasAnomaly: true,
        type: 'RAPID_SCANNING',
        message: `⚡ Rapid scanning detected! ${recentScans.length} scans in the last minute. Please slow down to ensure accuracy.`,
        severity: 'warning',
      };
    }

    // Check 2: High error rate (more than 30% failed scans in last 10 attempts)
    const { data: recentAttempts } = await supabase
      .from('record_history')
      .select('*')
      .eq('id', parseInt(_userId))
      .in('action', ['Order Load', 'Order Load Failed'])
      .order('time', { ascending: false })
      .limit(10);

    if (recentAttempts && recentAttempts.length >= 5) {
      const failedCount = recentAttempts.filter(a => a.action === 'Order Load Failed').length;
      const errorRate = failedCount / recentAttempts.length;

      if (errorRate > 0.3) {
        return {
          hasAnomaly: true,
          type: 'HIGH_ERROR_RATE',
          message: `⚠️ High error rate detected (${Math.round(errorRate * 100)}%). Please check your scanning technique or contact supervisor.`,
          severity: 'warning',
        };
      }
    }

    // Check 3: Unusual loading pattern (loading to multiple orders rapidly)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: recentLoads } = await supabase
      .from('order_loading_history')
      .select('order_ref')
      .eq('action_by', _userId)
      .eq('action_type', 'load')
      .gte('action_time', fiveMinutesAgo.toISOString());

    if (recentLoads) {
      const uniqueOrders = new Set(recentLoads.map(l => l.order_ref));
      if (uniqueOrders.size > 3) {
        return {
          hasAnomaly: true,
          type: 'UNUSUAL_PATTERN',
          message: `🔄 Unusual pattern: Loading to ${uniqueOrders.size} different orders in 5 minutes. Please verify you're loading to the correct order.`,
          severity: 'warning',
        };
      }
    }

    return { hasAnomaly: false };
  } catch (error) {
    console.error('Error checking operation anomaly:', error);
    return { hasAnomaly: false };
  }
}

/**
 * Log failed scan attempt for anomaly detection
 */
export async function logFailedScan(
  _userId: string,
  orderRef: string,
  palletNum: string,
  errorType: string
): Promise<void> {
  const supabase = await createClient();

  try {
    await supabase.from('record_history').insert({
      _time: new Date().toISOString(),
      id: parseInt(_userId) || 0,
      action: 'Order Load Failed',
      plt_num: palletNum,
      loc: null,
      remark: `Failed to load to ${orderRef}: ${errorType}`,
    });
  } catch (error) {
    console.error('Error logging failed scan:', error);
  }
}

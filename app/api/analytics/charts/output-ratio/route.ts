import { z } from 'zod';
import { withAnalyticsAuth, getDateRangeFromTimeRange } from '@/lib/analytics/auth-middleware';

/**
 * Analytics API endpoint for Output Ratio chart data
 * Handles frontend requests for output vs booked out ratio analytics
 * Updated to use unified authentication middleware
 */

// Input validation schema
const OutputRatioRequestSchema = z.object({
  timeRange: z.enum(['1d', '7d', '30d', '90d']),
});

export async function POST(request: Request) {
  return withAnalyticsAuth(request, OutputRatioRequestSchema, async (supabase, { timeRange }) => {
    // Get date range using helper function
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);

    // Fetch output data (pallets generated)
    const { data: outputData, error: outputError } = await supabase
      .from('record_palletinfo')
      .select('generate_time')
      .gte('generate_time', startDate.toISOString())
      .lte('generate_time', endDate.toISOString())
      .not('plt_remark', 'ilike', '%Material GRN-%');

    if (outputError) throw outputError;

    // Fetch transfer data (pallets booked out)
    const { data: transferData, error: transferError } = await supabase
      .from('record_transfer')
      .select('tran_date, plt_num')
      .gte('tran_date', startDate.toISOString())
      .lte('tran_date', endDate.toISOString());

    if (transferError) throw transferError;

    // Process data and return
    return processOutputRatioData(outputData || [], transferData || [], timeRange);
  });
}

// Data processing function migrated from frontend utils
function processOutputRatioData(
  outputData: { generate_time: string }[],
  transferData: { tran_date: string; plt_num: string }[],
  timeRange: string
) {
  if (timeRange === '1d') {
    // Hourly data processing for 1-day view
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0') + ':00',
      output: 0,
      booked_out: 0,
      ratio: 0,
    }));

    // Process output data
    outputData.forEach(record => {
      const generateTime = record.generate_time;
      if (generateTime && isValidDate(generateTime)) {
        const date = new Date(generateTime);
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          hourlyData[hour].output++;
        }
      }
    });

    // Process transfer data
    transferData.forEach(record => {
      const tranDate = record.tran_date;
      if (tranDate && isValidDate(tranDate)) {
        const date = new Date(tranDate);
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          hourlyData[hour].booked_out++;
        }
      }
    });

    // Calculate ratios
    hourlyData.forEach(item => {
      item.ratio = item.output > 0 ? Math.round((item.booked_out / item.output) * 100) : 0;
    });

    return { hourlyData, summary: calculateSummary(hourlyData) };
  } else {
    // Daily data processing for multi-day views
    const dayCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dailyData = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayCount - 1 - index));
      return {
        date: date.toISOString().split('T')[0],
        output: 0,
        booked_out: 0,
        ratio: 0,
      };
    });

    // Process output data
    outputData.forEach(record => {
      const generateTime = record.generate_time;
      if (generateTime && isValidDate(generateTime)) {
        const date = new Date(generateTime);
        const dateStr = date.toISOString().split('T')[0];
        const dayItem = dailyData.find(item => item.date === dateStr);
        if (dayItem) {
          dayItem.output++;
        }
      }
    });

    // Process transfer data
    transferData.forEach(record => {
      const tranDate = record.tran_date;
      if (tranDate && isValidDate(tranDate)) {
        const date = new Date(tranDate);
        const dateStr = date.toISOString().split('T')[0];
        const dayItem = dailyData.find(item => item.date === dateStr);
        if (dayItem) {
          dayItem.booked_out++;
        }
      }
    });

    // Calculate ratios
    dailyData.forEach(item => {
      item.ratio = item.output > 0 ? Math.round((item.booked_out / item.output) * 100) : 0;
    });

    return { dailyData, summary: calculateSummary(dailyData) };
  }
}

function calculateSummary(data: { output: number; booked_out: number; ratio: number }[]) {
  const totalOutput = data.reduce((sum, item) => sum + item.output, 0);
  const totalBookedOut = data.reduce((sum, item) => sum + item.booked_out, 0);
  const avgRatio = totalOutput > 0 ? Math.round((totalBookedOut / totalOutput) * 100) : 0;

  return {
    totalOutput,
    totalBookedOut,
    averageRatio: avgRatio,
    efficiency: avgRatio > 80 ? 'High' : avgRatio > 60 ? 'Medium' : 'Low',
  };
}

function isValidDate(date: string): boolean {
  return Boolean(date && !isNaN(new Date(date).getTime()));
}

import { z } from 'zod';
import { withAnalyticsAuth, getDateRangeFromTimeRange } from '@/lib/analytics/auth-middleware';

/**
 * Analytics API endpoint for Staff Workload chart data
 * Handles frontend requests for staff productivity and workload analytics
 * Updated to use unified authentication middleware
 */

// Input validation schema
const StaffWorkloadRequestSchema = z.object({
  timeRange: z.enum(['1d', '7d', '30d', '90d']),
});

export async function POST(request: Request) {
  return withAnalyticsAuth(
    request,
    StaffWorkloadRequestSchema,
    async (supabase, { timeRange }) => {
      // Get date range using helper function
      const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);

      // Fetch work level data with staff names
      const { data: workData, error: workError } = await supabase
        .from('work_level')
        .select(`
          id,
          qc,
          move,
          grn,
          latest_update,
          data_id!inner(name)
        `)
        .gte('latest_update', startDate.toISOString())
        .lte('latest_update', endDate.toISOString());

      if (workError) throw workError;

      // Process data and return
      // Type assertion needed due to Supabase query types
      return processStaffWorkloadData(workData as any || [], timeRange);
    }
  );
}

// Data processing function migrated from frontend utils
function processStaffWorkloadData(
  workData: {
    id: unknown;
    qc: unknown;
    move: unknown;
    grn: unknown;
    latest_update: unknown;
    data_id: { name: unknown };
  }[], 
  timeRange: string
) {
  // Safe data filtering and type checking
  const safeWorkData = workData.filter(record => 
    record && 
    typeof record === 'object' &&
    record.data_id &&
    typeof record.data_id === 'object' &&
    'name' in record.data_id &&
    typeof record.data_id.name === 'string' &&
    typeof record.latest_update === 'string'
  ).map(record => ({
    id: record.id,
    qc: typeof record.qc === 'number' ? record.qc : 0,
    move: typeof record.move === 'number' ? record.move : 0,
    grn: typeof record.grn === 'number' ? record.grn : 0,
    latest_update: record.latest_update as string,
    name: record.data_id.name as string
  }));

  // Calculate summary data (total operations per staff member)
  const staffTotals = new Map<string, number>();
  safeWorkData.forEach(record => {
    const name = record.name;
    const totalOps = record.qc + record.move + record.grn;
    staffTotals.set(name, (staffTotals.get(name) || 0) + totalOps);
  });

  // Convert to summary array and sort by workload
  const summaryData = Array.from(staffTotals.entries())
    .map(([name, pallets]) => ({ name, pallets }))
    .sort((a, b) => b.pallets - a.pallets);

  // Get top 5 staff for timeline view
  const topStaff = summaryData.slice(0, 5).map(item => item.name);

  // Generate timeline data
  let timelineData: { date: string; [key: string]: number | string }[] = [];

  if (timeRange === '1d') {
    // Hourly timeline for 1-day view
    timelineData = Array.from({ length: 24 }, (_, hour) => {
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      const item: { date: string; [key: string]: number | string } = { date: hourStr };
      
      // Initialize all top staff with 0
      topStaff.forEach(name => {
        item[name] = 0;
      });
      
      return item;
    });

    // Process workload data by hour
    safeWorkData.forEach(record => {
      const updateTime = record.latest_update;
      const name = record.name;
      
      if (updateTime && isValidDate(updateTime) && topStaff.includes(name)) {
        const date = new Date(updateTime);
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          const totalOps = record.qc + record.move + record.grn;
          const currentValue = timelineData[hour][name] as number;
          timelineData[hour][name] = currentValue + totalOps;
        }
      }
    });
  } else {
    // Daily timeline for multi-day views
    const dayCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    timelineData = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayCount - 1 - index));
      const dateStr = date.toISOString().split('T')[0];
      
      const item: { date: string; [key: string]: number | string } = { date: dateStr };
      
      // Initialize all top staff with 0
      topStaff.forEach(name => {
        item[name] = 0;
      });
      
      return item;
    });

    // Process workload data by day
    safeWorkData.forEach(record => {
      const updateTime = record.latest_update;
      const name = record.name;
      
      if (updateTime && isValidDate(updateTime) && topStaff.includes(name)) {
        const date = new Date(updateTime);
        const dateStr = date.toISOString().split('T')[0];
        const dayItem = timelineData.find(item => item.date === dateStr);
        if (dayItem) {
          const totalOps = record.qc + record.move + record.grn;
          const currentValue = dayItem[name] as number;
          dayItem[name] = currentValue + totalOps;
        }
      }
    });
  }

  return {
    summary: summaryData,
    timeline: timelineData,
    staffNames: topStaff,
    totalOperations: summaryData.reduce((sum, staff) => sum + staff.pallets, 0),
    totalStaff: summaryData.length
  };
}

function isValidDate(date: string): boolean {
  return Boolean(date && !isNaN(new Date(date).getTime()));
}
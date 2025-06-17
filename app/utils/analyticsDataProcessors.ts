/**
 * Analytics Data Processing Utilities
 */

export function getStartDate(timeRange: string): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeRange) {
    case '1d':
      return today;
    case '7d':
      return new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
    default:
      return new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  }
}

export function getEndDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export interface HourlyData {
  hour: string;
  output: number;
  booked_out: number;
}

export interface DailyData {
  date: string;
  output: number;
  booked_out: number;
}

export function processOutputRatioData(
  outputData: any[], 
  transferData: any[], 
  timeRange: string
): HourlyData[] | DailyData[] {
  if (timeRange === '1d') {
    return groupByHour(outputData, transferData);
  } else {
    return groupByDate(outputData, transferData);
  }
}

function groupByHour(outputData: any[], transferData: any[]): HourlyData[] {
  // Initialize hourly data for 24 hours
  const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    output: 0,
    booked_out: 0
  }));

  // Count output by hour
  outputData.forEach(record => {
    const hour = new Date(record.generate_time).getHours();
    hourlyData[hour].output++;
  });

  // Count transfers by hour
  transferData.forEach(record => {
    const hour = new Date(record.tran_date).getHours();
    hourlyData[hour].booked_out++;
  });


  return hourlyData;
}

function groupByDate(outputData: any[], transferData: any[]): DailyData[] {
  const dailyData = new Map<string, DailyData>();

  // Process output data
  outputData.forEach(record => {
    const date = new Date(record.generate_time).toLocaleDateString('en-GB');
    if (!dailyData.has(date)) {
      dailyData.set(date, { date, output: 0, booked_out: 0 });
    }
    dailyData.get(date)!.output++;
  });

  // Process transfer data
  transferData.forEach(record => {
    const date = new Date(record.tran_date).toLocaleDateString('en-GB');
    if (!dailyData.has(date)) {
      dailyData.set(date, { date, output: 0, booked_out: 0 });
    }
    dailyData.get(date)!.booked_out++;
  });

  // Sort by date
  const result = Array.from(dailyData.values());

  return result.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });
}

// Product trend data processing
export interface ProductTrendData {
  date: string;
  [productCode: string]: number | string;
}

export function processOrderTrendData(orderData: any[], timeRange: string): { detail: ProductTrendData[], summary: any[] } {
  const trendData = new Map<string, Map<string, number>>();
  const productCodes = new Set<string>();

  orderData.forEach(record => {
    const date = timeRange === '1d' 
      ? new Date(record.created_at).getHours().toString().padStart(2, '0') + ':00'
      : new Date(record.created_at).toLocaleDateString('en-GB');
    
    productCodes.add(record.product_code);
    
    if (!trendData.has(date)) {
      trendData.set(date, new Map());
    }
    
    const dateData = trendData.get(date)!;
    dateData.set(record.product_code, (dateData.get(record.product_code) || 0) + 1);
  });

  // Convert to array format
  const result: ProductTrendData[] = [];
  trendData.forEach((products, date) => {
    const dataPoint: ProductTrendData = { date };
    productCodes.forEach(code => {
      dataPoint[code] = products.get(code) || 0;
    });
    result.push(dataPoint);
  });

  const sortedResult = result.sort((a, b) => {
    if (timeRange === '1d') {
      return a.date.localeCompare(b.date);
    }
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  // Create summary data (total orders per time period)
  const summaryData = Array.from(trendData.entries()).map(([date, products]) => {
    const totalCount = Array.from(products.values()).reduce((sum, count) => sum + count, 0);
    return { date, count: totalCount };
  }).sort((a, b) => {
    if (timeRange === '1d') {
      return a.date.localeCompare(b.date);
    }
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  return { detail: sortedResult, summary: summaryData };
}

// Keep the old function name for backward compatibility
export function processProductTrendData(orderData: any[], timeRange: string): ProductTrendData[] {
  return processOrderTrendData(orderData, timeRange).detail;
}

// Staff workload data processing
export interface StaffWorkloadData {
  name: string;
  pallets: number;
  percentage: number;
}

export interface StaffWorkloadTimeData {
  date: string;
  [staffName: string]: number | string;
}

export function processStaffWorkloadData(
  workData: any[], 
  timeRange: string
): { summary: StaffWorkloadData[], timeline: StaffWorkloadTimeData[] } {
  const staffStats = new Map<string, number>();
  const timelineData = new Map<string, Map<string, number>>();
  
  let totalWork = 0;

  workData.forEach(record => {
    if (!record.data_id?.name) return;
    
    const staff = record.data_id.name;
    const workload = (record.qc || 0) + (record.move || 0) + (record.grn || 0);
    
    staffStats.set(staff, (staffStats.get(staff) || 0) + workload);
    totalWork += workload;

    // Timeline data
    const date = timeRange === '1d'
      ? new Date(record.latest_update).getHours().toString().padStart(2, '0') + ':00'
      : new Date(record.latest_update).toLocaleDateString('en-GB');
    
    if (!timelineData.has(date)) {
      timelineData.set(date, new Map());
    }
    
    const dateData = timelineData.get(date)!;
    dateData.set(staff, (dateData.get(staff) || 0) + workload);
  });

  // Convert summary to array
  const summary: StaffWorkloadData[] = Array.from(staffStats.entries())
    .map(([name, pallets]) => ({
      name,
      pallets,
      percentage: totalWork > 0 ? Math.round((pallets / totalWork) * 100) : 0
    }))
    .sort((a, b) => b.pallets - a.pallets)
    .slice(0, 10); // Top 10 staff

  // Convert timeline to array
  const staffNames = Array.from(staffStats.keys()).slice(0, 5); // Top 5 for timeline
  const timeline: StaffWorkloadTimeData[] = [];
  
  timelineData.forEach((staffData, date) => {
    const dataPoint: StaffWorkloadTimeData = { date };
    staffNames.forEach(name => {
      dataPoint[name] = staffData.get(name) || 0;
    });
    timeline.push(dataPoint);
  });

  return {
    summary,
    timeline: timeline.sort((a, b) => {
      if (timeRange === '1d') {
        return a.date.localeCompare(b.date);
      }
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    })
  };
}
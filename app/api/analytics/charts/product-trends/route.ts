import { z } from 'zod';
import { withAnalyticsAuth, getDateRangeFromTimeRange } from '@/lib/analytics/auth-middleware';

/**
 * Analytics API endpoint for Product Trends chart data
 * Handles frontend requests for product order trend analytics
 * Updated to use unified authentication middleware
 */

// Input validation schema
const ProductTrendsRequestSchema = z.object({
  timeRange: z.enum(['1d', '7d', '30d', '90d']),
});

export async function POST(request: Request) {
  return withAnalyticsAuth(
    request,
    ProductTrendsRequestSchema,
    async (supabase, { timeRange }) => {
      // Get date range using helper function
      const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);

      // Fetch order data
      const { data: orderData, error: orderError } = await supabase
        .from('data_order')
        .select('product_code, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      if (orderError) throw orderError;

      // Process data and return
      return processProductTrendsData(orderData || [], timeRange);
    }
  );
}

// Data processing function migrated from frontend utils
function processProductTrendsData(
  orderData: { product_code: unknown; created_at: unknown }[], 
  timeRange: string
) {
  // Safe data filtering
  const safeOrderData = orderData.filter(record => 
    record && 
    typeof record === 'object' && 
    typeof record.product_code === 'string' && 
    typeof record.created_at === 'string'
  ) as { product_code: string; created_at: string }[];

  // Calculate top products (top 10 by order count)
  const productTotals = new Map<string, number>();
  safeOrderData.forEach(record => {
    const productCode = record.product_code;
    if (productCode) {
      productTotals.set(productCode, (productTotals.get(productCode) || 0) + 1);
    }
  });

  const topProducts = Array.from(productTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code]) => code);

  if (timeRange === '1d') {
    // Hourly processing for 1-day view
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      const item: { date: string; [key: string]: number | string } = { date: hourStr };
      
      // Initialize all products with 0
      topProducts.forEach(product => {
        item[product] = 0;
      });
      
      return item;
    });

    // Process order data by hour
    safeOrderData.forEach(record => {
      const createdAt = record.created_at;
      const productCode = record.product_code;
      
      if (createdAt && isValidDate(createdAt) && topProducts.includes(productCode)) {
        const date = new Date(createdAt);
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          const currentValue = hourlyData[hour][productCode] as number;
          hourlyData[hour][productCode] = currentValue + 1;
        }
      }
    });

    // Summary data for hourly view
    const summaryData = hourlyData.map(item => ({
      date: item.date as string,
      count: topProducts.reduce((sum, product) => sum + (item[product] as number), 0)
    }));

    return {
      detail: hourlyData,
      summary: summaryData,
      productCodes: topProducts,
      totalOrders: safeOrderData.length
    };
  } else {
    // Daily processing for multi-day views
    const dayCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dailyData = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayCount - 1 - index));
      const dateStr = date.toISOString().split('T')[0];
      
      const item: { date: string; [key: string]: number | string } = { date: dateStr };
      
      // Initialize all products with 0
      topProducts.forEach(product => {
        item[product] = 0;
      });
      
      return item;
    });

    // Process order data by day
    safeOrderData.forEach(record => {
      const createdAt = record.created_at;
      const productCode = record.product_code;
      
      if (createdAt && isValidDate(createdAt) && topProducts.includes(productCode)) {
        const date = new Date(createdAt);
        const dateStr = date.toISOString().split('T')[0];
        const dayItem = dailyData.find(item => item.date === dateStr);
        if (dayItem) {
          const currentValue = dayItem[productCode] as number;
          dayItem[productCode] = currentValue + 1;
        }
      }
    });

    // Summary data for daily view
    const summaryData = dailyData.map(item => ({
      date: item.date as string,
      count: topProducts.reduce((sum, product) => sum + (item[product] as number), 0)
    }));

    return {
      detail: dailyData,
      summary: summaryData,
      productCodes: topProducts,
      totalOrders: safeOrderData.length
    };
  }
}

function isValidDate(date: string): boolean {
  return Boolean(date && !isNaN(new Date(date).getTime()));
}
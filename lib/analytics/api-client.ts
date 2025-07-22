/**
 * Analytics API Client
 * Unified client for all Analytics API endpoints
 * Handles authentication, error handling, and type safety
 */

interface AnalyticsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface OutputRatioData {
  hourlyData?: { hour: string; output: number; booked_out: number; ratio: number }[];
  dailyData?: { date: string; output: number; booked_out: number; ratio: number }[];
  summary: {
    totalOutput: number;
    totalBookedOut: number;
    averageRatio: number;
    efficiency: 'High' | 'Medium' | 'Low';
  };
}

interface ProductTrendsData {
  detail: { date: string; [productCode: string]: number | string }[];
  summary: { date: string; count: number }[];
  productCodes: string[];
  totalOrders: number;
}

interface StaffWorkloadData {
  summary: { name: string; pallets: number }[];
  timeline: { date: string; [staffName: string]: number | string }[];
  staffNames: string[];
  totalOperations: number;
  totalStaff: number;
}

class AnalyticsApiClient {
  private static async makeRequest<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // If response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      const result: AnalyticsApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      if (!result.data) {
        throw new Error('No data returned from API');
      }

      return result.data;
    } catch (error) {
      // Enhance error messages for better debugging
      if (error instanceof Error) {
        console.error(`Analytics API Error (${endpoint}):`, error.message);
        throw new Error(`Failed to fetch analytics data: ${error.message}`);
      }
      
      console.error(`Analytics API Unknown Error (${endpoint}):`, error);
      throw new Error('An unexpected error occurred while fetching analytics data');
    }
  }

  /**
   * Get output ratio data for charts
   * @param timeRange - Time range for data: '1d', '7d', '30d', '90d'
   */
  static async getOutputRatio(timeRange: string): Promise<OutputRatioData> {
    return this.makeRequest<OutputRatioData>('/api/analytics/charts/output-ratio', { 
      timeRange 
    });
  }

  /**
   * Get product trends data for charts
   * @param timeRange - Time range for data: '1d', '7d', '30d', '90d'
   */
  static async getProductTrends(timeRange: string): Promise<ProductTrendsData> {
    return this.makeRequest<ProductTrendsData>('/api/analytics/charts/product-trends', { 
      timeRange 
    });
  }

  /**
   * Get staff workload data for charts
   * @param timeRange - Time range for data: '1d', '7d', '30d', '90d'
   */
  static async getStaffWorkload(timeRange: string): Promise<StaffWorkloadData> {
    return this.makeRequest<StaffWorkloadData>('/api/analytics/charts/staff-workload', { 
      timeRange 
    });
  }

  /**
   * Validate time range parameter
   */
  static validateTimeRange(timeRange: string): boolean {
    return ['1d', '7d', '30d', '90d'].includes(timeRange);
  }

  /**
   * Get all analytics data in batch (for dashboard view)
   * @param timeRange - Time range for data: '1d', '7d', '30d', '90d'
   */
  static async getAllAnalytics(timeRange: string): Promise<{
    outputRatio: OutputRatioData;
    productTrends: ProductTrendsData;
    staffWorkload: StaffWorkloadData;
  }> {
    if (!this.validateTimeRange(timeRange)) {
      throw new Error(`Invalid time range: ${timeRange}. Must be one of: 1d, 7d, 30d, 90d`);
    }

    try {
      // Execute all requests in parallel for better performance
      const [outputRatio, productTrends, staffWorkload] = await Promise.all([
        this.getOutputRatio(timeRange),
        this.getProductTrends(timeRange),
        this.getStaffWorkload(timeRange),
      ]);

      return {
        outputRatio,
        productTrends,
        staffWorkload,
      };
    } catch (error) {
      console.error('Batch analytics request failed:', error);
      throw new Error('Failed to fetch complete analytics data');
    }
  }
}

// Export types for use in components
export type { 
  OutputRatioData, 
  ProductTrendsData, 
  StaffWorkloadData,
  AnalyticsApiResponse 
};

export { AnalyticsApiClient };
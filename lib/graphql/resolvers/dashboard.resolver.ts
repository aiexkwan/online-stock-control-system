import { GraphQLError } from 'graphql';
import { GraphQLContext } from './index';

// 圖表資料點介面
interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
}

// 圖表回傳資料介面
interface ChartData {
  title: string;
  data: ChartDataPoint[];
  type: 'BAR' | 'LINE' | 'PIE';
}

interface ChartDataArgs {
  chartType: 'production' | 'inventory' | 'distribution';
  filter?: {
    dateRange?: {
      startDate?: string;
      endDate?: string;
    };
    category?: string;
    groupBy?: string;
  };
}

export const dashboardResolvers = {
  Query: {
    chartData: async (
      _: unknown,
      args: ChartDataArgs,
      context: GraphQLContext
    ): Promise<ChartData> => {
      const requestId = Math.random().toString(36).substring(7);

      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        console.log(`[GraphQL-${requestId}] chartData called with args:`, args);

        // 根據 chartType 返回不同的數據
        let data: ChartDataPoint[] = [];
        let title = '';
        let type: 'BAR' | 'LINE' | 'PIE' = 'BAR';

        switch (args.chartType) {
          case 'production':
            title = 'Production Overview';
            type = 'BAR';
            data = [
              { label: 'Monday', value: 120, category: 'weekday' },
              { label: 'Tuesday', value: 150, category: 'weekday' },
              { label: 'Wednesday', value: 180, category: 'weekday' },
              { label: 'Thursday', value: 140, category: 'weekday' },
              { label: 'Friday', value: 200, category: 'weekday' },
            ];
            break;

          case 'inventory':
            title = 'Inventory Levels';
            type = 'LINE';
            data = [
              { label: 'Week 1', value: 5000 },
              { label: 'Week 2', value: 5500 },
              { label: 'Week 3', value: 5200 },
              { label: 'Week 4', value: 5800 },
            ];
            break;

          case 'distribution':
            title = 'Product Distribution';
            type = 'PIE';
            data = [
              { label: 'Category A', value: 35 },
              { label: 'Category B', value: 25 },
              { label: 'Category C', value: 20 },
              { label: 'Category D', value: 20 },
            ];
            break;

          default:
            // This should never happen due to TypeScript union type checking
            const exhaustiveCheck: never = args.chartType;
            throw new GraphQLError(`Unknown chart type: ${exhaustiveCheck}`, {
              extensions: { code: 'BAD_REQUEST' },
            });
        }

        // 應用篩選條件
        if (args.filter?.category) {
          data = data.filter((item: ChartDataPoint) => {
            return item.category === args.filter?.category;
          });
        }

        return {
          title,
          data,
          type,
        };
      } catch (error) {
        console.error(`[GraphQL-${requestId}] Error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chart data';
        throw new GraphQLError(errorMessage, {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            requestId,
          },
        });
      }
    },
  },
};

export default dashboardResolvers;

import { GraphQLError } from 'graphql';
import { GraphQLContext } from './index';

interface ChartDataArgs {
  chartType: string;
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
    chartData: async (_: unknown, args: ChartDataArgs, context: GraphQLContext) => {
      const startTime = Date.now();
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
        let data = [];
        let title = '';
        let type = 'BAR';

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
            ] as unknown[];
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
            throw new GraphQLError(`Unknown chart type: ${args.chartType}`, {
              extensions: { code: 'BAD_REQUEST' },
            });
        }

        // 應用篩選條件
        if (args.filter?.category) {
          data = data.filter((item: unknown) => {
            const record = item as Record<string, unknown>;
            return record.category === args.filter?.category;
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

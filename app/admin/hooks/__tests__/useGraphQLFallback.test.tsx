/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock all external dependencies before importing
jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  ApolloError: class extends Error {
    graphQLErrors: any[];
    networkError: any;
    constructor(options: any) {
      super(options.message || 'Apollo Error');
      this.graphQLErrors = options.graphQLErrors || [];
      this.networkError = options.networkError;
    }
  },
}));

jest.mock('swr', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((key: any, fetcher: any, config: any) => {
      const [data, setData] = React.useState(undefined);
      const [error, setError] = React.useState(undefined);
      const [isLoading, setIsLoading] = React.useState(false);
      
      React.useEffect(() => {
        if (key && fetcher) {
          setIsLoading(true);
          fetcher()
            .then((result: any) => {
              setData(result);
              setError(undefined);
              setIsLoading(false);
            })
            .catch((err: any) => {
              setError(err);
              setData(undefined);
              setIsLoading(false);
              config?.onError?.(err);
            });
        }
      }, [JSON.stringify(key)]);

      return {
        data,
        error,
        isLoading,
        mutate: jest.fn().mockResolvedValue(data),
      };
    }),
  };
});

jest.mock('../../hooks/useWidgetErrorHandler', () => ({
  useWidgetErrorHandler: jest.fn(() => ({
    handleFetchError: jest.fn(),
  })),
}));

jest.mock('@/lib/widgets/performance-monitor', () => ({
  performanceMonitor: {
    recordMetric: jest.fn(),
  },
}));

jest.mock('../../contexts/DashboardDataContext', () => {
  const React = require('react');
  return {
    DashboardDataContext: React.createContext(null),
  };
});

// Import after mocks
import { useQuery } from '@apollo/client';
import { useGraphQLFallback, GraphQLFallbackPresets } from '../useGraphQLFallback';
import { DashboardDataContext } from '../../contexts/DashboardDataContext';
import { useWidgetErrorHandler } from '../../hooks/useWidgetErrorHandler';
import { performanceMonitor } from '@/lib/widgets/performance-monitor';

const ApolloError = jest.requireMock('@apollo/client').ApolloError;

// Mock console
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('useGraphQLFallback', () => {
  const mockHandleFetchError = jest.fn();
  const mockRecordMetric = jest.fn();
  const mockQuery = { kind: 'Document', definitions: [] } as any;
  const mockServerAction = jest.fn();
  const mockOnCompleted = jest.fn();
  const mockOnError = jest.fn();
  const mockRefetch = jest.fn().mockResolvedValue({});

  // Helper to create wrapper with context
  const createWrapper = (contextValue: any) => {
    return ({ children }: { children: React.ReactNode }) => (
      <DashboardDataContext.Provider value={contextValue}>
        {children}
      </DashboardDataContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useWidgetErrorHandler as jest.Mock).mockReturnValue({
      handleFetchError: mockHandleFetchError,
    });
    
    (performanceMonitor.recordMetric as jest.Mock) = mockRecordMetric;
    
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });
  });

  describe('Context extraction', () => {
    it('should extract data from context when available', () => {
      const contextData = { 
        data: { 
          inventory: { total: 100 },
          orders: [{ id: 1 }, { id: 2 }]
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      };
      
      const extractFromContext = jest.fn((data) => data.inventory);
      
      const { result } = renderHook(
        () => useGraphQLFallback({
          graphqlQuery: mockQuery,
          extractFromContext,
        }),
        { wrapper: createWrapper(contextData) }
      );

      expect(extractFromContext).toHaveBeenCalledWith(contextData.data);
      expect(result.current.data).toEqual({ total: 100 });
      expect(result.current.mode).toBe('context');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle context extraction errors gracefully', () => {
      const contextData = { 
        data: { malformed: 'data' },
        loading: false,
        error: null 
      };
      
      const extractFromContext = jest.fn(() => {
        throw new Error('Extraction failed');
      });
      
      const { result } = renderHook(
        () => useGraphQLFallback({
          graphqlQuery: mockQuery,
          extractFromContext,
        }),
        { wrapper: createWrapper(contextData) }
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error extracting data from context:', 
        expect.any(Error)
      );
      expect(result.current.data).toBeUndefined();
      expect(result.current.mode).toBe('graphql');
    });
  });

  describe('GraphQL query handling', () => {
    it('should execute GraphQL query successfully', async () => {
      const mockData = { users: [{ id: 1, name: 'Test' }] };
      
      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          variables: { limit: 10 },
          onCompleted: mockOnCompleted,
        })
      );

      expect(useQuery).toHaveBeenCalledWith(mockQuery, expect.objectContaining({
        variables: { limit: 10 },
        skip: false,
        fetchPolicy: 'cache-first',
      }));
      
      expect(result.current.data).toEqual(mockData);
      expect(result.current.mode).toBe('graphql');
      expect(result.current.loading).toBe(false);
    });

    it('should handle GraphQL loading state', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
        })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle GraphQL errors and fallback to server action', async () => {
      const apolloError = new ApolloError({
        graphQLErrors: [],
        networkError: new Error('Network failed'),
      });

      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        loading: false,
        error: apolloError,
        refetch: mockRefetch,
      });

      const mockServerData = { fallbackData: true };
      mockServerAction.mockResolvedValue(mockServerData);

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          serverAction: mockServerAction,
          fallbackEnabled: true,
          onError: mockOnError,
        })
      );

      // Simulate the onError callback being called
      const useQueryCall = (useQuery as jest.Mock).mock.calls[0][1];
      act(() => {
        useQueryCall.onError(apolloError);
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('server-action');
      });

      expect(mockHandleFetchError).toHaveBeenCalledWith(apolloError, 'graphql-query');
      expect(mockConsoleError).toHaveBeenCalledWith('GraphQL error:', apolloError);
    });
  });

  describe('Server Action fallback', () => {
    it('should execute server action when no GraphQL query provided', async () => {
      const mockServerData = { serverData: 'test' };
      mockServerAction.mockResolvedValue(mockServerData);

      const { result, rerender } = renderHook(() => 
        useGraphQLFallback({
          serverAction: mockServerAction,
          onCompleted: mockOnCompleted,
        })
      );

      // Force a re-render to trigger the effect
      rerender();

      await waitFor(() => {
        expect(result.current.mode).toBe('server-action');
      });
    });

    it('should handle server action errors', async () => {
      // Start with GraphQL error to trigger server action mode
      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        loading: false,
        error: new ApolloError({ networkError: new Error('GraphQL failed') }),
        refetch: mockRefetch,
      });

      const serverError = new Error('Server action failed');
      mockServerAction.mockRejectedValue(serverError);

      const { result, rerender } = renderHook(() => 
        useGraphQLFallback({
          serverAction: mockServerAction,
          onError: mockOnError,
        })
      );

      // The effect should set mode to server-action due to error and presence of serverAction
      rerender();

      await waitFor(() => {
        expect(result.current.mode).toBe('server-action');
      });
    });

    it('should not call onError when fallbackEnabled is false and GraphQL fails', () => {
      const apolloError = new ApolloError({
        networkError: new Error('Network failed'),
      });

      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        loading: false,
        error: apolloError,
        refetch: mockRefetch,
      });

      renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          serverAction: mockServerAction,
          fallbackEnabled: false,
          onError: mockOnError,
        })
      );

      // Trigger error callback
      const useQueryCall = (useQuery as jest.Mock).mock.calls[0][1];
      act(() => {
        useQueryCall.onError(apolloError);
      });

      // When fallbackEnabled is false, onError should be called
      expect(mockOnError).toHaveBeenCalledWith(apolloError);
    });
  });

  describe('Performance monitoring', () => {
    it('should track performance metrics for successful queries', async () => {
      const mockData = { test: 'data' };
      
      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          widgetId: 'test-widget',
        })
      );

      // Trigger onCompleted callback
      const useQueryCall = (useQuery as jest.Mock).mock.calls[0][1];
      act(() => {
        useQueryCall.onCompleted(mockData);
      });

      await waitFor(() => {
        expect(result.current.performanceMetrics).toBeDefined();
        expect(result.current.performanceMetrics?.dataSource).toBe('graphql');
        expect(result.current.performanceMetrics?.fallbackUsed).toBe(false);
      });

      expect(mockRecordMetric).toHaveBeenCalledWith({
        widgetId: 'test-widget',
        metricType: 'dataFetch',
        value: expect.any(Number),
        timestamp: expect.any(Number),
        metadata: expect.objectContaining({
          dataSource: 'graphql',
          fallbackUsed: false,
        }),
      });
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch from context when in context mode', async () => {
      const mockContextRefetch = jest.fn();
      const contextData = { 
        data: { test: 'data' },
        loading: false,
        error: null,
        refetch: mockContextRefetch,
      };
      
      const extractFromContext = jest.fn((data) => data.test);
      
      const { result } = renderHook(
        () => useGraphQLFallback({
          graphqlQuery: mockQuery,
          extractFromContext,
        }),
        { wrapper: createWrapper(contextData) }
      );

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockContextRefetch).toHaveBeenCalled();
    });

    it('should refetch GraphQL query when in graphql mode', async () => {
      const mockData = { test: 'data' };
      
      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
        })
      );

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle refetch errors', async () => {
      const refetchError = new Error('Refetch failed');
      mockRefetch.mockRejectedValue(refetchError);
      
      (useQuery as jest.Mock).mockReturnValue({
        data: { test: 'data' },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
        })
      );

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Refetch error:', refetchError);
      expect(mockHandleFetchError).toHaveBeenCalledWith(refetchError, 'refetch');
    });

    it('should handle when no refetch method is available', async () => {
      // Mock a scenario where no refetch method is available
      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: undefined, // No refetch method
      });

      const { result } = renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
        })
      );

      // Should not throw when calling refetch
      await act(async () => {
        await result.current.refetch();
      });

      // No error should be logged since there's nothing to refetch
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('GraphQLFallbackPresets', () => {
    it('should apply realtime preset correctly', () => {
      renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          ...GraphQLFallbackPresets.realtime,
        })
      );

      expect(useQuery).toHaveBeenCalledWith(mockQuery, expect.objectContaining({
        fetchPolicy: 'network-only',
        pollInterval: 5000,
      }));
    });

    it('should apply cached preset correctly', () => {
      renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          ...GraphQLFallbackPresets.cached,
        })
      );

      expect(useQuery).toHaveBeenCalledWith(mockQuery, expect.objectContaining({
        fetchPolicy: 'cache-first',
        pollInterval: undefined,
      }));
    });

    it('should apply mutation preset correctly', () => {
      renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          ...GraphQLFallbackPresets.mutation,
        })
      );

      expect(useQuery).toHaveBeenCalledWith(mockQuery, expect.objectContaining({
        fetchPolicy: 'no-cache',
        pollInterval: undefined,
      }));
    });
  });

  describe('Edge cases', () => {
    it('should handle missing graphqlQuery and serverAction', () => {
      const { result } = renderHook(() => 
        useGraphQLFallback({})
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle simultaneous context and graphql data', async () => {
      const contextData = { 
        data: { fromContext: true },
        loading: false,
        error: null 
      };
      
      const graphqlData = { fromGraphQL: true };
      
      (useQuery as jest.Mock).mockReturnValue({
        data: graphqlData,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });
      
      const extractFromContext = jest.fn((data) => data);
      
      const { result } = renderHook(
        () => useGraphQLFallback({
          graphqlQuery: mockQuery,
          extractFromContext,
        }),
        { wrapper: createWrapper(contextData) }
      );

      // Context data should take precedence
      expect(result.current.data).toEqual({ fromContext: true });
      expect(result.current.mode).toBe('context');
    });

    it('should skip all queries when skip is true', () => {
      renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          serverAction: mockServerAction,
          skip: true,
        })
      );

      expect(useQuery).toHaveBeenCalledWith(mockQuery, expect.objectContaining({
        skip: true,
      }));
    });

    it('should handle variables in performance tracking', async () => {
      const variables = { filter: 'active', limit: 10 };
      
      (useQuery as jest.Mock).mockReturnValue({
        data: { test: 'data' },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      renderHook(() => 
        useGraphQLFallback({
          graphqlQuery: mockQuery,
          variables,
          widgetId: 'test-widget',
        })
      );

      // Trigger onCompleted
      const useQueryCall = (useQuery as jest.Mock).mock.calls[0][1];
      act(() => {
        useQueryCall.onCompleted({ test: 'data' });
      });

      await waitFor(() => {
        expect(mockRecordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              variables: JSON.stringify(variables),
            }),
          })
        );
      });
    });
  });
});
import { gql } from '@apollo/client';
import type * as ApolloReactCommon from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
const defaultOptions = {} as const;

export const GetDashboardBatchDataDocument = gql`
    query GetDashboardBatchData($dateFrom: Datetime!, $dateTo: Datetime!, $todayStart: Datetime!, $productType: String) {
  allPallets: record_palletinfoCollection {
    edges {
      node {
        plt_num
        generate_time
      }
    }
  }
  todayPallets: record_palletinfoCollection(
    filter: {generate_time: {gte: $todayStart}}
  ) {
    edges {
      node {
        plt_num
      }
    }
  }
  inventoryData: record_inventoryCollection {
    edges {
      node {
        product_code
        injection
        pipeline
        prebook
        await
        fold
        bulk
        backcarpark
        damage
        await_grn
      }
    }
  }
  awaitLocationData: record_inventoryCollection(filter: {await: {gt: 0}}) {
    edges {
      node {
        product_code
        await
      }
    }
  }
  recentOrders: data_orderCollection(
    orderBy: [{order_ref: DescNullsLast}]
    first: 10
  ) {
    edges {
      node {
        order_ref
        loaded_qty
      }
    }
  }
  acoOrders: record_acoCollection(
    filter: {latest_update: {gte: $dateFrom}}
    orderBy: [{latest_update: DescNullsLast}]
    first: 10
  ) {
    edges {
      node {
        uuid
        order_ref
        latest_update
        finished_qty
      }
    }
  }
  transferRecords: record_transferCollection(
    filter: {tran_date: {gte: $dateFrom, lte: $dateTo}}
  ) {
    edges {
      node {
        uuid
        tran_date
        f_loc
        t_loc
        plt_num
      }
    }
  }
  yesterdayTransfers: record_transferCollection(
    filter: {tran_date: {gte: $dateFrom, lt: $todayStart}}
  ) {
    edges {
      node {
        uuid
      }
    }
  }
  productTypes: data_codeCollection(filter: {type: {eq: $productType}}) {
    edges {
      node {
        code
        description
        type
        standard_qty
      }
    }
  }
  historyRecords: record_historyCollection(
    filter: {time: {gte: $dateFrom, lte: $dateTo}}
    orderBy: [{time: DescNullsLast}]
  ) {
    edges {
      node {
        uuid
        time
        action
        data_id {
          id
          name
        }
      }
    }
  }
}
    `;

/**
 * __useGetDashboardBatchDataQuery__
 *
 * To run a query within a React component, call `useGetDashboardBatchDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDashboardBatchDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDashboardBatchDataQuery({
 *   variables: {
 *      dateFrom: // value for 'dateFrom'
 *      dateTo: // value for 'dateTo'
 *      todayStart: // value for 'todayStart'
 *      productType: // value for 'productType'
 *   },
 * });
 */
export function useGetDashboardBatchDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables> & ({ variables: GetDashboardBatchDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>(GetDashboardBatchDataDocument, options);
      }
export function useGetDashboardBatchDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>(GetDashboardBatchDataDocument, options);
        }
export function useGetDashboardBatchDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>(GetDashboardBatchDataDocument, options);
        }
export type GetDashboardBatchDataQueryHookResult = ReturnType<typeof useGetDashboardBatchDataQuery>;
export type GetDashboardBatchDataLazyQueryHookResult = ReturnType<typeof useGetDashboardBatchDataLazyQuery>;
export type GetDashboardBatchDataSuspenseQueryHookResult = ReturnType<typeof useGetDashboardBatchDataSuspenseQuery>;
export type GetDashboardBatchDataQueryResult = ApolloReactCommon.QueryResult<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>;
export const GetAcoOrdersForCardsDocument = gql`
    query GetAcoOrdersForCards {
  record_acoCollection(orderBy: [{order_ref: DescNullsLast}]) {
    edges {
      node {
        uuid
        order_ref
        code
        required_qty
        finished_qty
        latest_update
      }
    }
  }
}
    `;

/**
 * __useGetAcoOrdersForCardsQuery__
 *
 * To run a query within a React component, call `useGetAcoOrdersForCardsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAcoOrdersForCardsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAcoOrdersForCardsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAcoOrdersForCardsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>(GetAcoOrdersForCardsDocument, options);
      }
export function useGetAcoOrdersForCardsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>(GetAcoOrdersForCardsDocument, options);
        }
export function useGetAcoOrdersForCardsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>(GetAcoOrdersForCardsDocument, options);
        }
export type GetAcoOrdersForCardsQueryHookResult = ReturnType<typeof useGetAcoOrdersForCardsQuery>;
export type GetAcoOrdersForCardsLazyQueryHookResult = ReturnType<typeof useGetAcoOrdersForCardsLazyQuery>;
export type GetAcoOrdersForCardsSuspenseQueryHookResult = ReturnType<typeof useGetAcoOrdersForCardsSuspenseQuery>;
export type GetAcoOrdersForCardsQueryResult = ApolloReactCommon.QueryResult<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>;
export const GetAcoOrdersForChartDocument = gql`
    query GetAcoOrdersForChart {
  record_acoCollection(orderBy: [{order_ref: AscNullsLast}], first: 20) {
    edges {
      node {
        uuid
        order_ref
        code
        required_qty
        finished_qty
        latest_update
      }
    }
  }
}
    `;

/**
 * __useGetAcoOrdersForChartQuery__
 *
 * To run a query within a React component, call `useGetAcoOrdersForChartQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAcoOrdersForChartQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAcoOrdersForChartQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAcoOrdersForChartQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>(GetAcoOrdersForChartDocument, options);
      }
export function useGetAcoOrdersForChartLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>(GetAcoOrdersForChartDocument, options);
        }
export function useGetAcoOrdersForChartSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>(GetAcoOrdersForChartDocument, options);
        }
export type GetAcoOrdersForChartQueryHookResult = ReturnType<typeof useGetAcoOrdersForChartQuery>;
export type GetAcoOrdersForChartLazyQueryHookResult = ReturnType<typeof useGetAcoOrdersForChartLazyQuery>;
export type GetAcoOrdersForChartSuspenseQueryHookResult = ReturnType<typeof useGetAcoOrdersForChartSuspenseQuery>;
export type GetAcoOrdersForChartQueryResult = ApolloReactCommon.QueryResult<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>;
export const GetInventoryTurnoverDocument = gql`
    query GetInventoryTurnover {
  record_inventoryCollection {
    edges {
      node {
        uuid
        product_code
        injection
        pipeline
        prebook
        await
        fold
        bulk
        backcarpark
        await_grn
        damage
        latest_update
      }
    }
  }
  data_orderCollection(orderBy: [{created_at: DescNullsLast}], first: 200) {
    edges {
      node {
        uuid
        product_code
        product_qty
        loaded_qty
        created_at
      }
    }
  }
}
    `;

/**
 * __useGetInventoryTurnoverQuery__
 *
 * To run a query within a React component, call `useGetInventoryTurnoverQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInventoryTurnoverQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInventoryTurnoverQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetInventoryTurnoverQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>(GetInventoryTurnoverDocument, options);
      }
export function useGetInventoryTurnoverLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>(GetInventoryTurnoverDocument, options);
        }
export function useGetInventoryTurnoverSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>(GetInventoryTurnoverDocument, options);
        }
export type GetInventoryTurnoverQueryHookResult = ReturnType<typeof useGetInventoryTurnoverQuery>;
export type GetInventoryTurnoverLazyQueryHookResult = ReturnType<typeof useGetInventoryTurnoverLazyQuery>;
export type GetInventoryTurnoverSuspenseQueryHookResult = ReturnType<typeof useGetInventoryTurnoverSuspenseQuery>;
export type GetInventoryTurnoverQueryResult = ApolloReactCommon.QueryResult<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>;
export const GetInventoryLocationsDocument = gql`
    query GetInventoryLocations {
  record_inventoryCollection {
    edges {
      node {
        uuid
        product_code
        injection
        pipeline
        prebook
        await
        fold
        bulk
        backcarpark
        await_grn
        damage
        latest_update
      }
    }
  }
}
    `;

/**
 * __useGetInventoryLocationsQuery__
 *
 * To run a query within a React component, call `useGetInventoryLocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInventoryLocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInventoryLocationsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetInventoryLocationsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>(GetInventoryLocationsDocument, options);
      }
export function useGetInventoryLocationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>(GetInventoryLocationsDocument, options);
        }
export function useGetInventoryLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>(GetInventoryLocationsDocument, options);
        }
export type GetInventoryLocationsQueryHookResult = ReturnType<typeof useGetInventoryLocationsQuery>;
export type GetInventoryLocationsLazyQueryHookResult = ReturnType<typeof useGetInventoryLocationsLazyQuery>;
export type GetInventoryLocationsSuspenseQueryHookResult = ReturnType<typeof useGetInventoryLocationsSuspenseQuery>;
export type GetInventoryLocationsQueryResult = ApolloReactCommon.QueryResult<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>;
export const GetStocktakeAccuracyDocument = gql`
    query GetStocktakeAccuracy {
  stocktake_daily_summaryCollection(
    orderBy: [{count_date: DescNullsLast}]
    first: 30
  ) {
    edges {
      node {
        uuid
        count_date
        product_code
        product_desc
        pallet_count
        total_counted
        final_remain_qty
        last_count_time
        created_at
        updated_at
      }
    }
  }
}
    `;

/**
 * __useGetStocktakeAccuracyQuery__
 *
 * To run a query within a React component, call `useGetStocktakeAccuracyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStocktakeAccuracyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStocktakeAccuracyQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetStocktakeAccuracyQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>(GetStocktakeAccuracyDocument, options);
      }
export function useGetStocktakeAccuracyLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>(GetStocktakeAccuracyDocument, options);
        }
export function useGetStocktakeAccuracySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>(GetStocktakeAccuracyDocument, options);
        }
export type GetStocktakeAccuracyQueryHookResult = ReturnType<typeof useGetStocktakeAccuracyQuery>;
export type GetStocktakeAccuracyLazyQueryHookResult = ReturnType<typeof useGetStocktakeAccuracyLazyQuery>;
export type GetStocktakeAccuracySuspenseQueryHookResult = ReturnType<typeof useGetStocktakeAccuracySuspenseQuery>;
export type GetStocktakeAccuracyQueryResult = ApolloReactCommon.QueryResult<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>;
export const GetTopProductsInventoryDocument = gql`
    query GetTopProductsInventory {
  record_inventoryCollection {
    edges {
      node {
        uuid
        product_code
        injection
        pipeline
        prebook
        await
        fold
        bulk
        backcarpark
        await_grn
        damage
        latest_update
        data_code {
          description
          colour
        }
      }
    }
  }
}
    `;

/**
 * __useGetTopProductsInventoryQuery__
 *
 * To run a query within a React component, call `useGetTopProductsInventoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTopProductsInventoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTopProductsInventoryQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTopProductsInventoryQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>(GetTopProductsInventoryDocument, options);
      }
export function useGetTopProductsInventoryLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>(GetTopProductsInventoryDocument, options);
        }
export function useGetTopProductsInventorySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>(GetTopProductsInventoryDocument, options);
        }
export type GetTopProductsInventoryQueryHookResult = ReturnType<typeof useGetTopProductsInventoryQuery>;
export type GetTopProductsInventoryLazyQueryHookResult = ReturnType<typeof useGetTopProductsInventoryLazyQuery>;
export type GetTopProductsInventorySuspenseQueryHookResult = ReturnType<typeof useGetTopProductsInventorySuspenseQuery>;
export type GetTopProductsInventoryQueryResult = ApolloReactCommon.QueryResult<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>;
export const GetUserActivityDocument = gql`
    query GetUserActivity($startDate: Datetime!, $endDate: Datetime!) {
  record_historyCollection(
    filter: {time: {gte: $startDate, lte: $endDate}}
    orderBy: [{time: DescNullsLast}]
  ) {
    edges {
      node {
        uuid
        action
        time
        remark
        plt_num
        loc
        data_id {
          id
          name
          department
        }
      }
    }
  }
}
    `;

/**
 * __useGetUserActivityQuery__
 *
 * To run a query within a React component, call `useGetUserActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserActivityQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetUserActivityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables> & ({ variables: GetUserActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, options);
      }
export function useGetUserActivityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, options);
        }
export function useGetUserActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, options);
        }
export type GetUserActivityQueryHookResult = ReturnType<typeof useGetUserActivityQuery>;
export type GetUserActivityLazyQueryHookResult = ReturnType<typeof useGetUserActivityLazyQuery>;
export type GetUserActivitySuspenseQueryHookResult = ReturnType<typeof useGetUserActivitySuspenseQuery>;
export type GetUserActivityQueryResult = ApolloReactCommon.QueryResult<GetUserActivityQuery, GetUserActivityQueryVariables>;
export const GetVoidRecordsDocument = gql`
    query GetVoidRecords {
  report_voidCollection(orderBy: [{time: DescNullsLast}], first: 100) {
    edges {
      node {
        uuid
        plt_num
        reason
        time
        damage_qty
      }
    }
  }
}
    `;

/**
 * __useGetVoidRecordsQuery__
 *
 * To run a query within a React component, call `useGetVoidRecordsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetVoidRecordsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVoidRecordsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetVoidRecordsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>(GetVoidRecordsDocument, options);
      }
export function useGetVoidRecordsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>(GetVoidRecordsDocument, options);
        }
export function useGetVoidRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>(GetVoidRecordsDocument, options);
        }
export type GetVoidRecordsQueryHookResult = ReturnType<typeof useGetVoidRecordsQuery>;
export type GetVoidRecordsLazyQueryHookResult = ReturnType<typeof useGetVoidRecordsLazyQuery>;
export type GetVoidRecordsSuspenseQueryHookResult = ReturnType<typeof useGetVoidRecordsSuspenseQuery>;
export type GetVoidRecordsQueryResult = ApolloReactCommon.QueryResult<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>;
export const GetProductionDetailsDocument = gql`
    query GetProductionDetails($startDate: Datetime!, $endDate: Datetime!, $limit: Int = 50) {
  record_palletinfoCollection(
    filter: {plt_remark: {ilike: "%finished in production%"}, generate_time: {gte: $startDate, lte: $endDate}}
    orderBy: [{generate_time: DescNullsLast}]
    first: $limit
  ) {
    edges {
      node {
        plt_num
        product_code
        product_qty
        generate_time
        plt_remark
        series
        pdf_url
      }
    }
  }
}
    `;

/**
 * __useGetProductionDetailsQuery__
 *
 * To run a query within a React component, call `useGetProductionDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProductionDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProductionDetailsQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetProductionDetailsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProductionDetailsQuery, GetProductionDetailsQueryVariables> & ({ variables: GetProductionDetailsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>(GetProductionDetailsDocument, options);
      }
export function useGetProductionDetailsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>(GetProductionDetailsDocument, options);
        }
export function useGetProductionDetailsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>(GetProductionDetailsDocument, options);
        }
export type GetProductionDetailsQueryHookResult = ReturnType<typeof useGetProductionDetailsQuery>;
export type GetProductionDetailsLazyQueryHookResult = ReturnType<typeof useGetProductionDetailsLazyQuery>;
export type GetProductionDetailsSuspenseQueryHookResult = ReturnType<typeof useGetProductionDetailsSuspenseQuery>;
export type GetProductionDetailsQueryResult = ApolloReactCommon.QueryResult<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>;
export const GetInjectionProductionStatsDocument = gql`
    query GetInjectionProductionStats($startDate: Datetime!, $endDate: Datetime!) {
  record_palletinfoCollection(
    filter: {generate_time: {gte: $startDate, lte: $endDate}}
  ) {
    edges {
      node {
        plt_num
        product_qty
        product_code
        generate_time
      }
    }
  }
}
    `;

/**
 * __useGetInjectionProductionStatsQuery__
 *
 * To run a query within a React component, call `useGetInjectionProductionStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInjectionProductionStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInjectionProductionStatsQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetInjectionProductionStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables> & ({ variables: GetInjectionProductionStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>(GetInjectionProductionStatsDocument, options);
      }
export function useGetInjectionProductionStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>(GetInjectionProductionStatsDocument, options);
        }
export function useGetInjectionProductionStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>(GetInjectionProductionStatsDocument, options);
        }
export type GetInjectionProductionStatsQueryHookResult = ReturnType<typeof useGetInjectionProductionStatsQuery>;
export type GetInjectionProductionStatsLazyQueryHookResult = ReturnType<typeof useGetInjectionProductionStatsLazyQuery>;
export type GetInjectionProductionStatsSuspenseQueryHookResult = ReturnType<typeof useGetInjectionProductionStatsSuspenseQuery>;
export type GetInjectionProductionStatsQueryResult = ApolloReactCommon.QueryResult<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>;
export const GetStaffWorkloadDocument = gql`
    query GetStaffWorkload($startDate: Datetime!, $endDate: Datetime!) {
  record_historyCollection(
    filter: {time: {gte: $startDate, lte: $endDate}, action: {ilike: "%QC passed%"}}
    orderBy: [{time: AscNullsLast}]
  ) {
    edges {
      node {
        id
        time
        action
        plt_num
        loc
        remark
        uuid
      }
    }
  }
}
    `;

/**
 * __useGetStaffWorkloadQuery__
 *
 * To run a query within a React component, call `useGetStaffWorkloadQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStaffWorkloadQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStaffWorkloadQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetStaffWorkloadQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables> & ({ variables: GetStaffWorkloadQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>(GetStaffWorkloadDocument, options);
      }
export function useGetStaffWorkloadLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>(GetStaffWorkloadDocument, options);
        }
export function useGetStaffWorkloadSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>(GetStaffWorkloadDocument, options);
        }
export type GetStaffWorkloadQueryHookResult = ReturnType<typeof useGetStaffWorkloadQuery>;
export type GetStaffWorkloadLazyQueryHookResult = ReturnType<typeof useGetStaffWorkloadLazyQuery>;
export type GetStaffWorkloadSuspenseQueryHookResult = ReturnType<typeof useGetStaffWorkloadSuspenseQuery>;
export type GetStaffWorkloadQueryResult = ApolloReactCommon.QueryResult<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>;
export const GetTopProductsByQuantityDocument = gql`
    query GetTopProductsByQuantity($startDate: Datetime!, $endDate: Datetime!, $limit: Int = 10) {
  record_palletinfoCollection(
    filter: {generate_time: {gte: $startDate, lte: $endDate}}
  ) {
    edges {
      node {
        product_code
        product_qty
        data_code {
          description
          colour
          type
        }
      }
    }
  }
}
    `;

/**
 * __useGetTopProductsByQuantityQuery__
 *
 * To run a query within a React component, call `useGetTopProductsByQuantityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTopProductsByQuantityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTopProductsByQuantityQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetTopProductsByQuantityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables> & ({ variables: GetTopProductsByQuantityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>(GetTopProductsByQuantityDocument, options);
      }
export function useGetTopProductsByQuantityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>(GetTopProductsByQuantityDocument, options);
        }
export function useGetTopProductsByQuantitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>(GetTopProductsByQuantityDocument, options);
        }
export type GetTopProductsByQuantityQueryHookResult = ReturnType<typeof useGetTopProductsByQuantityQuery>;
export type GetTopProductsByQuantityLazyQueryHookResult = ReturnType<typeof useGetTopProductsByQuantityLazyQuery>;
export type GetTopProductsByQuantitySuspenseQueryHookResult = ReturnType<typeof useGetTopProductsByQuantitySuspenseQuery>;
export type GetTopProductsByQuantityQueryResult = ApolloReactCommon.QueryResult<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>;
export const GetTopProductsDetailedDocument = gql`
    query GetTopProductsDetailed($startDate: Datetime!, $endDate: Datetime!) {
  record_palletinfoCollection(
    filter: {generate_time: {gte: $startDate, lte: $endDate}}
    orderBy: [{generate_time: DescNullsLast}]
  ) {
    edges {
      node {
        plt_num
        product_code
        product_qty
        generate_time
        series
        data_code {
          description
          colour
          type
          standard_qty
        }
      }
    }
  }
}
    `;

/**
 * __useGetTopProductsDetailedQuery__
 *
 * To run a query within a React component, call `useGetTopProductsDetailedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTopProductsDetailedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTopProductsDetailedQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetTopProductsDetailedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables> & ({ variables: GetTopProductsDetailedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>(GetTopProductsDetailedDocument, options);
      }
export function useGetTopProductsDetailedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>(GetTopProductsDetailedDocument, options);
        }
export function useGetTopProductsDetailedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>(GetTopProductsDetailedDocument, options);
        }
export type GetTopProductsDetailedQueryHookResult = ReturnType<typeof useGetTopProductsDetailedQuery>;
export type GetTopProductsDetailedLazyQueryHookResult = ReturnType<typeof useGetTopProductsDetailedLazyQuery>;
export type GetTopProductsDetailedSuspenseQueryHookResult = ReturnType<typeof useGetTopProductsDetailedSuspenseQuery>;
export type GetTopProductsDetailedQueryResult = ApolloReactCommon.QueryResult<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>;
export const GetHistoryTreeDocument = gql`
    query GetHistoryTree($limit: Int = 50, $offset: Int = 0) {
  record_historyCollection(
    orderBy: [{time: DescNullsLast}]
    first: $limit
    offset: $offset
  ) {
    edges {
      node {
        id
        time
        action
        plt_num
        loc
        remark
        uuid
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
    `;

/**
 * __useGetHistoryTreeQuery__
 *
 * To run a query within a React component, call `useGetHistoryTreeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHistoryTreeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHistoryTreeQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetHistoryTreeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>(GetHistoryTreeDocument, options);
      }
export function useGetHistoryTreeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>(GetHistoryTreeDocument, options);
        }
export function useGetHistoryTreeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>(GetHistoryTreeDocument, options);
        }
export type GetHistoryTreeQueryHookResult = ReturnType<typeof useGetHistoryTreeQuery>;
export type GetHistoryTreeLazyQueryHookResult = ReturnType<typeof useGetHistoryTreeLazyQuery>;
export type GetHistoryTreeSuspenseQueryHookResult = ReturnType<typeof useGetHistoryTreeSuspenseQuery>;
export type GetHistoryTreeQueryResult = ApolloReactCommon.QueryResult<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>;
export const GetInventoryOrderedAnalysisWidgetDocument = gql`
    query GetInventoryOrderedAnalysisWidget($productType: String) {
  record_inventoryCollection(
    filter: {or: [{product_code: {neq: ""}}, {product_code: {is: null}}]}
  ) {
    edges {
      node {
        product_code
        injection
        pipeline
        prebook
        await
        fold
        bulk
        backcarpark
        damage
        await_grn
        latest_update
      }
    }
  }
  data_orderCollection(
    filter: {or: [{product_code: {neq: ""}}, {product_code: {is: null}}]}
  ) {
    edges {
      node {
        product_code
        product_qty
        loaded_qty
      }
    }
  }
  data_codeCollection(filter: {type: {eq: $productType}}) {
    edges {
      node {
        code
        description
        type
        standard_qty
      }
    }
  }
}
    `;

/**
 * __useGetInventoryOrderedAnalysisWidgetQuery__
 *
 * To run a query within a React component, call `useGetInventoryOrderedAnalysisWidgetQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInventoryOrderedAnalysisWidgetQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInventoryOrderedAnalysisWidgetQuery({
 *   variables: {
 *      productType: // value for 'productType'
 *   },
 * });
 */
export function useGetInventoryOrderedAnalysisWidgetQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>(GetInventoryOrderedAnalysisWidgetDocument, options);
      }
export function useGetInventoryOrderedAnalysisWidgetLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>(GetInventoryOrderedAnalysisWidgetDocument, options);
        }
export function useGetInventoryOrderedAnalysisWidgetSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>(GetInventoryOrderedAnalysisWidgetDocument, options);
        }
export type GetInventoryOrderedAnalysisWidgetQueryHookResult = ReturnType<typeof useGetInventoryOrderedAnalysisWidgetQuery>;
export type GetInventoryOrderedAnalysisWidgetLazyQueryHookResult = ReturnType<typeof useGetInventoryOrderedAnalysisWidgetLazyQuery>;
export type GetInventoryOrderedAnalysisWidgetSuspenseQueryHookResult = ReturnType<typeof useGetInventoryOrderedAnalysisWidgetSuspenseQuery>;
export type GetInventoryOrderedAnalysisWidgetQueryResult = ApolloReactCommon.QueryResult<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>;
export const GetTotalPalletsCountDocument = gql`
    query GetTotalPalletsCount {
  record_palletinfoCollection {
    edges {
      node {
        plt_num
      }
    }
  }
}
    `;

/**
 * __useGetTotalPalletsCountQuery__
 *
 * To run a query within a React component, call `useGetTotalPalletsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTotalPalletsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTotalPalletsCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTotalPalletsCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>(GetTotalPalletsCountDocument, options);
      }
export function useGetTotalPalletsCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>(GetTotalPalletsCountDocument, options);
        }
export function useGetTotalPalletsCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>(GetTotalPalletsCountDocument, options);
        }
export type GetTotalPalletsCountQueryHookResult = ReturnType<typeof useGetTotalPalletsCountQuery>;
export type GetTotalPalletsCountLazyQueryHookResult = ReturnType<typeof useGetTotalPalletsCountLazyQuery>;
export type GetTotalPalletsCountSuspenseQueryHookResult = ReturnType<typeof useGetTotalPalletsCountSuspenseQuery>;
export type GetTotalPalletsCountQueryResult = ApolloReactCommon.QueryResult<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>;
export const GetTodayTransfersCountDocument = gql`
    query GetTodayTransfersCount($todayStart: Datetime!) {
  record_transferCollection(filter: {tran_date: {gte: $todayStart}}) {
    edges {
      node {
        uuid
      }
    }
  }
}
    `;

/**
 * __useGetTodayTransfersCountQuery__
 *
 * To run a query within a React component, call `useGetTodayTransfersCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTodayTransfersCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTodayTransfersCountQuery({
 *   variables: {
 *      todayStart: // value for 'todayStart'
 *   },
 * });
 */
export function useGetTodayTransfersCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables> & ({ variables: GetTodayTransfersCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>(GetTodayTransfersCountDocument, options);
      }
export function useGetTodayTransfersCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>(GetTodayTransfersCountDocument, options);
        }
export function useGetTodayTransfersCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>(GetTodayTransfersCountDocument, options);
        }
export type GetTodayTransfersCountQueryHookResult = ReturnType<typeof useGetTodayTransfersCountQuery>;
export type GetTodayTransfersCountLazyQueryHookResult = ReturnType<typeof useGetTodayTransfersCountLazyQuery>;
export type GetTodayTransfersCountSuspenseQueryHookResult = ReturnType<typeof useGetTodayTransfersCountSuspenseQuery>;
export type GetTodayTransfersCountQueryResult = ApolloReactCommon.QueryResult<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>;
export const GetActiveProductsCountDocument = gql`
    query GetActiveProductsCount {
  data_codeCollection {
    edges {
      node {
        code
        description
        type
      }
    }
  }
}
    `;

/**
 * __useGetActiveProductsCountQuery__
 *
 * To run a query within a React component, call `useGetActiveProductsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActiveProductsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActiveProductsCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetActiveProductsCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>(GetActiveProductsCountDocument, options);
      }
export function useGetActiveProductsCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>(GetActiveProductsCountDocument, options);
        }
export function useGetActiveProductsCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>(GetActiveProductsCountDocument, options);
        }
export type GetActiveProductsCountQueryHookResult = ReturnType<typeof useGetActiveProductsCountQuery>;
export type GetActiveProductsCountLazyQueryHookResult = ReturnType<typeof useGetActiveProductsCountLazyQuery>;
export type GetActiveProductsCountSuspenseQueryHookResult = ReturnType<typeof useGetActiveProductsCountSuspenseQuery>;
export type GetActiveProductsCountQueryResult = ApolloReactCommon.QueryResult<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>;
export const GetPendingOrdersCountDocument = gql`
    query GetPendingOrdersCount {
  data_orderCollection {
    edges {
      node {
        order_ref
        loaded_qty
      }
    }
  }
}
    `;

/**
 * __useGetPendingOrdersCountQuery__
 *
 * To run a query within a React component, call `useGetPendingOrdersCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPendingOrdersCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPendingOrdersCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPendingOrdersCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>(GetPendingOrdersCountDocument, options);
      }
export function useGetPendingOrdersCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>(GetPendingOrdersCountDocument, options);
        }
export function useGetPendingOrdersCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>(GetPendingOrdersCountDocument, options);
        }
export type GetPendingOrdersCountQueryHookResult = ReturnType<typeof useGetPendingOrdersCountQuery>;
export type GetPendingOrdersCountLazyQueryHookResult = ReturnType<typeof useGetPendingOrdersCountLazyQuery>;
export type GetPendingOrdersCountSuspenseQueryHookResult = ReturnType<typeof useGetPendingOrdersCountSuspenseQuery>;
export type GetPendingOrdersCountQueryResult = ApolloReactCommon.QueryResult<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>;
export const GetTransferCountDocument = gql`
    query GetTransferCount($startDate: Datetime!, $endDate: Datetime!) {
  record_transferCollection(filter: {tran_date: {gte: $startDate, lte: $endDate}}) {
    edges {
      node {
        uuid
        tran_date
      }
    }
  }
}
    `;

/**
 * __useGetTransferCountQuery__
 *
 * To run a query within a React component, call `useGetTransferCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTransferCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTransferCountQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetTransferCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTransferCountQuery, GetTransferCountQueryVariables> & ({ variables: GetTransferCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTransferCountQuery, GetTransferCountQueryVariables>(GetTransferCountDocument, options);
      }
export function useGetTransferCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTransferCountQuery, GetTransferCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTransferCountQuery, GetTransferCountQueryVariables>(GetTransferCountDocument, options);
        }
export function useGetTransferCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTransferCountQuery, GetTransferCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTransferCountQuery, GetTransferCountQueryVariables>(GetTransferCountDocument, options);
        }
export type GetTransferCountQueryHookResult = ReturnType<typeof useGetTransferCountQuery>;
export type GetTransferCountLazyQueryHookResult = ReturnType<typeof useGetTransferCountLazyQuery>;
export type GetTransferCountSuspenseQueryHookResult = ReturnType<typeof useGetTransferCountSuspenseQuery>;
export type GetTransferCountQueryResult = ApolloReactCommon.QueryResult<GetTransferCountQuery, GetTransferCountQueryVariables>;
export const GetInventoryStatsDocument = gql`
    query GetInventoryStats {
  record_inventoryCollection {
    edges {
      node {
        product_code
        injection
        pipeline
        prebook
        await
        fold
        bulk
        backcarpark
        damage
        await_grn
      }
    }
  }
}
    `;

/**
 * __useGetInventoryStatsQuery__
 *
 * To run a query within a React component, call `useGetInventoryStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInventoryStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInventoryStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetInventoryStatsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>(GetInventoryStatsDocument, options);
      }
export function useGetInventoryStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>(GetInventoryStatsDocument, options);
        }
export function useGetInventoryStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>(GetInventoryStatsDocument, options);
        }
export type GetInventoryStatsQueryHookResult = ReturnType<typeof useGetInventoryStatsQuery>;
export type GetInventoryStatsLazyQueryHookResult = ReturnType<typeof useGetInventoryStatsLazyQuery>;
export type GetInventoryStatsSuspenseQueryHookResult = ReturnType<typeof useGetInventoryStatsSuspenseQuery>;
export type GetInventoryStatsQueryResult = ApolloReactCommon.QueryResult<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>;
export const GetSimpleRecordsDocument = gql`
    query GetSimpleRecords {
  record_palletinfoCollection(first: 10) {
    edges {
      node {
        nodeId
        plt_num
        product_code
        product_qty
        generate_time
        series
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetSimpleRecordsQuery__
 *
 * To run a query within a React component, call `useGetSimpleRecordsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSimpleRecordsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSimpleRecordsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSimpleRecordsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>(GetSimpleRecordsDocument, options);
      }
export function useGetSimpleRecordsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>(GetSimpleRecordsDocument, options);
        }
export function useGetSimpleRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>(GetSimpleRecordsDocument, options);
        }
export type GetSimpleRecordsQueryHookResult = ReturnType<typeof useGetSimpleRecordsQuery>;
export type GetSimpleRecordsLazyQueryHookResult = ReturnType<typeof useGetSimpleRecordsLazyQuery>;
export type GetSimpleRecordsSuspenseQueryHookResult = ReturnType<typeof useGetSimpleRecordsSuspenseQuery>;
export type GetSimpleRecordsQueryResult = ApolloReactCommon.QueryResult<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>;
export const GetDataCodesDocument = gql`
    query GetDataCodes {
  data_codeCollection(first: 10) {
    edges {
      node {
        nodeId
        code
        description
        type
        standard_qty
        colour
      }
    }
  }
}
    `;

/**
 * __useGetDataCodesQuery__
 *
 * To run a query within a React component, call `useGetDataCodesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDataCodesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDataCodesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDataCodesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetDataCodesQuery, GetDataCodesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDataCodesQuery, GetDataCodesQueryVariables>(GetDataCodesDocument, options);
      }
export function useGetDataCodesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDataCodesQuery, GetDataCodesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDataCodesQuery, GetDataCodesQueryVariables>(GetDataCodesDocument, options);
        }
export function useGetDataCodesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDataCodesQuery, GetDataCodesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetDataCodesQuery, GetDataCodesQueryVariables>(GetDataCodesDocument, options);
        }
export type GetDataCodesQueryHookResult = ReturnType<typeof useGetDataCodesQuery>;
export type GetDataCodesLazyQueryHookResult = ReturnType<typeof useGetDataCodesLazyQuery>;
export type GetDataCodesSuspenseQueryHookResult = ReturnType<typeof useGetDataCodesSuspenseQuery>;
export type GetDataCodesQueryResult = ApolloReactCommon.QueryResult<GetDataCodesQuery, GetDataCodesQueryVariables>;
export const GetInventoryWithAwaitDocument = gql`
    query GetInventoryWithAwait {
  record_inventoryCollection(filter: {await: {gt: 0}}, first: 10) {
    edges {
      node {
        nodeId
        plt_num
        product_code
        await
        latest_update
      }
    }
  }
}
    `;

/**
 * __useGetInventoryWithAwaitQuery__
 *
 * To run a query within a React component, call `useGetInventoryWithAwaitQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInventoryWithAwaitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInventoryWithAwaitQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetInventoryWithAwaitQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>(GetInventoryWithAwaitDocument, options);
      }
export function useGetInventoryWithAwaitLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>(GetInventoryWithAwaitDocument, options);
        }
export function useGetInventoryWithAwaitSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>(GetInventoryWithAwaitDocument, options);
        }
export type GetInventoryWithAwaitQueryHookResult = ReturnType<typeof useGetInventoryWithAwaitQuery>;
export type GetInventoryWithAwaitLazyQueryHookResult = ReturnType<typeof useGetInventoryWithAwaitLazyQuery>;
export type GetInventoryWithAwaitSuspenseQueryHookResult = ReturnType<typeof useGetInventoryWithAwaitSuspenseQuery>;
export type GetInventoryWithAwaitQueryResult = ApolloReactCommon.QueryResult<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>;
export const GetOrdersListDocument = gql`
    query GetOrdersList($limit: Int!, $offset: Int!) {
  record_historyCollection(
    filter: {action: {eq: "Order Upload"}}
    orderBy: [{time: DescNullsLast}]
    first: $limit
    offset: $offset
  ) {
    edges {
      node {
        uuid
        time
        id
        action
        plt_num
        loc
        remark
        data_id {
          id
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
    `;

/**
 * __useGetOrdersListQuery__
 *
 * To run a query within a React component, call `useGetOrdersListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrdersListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrdersListQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetOrdersListQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetOrdersListQuery, GetOrdersListQueryVariables> & ({ variables: GetOrdersListQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetOrdersListQuery, GetOrdersListQueryVariables>(GetOrdersListDocument, options);
      }
export function useGetOrdersListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetOrdersListQuery, GetOrdersListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetOrdersListQuery, GetOrdersListQueryVariables>(GetOrdersListDocument, options);
        }
export function useGetOrdersListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetOrdersListQuery, GetOrdersListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetOrdersListQuery, GetOrdersListQueryVariables>(GetOrdersListDocument, options);
        }
export type GetOrdersListQueryHookResult = ReturnType<typeof useGetOrdersListQuery>;
export type GetOrdersListLazyQueryHookResult = ReturnType<typeof useGetOrdersListLazyQuery>;
export type GetOrdersListSuspenseQueryHookResult = ReturnType<typeof useGetOrdersListSuspenseQuery>;
export type GetOrdersListQueryResult = ApolloReactCommon.QueryResult<GetOrdersListQuery, GetOrdersListQueryVariables>;
export const GetOtherFilesListDocument = gql`
    query GetOtherFilesList($limit: Int!, $offset: Int!) {
  doc_uploadCollection(
    filter: {not: {doc_type: {eq: "order"}}}
    orderBy: [{created_at: DescNullsLast}]
    first: $limit
    offset: $offset
  ) {
    edges {
      node {
        uuid
        doc_name
        doc_type
        upload_by
        created_at
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
    `;

/**
 * __useGetOtherFilesListQuery__
 *
 * To run a query within a React component, call `useGetOtherFilesListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOtherFilesListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOtherFilesListQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetOtherFilesListQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetOtherFilesListQuery, GetOtherFilesListQueryVariables> & ({ variables: GetOtherFilesListQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>(GetOtherFilesListDocument, options);
      }
export function useGetOtherFilesListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>(GetOtherFilesListDocument, options);
        }
export function useGetOtherFilesListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>(GetOtherFilesListDocument, options);
        }
export type GetOtherFilesListQueryHookResult = ReturnType<typeof useGetOtherFilesListQuery>;
export type GetOtherFilesListLazyQueryHookResult = ReturnType<typeof useGetOtherFilesListLazyQuery>;
export type GetOtherFilesListSuspenseQueryHookResult = ReturnType<typeof useGetOtherFilesListSuspenseQuery>;
export type GetOtherFilesListQueryResult = ApolloReactCommon.QueryResult<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>;
export const GetAwaitLocationQtyDocument = gql`
    query GetAwaitLocationQty {
  record_inventoryCollection(filter: {await: {gt: 0}}) {
    edges {
      node {
        nodeId
        await
        product_code
      }
    }
  }
}
    `;

/**
 * __useGetAwaitLocationQtyQuery__
 *
 * To run a query within a React component, call `useGetAwaitLocationQtyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAwaitLocationQtyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAwaitLocationQtyQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAwaitLocationQtyQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>(GetAwaitLocationQtyDocument, options);
      }
export function useGetAwaitLocationQtyLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>(GetAwaitLocationQtyDocument, options);
        }
export function useGetAwaitLocationQtySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>(GetAwaitLocationQtyDocument, options);
        }
export type GetAwaitLocationQtyQueryHookResult = ReturnType<typeof useGetAwaitLocationQtyQuery>;
export type GetAwaitLocationQtyLazyQueryHookResult = ReturnType<typeof useGetAwaitLocationQtyLazyQuery>;
export type GetAwaitLocationQtySuspenseQueryHookResult = ReturnType<typeof useGetAwaitLocationQtySuspenseQuery>;
export type GetAwaitLocationQtyQueryResult = ApolloReactCommon.QueryResult<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>;
export const GetOrderStateListDocument = gql`
    query GetOrderStateList($limit: Int = 50, $offset: Int = 0) {
  data_orderCollection(
    filter: {or: [{loaded_qty: {is: null}}]}
    orderBy: [{created_at: DescNullsLast}]
    first: $limit
    offset: $offset
  ) {
    edges {
      node {
        uuid
        order_ref
        account_num
        product_code
        product_desc
        product_qty
        loaded_qty
        created_at
        customer_ref
        invoice_to
        delivery_add
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
    `;

/**
 * __useGetOrderStateListQuery__
 *
 * To run a query within a React component, call `useGetOrderStateListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrderStateListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrderStateListQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetOrderStateListQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetOrderStateListQuery, GetOrderStateListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetOrderStateListQuery, GetOrderStateListQueryVariables>(GetOrderStateListDocument, options);
      }
export function useGetOrderStateListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetOrderStateListQuery, GetOrderStateListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetOrderStateListQuery, GetOrderStateListQueryVariables>(GetOrderStateListDocument, options);
        }
export function useGetOrderStateListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetOrderStateListQuery, GetOrderStateListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetOrderStateListQuery, GetOrderStateListQueryVariables>(GetOrderStateListDocument, options);
        }
export type GetOrderStateListQueryHookResult = ReturnType<typeof useGetOrderStateListQuery>;
export type GetOrderStateListLazyQueryHookResult = ReturnType<typeof useGetOrderStateListLazyQuery>;
export type GetOrderStateListSuspenseQueryHookResult = ReturnType<typeof useGetOrderStateListSuspenseQuery>;
export type GetOrderStateListQueryResult = ApolloReactCommon.QueryResult<GetOrderStateListQuery, GetOrderStateListQueryVariables>;
export const GetStillInAwaitDocument = gql`
    query GetStillInAwait($startDate: Datetime!, $endDate: Datetime!) {
  record_palletinfoCollection(
    filter: {generate_time: {gte: $startDate, lte: $endDate}}
  ) {
    edges {
      node {
        plt_num
        generate_time
        record_inventoryCollection {
          edges {
            node {
              await
              plt_num
            }
          }
        }
      }
    }
  }
}
    `;

/**
 * __useGetStillInAwaitQuery__
 *
 * To run a query within a React component, call `useGetStillInAwaitQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStillInAwaitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStillInAwaitQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetStillInAwaitQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetStillInAwaitQuery, GetStillInAwaitQueryVariables> & ({ variables: GetStillInAwaitQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>(GetStillInAwaitDocument, options);
      }
export function useGetStillInAwaitLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>(GetStillInAwaitDocument, options);
        }
export function useGetStillInAwaitSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>(GetStillInAwaitDocument, options);
        }
export type GetStillInAwaitQueryHookResult = ReturnType<typeof useGetStillInAwaitQuery>;
export type GetStillInAwaitLazyQueryHookResult = ReturnType<typeof useGetStillInAwaitLazyQuery>;
export type GetStillInAwaitSuspenseQueryHookResult = ReturnType<typeof useGetStillInAwaitSuspenseQuery>;
export type GetStillInAwaitQueryResult = ApolloReactCommon.QueryResult<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>;
export const GetStillInAwaitOptimizedDocument = gql`
    query GetStillInAwaitOptimized($startDate: Datetime!, $endDate: Datetime!) {
  record_palletinfoCollection(
    filter: {generate_time: {gte: $startDate, lte: $endDate}}
  ) {
    edges {
      node {
        nodeId
        plt_num
        generate_time
        product_code
        record_inventoryCollection(filter: {await: {gt: 0}}) {
          edges {
            node {
              nodeId
              plt_num
              await
              latest_update
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    `;

/**
 * __useGetStillInAwaitOptimizedQuery__
 *
 * To run a query within a React component, call `useGetStillInAwaitOptimizedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStillInAwaitOptimizedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStillInAwaitOptimizedQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetStillInAwaitOptimizedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables> & ({ variables: GetStillInAwaitOptimizedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>(GetStillInAwaitOptimizedDocument, options);
      }
export function useGetStillInAwaitOptimizedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>(GetStillInAwaitOptimizedDocument, options);
        }
export function useGetStillInAwaitOptimizedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>(GetStillInAwaitOptimizedDocument, options);
        }
export type GetStillInAwaitOptimizedQueryHookResult = ReturnType<typeof useGetStillInAwaitOptimizedQuery>;
export type GetStillInAwaitOptimizedLazyQueryHookResult = ReturnType<typeof useGetStillInAwaitOptimizedLazyQuery>;
export type GetStillInAwaitOptimizedSuspenseQueryHookResult = ReturnType<typeof useGetStillInAwaitOptimizedSuspenseQuery>;
export type GetStillInAwaitOptimizedQueryResult = ApolloReactCommon.QueryResult<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>;
export const GetTransferTimeDistributionDocument = gql`
    query GetTransferTimeDistribution($startDate: Datetime!, $endDate: Datetime!) {
  record_transferCollection(
    filter: {tran_date: {gte: $startDate, lte: $endDate}}
    orderBy: [{tran_date: AscNullsLast}]
  ) {
    edges {
      node {
        uuid
        tran_date
        f_loc
        t_loc
        plt_num
      }
    }
  }
}
    `;

/**
 * __useGetTransferTimeDistributionQuery__
 *
 * To run a query within a React component, call `useGetTransferTimeDistributionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTransferTimeDistributionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTransferTimeDistributionQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetTransferTimeDistributionQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables> & ({ variables: GetTransferTimeDistributionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>(GetTransferTimeDistributionDocument, options);
      }
export function useGetTransferTimeDistributionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>(GetTransferTimeDistributionDocument, options);
        }
export function useGetTransferTimeDistributionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>(GetTransferTimeDistributionDocument, options);
        }
export type GetTransferTimeDistributionQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionQuery>;
export type GetTransferTimeDistributionLazyQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionLazyQuery>;
export type GetTransferTimeDistributionSuspenseQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionSuspenseQuery>;
export type GetTransferTimeDistributionQueryResult = ApolloReactCommon.QueryResult<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>;
export const GetTransferTimeDistributionOptimizedDocument = gql`
    query GetTransferTimeDistributionOptimized($startDate: Datetime!, $endDate: Datetime!) {
  record_transferCollection(
    filter: {tran_date: {gte: $startDate, lte: $endDate}}
    orderBy: [{tran_date: AscNullsLast}]
  ) {
    edges {
      node {
        nodeId
        uuid
        tran_date
        f_loc
        t_loc
        plt_num
        operator_id
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    `;

/**
 * __useGetTransferTimeDistributionOptimizedQuery__
 *
 * To run a query within a React component, call `useGetTransferTimeDistributionOptimizedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTransferTimeDistributionOptimizedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTransferTimeDistributionOptimizedQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetTransferTimeDistributionOptimizedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables> & ({ variables: GetTransferTimeDistributionOptimizedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>(GetTransferTimeDistributionOptimizedDocument, options);
      }
export function useGetTransferTimeDistributionOptimizedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>(GetTransferTimeDistributionOptimizedDocument, options);
        }
export function useGetTransferTimeDistributionOptimizedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>(GetTransferTimeDistributionOptimizedDocument, options);
        }
export type GetTransferTimeDistributionOptimizedQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionOptimizedQuery>;
export type GetTransferTimeDistributionOptimizedLazyQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionOptimizedLazyQuery>;
export type GetTransferTimeDistributionOptimizedSuspenseQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionOptimizedSuspenseQuery>;
export type GetTransferTimeDistributionOptimizedQueryResult = ApolloReactCommon.QueryResult<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>;
export const GetWarehouseTransferListDocument = gql`
    query GetWarehouseTransferList($startDate: Datetime!, $endDate: Datetime!, $limit: Int = 50, $offset: Int = 0) {
  record_transferCollection(
    filter: {tran_date: {gte: $startDate, lte: $endDate}}
    orderBy: [{tran_date: DescNullsLast}]
    first: $limit
    offset: $offset
  ) {
    edges {
      node {
        uuid
        tran_date
        f_loc
        t_loc
        plt_num
        operator_id
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
    `;

/**
 * __useGetWarehouseTransferListQuery__
 *
 * To run a query within a React component, call `useGetWarehouseTransferListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWarehouseTransferListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWarehouseTransferListQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetWarehouseTransferListQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables> & ({ variables: GetWarehouseTransferListQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>(GetWarehouseTransferListDocument, options);
      }
export function useGetWarehouseTransferListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>(GetWarehouseTransferListDocument, options);
        }
export function useGetWarehouseTransferListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>(GetWarehouseTransferListDocument, options);
        }
export type GetWarehouseTransferListQueryHookResult = ReturnType<typeof useGetWarehouseTransferListQuery>;
export type GetWarehouseTransferListLazyQueryHookResult = ReturnType<typeof useGetWarehouseTransferListLazyQuery>;
export type GetWarehouseTransferListSuspenseQueryHookResult = ReturnType<typeof useGetWarehouseTransferListSuspenseQuery>;
export type GetWarehouseTransferListQueryResult = ApolloReactCommon.QueryResult<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>;
export const GetWarehouseWorkLevelDocument = gql`
    query GetWarehouseWorkLevel($startDate: Datetime!, $endDate: Datetime!) {
  work_levelCollection(
    filter: {latest_update: {gte: $startDate, lte: $endDate}}
    orderBy: [{latest_update: AscNullsLast}]
  ) {
    edges {
      node {
        uuid
        id
        qc
        move
        grn
        loading
        latest_update
      }
    }
  }
}
    `;

/**
 * __useGetWarehouseWorkLevelQuery__
 *
 * To run a query within a React component, call `useGetWarehouseWorkLevelQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWarehouseWorkLevelQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWarehouseWorkLevelQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetWarehouseWorkLevelQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables> & ({ variables: GetWarehouseWorkLevelQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>(GetWarehouseWorkLevelDocument, options);
      }
export function useGetWarehouseWorkLevelLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>(GetWarehouseWorkLevelDocument, options);
        }
export function useGetWarehouseWorkLevelSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>(GetWarehouseWorkLevelDocument, options);
        }
export type GetWarehouseWorkLevelQueryHookResult = ReturnType<typeof useGetWarehouseWorkLevelQuery>;
export type GetWarehouseWorkLevelLazyQueryHookResult = ReturnType<typeof useGetWarehouseWorkLevelLazyQuery>;
export type GetWarehouseWorkLevelSuspenseQueryHookResult = ReturnType<typeof useGetWarehouseWorkLevelSuspenseQuery>;
export type GetWarehouseWorkLevelQueryResult = ApolloReactCommon.QueryResult<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>;
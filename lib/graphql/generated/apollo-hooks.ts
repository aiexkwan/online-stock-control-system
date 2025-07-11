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
export function useGetDashboardBatchDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables> & ({ variables: Types.GetDashboardBatchDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables>(GetDashboardBatchDataDocument, options);
      }
export function useGetDashboardBatchDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables>(GetDashboardBatchDataDocument, options);
        }
export function useGetDashboardBatchDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables>(GetDashboardBatchDataDocument, options);
        }
export type GetDashboardBatchDataQueryHookResult = ReturnType<typeof useGetDashboardBatchDataQuery>;
export type GetDashboardBatchDataLazyQueryHookResult = ReturnType<typeof useGetDashboardBatchDataLazyQuery>;
export type GetDashboardBatchDataSuspenseQueryHookResult = ReturnType<typeof useGetDashboardBatchDataSuspenseQuery>;
export type GetDashboardBatchDataQueryResult = ApolloReactCommon.QueryResult<Types.GetDashboardBatchDataQuery, Types.GetDashboardBatchDataQueryVariables>;
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
export function useGetAcoOrdersForCardsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>(GetAcoOrdersForCardsDocument, options);
      }
export function useGetAcoOrdersForCardsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>(GetAcoOrdersForCardsDocument, options);
        }
export function useGetAcoOrdersForCardsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>(GetAcoOrdersForCardsDocument, options);
        }
export type GetAcoOrdersForCardsQueryHookResult = ReturnType<typeof useGetAcoOrdersForCardsQuery>;
export type GetAcoOrdersForCardsLazyQueryHookResult = ReturnType<typeof useGetAcoOrdersForCardsLazyQuery>;
export type GetAcoOrdersForCardsSuspenseQueryHookResult = ReturnType<typeof useGetAcoOrdersForCardsSuspenseQuery>;
export type GetAcoOrdersForCardsQueryResult = ApolloReactCommon.QueryResult<Types.GetAcoOrdersForCardsQuery, Types.GetAcoOrdersForCardsQueryVariables>;
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
export function useGetAcoOrdersForChartQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>(GetAcoOrdersForChartDocument, options);
      }
export function useGetAcoOrdersForChartLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>(GetAcoOrdersForChartDocument, options);
        }
export function useGetAcoOrdersForChartSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>(GetAcoOrdersForChartDocument, options);
        }
export type GetAcoOrdersForChartQueryHookResult = ReturnType<typeof useGetAcoOrdersForChartQuery>;
export type GetAcoOrdersForChartLazyQueryHookResult = ReturnType<typeof useGetAcoOrdersForChartLazyQuery>;
export type GetAcoOrdersForChartSuspenseQueryHookResult = ReturnType<typeof useGetAcoOrdersForChartSuspenseQuery>;
export type GetAcoOrdersForChartQueryResult = ApolloReactCommon.QueryResult<Types.GetAcoOrdersForChartQuery, Types.GetAcoOrdersForChartQueryVariables>;
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
export function useGetInventoryTurnoverQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>(GetInventoryTurnoverDocument, options);
      }
export function useGetInventoryTurnoverLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>(GetInventoryTurnoverDocument, options);
        }
export function useGetInventoryTurnoverSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>(GetInventoryTurnoverDocument, options);
        }
export type GetInventoryTurnoverQueryHookResult = ReturnType<typeof useGetInventoryTurnoverQuery>;
export type GetInventoryTurnoverLazyQueryHookResult = ReturnType<typeof useGetInventoryTurnoverLazyQuery>;
export type GetInventoryTurnoverSuspenseQueryHookResult = ReturnType<typeof useGetInventoryTurnoverSuspenseQuery>;
export type GetInventoryTurnoverQueryResult = ApolloReactCommon.QueryResult<Types.GetInventoryTurnoverQuery, Types.GetInventoryTurnoverQueryVariables>;
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
export function useGetInventoryLocationsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>(GetInventoryLocationsDocument, options);
      }
export function useGetInventoryLocationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>(GetInventoryLocationsDocument, options);
        }
export function useGetInventoryLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>(GetInventoryLocationsDocument, options);
        }
export type GetInventoryLocationsQueryHookResult = ReturnType<typeof useGetInventoryLocationsQuery>;
export type GetInventoryLocationsLazyQueryHookResult = ReturnType<typeof useGetInventoryLocationsLazyQuery>;
export type GetInventoryLocationsSuspenseQueryHookResult = ReturnType<typeof useGetInventoryLocationsSuspenseQuery>;
export type GetInventoryLocationsQueryResult = ApolloReactCommon.QueryResult<Types.GetInventoryLocationsQuery, Types.GetInventoryLocationsQueryVariables>;
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
export function useGetStocktakeAccuracyQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>(GetStocktakeAccuracyDocument, options);
      }
export function useGetStocktakeAccuracyLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>(GetStocktakeAccuracyDocument, options);
        }
export function useGetStocktakeAccuracySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>(GetStocktakeAccuracyDocument, options);
        }
export type GetStocktakeAccuracyQueryHookResult = ReturnType<typeof useGetStocktakeAccuracyQuery>;
export type GetStocktakeAccuracyLazyQueryHookResult = ReturnType<typeof useGetStocktakeAccuracyLazyQuery>;
export type GetStocktakeAccuracySuspenseQueryHookResult = ReturnType<typeof useGetStocktakeAccuracySuspenseQuery>;
export type GetStocktakeAccuracyQueryResult = ApolloReactCommon.QueryResult<Types.GetStocktakeAccuracyQuery, Types.GetStocktakeAccuracyQueryVariables>;
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
export function useGetTopProductsInventoryQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>(GetTopProductsInventoryDocument, options);
      }
export function useGetTopProductsInventoryLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>(GetTopProductsInventoryDocument, options);
        }
export function useGetTopProductsInventorySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>(GetTopProductsInventoryDocument, options);
        }
export type GetTopProductsInventoryQueryHookResult = ReturnType<typeof useGetTopProductsInventoryQuery>;
export type GetTopProductsInventoryLazyQueryHookResult = ReturnType<typeof useGetTopProductsInventoryLazyQuery>;
export type GetTopProductsInventorySuspenseQueryHookResult = ReturnType<typeof useGetTopProductsInventorySuspenseQuery>;
export type GetTopProductsInventoryQueryResult = ApolloReactCommon.QueryResult<Types.GetTopProductsInventoryQuery, Types.GetTopProductsInventoryQueryVariables>;
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
export function useGetUserActivityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables> & ({ variables: Types.GetUserActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables>(GetUserActivityDocument, options);
      }
export function useGetUserActivityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables>(GetUserActivityDocument, options);
        }
export function useGetUserActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables>(GetUserActivityDocument, options);
        }
export type GetUserActivityQueryHookResult = ReturnType<typeof useGetUserActivityQuery>;
export type GetUserActivityLazyQueryHookResult = ReturnType<typeof useGetUserActivityLazyQuery>;
export type GetUserActivitySuspenseQueryHookResult = ReturnType<typeof useGetUserActivitySuspenseQuery>;
export type GetUserActivityQueryResult = ApolloReactCommon.QueryResult<Types.GetUserActivityQuery, Types.GetUserActivityQueryVariables>;
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
export function useGetVoidRecordsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>(GetVoidRecordsDocument, options);
      }
export function useGetVoidRecordsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>(GetVoidRecordsDocument, options);
        }
export function useGetVoidRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>(GetVoidRecordsDocument, options);
        }
export type GetVoidRecordsQueryHookResult = ReturnType<typeof useGetVoidRecordsQuery>;
export type GetVoidRecordsLazyQueryHookResult = ReturnType<typeof useGetVoidRecordsLazyQuery>;
export type GetVoidRecordsSuspenseQueryHookResult = ReturnType<typeof useGetVoidRecordsSuspenseQuery>;
export type GetVoidRecordsQueryResult = ApolloReactCommon.QueryResult<Types.GetVoidRecordsQuery, Types.GetVoidRecordsQueryVariables>;
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
export function useGetProductionDetailsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables> & ({ variables: Types.GetProductionDetailsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables>(GetProductionDetailsDocument, options);
      }
export function useGetProductionDetailsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables>(GetProductionDetailsDocument, options);
        }
export function useGetProductionDetailsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables>(GetProductionDetailsDocument, options);
        }
export type GetProductionDetailsQueryHookResult = ReturnType<typeof useGetProductionDetailsQuery>;
export type GetProductionDetailsLazyQueryHookResult = ReturnType<typeof useGetProductionDetailsLazyQuery>;
export type GetProductionDetailsSuspenseQueryHookResult = ReturnType<typeof useGetProductionDetailsSuspenseQuery>;
export type GetProductionDetailsQueryResult = ApolloReactCommon.QueryResult<Types.GetProductionDetailsQuery, Types.GetProductionDetailsQueryVariables>;
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
export function useGetInjectionProductionStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables> & ({ variables: Types.GetInjectionProductionStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables>(GetInjectionProductionStatsDocument, options);
      }
export function useGetInjectionProductionStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables>(GetInjectionProductionStatsDocument, options);
        }
export function useGetInjectionProductionStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables>(GetInjectionProductionStatsDocument, options);
        }
export type GetInjectionProductionStatsQueryHookResult = ReturnType<typeof useGetInjectionProductionStatsQuery>;
export type GetInjectionProductionStatsLazyQueryHookResult = ReturnType<typeof useGetInjectionProductionStatsLazyQuery>;
export type GetInjectionProductionStatsSuspenseQueryHookResult = ReturnType<typeof useGetInjectionProductionStatsSuspenseQuery>;
export type GetInjectionProductionStatsQueryResult = ApolloReactCommon.QueryResult<Types.GetInjectionProductionStatsQuery, Types.GetInjectionProductionStatsQueryVariables>;
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
export function useGetStaffWorkloadQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables> & ({ variables: Types.GetStaffWorkloadQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables>(GetStaffWorkloadDocument, options);
      }
export function useGetStaffWorkloadLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables>(GetStaffWorkloadDocument, options);
        }
export function useGetStaffWorkloadSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables>(GetStaffWorkloadDocument, options);
        }
export type GetStaffWorkloadQueryHookResult = ReturnType<typeof useGetStaffWorkloadQuery>;
export type GetStaffWorkloadLazyQueryHookResult = ReturnType<typeof useGetStaffWorkloadLazyQuery>;
export type GetStaffWorkloadSuspenseQueryHookResult = ReturnType<typeof useGetStaffWorkloadSuspenseQuery>;
export type GetStaffWorkloadQueryResult = ApolloReactCommon.QueryResult<Types.GetStaffWorkloadQuery, Types.GetStaffWorkloadQueryVariables>;
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
export function useGetTopProductsByQuantityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables> & ({ variables: Types.GetTopProductsByQuantityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables>(GetTopProductsByQuantityDocument, options);
      }
export function useGetTopProductsByQuantityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables>(GetTopProductsByQuantityDocument, options);
        }
export function useGetTopProductsByQuantitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables>(GetTopProductsByQuantityDocument, options);
        }
export type GetTopProductsByQuantityQueryHookResult = ReturnType<typeof useGetTopProductsByQuantityQuery>;
export type GetTopProductsByQuantityLazyQueryHookResult = ReturnType<typeof useGetTopProductsByQuantityLazyQuery>;
export type GetTopProductsByQuantitySuspenseQueryHookResult = ReturnType<typeof useGetTopProductsByQuantitySuspenseQuery>;
export type GetTopProductsByQuantityQueryResult = ApolloReactCommon.QueryResult<Types.GetTopProductsByQuantityQuery, Types.GetTopProductsByQuantityQueryVariables>;
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
export function useGetTopProductsDetailedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables> & ({ variables: Types.GetTopProductsDetailedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables>(GetTopProductsDetailedDocument, options);
      }
export function useGetTopProductsDetailedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables>(GetTopProductsDetailedDocument, options);
        }
export function useGetTopProductsDetailedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables>(GetTopProductsDetailedDocument, options);
        }
export type GetTopProductsDetailedQueryHookResult = ReturnType<typeof useGetTopProductsDetailedQuery>;
export type GetTopProductsDetailedLazyQueryHookResult = ReturnType<typeof useGetTopProductsDetailedLazyQuery>;
export type GetTopProductsDetailedSuspenseQueryHookResult = ReturnType<typeof useGetTopProductsDetailedSuspenseQuery>;
export type GetTopProductsDetailedQueryResult = ApolloReactCommon.QueryResult<Types.GetTopProductsDetailedQuery, Types.GetTopProductsDetailedQueryVariables>;
export const GetProductByCodeDocument = gql`
    query GetProductByCode($code: String!) {
  data_codeCollection(filter: {code: {eq: $code}}) {
    edges {
      node {
        code
        description
        colour
        standard_qty
        type
        remark
      }
    }
  }
}
    `;
export function useGetProductByCodeQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables> & ({ variables: Types.GetProductByCodeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables>(GetProductByCodeDocument, options);
      }
export function useGetProductByCodeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables>(GetProductByCodeDocument, options);
        }
export function useGetProductByCodeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables>(GetProductByCodeDocument, options);
        }
export type GetProductByCodeQueryHookResult = ReturnType<typeof useGetProductByCodeQuery>;
export type GetProductByCodeLazyQueryHookResult = ReturnType<typeof useGetProductByCodeLazyQuery>;
export type GetProductByCodeSuspenseQueryHookResult = ReturnType<typeof useGetProductByCodeSuspenseQuery>;
export type GetProductByCodeQueryResult = ApolloReactCommon.QueryResult<Types.GetProductByCodeQuery, Types.GetProductByCodeQueryVariables>;
export const GetProductsDocument = gql`
    query GetProducts($codeFilter: String, $descriptionFilter: String, $typeFilter: String, $first: Int = 50, $offset: Int = 0) {
  data_codeCollection(
    first: $first
    offset: $offset
    filter: {code: {ilike: $codeFilter}, description: {ilike: $descriptionFilter}, type: {eq: $typeFilter}}
    orderBy: [{code: AscNullsLast}]
  ) {
    edges {
      node {
        code
        description
        colour
        standard_qty
        type
        remark
      }
    }
  }
}
    `;
export function useGetProductsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetProductsQuery, Types.GetProductsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetProductsQuery, Types.GetProductsQueryVariables>(GetProductsDocument, options);
      }
export function useGetProductsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetProductsQuery, Types.GetProductsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetProductsQuery, Types.GetProductsQueryVariables>(GetProductsDocument, options);
        }
export function useGetProductsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetProductsQuery, Types.GetProductsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetProductsQuery, Types.GetProductsQueryVariables>(GetProductsDocument, options);
        }
export type GetProductsQueryHookResult = ReturnType<typeof useGetProductsQuery>;
export type GetProductsLazyQueryHookResult = ReturnType<typeof useGetProductsLazyQuery>;
export type GetProductsSuspenseQueryHookResult = ReturnType<typeof useGetProductsSuspenseQuery>;
export type GetProductsQueryResult = ApolloReactCommon.QueryResult<Types.GetProductsQuery, Types.GetProductsQueryVariables>;
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
export function useGetHistoryTreeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>(GetHistoryTreeDocument, options);
      }
export function useGetHistoryTreeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>(GetHistoryTreeDocument, options);
        }
export function useGetHistoryTreeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>(GetHistoryTreeDocument, options);
        }
export type GetHistoryTreeQueryHookResult = ReturnType<typeof useGetHistoryTreeQuery>;
export type GetHistoryTreeLazyQueryHookResult = ReturnType<typeof useGetHistoryTreeLazyQuery>;
export type GetHistoryTreeSuspenseQueryHookResult = ReturnType<typeof useGetHistoryTreeSuspenseQuery>;
export type GetHistoryTreeQueryResult = ApolloReactCommon.QueryResult<Types.GetHistoryTreeQuery, Types.GetHistoryTreeQueryVariables>;
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
export function useGetInventoryOrderedAnalysisWidgetQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>(GetInventoryOrderedAnalysisWidgetDocument, options);
      }
export function useGetInventoryOrderedAnalysisWidgetLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>(GetInventoryOrderedAnalysisWidgetDocument, options);
        }
export function useGetInventoryOrderedAnalysisWidgetSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>(GetInventoryOrderedAnalysisWidgetDocument, options);
        }
export type GetInventoryOrderedAnalysisWidgetQueryHookResult = ReturnType<typeof useGetInventoryOrderedAnalysisWidgetQuery>;
export type GetInventoryOrderedAnalysisWidgetLazyQueryHookResult = ReturnType<typeof useGetInventoryOrderedAnalysisWidgetLazyQuery>;
export type GetInventoryOrderedAnalysisWidgetSuspenseQueryHookResult = ReturnType<typeof useGetInventoryOrderedAnalysisWidgetSuspenseQuery>;
export type GetInventoryOrderedAnalysisWidgetQueryResult = ApolloReactCommon.QueryResult<Types.GetInventoryOrderedAnalysisWidgetQuery, Types.GetInventoryOrderedAnalysisWidgetQueryVariables>;
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
export function useGetTotalPalletsCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>(GetTotalPalletsCountDocument, options);
      }
export function useGetTotalPalletsCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>(GetTotalPalletsCountDocument, options);
        }
export function useGetTotalPalletsCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>(GetTotalPalletsCountDocument, options);
        }
export type GetTotalPalletsCountQueryHookResult = ReturnType<typeof useGetTotalPalletsCountQuery>;
export type GetTotalPalletsCountLazyQueryHookResult = ReturnType<typeof useGetTotalPalletsCountLazyQuery>;
export type GetTotalPalletsCountSuspenseQueryHookResult = ReturnType<typeof useGetTotalPalletsCountSuspenseQuery>;
export type GetTotalPalletsCountQueryResult = ApolloReactCommon.QueryResult<Types.GetTotalPalletsCountQuery, Types.GetTotalPalletsCountQueryVariables>;
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
export function useGetTodayTransfersCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables> & ({ variables: Types.GetTodayTransfersCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables>(GetTodayTransfersCountDocument, options);
      }
export function useGetTodayTransfersCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables>(GetTodayTransfersCountDocument, options);
        }
export function useGetTodayTransfersCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables>(GetTodayTransfersCountDocument, options);
        }
export type GetTodayTransfersCountQueryHookResult = ReturnType<typeof useGetTodayTransfersCountQuery>;
export type GetTodayTransfersCountLazyQueryHookResult = ReturnType<typeof useGetTodayTransfersCountLazyQuery>;
export type GetTodayTransfersCountSuspenseQueryHookResult = ReturnType<typeof useGetTodayTransfersCountSuspenseQuery>;
export type GetTodayTransfersCountQueryResult = ApolloReactCommon.QueryResult<Types.GetTodayTransfersCountQuery, Types.GetTodayTransfersCountQueryVariables>;
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
export function useGetActiveProductsCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>(GetActiveProductsCountDocument, options);
      }
export function useGetActiveProductsCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>(GetActiveProductsCountDocument, options);
        }
export function useGetActiveProductsCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>(GetActiveProductsCountDocument, options);
        }
export type GetActiveProductsCountQueryHookResult = ReturnType<typeof useGetActiveProductsCountQuery>;
export type GetActiveProductsCountLazyQueryHookResult = ReturnType<typeof useGetActiveProductsCountLazyQuery>;
export type GetActiveProductsCountSuspenseQueryHookResult = ReturnType<typeof useGetActiveProductsCountSuspenseQuery>;
export type GetActiveProductsCountQueryResult = ApolloReactCommon.QueryResult<Types.GetActiveProductsCountQuery, Types.GetActiveProductsCountQueryVariables>;
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
export function useGetPendingOrdersCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>(GetPendingOrdersCountDocument, options);
      }
export function useGetPendingOrdersCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>(GetPendingOrdersCountDocument, options);
        }
export function useGetPendingOrdersCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>(GetPendingOrdersCountDocument, options);
        }
export type GetPendingOrdersCountQueryHookResult = ReturnType<typeof useGetPendingOrdersCountQuery>;
export type GetPendingOrdersCountLazyQueryHookResult = ReturnType<typeof useGetPendingOrdersCountLazyQuery>;
export type GetPendingOrdersCountSuspenseQueryHookResult = ReturnType<typeof useGetPendingOrdersCountSuspenseQuery>;
export type GetPendingOrdersCountQueryResult = ApolloReactCommon.QueryResult<Types.GetPendingOrdersCountQuery, Types.GetPendingOrdersCountQueryVariables>;
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
export function useGetTransferCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables> & ({ variables: Types.GetTransferCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables>(GetTransferCountDocument, options);
      }
export function useGetTransferCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables>(GetTransferCountDocument, options);
        }
export function useGetTransferCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables>(GetTransferCountDocument, options);
        }
export type GetTransferCountQueryHookResult = ReturnType<typeof useGetTransferCountQuery>;
export type GetTransferCountLazyQueryHookResult = ReturnType<typeof useGetTransferCountLazyQuery>;
export type GetTransferCountSuspenseQueryHookResult = ReturnType<typeof useGetTransferCountSuspenseQuery>;
export type GetTransferCountQueryResult = ApolloReactCommon.QueryResult<Types.GetTransferCountQuery, Types.GetTransferCountQueryVariables>;
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
export function useGetInventoryStatsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>(GetInventoryStatsDocument, options);
      }
export function useGetInventoryStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>(GetInventoryStatsDocument, options);
        }
export function useGetInventoryStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>(GetInventoryStatsDocument, options);
        }
export type GetInventoryStatsQueryHookResult = ReturnType<typeof useGetInventoryStatsQuery>;
export type GetInventoryStatsLazyQueryHookResult = ReturnType<typeof useGetInventoryStatsLazyQuery>;
export type GetInventoryStatsSuspenseQueryHookResult = ReturnType<typeof useGetInventoryStatsSuspenseQuery>;
export type GetInventoryStatsQueryResult = ApolloReactCommon.QueryResult<Types.GetInventoryStatsQuery, Types.GetInventoryStatsQueryVariables>;
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
export function useGetSimpleRecordsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>(GetSimpleRecordsDocument, options);
      }
export function useGetSimpleRecordsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>(GetSimpleRecordsDocument, options);
        }
export function useGetSimpleRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>(GetSimpleRecordsDocument, options);
        }
export type GetSimpleRecordsQueryHookResult = ReturnType<typeof useGetSimpleRecordsQuery>;
export type GetSimpleRecordsLazyQueryHookResult = ReturnType<typeof useGetSimpleRecordsLazyQuery>;
export type GetSimpleRecordsSuspenseQueryHookResult = ReturnType<typeof useGetSimpleRecordsSuspenseQuery>;
export type GetSimpleRecordsQueryResult = ApolloReactCommon.QueryResult<Types.GetSimpleRecordsQuery, Types.GetSimpleRecordsQueryVariables>;
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
export function useGetDataCodesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>(GetDataCodesDocument, options);
      }
export function useGetDataCodesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>(GetDataCodesDocument, options);
        }
export function useGetDataCodesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>(GetDataCodesDocument, options);
        }
export type GetDataCodesQueryHookResult = ReturnType<typeof useGetDataCodesQuery>;
export type GetDataCodesLazyQueryHookResult = ReturnType<typeof useGetDataCodesLazyQuery>;
export type GetDataCodesSuspenseQueryHookResult = ReturnType<typeof useGetDataCodesSuspenseQuery>;
export type GetDataCodesQueryResult = ApolloReactCommon.QueryResult<Types.GetDataCodesQuery, Types.GetDataCodesQueryVariables>;
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
export function useGetInventoryWithAwaitQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>(GetInventoryWithAwaitDocument, options);
      }
export function useGetInventoryWithAwaitLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>(GetInventoryWithAwaitDocument, options);
        }
export function useGetInventoryWithAwaitSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>(GetInventoryWithAwaitDocument, options);
        }
export type GetInventoryWithAwaitQueryHookResult = ReturnType<typeof useGetInventoryWithAwaitQuery>;
export type GetInventoryWithAwaitLazyQueryHookResult = ReturnType<typeof useGetInventoryWithAwaitLazyQuery>;
export type GetInventoryWithAwaitSuspenseQueryHookResult = ReturnType<typeof useGetInventoryWithAwaitSuspenseQuery>;
export type GetInventoryWithAwaitQueryResult = ApolloReactCommon.QueryResult<Types.GetInventoryWithAwaitQuery, Types.GetInventoryWithAwaitQueryVariables>;
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
export function useGetOrdersListQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables> & ({ variables: Types.GetOrdersListQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables>(GetOrdersListDocument, options);
      }
export function useGetOrdersListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables>(GetOrdersListDocument, options);
        }
export function useGetOrdersListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables>(GetOrdersListDocument, options);
        }
export type GetOrdersListQueryHookResult = ReturnType<typeof useGetOrdersListQuery>;
export type GetOrdersListLazyQueryHookResult = ReturnType<typeof useGetOrdersListLazyQuery>;
export type GetOrdersListSuspenseQueryHookResult = ReturnType<typeof useGetOrdersListSuspenseQuery>;
export type GetOrdersListQueryResult = ApolloReactCommon.QueryResult<Types.GetOrdersListQuery, Types.GetOrdersListQueryVariables>;
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
export function useGetOtherFilesListQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables> & ({ variables: Types.GetOtherFilesListQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables>(GetOtherFilesListDocument, options);
      }
export function useGetOtherFilesListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables>(GetOtherFilesListDocument, options);
        }
export function useGetOtherFilesListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables>(GetOtherFilesListDocument, options);
        }
export type GetOtherFilesListQueryHookResult = ReturnType<typeof useGetOtherFilesListQuery>;
export type GetOtherFilesListLazyQueryHookResult = ReturnType<typeof useGetOtherFilesListLazyQuery>;
export type GetOtherFilesListSuspenseQueryHookResult = ReturnType<typeof useGetOtherFilesListSuspenseQuery>;
export type GetOtherFilesListQueryResult = ApolloReactCommon.QueryResult<Types.GetOtherFilesListQuery, Types.GetOtherFilesListQueryVariables>;
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
export function useGetAwaitLocationQtyQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>(GetAwaitLocationQtyDocument, options);
      }
export function useGetAwaitLocationQtyLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>(GetAwaitLocationQtyDocument, options);
        }
export function useGetAwaitLocationQtySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>(GetAwaitLocationQtyDocument, options);
        }
export type GetAwaitLocationQtyQueryHookResult = ReturnType<typeof useGetAwaitLocationQtyQuery>;
export type GetAwaitLocationQtyLazyQueryHookResult = ReturnType<typeof useGetAwaitLocationQtyLazyQuery>;
export type GetAwaitLocationQtySuspenseQueryHookResult = ReturnType<typeof useGetAwaitLocationQtySuspenseQuery>;
export type GetAwaitLocationQtyQueryResult = ApolloReactCommon.QueryResult<Types.GetAwaitLocationQtyQuery, Types.GetAwaitLocationQtyQueryVariables>;
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
export function useGetOrderStateListQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>(GetOrderStateListDocument, options);
      }
export function useGetOrderStateListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>(GetOrderStateListDocument, options);
        }
export function useGetOrderStateListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>(GetOrderStateListDocument, options);
        }
export type GetOrderStateListQueryHookResult = ReturnType<typeof useGetOrderStateListQuery>;
export type GetOrderStateListLazyQueryHookResult = ReturnType<typeof useGetOrderStateListLazyQuery>;
export type GetOrderStateListSuspenseQueryHookResult = ReturnType<typeof useGetOrderStateListSuspenseQuery>;
export type GetOrderStateListQueryResult = ApolloReactCommon.QueryResult<Types.GetOrderStateListQuery, Types.GetOrderStateListQueryVariables>;
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
export function useGetStillInAwaitQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables> & ({ variables: Types.GetStillInAwaitQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables>(GetStillInAwaitDocument, options);
      }
export function useGetStillInAwaitLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables>(GetStillInAwaitDocument, options);
        }
export function useGetStillInAwaitSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables>(GetStillInAwaitDocument, options);
        }
export type GetStillInAwaitQueryHookResult = ReturnType<typeof useGetStillInAwaitQuery>;
export type GetStillInAwaitLazyQueryHookResult = ReturnType<typeof useGetStillInAwaitLazyQuery>;
export type GetStillInAwaitSuspenseQueryHookResult = ReturnType<typeof useGetStillInAwaitSuspenseQuery>;
export type GetStillInAwaitQueryResult = ApolloReactCommon.QueryResult<Types.GetStillInAwaitQuery, Types.GetStillInAwaitQueryVariables>;
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
export function useGetStillInAwaitOptimizedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables> & ({ variables: Types.GetStillInAwaitOptimizedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables>(GetStillInAwaitOptimizedDocument, options);
      }
export function useGetStillInAwaitOptimizedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables>(GetStillInAwaitOptimizedDocument, options);
        }
export function useGetStillInAwaitOptimizedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables>(GetStillInAwaitOptimizedDocument, options);
        }
export type GetStillInAwaitOptimizedQueryHookResult = ReturnType<typeof useGetStillInAwaitOptimizedQuery>;
export type GetStillInAwaitOptimizedLazyQueryHookResult = ReturnType<typeof useGetStillInAwaitOptimizedLazyQuery>;
export type GetStillInAwaitOptimizedSuspenseQueryHookResult = ReturnType<typeof useGetStillInAwaitOptimizedSuspenseQuery>;
export type GetStillInAwaitOptimizedQueryResult = ApolloReactCommon.QueryResult<Types.GetStillInAwaitOptimizedQuery, Types.GetStillInAwaitOptimizedQueryVariables>;
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
export function useGetTransferTimeDistributionQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables> & ({ variables: Types.GetTransferTimeDistributionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables>(GetTransferTimeDistributionDocument, options);
      }
export function useGetTransferTimeDistributionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables>(GetTransferTimeDistributionDocument, options);
        }
export function useGetTransferTimeDistributionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables>(GetTransferTimeDistributionDocument, options);
        }
export type GetTransferTimeDistributionQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionQuery>;
export type GetTransferTimeDistributionLazyQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionLazyQuery>;
export type GetTransferTimeDistributionSuspenseQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionSuspenseQuery>;
export type GetTransferTimeDistributionQueryResult = ApolloReactCommon.QueryResult<Types.GetTransferTimeDistributionQuery, Types.GetTransferTimeDistributionQueryVariables>;
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
export function useGetTransferTimeDistributionOptimizedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables> & ({ variables: Types.GetTransferTimeDistributionOptimizedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables>(GetTransferTimeDistributionOptimizedDocument, options);
      }
export function useGetTransferTimeDistributionOptimizedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables>(GetTransferTimeDistributionOptimizedDocument, options);
        }
export function useGetTransferTimeDistributionOptimizedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables>(GetTransferTimeDistributionOptimizedDocument, options);
        }
export type GetTransferTimeDistributionOptimizedQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionOptimizedQuery>;
export type GetTransferTimeDistributionOptimizedLazyQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionOptimizedLazyQuery>;
export type GetTransferTimeDistributionOptimizedSuspenseQueryHookResult = ReturnType<typeof useGetTransferTimeDistributionOptimizedSuspenseQuery>;
export type GetTransferTimeDistributionOptimizedQueryResult = ApolloReactCommon.QueryResult<Types.GetTransferTimeDistributionOptimizedQuery, Types.GetTransferTimeDistributionOptimizedQueryVariables>;
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
export function useGetWarehouseTransferListQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables> & ({ variables: Types.GetWarehouseTransferListQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables>(GetWarehouseTransferListDocument, options);
      }
export function useGetWarehouseTransferListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables>(GetWarehouseTransferListDocument, options);
        }
export function useGetWarehouseTransferListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables>(GetWarehouseTransferListDocument, options);
        }
export type GetWarehouseTransferListQueryHookResult = ReturnType<typeof useGetWarehouseTransferListQuery>;
export type GetWarehouseTransferListLazyQueryHookResult = ReturnType<typeof useGetWarehouseTransferListLazyQuery>;
export type GetWarehouseTransferListSuspenseQueryHookResult = ReturnType<typeof useGetWarehouseTransferListSuspenseQuery>;
export type GetWarehouseTransferListQueryResult = ApolloReactCommon.QueryResult<Types.GetWarehouseTransferListQuery, Types.GetWarehouseTransferListQueryVariables>;
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
export function useGetWarehouseWorkLevelQuery(baseOptions: ApolloReactHooks.QueryHookOptions<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables> & ({ variables: Types.GetWarehouseWorkLevelQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables>(GetWarehouseWorkLevelDocument, options);
      }
export function useGetWarehouseWorkLevelLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables>(GetWarehouseWorkLevelDocument, options);
        }
export function useGetWarehouseWorkLevelSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables>(GetWarehouseWorkLevelDocument, options);
        }
export type GetWarehouseWorkLevelQueryHookResult = ReturnType<typeof useGetWarehouseWorkLevelQuery>;
export type GetWarehouseWorkLevelLazyQueryHookResult = ReturnType<typeof useGetWarehouseWorkLevelLazyQuery>;
export type GetWarehouseWorkLevelSuspenseQueryHookResult = ReturnType<typeof useGetWarehouseWorkLevelSuspenseQuery>;
export type GetWarehouseWorkLevelQueryResult = ApolloReactCommon.QueryResult<Types.GetWarehouseWorkLevelQuery, Types.GetWarehouseWorkLevelQueryVariables>;
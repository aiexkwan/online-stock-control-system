import { gql } from '@apollo/client';
import type * as ApolloReactCommon from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
const defaultOptions = {} as const;

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
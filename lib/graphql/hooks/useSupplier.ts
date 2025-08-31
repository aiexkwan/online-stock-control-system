/**
 * Supplier GraphQL Hooks
 * Custom hooks for supplier-related GraphQL operations
 */

import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import type {
  Supplier,
  SupplierConnection,
  SupplierFilterInput,
  PaginationInput,
  SortInput,
  DateRangeInput,
  GrnFilterInput,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierPerformance,
  SortDirection,
} from '../../../types/generated/graphql';

// Common types for hook options - using Apollo's built-in types
type QueryOptions<TData = any, TVariables = any> = Apollo.QueryHookOptions<TData, TVariables>;
type MutationOptions<TData = any, TVariables = any> = Apollo.MutationHookOptions<TData, TVariables>;
type LazyQueryOptions<TData = any, TVariables = any> = Apollo.LazyQueryHookOptions<
  TData,
  TVariables
>;

// Filter options type for backward compatibility
interface FilterOptions {
  search?: string;
  category?: string;
  active?: boolean;
  dateRange?: { start: Date; end: Date };
}

// Pagination options type for backward compatibility
interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

// Sort options type for backward compatibility
interface SortOptions {
  field: string;
  ascending: boolean;
}

// Query: Get single supplier
export const GET_SUPPLIER = gql`
  query GetSupplier($code: String!) {
    supplier(code: $code) {
      supplier_code
      supplier_name
    }
  }
`;

// Query: Get supplier with statistics
export const GET_SUPPLIER_WITH_STATISTICS = gql`
  query GetSupplierWithStatistics($code: String!) {
    supplier(code: $code) {
      supplier_code
      supplier_name
    }
  }
`;

// Query: Get supplier with products
export const GET_SUPPLIER_WITH_PRODUCTS = gql`
  query GetSupplierWithProducts($code: String!, $pagination: PaginationInput, $sort: SortInput) {
    supplier(code: $code) {
      supplier_code
      supplier_name
    }
  }
`;

// Query: Get supplier with GRNs
export const GET_SUPPLIER_WITH_GRNS = gql`
  query GetSupplierWithGRNs(
    $code: String!
    $filter: GrnFilterInput
    $pagination: PaginationInput
    $sort: SortInput
  ) {
    supplier(code: $code) {
      supplier_code
      supplier_name
    }
  }
`;

// Query: Search suppliers
export const SEARCH_SUPPLIERS = gql`
  query SearchSuppliers($query: String!, $limit: Int) {
    searchSuppliers(query: $query, limit: $limit) {
      supplier_code
      supplier_name
    }
  }
`;

// Query: Search single supplier by code (for DataUpdateCard migration)
export const SEARCH_SUPPLIER_BY_CODE = gql`
  query SearchSupplierByCode($code: String!) {
    supplier(code: $code) {
      supplier_code
      supplier_name
    }
  }
`;

// Query: Get suppliers with pagination
export const GET_SUPPLIERS = gql`
  query GetSuppliers($filter: SupplierFilterInput, $pagination: PaginationInput, $sort: SortInput) {
    suppliers(filter: $filter, pagination: $pagination, sort: $sort) {
      edges {
        cursor
        node {
          supplier_code
          supplier_name
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// Query: Get supplier performance metrics
export const GET_SUPPLIER_PERFORMANCE = gql`
  query GetSupplierPerformance($supplierCode: String!, $dateRange: DateRangeInput) {
    supplierPerformance(supplierCode: $supplierCode, dateRange: $dateRange) {
      deliveryPerformance {
        onTimeDeliveries
        lateDeliveries
        earlyDeliveries
        averageDelayDays
      }
      qualityMetrics {
        acceptedGRNs
        rejectedGRNs
        partialGRNs
        defectRate
      }
      orderMetrics {
        totalOrders
        completedOrders
        pendingOrders
        cancelledOrders
      }
    }
  }
`;

// Mutation: Create supplier
export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      supplier_code
      supplier_name
    }
  }
`;

// Mutation: Update supplier
export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($code: String!, $input: UpdateSupplierInput!) {
    updateSupplier(code: $code, input: $input) {
      supplier_code
      supplier_name
    }
  }
`;

// Mutation: Deactivate supplier
export const DEACTIVATE_SUPPLIER = gql`
  mutation DeactivateSupplier($code: String!) {
    deactivateSupplier(code: $code) {
      supplier_code
      supplier_name
    }
  }
`;

// Types for query variables and results
type GetSupplierQueryVariables = {
  code: string;
};

type GetSupplierQueryResult = {
  supplier?: Supplier | null;
};

type GetSupplierWithProductsQueryVariables = {
  code: string;
  pagination?: PaginationInput;
  sort?: SortInput;
};

type GetSupplierWithGRNsQueryVariables = {
  code: string;
  filter?: GrnFilterInput;
  pagination?: PaginationInput;
  sort?: SortInput;
};

type SearchSuppliersQueryVariables = {
  query: string;
  limit?: number;
};

type SearchSuppliersQueryResult = {
  searchSuppliers: Supplier[];
};

type GetSuppliersQueryVariables = {
  filter?: SupplierFilterInput;
  pagination?: PaginationInput;
  sort?: SortInput;
};

type GetSuppliersQueryResult = {
  suppliers: SupplierConnection;
};

type GetSupplierPerformanceQueryVariables = {
  supplierCode: string;
  dateRange?: DateRangeInput;
};

type GetSupplierPerformanceQueryResult = {
  supplierPerformance: SupplierPerformance;
};

type CreateSupplierMutationVariables = {
  input: CreateSupplierInput;
};

type CreateSupplierMutationResult = {
  createSupplier: Supplier;
};

type UpdateSupplierMutationVariables = {
  code: string;
  input: UpdateSupplierInput;
};

type UpdateSupplierMutationResult = {
  updateSupplier: Supplier;
};

type DeactivateSupplierMutationVariables = {
  code: string;
};

type DeactivateSupplierMutationResult = {
  deactivateSupplier: Supplier;
};

// Convert legacy pagination options to GraphQL input types
function convertPaginationOptions(pagination?: PaginationOptions): PaginationInput | undefined {
  if (!pagination) return undefined;

  return {
    limit: pagination.limit,
    offset: pagination.offset,
    page: pagination.page,
    first: pagination.limit,
    after: pagination.cursor,
  };
}

// Convert legacy sort options to GraphQL input type
function convertSortOptions(sort?: SortOptions): SortInput | undefined {
  if (!sort) return undefined;

  return {
    field: sort.field,
    direction: (sort.ascending ? 'ASC' : 'DESC') as SortDirection,
  };
}

// Convert legacy filter options to GraphQL input type
function convertFilterOptions(filter?: FilterOptions): GrnFilterInput | undefined {
  if (!filter) return undefined;

  return {
    dateRange: filter.dateRange
      ? {
          start: filter.dateRange.start.toISOString(),
          end: filter.dateRange.end.toISOString(),
        }
      : undefined,
  };
}

// Convert legacy filter options to SupplierFilterInput
function convertSupplierFilterOptions(filter?: FilterOptions): SupplierFilterInput | undefined {
  if (!filter) return undefined;

  return {
    name: filter.search,
    status: filter.active ? 'ACTIVE' : undefined,
  };
}

// Hook: Use single supplier
export function useSupplier(
  code: string,
  options?: QueryOptions<GetSupplierQueryResult, GetSupplierQueryVariables>
) {
  return useQuery<GetSupplierQueryResult, GetSupplierQueryVariables>(GET_SUPPLIER, {
    variables: { code },
    skip: !code,
    ...options,
  });
}

// Hook: Use supplier with statistics
export function useSupplierWithStatistics(
  code: string,
  options?: QueryOptions<GetSupplierQueryResult, GetSupplierQueryVariables>
) {
  return useQuery<GetSupplierQueryResult, GetSupplierQueryVariables>(GET_SUPPLIER_WITH_STATISTICS, {
    variables: { code },
    skip: !code,
    ...options,
  });
}

// Hook: Use supplier with products
export function useSupplierWithProducts(
  code: string,
  pagination?: PaginationOptions,
  sort?: SortOptions,
  options?: QueryOptions<GetSupplierQueryResult, GetSupplierWithProductsQueryVariables>
) {
  return useQuery<GetSupplierQueryResult, GetSupplierWithProductsQueryVariables>(
    GET_SUPPLIER_WITH_PRODUCTS,
    {
      variables: {
        code,
        pagination: convertPaginationOptions(pagination),
        sort: convertSortOptions(sort),
      },
      skip: !code,
      ...options,
    }
  );
}

// Hook: Use supplier with GRNs
export function useSupplierWithGRNs(
  code: string,
  filter?: FilterOptions,
  pagination?: PaginationOptions,
  sort?: SortOptions,
  options?: QueryOptions<GetSupplierQueryResult, GetSupplierWithGRNsQueryVariables>
) {
  return useQuery<GetSupplierQueryResult, GetSupplierWithGRNsQueryVariables>(
    GET_SUPPLIER_WITH_GRNS,
    {
      variables: {
        code,
        filter: convertFilterOptions(filter),
        pagination: convertPaginationOptions(pagination),
        sort: convertSortOptions(sort),
      },
      skip: !code,
      ...options,
    }
  );
}

// Hook: Use search suppliers
export function useSearchSuppliers(
  options?: LazyQueryOptions<SearchSuppliersQueryResult, SearchSuppliersQueryVariables>
) {
  return useLazyQuery<SearchSuppliersQueryResult, SearchSuppliersQueryVariables>(
    SEARCH_SUPPLIERS,
    options
  );
}

// Hook: Use search single supplier by code (for DataUpdateCard migration)
export function useSearchSupplierByCode(
  options?: LazyQueryOptions<GetSupplierQueryResult, GetSupplierQueryVariables>
) {
  return useLazyQuery<GetSupplierQueryResult, GetSupplierQueryVariables>(SEARCH_SUPPLIER_BY_CODE, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch fresh data
    ...options,
  });
}

// Hook: Use suppliers list
export function useSuppliers(
  filter?: FilterOptions,
  pagination?: PaginationOptions,
  sort?: SortOptions,
  options?: QueryOptions<GetSuppliersQueryResult, GetSuppliersQueryVariables>
) {
  return useQuery<GetSuppliersQueryResult, GetSuppliersQueryVariables>(GET_SUPPLIERS, {
    variables: {
      filter: convertSupplierFilterOptions(filter),
      pagination: convertPaginationOptions(pagination),
      sort: convertSortOptions(sort),
    },
    ...options,
  });
}

// Hook: Use supplier performance
export function useSupplierPerformance(
  supplierCode: string,
  dateRange?: { start: Date; end: Date },
  options?: QueryOptions<GetSupplierPerformanceQueryResult, GetSupplierPerformanceQueryVariables>
) {
  const dateRangeInput: DateRangeInput | undefined = dateRange
    ? {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      }
    : undefined;

  return useQuery<GetSupplierPerformanceQueryResult, GetSupplierPerformanceQueryVariables>(
    GET_SUPPLIER_PERFORMANCE,
    {
      variables: { supplierCode, dateRange: dateRangeInput },
      skip: !supplierCode,
      ...options,
    }
  );
}

// Hook: Use create supplier
export function useCreateSupplier(
  options?: MutationOptions<CreateSupplierMutationResult, CreateSupplierMutationVariables>
) {
  return useMutation<CreateSupplierMutationResult, CreateSupplierMutationVariables>(
    CREATE_SUPPLIER,
    {
      update(cache, { data }) {
        if (data?.createSupplier) {
          // Update cache after creation
          cache.modify({
            fields: {
              suppliers(existingSuppliers = { edges: [] }) {
                const newSupplierRef = cache.writeFragment({
                  data: data.createSupplier,
                  fragment: gql`
                    fragment NewSupplier on Supplier {
                      supplier_code
                      supplier_name
                    }
                  `,
                });
                return {
                  ...existingSuppliers,
                  edges: [{ node: newSupplierRef }, ...existingSuppliers.edges],
                };
              },
            },
          });
        }
      },
      ...options,
    }
  );
}

// Hook: Use update supplier
export function useUpdateSupplier(
  options?: MutationOptions<UpdateSupplierMutationResult, UpdateSupplierMutationVariables>
) {
  return useMutation<UpdateSupplierMutationResult, UpdateSupplierMutationVariables>(
    UPDATE_SUPPLIER,
    {
      update(cache, { data }) {
        if (data?.updateSupplier) {
          // Update cache after update
          const id = cache.identify(data.updateSupplier);
          if (id) {
            cache.modify({
              id,
              fields: {
                supplier_name() {
                  return data.updateSupplier.supplier_name;
                },
              },
            });
          }
        }
      },
      ...options,
    }
  );
}

// Hook: Use deactivate supplier
export function useDeactivateSupplier(
  options?: MutationOptions<DeactivateSupplierMutationResult, DeactivateSupplierMutationVariables>
) {
  return useMutation<DeactivateSupplierMutationResult, DeactivateSupplierMutationVariables>(
    DEACTIVATE_SUPPLIER,
    {
      update(cache, { data }) {
        if (data?.deactivateSupplier) {
          // Update cache after deactivation
          const id = cache.identify(data.deactivateSupplier);
          if (id) {
            cache.modify({
              id,
              fields: {
                supplier_name() {
                  return data.deactivateSupplier.supplier_name;
                },
              },
            });
          }
        }
      },
      ...options,
    }
  );
}

// Export all hooks and queries
const SupplierGraphQLExports = {
  // Queries
  GET_SUPPLIER,
  GET_SUPPLIER_WITH_STATISTICS,
  GET_SUPPLIER_WITH_PRODUCTS,
  GET_SUPPLIER_WITH_GRNS,
  SEARCH_SUPPLIERS,
  SEARCH_SUPPLIER_BY_CODE,
  GET_SUPPLIERS,
  GET_SUPPLIER_PERFORMANCE,
  // Mutations
  CREATE_SUPPLIER,
  UPDATE_SUPPLIER,
  DEACTIVATE_SUPPLIER,
  // Hooks
  useSupplier,
  useSupplierWithStatistics,
  useSupplierWithProducts,
  useSupplierWithGRNs,
  useSearchSuppliers,
  useSearchSupplierByCode,
  useSuppliers,
  useSupplierPerformance,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
};

export default SupplierGraphQLExports;

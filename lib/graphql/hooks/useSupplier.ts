/**
 * Supplier GraphQL Hooks
 * Custom hooks for supplier-related GraphQL operations
 */

import { useQuery, useMutation, useLazyQuery , gql } from '@apollo/client';

// Common types for hook options
interface QueryOptions {
  pollInterval?: number;
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache' | 'standby';
  errorPolicy?: 'none' | 'ignore' | 'all';
  onCompleted?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  skip?: boolean;
}

interface MutationOptions {
  errorPolicy?: 'none' | 'ignore' | 'all';
  onCompleted?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

interface FilterOptions {
  search?: string;
  category?: string;
  active?: boolean;
  dateRange?: { start: Date; end: Date };
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

interface SortOptions {
  field: string;
  ascending: boolean;
}

// Query: Get single supplier
export const GET_SUPPLIER = gql`
  query GetSupplier($code: String!) {
    supplier(code: $code) {
      code
      name
      address
      contact
      email
      phone
      fax
      status
      leadTime
      paymentTerms
      minimumOrderQuantity
      createdAt
      updatedAt
    }
  }
`;

// Query: Get supplier with statistics
export const GET_SUPPLIER_WITH_STATISTICS = gql`
  query GetSupplierWithStatistics($code: String!) {
    supplier(code: $code) {
      code
      name
      contact
      statistics {
        totalOrders
        totalProducts
        totalGRNs
        averageLeadTime
        onTimeDeliveryRate
        qualityRating
        lastOrderDate
        lastDeliveryDate
      }
    }
  }
`;

// Query: Get supplier with products
export const GET_SUPPLIER_WITH_PRODUCTS = gql`
  query GetSupplierWithProducts($code: String!, $pagination: PaginationInput, $sort: SortInput) {
    supplier(code: $code) {
      code
      name
      products(pagination: $pagination, sort: $sort) {
        edges {
          cursor
          node {
            code
            description
            type
            standardQty
            leadTime
            minimumOrderQuantity
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
  }
`;

// Query: Get supplier with GRNs
export const GET_SUPPLIER_WITH_GRNS = gql`
  query GetSupplierWithGRNs(
    $code: String!
    $filter: GRNFilter
    $pagination: PaginationInput
    $sort: SortInput
  ) {
    supplier(code: $code) {
      code
      name
      grns(filter: $filter, pagination: $pagination, sort: $sort) {
        edges {
          cursor
          node {
            grnNumber
            productCode
            quantity
            receivedDate
            status
            invoiceNumber
            remarks
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
  }
`;

// Query: Search suppliers
export const SEARCH_SUPPLIERS = gql`
  query SearchSuppliers($query: String!, $limit: Int) {
    searchSuppliers(query: $query, limit: $limit) {
      code
      name
      contact
      status
    }
  }
`;

// Query: Search single supplier by code (for DataUpdateCard migration)
export const SEARCH_SUPPLIER_BY_CODE = gql`
  query SearchSupplierByCode($code: String!) {
    supplier(code: $code) {
      code
      name
    }
  }
`;

// Query: Get suppliers with pagination
export const GET_SUPPLIERS = gql`
  query GetSuppliers($filter: SupplierFilter, $pagination: PaginationInput, $sort: SortInput) {
    suppliers(filter: $filter, pagination: $pagination, sort: $sort) {
      edges {
        cursor
        node {
          code
          name
          contact
          status
          leadTime
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
      code
      name
      address
      contact
      email
      phone
      status
      createdAt
    }
  }
`;

// Mutation: Update supplier
export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($code: String!, $input: UpdateSupplierInput!) {
    updateSupplier(code: $code, input: $input) {
      code
      name
      address
      contact
      email
      phone
      status
      updatedAt
    }
  }
`;

// Mutation: Deactivate supplier
export const DEACTIVATE_SUPPLIER = gql`
  mutation DeactivateSupplier($code: String!) {
    deactivateSupplier(code: $code) {
      code
      name
      status
    }
  }
`;

// Hook: Use single supplier
export function useSupplier(code: string, options?: QueryOptions) {
  return useQuery(GET_SUPPLIER, {
    variables: { code },
    skip: !code,
    ...options,
  });
}

// Hook: Use supplier with statistics
export function useSupplierWithStatistics(code: string, options?: QueryOptions) {
  return useQuery(GET_SUPPLIER_WITH_STATISTICS, {
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
  options?: QueryOptions
) {
  return useQuery(GET_SUPPLIER_WITH_PRODUCTS, {
    variables: { code, pagination, sort },
    skip: !code,
    ...options,
  });
}

// Hook: Use supplier with GRNs
export function useSupplierWithGRNs(
  code: string,
  filter?: FilterOptions,
  pagination?: PaginationOptions,
  sort?: SortOptions,
  options?: QueryOptions
) {
  return useQuery(GET_SUPPLIER_WITH_GRNS, {
    variables: { code, filter, pagination, sort },
    skip: !code,
    ...options,
  });
}

// Hook: Use search suppliers
export function useSearchSuppliers(options?: QueryOptions) {
  return useLazyQuery(SEARCH_SUPPLIERS, options);
}

// Hook: Use search single supplier by code (for DataUpdateCard migration)
export function useSearchSupplierByCode(options?: QueryOptions) {
  return useLazyQuery(SEARCH_SUPPLIER_BY_CODE, {
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
  options?: QueryOptions
) {
  return useQuery(GET_SUPPLIERS, {
    variables: { filter, pagination, sort },
    ...options,
  });
}

// Hook: Use supplier performance
export function useSupplierPerformance(
  supplierCode: string,
  dateRange?: { start: Date; end: Date },
  options?: QueryOptions
) {
  return useQuery(GET_SUPPLIER_PERFORMANCE, {
    variables: { supplierCode, dateRange },
    skip: !supplierCode,
    ...options,
  });
}

// Hook: Use create supplier
export function useCreateSupplier(options?: MutationOptions) {
  return useMutation(CREATE_SUPPLIER, {
    update(cache, { data: { createSupplier } }) {
      // Update cache after creation
      cache.modify({
        fields: {
          suppliers(existingSuppliers = { edges: [] }) {
            const newSupplierRef = cache.writeFragment({
              data: createSupplier,
              fragment: gql`
                fragment NewSupplier on Supplier {
                  code
                  name
                  contact
                  status
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
    },
    ...options,
  });
}

// Hook: Use update supplier
export function useUpdateSupplier(options?: MutationOptions) {
  return useMutation(UPDATE_SUPPLIER, {
    update(cache, { data: { updateSupplier } }) {
      // Update cache after update
      const id = cache.identify(updateSupplier);
      cache.modify({
        id,
        fields: {
          updatedAt() {
            return updateSupplier.updatedAt;
          },
        },
      });
    },
    ...options,
  });
}

// Hook: Use deactivate supplier
export function useDeactivateSupplier(options?: MutationOptions) {
  return useMutation(DEACTIVATE_SUPPLIER, {
    update(cache, { data: { deactivateSupplier } }) {
      // Update cache after deactivation
      const id = cache.identify(deactivateSupplier);
      cache.modify({
        id,
        fields: {
          status() {
            return 'INACTIVE';
          },
        },
      });
    },
    ...options,
  });
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

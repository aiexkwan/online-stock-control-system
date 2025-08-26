/**
 * Product GraphQL Hooks
 * Custom hooks for product-related GraphQL operations
 */

import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// Common types for hook options
interface QueryOptions<T = unknown> {
  pollInterval?: number;
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache' | 'standby';
  errorPolicy?: 'none' | 'ignore' | 'all';
  onCompleted?: (data: T) => void;
  onError?: (error: unknown) => void;
  skip?: boolean;
}

interface MutationOptions<T = unknown> {
  errorPolicy?: 'none' | 'ignore' | 'all';
  onCompleted?: (data: T) => void;
  onError?: (error: unknown) => void;
}

// Type for search product by code response
interface SearchProductByCodeResponse {
  product?: {
    code: string;
    description: string;
    type: string;
    standardQty?: number;
    inventory?: {
      totalQuantity: number;
      availableQuantity: number;
      reservedQuantity: number;
    };
  };
}

interface FilterOptions {
  search?: string;
  category?: string;
  type?: string;
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

// Query: Get single product
export const GET_PRODUCT = gql`
  query GetProduct($code: ID!) {
    product(code: $code) {
      code
      description
      colour
      type
      standardQty
      remark
    }
  }
`;

// Query: Get product with inventory
export const GET_PRODUCT_WITH_INVENTORY = gql`
  query GetProductWithInventory($code: ID!) {
    product(code: $code) {
      code
      description
      type
      standardQty
      inventory {
        totalQuantity
        availableQuantity
        reservedQuantity
        locationBreakdown {
          injection
          pipeline
          prebook
          await
          fold
          bulk
          backcarpark
          damage
        }
        lastUpdate
      }
    }
  }
`;

// Query: Get product with statistics
export const GET_PRODUCT_WITH_STATISTICS = gql`
  query GetProductWithStatistics($code: ID!) {
    product(code: $code) {
      code
      description
      type
      statistics {
        totalQuantity
        totalPallets
        totalLocations
        averageStockLevel
        stockTurnoverRate
        lastMovementDate
      }
    }
  }
`;

// Query: Get product with pallets
export const GET_PRODUCT_WITH_PALLETS = gql`
  query GetProductWithPallets(
    $code: ID!
    $filter: PalletFilter
    $pagination: PaginationInput
    $sort: SortInput
  ) {
    product(code: $code) {
      code
      description
      pallets(filter: $filter, pagination: $pagination, sort: $sort) {
        edges {
          cursor
          node {
            pltNum
            productCode
            quantity
            location
            status
            grnNumber
            batchNumber
            expiryDate
            manufactureDate
            createdAt
            updatedAt
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

// Query: Search products
export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $limit: Int) {
    searchProducts(query: $query, limit: $limit) {
      code
      description
      colour
      type
      standardQty
      remark
    }
  }
`;

// Query: Get products with pagination
export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput, $pagination: PaginationInput, $sort: SortInput) {
    products(filter: $filter, pagination: $pagination, sort: $sort) {
      edges {
        cursor
        node {
          code
          description
          colour
          type
          standardQty
          remark
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

// Query: Get product statistics with date range
export const GET_PRODUCT_STATISTICS = gql`
  query GetProductStatistics($productCode: ID!, $dateRange: DateRangeInput) {
    productStatistics(productCode: $productCode, dateRange: $dateRange) {
      totalQuantity
      totalPallets
      totalLocations
      averageStockLevel
      stockTurnoverRate
      lastMovementDate
    }
  }
`;

// Query: Get products with inventory by type (for StockLevelListAndChartCard)
export const GET_PRODUCTS_WITH_INVENTORY_BY_TYPE = gql`
  query GetProductsWithInventoryByType($type: String!, $limit: Int = 50) {
    products(
      filter: { type: $type }
      pagination: { limit: $limit }
      sort: { field: "code", order: ASC }
    ) {
      edges {
        node {
          code
          description
          type
          standardQty
          inventory {
            totalQuantity
            availableQuantity
            reservedQuantity
            lastUpdate
          }
          statistics {
            totalPallets
            averageStockLevel
            lastMovementDate
          }
        }
      }
      totalCount
    }
  }
`;

// Mutation: Create product
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      code
      description
      colour
      type
      standardQty
      remark
    }
  }
`;

// Mutation: Update product
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($code: ID!, $input: UpdateProductInput!) {
    updateProduct(code: $code, input: $input) {
      code
      description
      colour
      type
      standardQty
      remark
    }
  }
`;

// Mutation: Deactivate product
export const DEACTIVATE_PRODUCT = gql`
  mutation DeactivateProduct($code: ID!) {
    deactivateProduct(code: $code) {
      code
      description
      type
    }
  }
`;

// Hook: Use single product
export function useProduct(code: string, options?: QueryOptions) {
  return useQuery(GET_PRODUCT, {
    variables: { code },
    skip: !code,
    ...options,
  });
}

// Hook: Use product with inventory
export function useProductWithInventory(code: string, options?: QueryOptions) {
  return useQuery(GET_PRODUCT_WITH_INVENTORY, {
    variables: { code },
    skip: !code,
    ...options,
  });
}

// Hook: Use product with statistics
export function useProductWithStatistics(code: string, options?: QueryOptions) {
  return useQuery(GET_PRODUCT_WITH_STATISTICS, {
    variables: { code },
    skip: !code,
    ...options,
  });
}

// Hook: Use product with pallets
export function useProductWithPallets(
  code: string,
  filter?: FilterOptions,
  pagination?: PaginationOptions,
  sort?: SortOptions,
  options?: QueryOptions
) {
  return useQuery(GET_PRODUCT_WITH_PALLETS, {
    variables: { code, filter, pagination, sort },
    skip: !code,
    ...options,
  });
}

// Query: Search single product by exact code (for QC Label Card)
export const SEARCH_PRODUCT_BY_CODE = gql`
  query SearchProductByCode($code: ID!) {
    product(code: $code) {
      code
      description
      type
      standardQty
      inventory {
        totalQuantity
        availableQuantity
        reservedQuantity
      }
    }
  }
`;

// Hook: Use search products
export function useSearchProducts(options?: QueryOptions) {
  return useLazyQuery(SEARCH_PRODUCTS, options);
}

// Hook: Use search single product by code (for QC Label migration)
export function useSearchProductByCode(options?: QueryOptions<SearchProductByCodeResponse>) {
  return useLazyQuery(SEARCH_PRODUCT_BY_CODE, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch fresh data
    ...options,
  });
}

// Hook: Use products list
export function useProducts(
  filter?: FilterOptions,
  pagination?: PaginationOptions,
  sort?: SortOptions,
  options?: QueryOptions
) {
  return useQuery(GET_PRODUCTS, {
    variables: { filter, pagination, sort },
    ...options,
  });
}

// Hook: Use product statistics
export function useProductStatistics(
  productCode: string,
  dateRange?: { start: Date; end: Date },
  options?: QueryOptions
) {
  return useQuery(GET_PRODUCT_STATISTICS, {
    variables: { productCode, dateRange },
    skip: !productCode,
    ...options,
  });
}

// Hook: Use products with inventory by type (for StockLevelListAndChartCard)
export function useProductsWithInventoryByType(
  type: string,
  limit: number = 50,
  options?: QueryOptions
) {
  return useQuery(GET_PRODUCTS_WITH_INVENTORY_BY_TYPE, {
    variables: { type, limit },
    skip: !type || type === '',
    ...options,
  });
}

// Hook: Use create product
export function useCreateProduct(options?: MutationOptions) {
  return useMutation(CREATE_PRODUCT, {
    update(cache, { data: { createProduct } }) {
      // Update cache after creation
      cache.modify({
        fields: {
          products(existingProducts = { edges: [] }) {
            const newProductRef = cache.writeFragment({
              data: createProduct,
              fragment: gql`
                fragment NewProduct on Product {
                  code
                  description
                  type
                }
              `,
            });
            return {
              ...existingProducts,
              edges: [{ node: newProductRef }, ...existingProducts.edges],
            };
          },
        },
      });
    },
    ...options,
  });
}

// Hook: Use update product
export function useUpdateProduct(options?: MutationOptions) {
  return useMutation(UPDATE_PRODUCT, {
    update(cache, { data: { updateProduct } }) {
      // Update cache after update
      const id = cache.identify(updateProduct);
      cache.modify({
        id,
        fields: {
          updatedAt() {
            return updateProduct.updatedAt;
          },
        },
      });
    },
    ...options,
  });
}

// Hook: Use deactivate product
export function useDeactivateProduct(options?: MutationOptions) {
  return useMutation(DEACTIVATE_PRODUCT, {
    update(cache, { data: { deactivateProduct } }) {
      // Update cache after deactivation
      const id = cache.identify(deactivateProduct);
      cache.modify({
        id,
        fields: {
          isActive() {
            return false;
          },
        },
      });
    },
    ...options,
  });
}

// Export all hooks and queries
const ProductGraphQLExports = {
  // Queries
  GET_PRODUCT,
  GET_PRODUCT_WITH_INVENTORY,
  GET_PRODUCT_WITH_STATISTICS,
  GET_PRODUCT_WITH_PALLETS,
  SEARCH_PRODUCTS,
  SEARCH_PRODUCT_BY_CODE,
  GET_PRODUCTS,
  GET_PRODUCT_STATISTICS,
  GET_PRODUCTS_WITH_INVENTORY_BY_TYPE,
  // Mutations
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DEACTIVATE_PRODUCT,
  // Hooks
  useProduct,
  useProductWithInventory,
  useProductWithStatistics,
  useProductWithPallets,
  useSearchProducts,
  useSearchProductByCode,
  useProducts,
  useProductStatistics,
  useProductsWithInventoryByType,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
};

export default ProductGraphQLExports;

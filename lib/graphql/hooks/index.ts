/**
 * GraphQL Hooks Index
 * Central export for all GraphQL hooks
 */

// Product hooks
export * from './useProduct';
export { default as productHooks } from './useProduct';

// Supplier hooks  
export * from './useSupplier';
export { default as supplierHooks } from './useSupplier';

// Re-export commonly used hooks for convenience
export {
  // Product hooks
  useProduct,
  useProductWithInventory,
  useProductWithStatistics,
  useProductWithPallets,
  useSearchProducts,
  useProducts,
  useProductStatistics,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
} from './useProduct';

export {
  // Supplier hooks
  useSupplier,
  useSupplierWithStatistics,
  useSupplierWithProducts,
  useSupplierWithGRNs,
  useSearchSuppliers,
  useSuppliers,
  useSupplierPerformance,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
} from './useSupplier';
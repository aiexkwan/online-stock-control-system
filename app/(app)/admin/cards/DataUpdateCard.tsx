/**
 * DataUpdateCard Component
 * Product and Supplier Data Management Card
 * 
 * Features:
 * - Left side: Product search/add/update with list display
 * - Right side: Supplier search/add/update with list display
 * - Transparent background with glassmorphic data areas
 * 
 * Refactored to use useDataUpdate hook for better organization and reusability
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { cn } from '@/lib/utils';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import type { DataUpdateCardProps } from '../types/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGraphQLDataUpdate, type FormConfig } from '../hooks/useGraphQLDataUpdate';

export const DataUpdateCard: React.FC<DataUpdateCardProps> = ({
  className,
  height = 600,
}) => {
  // Product form configuration
  const productConfig: FormConfig = {
    fields: [
      { name: 'code', label: 'Product Code', type: 'text', required: true },
      { name: 'description', label: 'Product Description', type: 'text', required: true },
      { name: 'type', label: 'Product Type', type: 'text', required: true },
      { name: 'colour', label: 'Colour', type: 'text', required: true },
      { name: 'standard_qty', label: 'Standard Quantity Per Pallet', type: 'number', required: true },
      { name: 'remark', label: 'Special notes', type: 'text', required: false },
    ],
    entityType: 'product',
    tableName: 'data_code',
    primaryKey: 'code',
  };

  // Supplier form configuration  
  const supplierConfig: FormConfig = {
    fields: [
      { name: 'supplier_code', label: 'Supplier Code', type: 'text', required: true },
      { name: 'supplier_name', label: 'Supplier Name', type: 'text', required: false },
    ],
    entityType: 'supplier',
    tableName: 'data_supplier',
    primaryKey: 'supplier_code',
  };

  // Initialize hooks for product and supplier forms
  const productForm = useGraphQLDataUpdate({
    config: productConfig,
    initialData: {
      code: '',
      description: '',
      type: '',
      colour: '',
      standard_qty: 0,
      remark: ''
    },
    onSuccess: (action, data) => {
      console.log(`Product ${action} successful:`, data);
    },
    onError: (error, action) => {
      console.error(`Product ${action} error:`, error);
    },
  });

  const supplierForm = useGraphQLDataUpdate({
    config: supplierConfig, 
    initialData: {
      supplier_code: '',
      supplier_name: ''
    },
    onSuccess: (action, data) => {
      console.log(`Supplier ${action} successful:`, data);
    },
    onError: (error, action) => {
      console.error(`Supplier ${action} error:`, error);
    },
  });

  // Helper functions for form operations
  const handleProductSearch = () => {
    if (!productForm.state.searchTerm.trim()) {
      productForm.actions.showError('Please enter a product code');
      return;
    }
    productForm.actions.search(productForm.state.searchTerm);
  };

  const handleSupplierSearch = () => {
    if (!supplierForm.state.searchTerm.trim()) {
      supplierForm.actions.showError('Please enter a supplier code');
      return;
    }
    supplierForm.actions.search(supplierForm.state.searchTerm);
  };

  const handleProductConfirm = () => {
    const action = productForm.state.mode === 'add' ? 'create' : 'update';
    const message = `Confirm all changes to ${productForm.state.data.code || 'this product'}?`;
    
    productForm.actions.showConfirmation(message, () => {
      if (action === 'create') {
        productForm.actions.create();
      } else {
        productForm.actions.update();
      }
    });
  };

  const handleSupplierConfirm = () => {
    const action = supplierForm.state.mode === 'add' ? 'create' : 'update';
    const message = `Confirm all changes to ${supplierForm.state.data.supplier_code || 'this supplier'}?`;
    
    supplierForm.actions.showConfirmation(message, () => {
      if (action === 'create') {
        supplierForm.actions.create();
      } else {
        supplierForm.actions.update();
      }
    });
  };

  return (
    <div 
      className={cn('w-full bg-transparent', className)}
      style={{ height }}
    >
      <div className="flex gap-4 h-full">
        {/* Left: Product Update */}
        <GlassmorphicCard className="flex-1 p-6">
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Search Product</h3>
            
            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <Input
                value={productForm.state.searchTerm}
                onChange={(e) => {
                  productForm.actions.setSearchTerm(e.target.value);
                  if (productForm.state.mode !== 'initial') {
                    productForm.actions.switchToInitial();
                  }
                }}
                placeholder="Enter product code"
                className="flex-1 bg-slate-800/50 border-slate-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
              />
              <Button
                onClick={productForm.state.searchTerm ? handleProductSearch : () => productForm.actions.switchToAdd()}
                disabled={productForm.state.isSearching}
                className={cn(
                  "min-w-[100px]",
                  productForm.state.searchTerm ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                )}
              >
                {productForm.state.isSearching ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : productForm.state.searchTerm ? (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                    Search
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>

            <div className="border-t border-slate-600/50 my-2" />

            {/* Data Display Area */}
            <AnimatePresence mode="wait">
              {/* Display Mode - List Format */}
              {productForm.state.mode === 'display' && productForm.state.originalData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Code</span>
                      <span className="text-white font-medium">{String(productForm.state.originalData.code || '')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Description</span>
                      <span className="text-white font-medium">{String(productForm.state.originalData.description || '')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white font-medium">{String(productForm.state.originalData.type || '')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Colour</span>
                      <span className="text-white font-medium">{String(productForm.state.originalData.colour || '')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Standard Qty Per Pallet</span>
                      <span className="text-white font-medium">{String(productForm.state.originalData.standard_qty || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Special notes</span>
                      <span className="text-white font-medium">{String(productForm.state.originalData.remark || '-')}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => productForm.actions.switchToEdit()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update
                  </Button>
                </motion.div>
              )}

              {/* Edit Mode - Input Format */}
              {productForm.state.mode === 'edit' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 space-y-3"
                >
                  <div>
                    <Label className="text-white">Product Code</Label>
                    <Input
                      value={String(productForm.state.data.code || '')}
                      disabled
                      className="bg-slate-800/50 border-slate-600 text-white opacity-50"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Product Description</Label>
                    <Input
                      value={String(productForm.state.data.description || '')}
                      onChange={(e) => productForm.actions.setFieldValue('description', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.description && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.description}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Product Type</Label>
                    <Input
                      value={String(productForm.state.data.type || '')}
                      onChange={(e) => productForm.actions.setFieldValue('type', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.type && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.type}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Colour</Label>
                    <Input
                      value={String(productForm.state.data.colour || '')}
                      onChange={(e) => productForm.actions.setFieldValue('colour', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.colour && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.colour}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Standard Quantity Per Pallet</Label>
                    <Input
                      type="number"
                      value={String(productForm.state.data.standard_qty || 0)}
                      onChange={(e) => productForm.actions.setFieldValue('standard_qty', parseInt(e.target.value) || 0)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.standard_qty && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.standard_qty}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Special notes</Label>
                    <Input
                      value={String(productForm.state.data.remark || '')}
                      onChange={(e) => productForm.actions.setFieldValue('remark', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                  </div>

                  <Button
                    onClick={handleProductConfirm}
                    disabled={productForm.state.isUpdating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {productForm.state.isUpdating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Add Mode - Input Format */}
              {productForm.state.mode === 'add' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 space-y-3"
                >
                  <div>
                    <Label className="text-white">Product Code</Label>
                    <Input
                      value={String(productForm.state.data.code || '')}
                      onChange={(e) => productForm.actions.setFieldValue('code', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.code && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.code}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Product Description</Label>
                    <Input
                      value={String(productForm.state.data.description || '')}
                      onChange={(e) => productForm.actions.setFieldValue('description', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.description && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.description}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Product Type</Label>
                    <Input
                      value={String(productForm.state.data.type || '')}
                      onChange={(e) => productForm.actions.setFieldValue('type', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.type && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.type}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Colour</Label>
                    <Input
                      value={String(productForm.state.data.colour || '')}
                      onChange={(e) => productForm.actions.setFieldValue('colour', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.colour && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.colour}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Standard Quantity Per Pallet</Label>
                    <Input
                      type="number"
                      value={String(productForm.state.data.standard_qty || 0)}
                      onChange={(e) => productForm.actions.setFieldValue('standard_qty', parseInt(e.target.value) || 0)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {productForm.state.errors.standard_qty && (
                      <p className="text-sm text-red-400 mt-1">{productForm.state.errors.standard_qty}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Special notes</Label>
                    <Input
                      value={String(productForm.state.data.remark || '')}
                      onChange={(e) => productForm.actions.setFieldValue('remark', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                  </div>

                  <Button
                    onClick={handleProductConfirm}
                    disabled={productForm.state.isUpdating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {productForm.state.isUpdating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      'Add Product'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassmorphicCard>

        {/* Right: Supplier Update */}
        <GlassmorphicCard className="flex-1 p-6">
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Search Supplier</h3>
            
            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <Input
                value={supplierForm.state.searchTerm}
                onChange={(e) => {
                  supplierForm.actions.setSearchTerm(e.target.value);
                  if (supplierForm.state.mode !== 'initial') {
                    supplierForm.actions.switchToInitial();
                  }
                }}
                placeholder="Enter supplier code"
                className="flex-1 bg-slate-800/50 border-slate-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSupplierSearch()}
              />
              <Button
                onClick={supplierForm.state.searchTerm ? handleSupplierSearch : () => supplierForm.actions.switchToAdd()}
                disabled={supplierForm.state.isSearching}
                className={cn(
                  "min-w-[100px]",
                  supplierForm.state.searchTerm ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                )}
              >
                {supplierForm.state.isSearching ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : supplierForm.state.searchTerm ? (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                    Search
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>

            <div className="border-t border-slate-600/50 my-2" />

            {/* Data Display Area */}
            <AnimatePresence mode="wait">
              {/* Display Mode - List Format */}
              {supplierForm.state.mode === 'display' && supplierForm.state.originalData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Supplier Code</span>
                      <span className="text-white font-medium">{String(supplierForm.state.originalData.supplier_code || '')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Supplier Name</span>
                      <span className="text-white font-medium">{String(supplierForm.state.originalData.supplier_name || '-')}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => supplierForm.actions.switchToEdit()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update
                  </Button>
                </motion.div>
              )}

              {/* Edit Mode - Input Format */}
              {supplierForm.state.mode === 'edit' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 space-y-3"
                >
                  <div>
                    <Label className="text-white">Supplier Code</Label>
                    <Input
                      value={String(supplierForm.state.data.supplier_code || '')}
                      disabled
                      className="bg-slate-800/50 border-slate-600 text-white opacity-50"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Supplier Name</Label>
                    <Input
                      value={String(supplierForm.state.data.supplier_name || '')}
                      onChange={(e) => supplierForm.actions.setFieldValue('supplier_name', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {supplierForm.state.errors.supplier_name && (
                      <p className="text-sm text-red-400 mt-1">{supplierForm.state.errors.supplier_name}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSupplierConfirm}
                    disabled={supplierForm.state.isUpdating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                  >
                    {supplierForm.state.isUpdating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Add Mode - Input Format */}
              {supplierForm.state.mode === 'add' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 space-y-3"
                >
                  <div>
                    <Label className="text-white">Supplier Code</Label>
                    <Input
                      value={String(supplierForm.state.data.supplier_code || '')}
                      onChange={(e) => supplierForm.actions.setFieldValue('supplier_code', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {supplierForm.state.errors.supplier_code && (
                      <p className="text-sm text-red-400 mt-1">{supplierForm.state.errors.supplier_code}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Supplier Name</Label>
                    <Input
                      value={String(supplierForm.state.data.supplier_name || '')}
                      onChange={(e) => supplierForm.actions.setFieldValue('supplier_name', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    {supplierForm.state.errors.supplier_name && (
                      <p className="text-sm text-red-400 mt-1">{supplierForm.state.errors.supplier_name}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSupplierConfirm}
                    disabled={supplierForm.state.isUpdating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  >
                    {supplierForm.state.isUpdating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      'Add Supplier'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassmorphicCard>
      </div>
    </div>
  );
};

export default DataUpdateCard;
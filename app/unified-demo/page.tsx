/**
 * Unified Data Layer Demo Page
 * Demonstrates the usage of the new unified GraphQL Schema
 * Week 1: GraphQL Schema Standardization - Implementation Demo
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Truck, BarChart3, Search } from 'lucide-react';

import {
  unifiedDataLayer,
  type Product,
  type Pallet,
  type InventoryRecord,
  type Movement,
  type ProductFilter,
  type PalletFilter,
  type InventoryFilter,
  type MovementFilter,
} from '@/lib/graphql/unified-data-layer';

export default function UnifiedDemoPage() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState({
    products: false,
    pallets: false,
    inventory: false,
    movements: false,
    lowStock: false,
  });

  const [filters, setFilters] = useState({
    productSearch: '',
    palletSearch: '',
    inventoryProductCode: '',
    movementPallet: '',
  });

  const [activeTab, setActiveTab] = useState('products');

  // Load products data
  const loadProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const filter: ProductFilter = {};
      if (filters.productSearch) {
        filter.search = filters.productSearch;
      }

      const result = await unifiedDataLayer.getProducts(filter, { first: 20 });
      setProducts(result.edges.map(edge => edge.node));
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [filters.productSearch]);

  // Load pallets data
  const loadPallets = useCallback(async () => {
    setLoading(prev => ({ ...prev, pallets: true }));
    try {
      const filter: PalletFilter = {};
      if (filters.palletSearch) {
        filter.palletNumber = filters.palletSearch;
      }

      const result = await unifiedDataLayer.getPallets(filter, { first: 20 });
      setPallets(result.edges.map(edge => edge.node));
    } catch (error) {
      console.error('Failed to load pallets:', error);
    } finally {
      setLoading(prev => ({ ...prev, pallets: false }));
    }
  }, [filters.palletSearch]);

  // Load inventory data
  const loadInventory = useCallback(async () => {
    setLoading(prev => ({ ...prev, inventory: true }));
    try {
      const filter: InventoryFilter = {};
      if (filters.inventoryProductCode) {
        filter.productCode = filters.inventoryProductCode;
      }

      const result = await unifiedDataLayer.getInventory(filter, { first: 20 });
      setInventory(result.edges.map(edge => edge.node));
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  }, [filters.inventoryProductCode]);

  // Load movement records
  const loadMovements = useCallback(async () => {
    setLoading(prev => ({ ...prev, movements: true }));
    try {
      const filter: MovementFilter = {};
      if (filters.movementPallet) {
        filter.palletNumber = filters.movementPallet;
      }

      const result = await unifiedDataLayer.getMovements(filter, { first: 20 });
      setMovements(result.edges.map(edge => edge.node));
    } catch (error) {
      console.error('Failed to load movements:', error);
    } finally {
      setLoading(prev => ({ ...prev, movements: false }));
    }
  }, [filters.movementPallet]);

  // Load low stock products
  const loadLowStockProducts = async () => {
    setLoading(prev => ({ ...prev, lowStock: true }));
    try {
      const result = await unifiedDataLayer.getLowStockProducts(10);
      setLowStockProducts(result);
    } catch (error) {
      console.error('Failed to load low stock products:', error);
    } finally {
      setLoading(prev => ({ ...prev, lowStock: false }));
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts();
    loadLowStockProducts();
  }, [loadProducts]);

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'pallets':
        loadPallets();
        break;
      case 'inventory':
        loadInventory();
        break;
      case 'movements':
        loadMovements();
        break;
    }
  }, [activeTab, loadPallets, loadInventory, loadMovements]);

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Page title */}
      <div className='space-y-2 text-center'>
        <h1 className='text-3xl font-bold text-gray-900'>🚀 Unified Data Layer Demo</h1>
        <p className='text-gray-600'>
          Demonstrating the new unified GraphQL Schema standardized API
        </p>
        <Badge variant='outline' className='border-green-700 text-green-700'>
          Week 1: GraphQL Schema Standardization
        </Badge>
      </div>

      {/* Low stock alert */}
      <Card className='border-orange-200 bg-orange-50'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-orange-800'>
            <BarChart3 className='h-5 w-5' />
            Low Stock Alert
          </CardTitle>
          <CardDescription>Products with stock levels below 10 units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <Button onClick={loadLowStockProducts} disabled={loading.lowStock} size='sm'>
              {loading.lowStock && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Reload
            </Button>
            <Badge variant='destructive'>{lowStockProducts.length} products need restocking</Badge>
          </div>
          {lowStockProducts.length > 0 && (
            <div className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3'>
              {lowStockProducts.slice(0, 6).map(product => (
                <div key={product.id} className='rounded border bg-white p-2 text-sm'>
                  <div className='font-medium'>{product.code}</div>
                  <div className='truncate text-gray-600'>{product.description}</div>
                  <div className='text-xs text-gray-500'>
                    {product.colour} • {product.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main data display */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='products' className='flex items-center gap-2'>
            <Package className='h-4 w-4' />
            Products
          </TabsTrigger>
          <TabsTrigger value='pallets' className='flex items-center gap-2'>
            <Truck className='h-4 w-4' />
            Pallets
          </TabsTrigger>
          <TabsTrigger value='inventory' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            Inventory
          </TabsTrigger>
          <TabsTrigger value='movements' className='flex items-center gap-2'>
            <Truck className='h-4 w-4' />
            Movements
          </TabsTrigger>
        </TabsList>

        {/* Products tab */}
        <TabsContent value='products' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Query product data using unified GraphQL API</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <Label htmlFor='product-search'>Search Products</Label>
                  <Input
                    id='product-search'
                    placeholder='Enter product code or description...'
                    value={filters.productSearch}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        productSearch: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='flex items-end'>
                  <Button onClick={loadProducts} disabled={loading.products}>
                    {loading.products && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    <Search className='mr-2 h-4 w-4' />
                    Search
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {products.map(product => (
                  <Card key={product.id} className='transition-shadow hover:shadow-md'>
                    <CardContent className='p-4'>
                      <div className='text-lg font-semibold'>{product.code}</div>
                      <div className='mb-2 text-gray-600'>{product.description}</div>
                      <div className='flex justify-between text-sm'>
                        <Badge variant='outline'>{product.colour}</Badge>
                        <span className='text-gray-500'>{product.type}</span>
                      </div>
                      <div className='mt-2 text-sm text-gray-500'>
                        Standard Qty: {product.standardQty}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pallets tab */}
        <TabsContent value='pallets' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Pallet Management</CardTitle>
              <CardDescription>Query pallet data using unified GraphQL API</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <Label htmlFor='pallet-search'>Search Pallets</Label>
                  <Input
                    id='pallet-search'
                    placeholder='Enter pallet number...'
                    value={filters.palletSearch}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        palletSearch: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='flex items-end'>
                  <Button onClick={loadPallets} disabled={loading.pallets}>
                    {loading.pallets && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    <Search className='mr-2 h-4 w-4' />
                    Search
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {pallets.map(pallet => (
                  <Card key={pallet.id} className='transition-shadow hover:shadow-md'>
                    <CardContent className='p-4'>
                      <div className='text-lg font-semibold'>{pallet.palletNumber}</div>
                      <div className='mb-2 text-gray-600'>{pallet.productCode}</div>
                      <div className='flex items-center justify-between'>
                        <Badge variant={pallet.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {pallet.status}
                        </Badge>
                        <span className='text-sm text-gray-500'>Qty: {pallet.quantity}</span>
                      </div>
                      <div className='mt-2 text-xs text-gray-500'>
                        {new Date(pallet.generateTime).toLocaleDateString('en-US')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory tab */}
        <TabsContent value='inventory' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Query inventory data using unified GraphQL API</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <Label htmlFor='inventory-search'>Product Code</Label>
                  <Input
                    id='inventory-search'
                    placeholder='Enter product code...'
                    value={filters.inventoryProductCode}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        inventoryProductCode: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='flex items-end'>
                  <Button onClick={loadInventory} disabled={loading.inventory}>
                    {loading.inventory && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    <Search className='mr-2 h-4 w-4' />
                    Search
                  </Button>
                </div>
              </div>

              <div className='space-y-3'>
                {inventory.map(record => (
                  <Card key={record.id} className='transition-shadow hover:shadow-md'>
                    <CardContent className='p-4'>
                      <div className='mb-3 flex items-start justify-between'>
                        <div>
                          <div className='font-semibold'>{record.productCode}</div>
                          <div className='text-sm text-gray-600'>Pallet: {record.palletNumber}</div>
                        </div>
                        <Badge variant='outline' className='text-lg font-bold'>
                          Total: {record.totalQuantity}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-3 gap-2 text-sm md:grid-cols-5'>
                        <div className='rounded bg-blue-50 p-2 text-center'>
                          <div className='font-medium'>Injection</div>
                          <div className='text-blue-700'>{record.injection}</div>
                        </div>
                        <div className='rounded bg-green-50 p-2 text-center'>
                          <div className='font-medium'>Pipeline</div>
                          <div className='text-green-700'>{record.pipeline}</div>
                        </div>
                        <div className='rounded bg-yellow-50 p-2 text-center'>
                          <div className='font-medium'>Prebook</div>
                          <div className='text-yellow-700'>{record.prebook}</div>
                        </div>
                        <div className='rounded bg-purple-50 p-2 text-center'>
                          <div className='font-medium'>Await</div>
                          <div className='text-purple-700'>{record.await}</div>
                        </div>
                        <div className='rounded bg-gray-50 p-2 text-center'>
                          <div className='font-medium'>Fold</div>
                          <div className='text-gray-700'>{record.fold}</div>
                        </div>
                      </div>

                      <div className='mt-2 text-xs text-gray-500'>
                        Last updated: {new Date(record.latestUpdate).toLocaleString('en-US')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements tab */}
        <TabsContent value='movements' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Movement Records</CardTitle>
              <CardDescription>Query movement records using unified GraphQL API</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <Label htmlFor='movement-search'>Pallet Number</Label>
                  <Input
                    id='movement-search'
                    placeholder='Enter pallet number...'
                    value={filters.movementPallet}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        movementPallet: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='flex items-end'>
                  <Button onClick={loadMovements} disabled={loading.movements}>
                    {loading.movements && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    <Search className='mr-2 h-4 w-4' />
                    Search
                  </Button>
                </div>
              </div>

              <div className='space-y-3'>
                {movements.map(movement => (
                  <Card key={movement.id} className='transition-shadow hover:shadow-md'>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <div className='font-semibold'>{movement.palletNumber}</div>
                          <div className='text-sm text-gray-600'>
                            Operator ID: {movement.operatorId}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm text-gray-500'>
                            {new Date(movement.transferDate).toLocaleString('en-US')}
                          </div>
                        </div>
                      </div>

                      <div className='mt-3 flex items-center gap-2'>
                        <Badge variant='outline'>{movement.fromLocation}</Badge>
                        <span className='text-gray-400'>→</span>
                        <Badge variant='default'>{movement.toLocation}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API information */}
      <Card className='border-blue-200 bg-blue-50'>
        <CardHeader>
          <CardTitle className='text-blue-800'>Unified Data Layer Features</CardTitle>
        </CardHeader>
        <CardContent className='text-blue-700'>
          <ul className='list-inside list-disc space-y-1 text-sm'>
            <li>✅ Unified GraphQL Schema definitions</li>
            <li>✅ Standardized Connection pagination pattern</li>
            <li>✅ Consistent error handling mechanism</li>
            <li>✅ Flexible filtering and sorting functionality</li>
            <li>✅ Type-safe TypeScript support</li>
            <li>✅ Business logic abstraction layer</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

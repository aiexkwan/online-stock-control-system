'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Package,
  Search,
  Loader2,
  QrCode,
  MapPin,
  Activity,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
// import { format } from 'date-fns'; // Removed - not used
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
// import { Badge } from '@/components/ui/badge'; // Removed - not used
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { SimpleQRScanner } from '@/components/qr-scanner/simple-qr-scanner';
import { SearchInput } from '../components/shared';
import {
  useStockHistoryGraphQL,
  type StockHistoryRecord,
  // type ProductInfo, // Removed - not used
  // type PalletHistoryResult, // Removed - not used
  // type SinglePalletHistoryResult, // Removed - not used
} from '../hooks/useStockHistoryGraphQL';

// Simplified interface
interface StockHistoryCardProps {
  warehouse?: string;
  limit?: number;
}

export function StockHistoryCard({ warehouse, limit = 40 }: StockHistoryCardProps) {
  // State management
  const [activeTab, setActiveTab] = useState('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [palletSearchTerm, setPalletSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // References
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const palletTableRef = useRef<HTMLDivElement>(null);

  // GraphQL hook (simplified)
  const { productHistory, palletHistory, actions, utils } = useStockHistoryGraphQL({
    onError: error => {
      console.error('Stock history GraphQL error:', error);
    },
  });

  // Search handlers
  const handleProductSearch = useCallback(() => {
    if (searchTerm.trim()) {
      actions.searchByProductCode(searchTerm, {
        filter: warehouse ? { locations: [warehouse] } : {},
        pagination: { first: limit },
      });
    }
  }, [searchTerm, actions, warehouse, limit]);

  const handlePalletSearch = useCallback(() => {
    if (palletSearchTerm.trim()) {
      actions.searchByPalletNumber(palletSearchTerm);
    }
  }, [palletSearchTerm, actions]);

  const handleQRScan = useCallback(
    (result: string) => {
      setIsScannerOpen(false);
      setPalletSearchTerm(result);

      // Auto-trigger search after scan
      setTimeout(() => {
        actions.searchByPalletNumber(result);
      }, 100);
    },
    [actions]
  );

  return (
    <AnalysisCard
      className='h-full'
      borderGlow='hover'
      glassmorphicVariant='default'
      padding='none'
    >
      {/* Simplified Header */}
      <div className='border-b border-gray-700/50 p-4'>
        <div className='flex items-center justify-between'>
          <h3 className={`${cardTextStyles.title} flex items-center gap-2`}>
            <Package className='h-5 w-5' />
            Stock History
          </h3>
        </div>
      </div>

      <div className='p-4'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2 bg-white/5 backdrop-blur-sm'>
            <TabsTrigger value='stock' className='data-[state=active]:bg-blue-600/30'>
              <Search className='mr-2 h-4 w-4' />
              Stock Search
            </TabsTrigger>
            <TabsTrigger value='pallet' className='data-[state=active]:bg-blue-600/30'>
              <Package className='mr-2 h-4 w-4' />
              Pallet Search
            </TabsTrigger>
          </TabsList>

          {/* Stock Search Tab */}
          <TabsContent value='stock' className='space-y-4'>
            <div className='mt-4 p-4'>
              {/* Product Code Input */}
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleProductSearch}
                placeholder='Enter product code (e.g., ME6060150)...'
                searchType='product'
                autoDetect={true}
                showTypeIndicator={false}
                isLoading={productHistory.loading}
                inputClassName='bg-white/10 backdrop-blur-sm border-none text-white placeholder:text-gray-400 focus:ring-1 focus:ring-white/30'
                buttonClassName='bg-white/10 hover:bg-white/15 backdrop-blur-sm border-white/30 text-white'
              />

              {/* Product Info Display (simplified) */}
              {productHistory.data && (
                <div className='mt-4 rounded-lg border-none bg-white/5 p-4 backdrop-blur-sm'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Product Code</p>
                    <p className='text-lg font-semibold'>{productHistory.data.productCode}</p>
                    {productHistory.data.productInfo.description && (
                      <p className='text-sm text-gray-400'>
                        {productHistory.data.productInfo.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced History Table */}
              {productHistory.data && (
                <div
                  ref={tableContainerRef}
                  className='mt-4 overflow-auto rounded-md border-none bg-white/5 backdrop-blur-sm'
                  style={{ maxHeight: '600px' }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className='border-gray-700/50'>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-4 w-4' />
                            Time
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Package className='h-4 w-4' />
                            Pallet Number
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Users className='h-4 w-4' />
                            Operator
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Activity className='h-4 w-4' />
                            Action
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='h-4 w-4' />
                            Location
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productHistory.loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className='h-4 w-28' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-24' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-24' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-16' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-20' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-40' />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : productHistory.data.records.length > 0 ? (
                        <>
                          {productHistory.data.records.map(
                            (record: StockHistoryRecord, index: number) => (
                              <TableRow
                                key={`${record.id}-${index}`}
                                className='border-none hover:bg-white/10'
                              >
                                <TableCell className='font-mono text-sm text-gray-200'>
                                  {utils.formatDate(record.timestamp)}
                                </TableCell>
                                <TableCell className='font-mono text-sm text-gray-200'>
                                  {record.palletNumber}
                                </TableCell>
                                <TableCell className='text-gray-200'>
                                  {record.operatorName}
                                </TableCell>
                                <TableCell>
                                  <span className='text-sm text-gray-200'>{record.action}</span>
                                </TableCell>
                                <TableCell className='text-gray-200'>
                                  {record.location || record.toLocation || '-'}
                                </TableCell>
                                <TableCell className='max-w-[300px] truncate text-gray-200'>
                                  {record.remark || '-'}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                          {/* Load More button for paginated loading
                              Purpose: When there are many stock history records for a product,
                              this button allows loading additional records in batches (pagination)
                              instead of loading all records at once, improving performance */}
                          {productHistory.hasNextPage && (
                            <TableRow>
                              <TableCell colSpan={6} className='py-4 text-center'>
                                <Button
                                  onClick={productHistory.fetchMore}
                                  className='bg-blue-600/20 hover:bg-blue-600/30'
                                  disabled={productHistory.loading}
                                >
                                  {productHistory.loading ? (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                  ) : null}
                                  Load More
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center text-muted-foreground'>
                            {productHistory.error
                              ? 'Error loading data'
                              : 'No history records found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!productHistory.data && !productHistory.loading && (
                <div className='py-8 text-center text-muted-foreground'>
                  <Package className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  Enter a product code and click Search to view pallet history
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pallet Search Tab */}
          <TabsContent value='pallet' className='space-y-4'>
            <div className='mt-4 p-4'>
              {/* Pallet Search Input */}
              <SearchInput
                value={palletSearchTerm}
                onChange={setPalletSearchTerm}
                onSearch={handlePalletSearch}
                onQrScan={() => setIsScannerOpen(true)}
                placeholder='Enter Pallet Number or scan QR Code...'
                searchType='pallet'
                autoDetect={true}
                showQrButton={true}
                showTypeIndicator={false}
                isLoading={palletHistory.loading}
                inputClassName='bg-white/10 backdrop-blur-sm border-none text-white placeholder:text-gray-400 focus:ring-1 focus:ring-white/30'
                buttonClassName='bg-white/10 hover:bg-white/15 backdrop-blur-sm border-white/30 text-white'
              />

              {/* Pallet Info Panel (simplified) */}
              {palletHistory.data && (
                <div className='mt-4 rounded-lg border-none bg-white/5 p-4 backdrop-blur-sm'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Pallet Number</p>
                      <p className='text-lg font-semibold'>{palletHistory.data?.palletNumber}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Product</p>
                      <p className='text-lg font-semibold'>
                        {palletHistory.data?.palletInfo?.productCode}
                      </p>
                      <p className='text-sm text-gray-400'>
                        Qty: {palletHistory.data?.palletInfo?.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Pallet History Table */}
              {(palletHistory.loading || palletHistory.data) && (
                <div
                  ref={palletTableRef}
                  className='mt-4 overflow-auto rounded-md border-none bg-white/5 backdrop-blur-sm'
                  style={{ maxHeight: '600px' }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className='border-gray-700/50'>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            Time
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Users className='h-4 w-4' />
                            Operator
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <Activity className='h-4 w-4' />
                            Action
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='h-4 w-4' />
                            Location
                          </div>
                        </TableHead>
                        <TableHead className='text-gray-300'>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {palletHistory.loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className='h-4 w-32' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-24' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-20' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-20' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-40' />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : palletHistory.data?.records && palletHistory.data.records.length > 0 ? (
                        palletHistory.data.records.map(
                          (record: StockHistoryRecord, index: number) => (
                            <TableRow
                              key={`${record.id}-${index}`}
                              className='border-none hover:bg-white/10'
                            >
                              <TableCell className='font-mono text-sm text-gray-200'>
                                {utils.formatDate(record.timestamp)}
                              </TableCell>
                              <TableCell className='text-gray-200'>{record.operatorName}</TableCell>
                              <TableCell>
                                <span className='text-sm text-gray-200'>{record.action}</span>
                              </TableCell>
                              <TableCell className='text-gray-200'>
                                {record.location || record.toLocation || record.fromLocation || '-'}
                              </TableCell>
                              <TableCell className='max-w-[300px] truncate text-gray-200'>
                                {record.remark || '-'}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className='text-center text-muted-foreground'>
                            {palletHistory.error
                              ? 'Error loading pallet data'
                              : 'No history records found for this pallet'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!palletHistory.loading && !palletHistory.data && (
                <div className='py-8 text-center text-muted-foreground'>
                  <QrCode className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  Enter a Pallet Number or scan a QR Code to view pallet history
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Scanner Modal */}
      <SimpleQRScanner
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
        title='Scan Pallet QR Code'
      />
    </AnalysisCard>
  );
}

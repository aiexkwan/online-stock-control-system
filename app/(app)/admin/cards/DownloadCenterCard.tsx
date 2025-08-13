/**
 * DownloadCenterCard Component
 * Document Management Download Center
 * Display list of available reports with download buttons
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ReportCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLazyQuery } from '@apollo/client';
import type { DownloadCenterCardProps, DownloadRecord } from '../types/common';
import { startOfDay, endOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { extractErrorMessage } from '@/lib/types/api';

// Import GraphQL queries and actions
import { GRN_OPTIONS_QUERY } from '@/lib/graphql/queries/grnReport.graphql';
import { 
  WAREHOUSE_ORDERS_QUERY,
  type WarehouseOrder
} from '@/lib/graphql/queries/orderData.graphql';
import { generateAcoReportExcel, generateGrnReportExcel, generateTransactionReportExcel } from '@/app/actions/DownloadCentre-Actions';
import { format } from 'date-fns';
import { REPORT_TYPES } from '../constants/reportTypes';

// Download record interface definition removed - now imported from types/common


// Helper function to download base64 file
const downloadBase64File = (base64Data: string, fileName: string) => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const DownloadCenterCard: React.FC<DownloadCenterCardProps> = ({
  title = 'Download',
  description,
  className,
  onReportSelect,
  ...props
}) => {
  const { toast } = useToast();
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Date range state for transfer report
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const handleDownloadClick = async (reportId: string) => {
    const report = REPORT_TYPES.find(r => r.id === reportId);
    if (!report || !report.available) return;
    
    // Trigger data fetch when user opens dropdown - only then we fetch data
    if (reportId === 'aco-order') {
      // Fetch ACO orders on-demand
      fetchAcoOrders();
    } else if (reportId === 'grn') {
      // Fetch GRN options on-demand
      fetchGrnOptions();
    }
    
    // Show dropdown overlay for this report type
    setActiveDropdown(reportId);
    setSelectedValue('');
  };

  const handleSelection = async (reportId: string, value: string) => {
    if (!value) return;
    
    setIsGenerating(true);
    setActiveDropdown(null);
    
    try {
      switch (reportId) {
        case 'aco-order':
          // Generate ACO Order Report on server
          const acoResult = await generateAcoReportExcel(value);
          if (acoResult.success && acoResult.data) {
            // Download the file
            downloadBase64File(acoResult.data.fileData, acoResult.data.fileName);
            
            toast({
              title: 'ACO report exported successfully',
              description: `Order ${value} has been exported to Excel`,
            });
          } else {
            toast({
              title: 'Export failed',
              description: ('error' in acoResult ? extractErrorMessage(acoResult.error) : 'Failed to generate report'),
              variant: 'destructive',
            });
          }
          break;
          
        case 'grn':
          // Generate GRN Report on server (single Excel with multiple sheets)
          const grnResult = await generateGrnReportExcel(value);
          if (grnResult.success && grnResult.data) {
            // Download the file
            downloadBase64File(grnResult.data.fileData, grnResult.data.fileName);
            
            toast({
              title: 'GRN report exported successfully',
              description: `GRN ${value} has been exported to Excel`,
            });
          } else {
            toast({
              title: 'Export failed',
              description: ('error' in grnResult ? extractErrorMessage(grnResult.error) : 'Failed to generate report'),
              variant: 'destructive',
            });
          }
          break;
          
        case 'transfer':
          // Generate Transfer Report on server with selected date range
          if (!dateRange?.from || !dateRange?.to) {
            toast({
              title: 'Date range required',
              description: 'Please select both start and end dates',
              variant: 'destructive',
            });
            break;
          }
          
          const startDate = format(startOfDay(dateRange.from), 'yyyy-MM-dd');
          const endDate = format(endOfDay(dateRange.to), 'yyyy-MM-dd');
          
          const transferResult = await generateTransactionReportExcel(startDate, endDate);
          
          if (transferResult.success && transferResult.data) {
            // Download the file
            downloadBase64File(transferResult.data.fileData, transferResult.data.fileName);
            
            toast({
              title: 'Transfer report exported successfully',
              description: `Report generated for ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`,
            });
          } else {
            toast({
              title: 'Export failed',
              description: ('error' in transferResult ? extractErrorMessage(transferResult.error) : 'Failed to generate report'),
              variant: 'destructive',
            });
          }
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred during export',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Lazy queries for on-demand data fetching - only when user clicks download
  const [
    fetchAcoOrders,
    { data: acoOrdersData, loading: acoOrdersLoading }
  ] = useLazyQuery(WAREHOUSE_ORDERS_QUERY, {
    variables: { input: {} },
    fetchPolicy: 'cache-first',
    onError: (error) => {
      console.error('Failed to fetch ACO orders:', error);
      toast({
        title: 'Failed to load orders',
        description: 'Could not fetch ACO order list. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const [
    fetchGrnOptions,
    { data: grnOptionsData, loading: grnOptionsLoading }
  ] = useLazyQuery(GRN_OPTIONS_QUERY, {
    variables: { limit: 500 },
    fetchPolicy: 'cache-first',
    onError: (error) => {
      console.error('Failed to fetch GRN options:', error);
      toast({
        title: 'Failed to load GRN options',
        description: 'Could not fetch GRN reference list. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Extract data with proper fallbacks
  const acoOrders = acoOrdersData?.warehouseOrders?.items || [];
  const grnOptions = grnOptionsData?.grnOptions || [];

  return (
    <>
      <ReportCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        padding='none'
        className={cn("h-full", className)}
      >
      <div className="p-6">
        <h3 className={cn(cardTextStyles.title, "mb-4")}>{title}</h3>
        <div className="w-full">
        {/* Table header */}
        <div className="grid grid-cols-[1fr,2fr,auto] gap-4 border-b border-slate-600/50 pb-3 mb-4">
          <div className={cardTextStyles.body}>Name</div>
          <div className={cardTextStyles.body}>Description</div>
          <div className={cardTextStyles.body}></div>
        </div>

        {/* Report list */}
        <div className="space-y-2">
          {REPORT_TYPES.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className={cn(
                "grid grid-cols-[1fr,2fr,auto] gap-4 items-center p-4 rounded-lg transition-colors",
                report.available ? "hover:bg-slate-800/50" : "opacity-50"
              )}>
                {/* Name */}
                <div className="flex items-center gap-2">
                  <FileText className={cn("h-6 w-6", report.available ? "text-slate-400" : "text-slate-600")} />
                  <span className={cn(cardTextStyles.body, report.available ? "" : "text-slate-500")}>
                    {report.name}
                  </span>
                </div>

                {/* Description */}
                <div className={cn(cardTextStyles.bodySmall, report.available ? "text-slate-400" : "text-slate-600")}>
                  {report.description}
                  {!report.available && (
                    <span className={cn(cardTextStyles.labelSmall, "text-amber-500 block mt-1")}>
                      (Coming soon)
                    </span>
                  )}
                </div>

                {/* Download button */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => handleDownloadClick(report.id)}
                  disabled={loadingReports[report.id] || !report.available}
                  className={cn(
                    "text-lg",
                    report.available 
                      ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10" 
                      : "text-slate-600 cursor-not-allowed"
                  )}
                >
                  {loadingReports[report.id] ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Download className="h-6 w-6" />
                  )}
                  <span className="ml-2">Download</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      </div>
      </ReportCard>

      {/* Full screen overlay dropdown - OriginUI style */}
      <AnimatePresence>
        {activeDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={() => setActiveDropdown(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
                {/* Header gradient overlay */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={cn(cardTextStyles.title, "text-2xl tracking-tight")}>
                        {activeDropdown === 'aco-order' && 'Select ACO Order'}
                        {activeDropdown === 'grn' && 'Select GRN Reference'}
                        {activeDropdown === 'transfer' && 'Transfer Report'}
                      </h3>
                      <p className={cn(cardTextStyles.bodySmall, "text-zinc-400 mt-1")}>
                        {activeDropdown === 'aco-order' && 'Choose an order to generate the report'}
                        {activeDropdown === 'grn' && 'Select a GRN to export all material codes'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveDropdown(null)}
                      className="rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* ACO Order Dropdown */}
                  {activeDropdown === 'aco-order' && (
                    <div className="space-y-4">
                      <Select
                        value={selectedValue}
                        onValueChange={(value) => {
                          setSelectedValue(value);
                          handleSelection('aco-order', value);
                        }}
                      >
                        <SelectTrigger className="w-full h-12 bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800/70 focus:bg-zinc-800/70 focus:ring-2 focus:ring-white/20 focus:border-white/50 transition-all">
                          <SelectValue placeholder={acoOrdersLoading ? "Loading orders..." : "Choose an ACO order..."} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800 max-h-[300px] overflow-y-auto">
                          {acoOrdersLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-zinc-400">Loading orders...</span>
                            </div>
                          ) : acoOrders.length === 0 ? (
                            <div className="flex items-center justify-center p-4">
                              <span className="text-zinc-500">No orders available</span>
                            </div>
                          ) : (
                            acoOrders.map((order: WarehouseOrder) => (
                              <SelectItem 
                                key={order.orderRef} 
                                value={order.orderRef}
                                className="text-zinc-300 hover:text-white hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:text-white"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={cardTextStyles.body}>{order.orderRef}</span>
                                  <span className={cn(cardTextStyles.labelSmall, "text-zinc-500 ml-2 bg-zinc-800/50 px-2 py-1 rounded")}>
                                    {order.status}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* GRN Dropdown */}
                  {activeDropdown === 'grn' && (
                    <div className="space-y-4">
                      <Select
                        value={selectedValue}
                        onValueChange={(value) => {
                          setSelectedValue(value);
                          handleSelection('grn', value);
                        }}
                      >
                        <SelectTrigger className="w-full h-12 bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800/70 focus:bg-zinc-800/70 focus:ring-2 focus:ring-white/20 focus:border-white/50 transition-all">
                          <SelectValue placeholder={grnOptionsLoading ? "Loading GRN options..." : "Choose a GRN reference..."} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800 max-h-[300px] overflow-y-auto">
                          {grnOptionsLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-zinc-400">Loading GRN options...</span>
                            </div>
                          ) : grnOptions.length === 0 ? (
                            <div className="flex items-center justify-center p-4">
                              <span className="text-zinc-500">No GRN references available</span>
                            </div>
                          ) : (
                            grnOptions.map((option: { grnRef: string; materialCount: number }) => (
                              <SelectItem 
                                key={option.grnRef} 
                                value={option.grnRef}
                                className="text-zinc-300 hover:text-white hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:text-white"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={cardTextStyles.body}>{option.grnRef}</span>
                                  <span className={cn(cardTextStyles.labelSmall, "text-zinc-500 ml-2 bg-zinc-800/50 px-2 py-1 rounded")}>
                                    {option.materialCount} materials
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Transfer Report - With date range picker */}
                  {activeDropdown === 'transfer' && (
                    <div className="space-y-6">
                      {/* Date Range Picker - Always visible */}
                      <div className="w-full flex justify-center px-4">
                        <div className="transform scale-90 origin-center">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3"
                          />
                        </div>
                      </div>
                      
                      {/* Quick Date Range Options */}
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(today.getDate() - 1);
                            setDateRange({ from: yesterday, to: yesterday });
                          }}
                        >
                          Yesterday
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            const last2Days = new Date(today);
                            last2Days.setDate(today.getDate() - 2);
                            setDateRange({ from: last2Days, to: today });
                          }}
                        >
                          Last 2 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            const last3Days = new Date(today);
                            last3Days.setDate(today.getDate() - 3);
                            setDateRange({ from: last3Days, to: today });
                          }}
                        >
                          Last 3 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            const last4Days = new Date(today);
                            last4Days.setDate(today.getDate() - 4);
                            setDateRange({ from: last4Days, to: today });
                          }}
                        >
                          Last 4 days
                        </Button>
                      </div>
                      
                      <Button
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/25 transition-all duration-200"
                        onClick={() => handleSelection('transfer', 'custom-range')}
                        disabled={isGenerating || !dateRange?.from || !dateRange?.to}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download Transfer Report
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay - OriginUI style */}
      {isGenerating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900/95 backdrop-blur-xl p-8 rounded-2xl border border-zinc-800/50 shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full" />
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400 relative" />
              </div>
              <p className={cn(cardTextStyles.body, "mt-6")}>Generating report...</p>
              <p className={cn(cardTextStyles.bodySmall, "mt-2 text-zinc-400")}>Please wait while we prepare your download</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default DownloadCenterCard;
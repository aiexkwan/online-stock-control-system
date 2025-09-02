/**
 * Reports Dashboard Dialog Component
 *
 * Provides a centralized interface for accessing and managing various system reports.
 * Supports filtering, categorization, and unified report access through a modal dialog.
 *
 * @fileoverview Comprehensive report dashboard with search, filtering, and categorization
 * @author System
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Package,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Filter,
  X,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { ReportRegistry } from '@/app/components/reports/core/ReportRegistry';
import { RegisteredReport } from '@/app/components/reports/core/ReportConfig';

// Report Dialogs
// Order Loading Report 功能已移除 (極簡化)
// import { UnifiedLoadingReportDialog } from '@/app/(app)/order-loading/components/UnifiedLoadingReportDialog';
// import { UnifiedStockTakeReportDialog } from '@/app/stock-take/components/UnifiedStockTakeReportDialog'; // Component not found
// ACO Report now integrated directly into system page card
// import { UnifiedGrnReportDialog } from '@/components/business/reports/UnifiedGrnReportDialog'; // Component not found
// Transaction Report now integrated directly into system page card
import { UnifiedExportAllDataDialog } from '@/app/components/reports/UnifiedExportAllDataDialog';

/**
 * Props interface for ReportsDashboardDialog component
 */
interface ReportsDashboardDialogProps {
  /** Whether the dialog is currently open */
  readonly isOpen: boolean;
  /** Callback function to handle dialog close event */
  readonly onClose: () => void;
}

/**
 * State interface for managing individual report dialog visibility
 */
interface ReportDialogState {
  [key: string]: boolean;
}

/**
 * ReportsDashboardDialog Component
 *
 * Main component for displaying and managing system reports in a centralized dashboard.
 * Provides search, filtering, and categorization functionality for easy report access.
 *
 * @param props - Component props
 * @returns React functional component
 */
export function ReportsDashboardDialog({ isOpen, onClose }: ReportsDashboardDialogProps) {
  const [reports, setReports] = useState<RegisteredReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogStates, setDialogStates] = useState<ReportDialogState>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  /**
   * Load report list when dialog opens
   * Initializes report data and dialog states
   */
  useEffect(() => {
    if (isOpen) {
      try {
        const loadedReports = ReportRegistry.getAllReports();
        setReports(loadedReports);

        // Initialize dialog states
        const initialStates: ReportDialogState = {};
        loadedReports.forEach(report => {
          initialStates[report._config.id] = false;
        });
        setDialogStates(initialStates);
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    }
  }, [isOpen]);

  /**
   * Filter reports based on search term and category
   */
  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report._config._name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report._config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || report._config.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /**
   * Handle report selection and open corresponding dialog
   * @param reportId - The ID of the report to select
   */
  const selectReport = (reportId: string) => {
    setSelectedReport(reportId);
    setDialogStates(prev => ({
      ...prev,
      [reportId]: true,
    }));
  };

  /**
   * Handle closing of individual report dialogs
   * @param reportId - The ID of the report dialog to close
   */
  const closeReportDialog = (reportId: string) => {
    setDialogStates(prev => ({
      ...prev,
      [reportId]: false,
    }));
    setSelectedReport(null);
  };

  /**
   * Get appropriate icon for report category
   * @param category - The report category
   * @returns React icon component
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operational':
        return <TrendingUp className='h-4 w-4' />;
      case 'inventory':
        return <Package className='h-4 w-4' />;
      case 'financial':
        return <BarChart3 className='h-4 w-4' />;
      case 'quality':
        return <AlertCircle className='h-4 w-4' />;
      case 'management':
        return <Building2 className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  /**
   * Get category-specific color scheme for UI elements
   * @param category - The report category
   * @returns CSS class string for category colors
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'operational':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'inventory':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'financial':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'quality':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'management':
        return 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <>
      <Dialog open={isOpen && !selectedReport} onOpenChange={open => !open && onClose()}>
        <DialogContent className={`${dialogStyles.content} max-h-[80vh] max-w-4xl`}>
          <DialogHeader>
            <DialogTitle className={dialogStyles.title}>
              <BarChart3 className={`h-6 w-6 ${iconColors.blue}`} />
              Report Center
            </DialogTitle>
            <DialogDescription className={dialogStyles.description}>
              Select a report to generate
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Search and Filter */}
            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
                <Input
                  placeholder='Search reports...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`pl-10 ${dialogStyles.input}`}
                />
              </div>
              <div className='flex flex-wrap gap-2'>
                {['all', 'operational', 'inventory', 'management'].map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'capitalize transition-all',
                      selectedCategory === category
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    )}
                  >
                    {category === 'all'
                      ? 'All'
                      : category === 'operational'
                        ? 'Operational'
                        : category === 'inventory'
                          ? 'Inventory'
                          : 'Management'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Report List */}
            <div className='h-[400px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-4 pr-4'>
              <div className='space-y-6'>
                {['operational', 'inventory', 'management'].map(category => {
                  const categoryReports = filteredReports.filter(
                    r => r._config.category === category
                  );

                  if (categoryReports.length === 0 && selectedCategory !== 'all') return null;

                  return (
                    <div key={category} className='space-y-3'>
                      <div className='flex items-center gap-2 text-sm font-medium text-slate-300'>
                        <div
                          className={cn('rounded p-1.5', getCategoryColor(category).split(' ')[0])}
                        >
                          {getCategoryIcon(category)}
                        </div>
                        <span className='capitalize'>{category} Reports</span>
                        <Badge variant='secondary' className='bg-slate-700 text-xs text-slate-300'>
                          {categoryReports.length}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        {categoryReports.map(report => (
                          <Button
                            key={report._config.id}
                            variant='outline'
                            className={cn(
                              'h-auto justify-start p-4 text-left transition-all hover:shadow-md',
                              'border-slate-600 bg-slate-800 hover:bg-slate-700',
                              getCategoryColor(report._config.category)
                            )}
                            onClick={() => selectReport(report._config.id)}
                          >
                            <div className='flex w-full items-start gap-3'>
                              <FileText className='mt-0.5 h-5 w-5 flex-shrink-0' />
                              <div className='flex-1 space-y-1'>
                                <div className='font-medium text-white'>{report._config._name}</div>
                                <div className='line-clamp-2 text-xs text-slate-400'>
                                  {report._config.description}
                                </div>
                                <div className='mt-2 flex gap-1'>
                                  {report._config.formats.map(format => (
                                    <Badge
                                      key={format}
                                      variant='secondary'
                                      className='bg-slate-700 px-1.5 py-0 text-xs text-slate-300'
                                    >
                                      {format.toUpperCase()}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* No Results */}
                {filteredReports.length === 0 && (
                  <div className='py-12 text-center'>
                    <Filter className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                    <p className='text-slate-500'>No reports found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Report Dialogs */}
      {/* Order Loading Report 功能已移除 (極簡化) */}
      {/* <UnifiedLoadingReportDialog
        isOpen={dialogStates['order-loading-report'] || false}
        onClose={() => closeReportDialog('order-loading-report')}
      /> */}

      {/* Stock Take Report Dialog - Component not found
      <UnifiedStockTakeReportDialog
        isOpen={dialogStates['stock-take-report'] || false}
        onClose={() => closeReportDialog('stock-take-report')}
      /> */}
      {/* ACO Order Report now integrated directly into system page card */}

      {/* Transaction Report now integrated directly into system page card */}

      <UnifiedExportAllDataDialog
        isOpen={dialogStates['export-all-data'] || false}
        onClose={() => closeReportDialog('export-all-data')}
      />
    </>
  );
}

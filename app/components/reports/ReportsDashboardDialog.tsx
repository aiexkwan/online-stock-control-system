/**
 * Reports Dashboard Dialog
 * Displays all reports in a dialog interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
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
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { ReportRegistry } from '@/app/components/reports/core/ReportRegistry';
import { RegisteredReport } from '@/app/components/reports/core/ReportConfig';

// Report Dialogs
import { UnifiedVoidReportDialog } from '@/app/void-pallet/components/UnifiedVoidReportDialog';
import { UnifiedLoadingReportDialog } from '@/app/order-loading/components/UnifiedLoadingReportDialog';
// import { UnifiedStockTakeReportDialog } from '@/app/stock-take/components/UnifiedStockTakeReportDialog'; // Component not found
// ACO Report now integrated directly into system page widget
import { UnifiedGrnReportDialog } from '@/app/components/reports/UnifiedGrnReportDialog';
// Transaction Report now integrated directly into system page widget
import { UnifiedExportAllDataDialog } from '@/app/components/reports/UnifiedExportAllDataDialog';

interface ReportsDashboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportDialogState {
  [key: string]: boolean;
}

export function ReportsDashboardDialog({ isOpen, onClose }: ReportsDashboardDialogProps) {
  const [reports, setReports] = useState<RegisteredReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogStates, setDialogStates] = useState<ReportDialogState>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Load report list
  useEffect(() => {
    if (isOpen) {
      const loadedReports = ReportRegistry.getAllReports();
      setReports(loadedReports);
      
      // Initialize dialog states
      const initialStates: ReportDialogState = {};
      loadedReports.forEach(report => {
        initialStates[report.config.id] = false;
      });
      setDialogStates(initialStates);
    }
  }, [isOpen]);

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.config.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Select report
  const selectReport = (reportId: string) => {
    setSelectedReport(reportId);
    setDialogStates(prev => ({
      ...prev,
      [reportId]: true
    }));
  };

  // Close report dialog
  const closeReportDialog = (reportId: string) => {
    setDialogStates(prev => ({
      ...prev,
      [reportId]: false
    }));
    setSelectedReport(null);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operational':
        return <TrendingUp className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'financial':
        return <BarChart3 className="h-4 w-4" />;
      case 'quality':
        return <AlertCircle className="h-4 w-4" />;
      case 'management':
        return <Building2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get category color
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
      <Dialog open={isOpen && !selectedReport} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={`${dialogStyles.content} max-w-4xl max-h-[80vh]`}>
          <DialogHeader>
            <DialogTitle className={dialogStyles.title}>
              <BarChart3 className={`h-6 w-6 ${iconColors.blue}`} />
              Report Center
            </DialogTitle>
            <DialogDescription className={dialogStyles.description}>
              Select a report to generate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${dialogStyles.input}`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'operational', 'inventory', 'management'].map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "capitalize transition-all",
                      selectedCategory === category 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    {category === 'all' ? 'All' : 
                     category === 'operational' ? 'Operational' :
                     category === 'inventory' ? 'Inventory' :
                     'Management'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Report List */}
            <div className="h-[400px] overflow-y-auto pr-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="space-y-6">
                {['operational', 'inventory', 'management'].map(category => {
                  const categoryReports = filteredReports.filter(r => r.config.category === category);
                  
                  if (categoryReports.length === 0 && selectedCategory !== 'all') return null;
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <div className={cn("p-1.5 rounded", getCategoryColor(category).split(' ')[0])}>
                          {getCategoryIcon(category)}
                        </div>
                        <span className="capitalize">{category} Reports</span>
                        <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                          {categoryReports.length}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categoryReports.map(report => (
                          <Button
                            key={report.config.id}
                            variant="outline"
                            className={cn(
                              "h-auto p-4 justify-start text-left hover:shadow-md transition-all",
                              "bg-slate-800 border-slate-600 hover:bg-slate-700",
                              getCategoryColor(report.config.category)
                            )}
                            onClick={() => selectReport(report.config.id)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 space-y-1">
                                <div className="font-medium text-white">{report.config.name}</div>
                                <div className="text-xs text-slate-400 line-clamp-2">
                                  {report.config.description}
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {report.config.formats.map(format => (
                                    <Badge 
                                      key={format} 
                                      variant="secondary" 
                                      className="text-xs px-1.5 py-0 bg-slate-700 text-slate-300"
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
                  <div className="text-center py-12">
                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-slate-500">
                      No reports found matching your criteria
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Report Dialogs */}
      <UnifiedVoidReportDialog
        isOpen={dialogStates['void-pallet-report'] || false}
        onClose={() => closeReportDialog('void-pallet-report')}
      />
      
      <UnifiedLoadingReportDialog
        isOpen={dialogStates['order-loading-report'] || false}
        onClose={() => closeReportDialog('order-loading-report')}
      />
      
      {/* Stock Take Report Dialog - Component not found
      <UnifiedStockTakeReportDialog
        isOpen={dialogStates['stock-take-report'] || false}
        onClose={() => closeReportDialog('stock-take-report')}
      /> */}
      {/* ACO Order Report now integrated directly into system page widget */}
      
      <UnifiedGrnReportDialog
        isOpen={dialogStates['grn-report'] || false}
        onClose={() => closeReportDialog('grn-report')}
      />
      
      {/* Transaction Report now integrated directly into system page widget */}
      
      <UnifiedExportAllDataDialog
        isOpen={dialogStates['export-all-data'] || false}
        onClose={() => closeReportDialog('export-all-data')}
      />
    </>
  );
}
'use client';

import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fetchVoidRecords, fetchVoidRecordsAlternative, generateVoidReportPDF, generateVoidReportExcel, VoidReportFilters } from '@/app/void-pallet/services/voidReportService';
import { VOID_REASONS } from '@/app/void-pallet/types';

interface VoidReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoidReportDialog({ isOpen, onClose }: VoidReportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('excel');
  
  // Filters
  const [filters, setFilters] = useState<VoidReportFilters>({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 90)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    voidReason: '',
    productCode: '',
    voidBy: ''
  });
  
  // Quick date range presets
  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setFilters(prev => ({
      ...prev,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch void records
      let records;
      try {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('Attempting to fetch void records with primary method...');
        records = await fetchVoidRecords(filters);
      } catch (primaryError) {
        console.error('Primary fetch method failed:', primaryError);
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('Attempting alternative fetch method...');
        toast.info('Using alternative data fetch method...');
        
        try {
          records = await fetchVoidRecordsAlternative(filters);
        } catch (alternativeError) {
          console.error('Alternative fetch method also failed:', alternativeError);
          throw new Error('Unable to fetch void records. Please check your database connection.');
        }
      }
      
      if (!records || records.length === 0) {
        toast.warning('No void records found for the selected criteria');
        setIsGenerating(false);
        return;
      }
      
      toast.info(`Found ${records.length} void records. Generating report...`);
      
      // Generate report
      let blob: Blob;
      let filename: string;
      
      if (exportFormat === 'pdf') {
        blob = generateVoidReportPDF(records, filters);
        filename = `void_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      } else {
        blob = generateVoidReportExcel(records, filters);
        filename = `void_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      }
      
      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Report generated successfully: ${filename}`);
      onClose();
    } catch (error: any) {
      console.error('Error generating report:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to generate report: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterChange = (key: keyof VoidReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent flex items-center">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3 shadow-lg shadow-purple-500/25">
                <FileText className="w-4 h-4 text-white" />
              </div>
              Void Report Export
            </h2>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 space-y-6">
            {/* Filters Section */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-purple-400" />
                Report Filters
              </h3>
              
              <div className="space-y-4">
                {/* Quick date range buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDateRange(7)}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all"
                  >
                    Last 7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateRange(30)}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all"
                  >
                    Last 30 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateRange(90)}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all"
                  >
                    Last 90 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateRange(365)}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all"
                  >
                    Last year
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, startDate: '', endDate: '' }))}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all"
                  >
                    All time
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>
                </div>
                
                {/* Void Reason */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Void Reason
                  </label>
                  <select
                    value={filters.voidReason || ''}
                    onChange={(e) => handleFilterChange('voidReason', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  >
                    <option value="">All Reasons</option>
                    {VOID_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Product Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Product Code
                    <span className="text-xs text-slate-500 ml-2">(Leave blank for all)</span>
                  </label>
                  <input
                    type="text"
                    value={filters.productCode || ''}
                    onChange={(e) => handleFilterChange('productCode', e.target.value)}
                    placeholder="Enter product code or leave blank"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>
                
                {/* Voided By */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Voided By
                    <span className="text-xs text-slate-500 ml-2">(Leave blank for all)</span>
                  </label>
                  <input
                    type="text"
                    value={filters.voidBy || ''}
                    onChange={(e) => handleFilterChange('voidBy', e.target.value)}
                    placeholder="Enter username or leave blank"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Export Format Section */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Export Format</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`p-4 rounded-xl border transition-all ${
                    exportFormat === 'excel'
                      ? 'bg-green-600/20 border-green-500/50 text-green-400'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                  <span className="block text-sm font-medium">Excel (.xlsx)</span>
                  <span className="block text-xs mt-1 opacity-70">Detailed data with summary</span>
                </button>
                
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`p-4 rounded-xl border transition-all ${
                    exportFormat === 'pdf'
                      ? 'bg-red-600/20 border-red-500/50 text-red-400'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <span className="block text-sm font-medium">PDF</span>
                  <span className="block text-xs mt-1 opacity-70">Formatted report</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/25 flex items-center"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
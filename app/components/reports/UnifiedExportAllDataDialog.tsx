/**
 * Unified Export All Data Dialog
 * Integrated with the unified report framework
 */

'use client';

import React, { useState } from 'react';
import { UnifiedReportDialog } from '@/app/components/reports/core/UnifiedReportDialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';

interface UnifiedExportAllDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableOption {
  name: string;
  tableName: string;
  requiresDateRange: boolean;
}

const tableOptions: TableOption[] = [
  { name: 'Pallet Information', tableName: 'record_palletinfo', requiresDateRange: false },
  { name: 'Code List', tableName: 'data_code', requiresDateRange: false },
  { name: 'Voided Inventory', tableName: 'report_void', requiresDateRange: false },
  { name: 'Operation History', tableName: 'record_history', requiresDateRange: true },
  { name: 'Full Inventory', tableName: 'record_inventory', requiresDateRange: true },
];

export function UnifiedExportAllDataDialog({ isOpen, onClose }: UnifiedExportAllDataDialogProps) {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const handleTableToggle = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const exportTableAsCsv = async (tableName: string, displayName: string, requiresDateRange: boolean) => {
    const supabase = createClient();
    let query = supabase.from(tableName).select('*');

    // Apply date range filter if required
    if (requiresDateRange) {
      query = query
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      throw new Error(`Failed to export ${displayName}`);
    }

    if (!data || data.length === 0) {
      console.log(`No data found for ${tableName}`);
      return;
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle special characters and quotes in CSV
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${displayName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (selectedTables.length === 0) {
      toast({
        title: "No Tables Selected",
        description: "Please select at least one table to export",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Export All Data only supports CSV format
      if (format !== 'excel') {
        toast({
          title: "Format Not Supported",
          description: "Data export is only available in CSV format",
          variant: "destructive",
        });
        return;
      }

      // Export each selected table
      for (const tableName of selectedTables) {
        const tableOption = tableOptions.find(t => t.tableName === tableName);
        if (tableOption) {
          await exportTableAsCsv(tableName, tableOption.name, tableOption.requiresDateRange);
        }
      }
      
      toast({
        title: "Success",
        description: `Successfully exported ${selectedTables.length} table(s)`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requiresDateRange = selectedTables.some(tableName => 
    tableOptions.find(t => t.tableName === tableName)?.requiresDateRange
  );

  return (
    <UnifiedReportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export All Data"
      description="Export selected database tables as CSV files"
      formats={['excel']} // Using 'excel' to represent CSV export
      onGenerate={handleGenerateReport}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Select Tables to Export</Label>
          {tableOptions.map((table) => (
            <div key={table.tableName} className="flex items-center space-x-2">
              <Checkbox
                id={table.tableName}
                checked={selectedTables.includes(table.tableName)}
                onCheckedChange={() => handleTableToggle(table.tableName)}
                className="border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor={table.tableName}
                className="text-sm font-normal text-white cursor-pointer"
              >
                {table.name}
                {table.requiresDateRange && (
                  <span className="text-slate-500 ml-2">(requires date range)</span>
                )}
              </Label>
            </div>
          ))}
        </div>

        {requiresDateRange && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
        )}
        
        <p className="text-sm text-slate-500">
          Each selected table will be exported as a separate CSV file
        </p>
      </div>
    </UnifiedReportDialog>
  );
}
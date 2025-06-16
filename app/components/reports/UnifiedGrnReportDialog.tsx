/**
 * Unified GRN Report Dialog
 * Integrated with the unified report framework
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedReportDialog } from '@/app/components/reports/core/UnifiedReportDialog';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/app/utils/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportGrnReport } from '@/lib/exportReport';

interface UnifiedGrnReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedGrnReportDialog({ isOpen, onClose }: UnifiedGrnReportDialogProps) {
  const { toast } = useToast();
  const [grnRefs, setGrnRefs] = useState<string[]>([]);
  const [selectedGrnRef, setSelectedGrnRef] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch GRN references when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchGrnRefs();
    }
  }, [isOpen]);

  const fetchGrnRefs = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('grn_label')
        .select('grn_ref')
        .order('print_date', { ascending: false });

      if (error) {
        console.error('Error fetching GRN references:', error);
        toast({
          title: "Error",
          description: "Failed to fetch GRN references",
          variant: "destructive",
        });
        return;
      }

      // Get unique GRN references
      const uniqueRefs = [...new Set((data || []).map(item => item.grn_ref))].filter(Boolean);
      setGrnRefs(uniqueRefs);
      
      // Set default selection
      if (uniqueRefs.length > 0 && !selectedGrnRef) {
        setSelectedGrnRef(uniqueRefs[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GRN references",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (!selectedGrnRef) {
      toast({
        title: "No GRN Selected",
        description: "Please select a GRN reference",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (format === 'excel') {
        // Fetch GRN data
        const supabase = createClient();
        const { data: grnData, error } = await supabase
          .from('grn_label')
          .select('*')
          .eq('grn_ref', selectedGrnRef)
          .order('material_code', { ascending: true });

        if (error) throw error;

        // Group by material code
        const groupedData = grnData.reduce((acc: any, item: any) => {
          const materialCode = item.material_code;
          if (!acc[materialCode]) {
            acc[materialCode] = [];
          }
          acc[materialCode].push(item);
          return acc;
        }, {});

        // Generate report for each material code
        for (const [materialCode, items] of Object.entries(groupedData)) {
          await exportGrnReport(items as any[], selectedGrnRef, materialCode);
        }

        toast({
          title: "Success",
          description: `GRN reports generated for ${Object.keys(groupedData).length} material code(s)`,
        });
      } else {
        // PDF format not supported for GRN reports
        toast({
          title: "Format Not Supported",
          description: "GRN reports are only available in Excel format",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedReportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="GRN Report"
      description="Generate Goods Receipt Note reports by GRN reference"
      formats={['excel']}
      onGenerate={handleGenerateReport}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="grn-ref">GRN Reference</Label>
          <Select
            value={selectedGrnRef}
            onValueChange={setSelectedGrnRef}
            disabled={grnRefs.length === 0}
          >
            <SelectTrigger id="grn-ref" className="bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder={grnRefs.length === 0 ? "Loading..." : "Select GRN reference"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {grnRefs.map((ref) => (
                <SelectItem 
                  key={ref} 
                  value={ref}
                  className="text-white hover:bg-slate-700"
                >
                  {ref}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {grnRefs.length === 0 && (
            <p className="text-sm text-slate-500">No GRN references found</p>
          )}
          <p className="text-sm text-slate-500">
            Reports will be generated separately for each material code
          </p>
        </div>
      </div>
    </UnifiedReportDialog>
  );
}
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
import { Select } from '@/components/ui/select';
import { exportGrnReport } from '@/lib/exportReport';
import { getMaterialCodesForGrnRef, getGrnReportData } from '@/app/actions/reportActions';

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
        // Get current user
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          throw new Error('User not authenticated');
        }

        // Get material codes for the selected grn_ref
        const materialCodes = await getMaterialCodesForGrnRef(selectedGrnRef);
        
        if (materialCodes.length === 0) {
          throw new Error('No materials found for the selected GRN reference');
        }

        // Generate report for each material code
        for (const materialCode of materialCodes) {
          const reportData = await getGrnReportData(selectedGrnRef, materialCode, user.email);
          if (reportData) {
            await exportGrnReport(reportData);
          }
        }

        toast({
          title: "Success",
          description: `GRN reports generated for ${materialCodes.length} material code(s)`,
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
            id="grn-ref"
            value={selectedGrnRef}
            onChange={(e) => setSelectedGrnRef(e.target.value)}
            disabled={grnRefs.length === 0}
            className="bg-slate-800 border-slate-600 text-white"
          >
            <option value="">{grnRefs.length === 0 ? "Loading..." : "Select GRN reference"}</option>
            {grnRefs.map((ref) => (
              <option key={ref} value={ref}>
                {ref}
              </option>
            ))}
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
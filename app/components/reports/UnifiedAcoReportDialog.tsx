/**
 * Unified ACO Order Report Dialog
 * Integrated with the unified report framework
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedReportDialog } from '@/app/components/reports/core/UnifiedReportDialog';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/app/utils/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportAcoReport } from '@/lib/exportReport';
import { getAcoReportData } from '@/app/actions/reportActions';

interface UnifiedAcoReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedAcoReportDialog({ isOpen, onClose }: UnifiedAcoReportDialogProps) {
  const { toast } = useToast();
  const [acoOrders, setAcoOrders] = useState<string[]>([]);
  const [selectedAcoOrder, setSelectedAcoOrder] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch ACO orders when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAcoOrders();
    }
  }, [isOpen]);

  const fetchAcoOrders = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('acos')
        .select('aco_order')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ACO orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch ACO orders",
          variant: "destructive",
        });
        return;
      }

      // Get unique ACO orders
      const uniqueOrders = [...new Set((data || []).map(item => item.aco_order))].filter(Boolean);
      setAcoOrders(uniqueOrders);
      
      // Set default selection
      if (uniqueOrders.length > 0 && !selectedAcoOrder) {
        setSelectedAcoOrder(uniqueOrders[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ACO orders",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (!selectedAcoOrder) {
      toast({
        title: "No Order Selected",
        description: "Please select an ACO order",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (format === 'excel') {
        // Generate Excel report
        const reportData = await getAcoReportData(selectedAcoOrder);
        await exportAcoReport(reportData, selectedAcoOrder);
        
        toast({
          title: "Success",
          description: "ACO order report generated successfully",
        });
      } else {
        // PDF format not supported for ACO reports
        toast({
          title: "Format Not Supported",
          description: "ACO reports are only available in Excel format",
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
      title="ACO Order Report"
      description="Generate ACO order reports with product and quantity details"
      formats={['excel']}
      onGenerate={handleGenerateReport}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="aco-order">ACO Order</Label>
          <Select
            value={selectedAcoOrder}
            onValueChange={setSelectedAcoOrder}
            disabled={acoOrders.length === 0}
          >
            <SelectTrigger id="aco-order" className="bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder={acoOrders.length === 0 ? "Loading..." : "Select ACO order"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {acoOrders.map((order) => (
                <SelectItem 
                  key={order} 
                  value={order}
                  className="text-white hover:bg-slate-700"
                >
                  {order}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {acoOrders.length === 0 && (
            <p className="text-sm text-slate-500">No ACO orders found</p>
          )}
        </div>
      </div>
    </UnifiedReportDialog>
  );
}
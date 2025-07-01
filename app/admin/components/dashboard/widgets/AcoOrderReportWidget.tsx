/**
 * ACO Order Report Widget
 * 集成 ACO 訂單報表功能
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/app/utils/supabase/client';
import { exportAcoReport } from '@/lib/exportReport';
import { getAcoReportData } from '@/app/actions/reportActions';
import { cn } from '@/lib/utils';

interface AcoOrderReportWidgetProps {
  theme?: string;
}

export function AcoOrderReportWidget({ theme }: AcoOrderReportWidgetProps) {
  const { toast } = useToast();
  const [acoOrders, setAcoOrders] = useState<string[]>([]);
  const [selectedAcoOrder, setSelectedAcoOrder] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch ACO orders on mount
  useEffect(() => {
    fetchAcoOrders();
  }, [fetchAcoOrders]);

  const fetchAcoOrders = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_aco')
        .select('order_ref')
        .order('latest_update', { ascending: false });

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
      const uniqueOrders = [...new Set((data || []).map(item => item.order_ref))].filter(Boolean);
      // Convert to string array since order_ref is integer
      const orderStrings = uniqueOrders.map(ref => ref.toString());
      setAcoOrders(orderStrings);
      
      // Set default selection
      if (orderStrings.length > 0 && !selectedAcoOrder) {
        setSelectedAcoOrder(orderStrings[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ACO orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedAcoOrder]);

  const handleGenerateReport = async () => {
    if (!selectedAcoOrder) {
      toast({
        title: "No Order Selected",
        description: "Please select an ACO order",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate Excel report
      const reportData = await getAcoReportData(selectedAcoOrder);
      await exportAcoReport(reportData, selectedAcoOrder);
      
      toast({
        title: "Success",
        description: `ACO order ${selectedAcoOrder} report generated successfully`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={cn(
      "h-full bg-slate-900/50 backdrop-blur-xl",
      "border border-slate-700/50",
      "shadow-[0_0_30px_rgba(0,0,0,0.3)]",
      "transition-all duration-300",
      "hover:shadow-[0_0_40px_rgba(0,0,0,0.4)]",
      "overflow-visible"
    )}>
      <CardContent className="h-full p-4 flex flex-col">
        <div className="flex flex-col h-full">
          {/* Title */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DocumentArrowDownIcon className="h-5 w-5 text-cyan-500" />
              <h3 className="text-sm font-semibold text-white">ACO Order Report</h3>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center">
            <div className="w-full flex items-center gap-3">
              {/* ACO Order Selector */}
              <div className="flex-1">
                <Label htmlFor="aco-order" className="sr-only">
                  ACO Order
                </Label>
                <Select
                  value={selectedAcoOrder}
                  onValueChange={setSelectedAcoOrder}
                  disabled={loading || acoOrders.length === 0}
                >
                  <SelectTrigger 
                    id="aco-order"
                    className="w-full h-9 bg-slate-800 border-slate-600 text-white text-sm"
                  >
                    <SelectValue placeholder={
                      loading ? "Loading..." : 
                      acoOrders.length === 0 ? "No ACO orders" : 
                      "Select ACO order"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {acoOrders.map((order) => (
                      <SelectItem 
                        key={order} 
                        value={order}
                        className="text-white hover:bg-slate-700 text-sm"
                      >
                        {order}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={loading || isGenerating || acoOrders.length === 0 || !selectedAcoOrder}
                className={cn(
                  "h-9 px-3",
                  "bg-cyan-600 hover:bg-cyan-700",
                  "text-white text-sm font-medium",
                  "border-0",
                  "transition-all duration-200",
                  "disabled:bg-slate-700 disabled:text-slate-400"
                )}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          {acoOrders.length === 0 && !loading && (
            <p className="text-xs text-slate-500 mt-2">No ACO order data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
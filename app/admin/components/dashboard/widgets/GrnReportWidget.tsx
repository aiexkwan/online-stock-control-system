/**
 * GRN Report Widget
 * 包含 GRN reference 下拉選擇器的 GRN 報告生成器
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { exportGrnReport } from '@/lib/exportReport';
import { getMaterialCodesForGrnRef, getGrnReportData } from '@/app/actions/reportActions';
import { createClient } from '@/app/utils/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';

interface GrnReportWidgetProps {
  title: string;
  reportType: string;
  description?: string;
  apiEndpoint?: string;
}

export const GrnReportWidget = function GrnReportWidget({ 
  title, 
  reportType,
  description,
  apiEndpoint 
}: GrnReportWidgetProps) {
  const { toast } = useToast();
  const [grnRefs, setGrnRefs] = useState<string[]>([]);
  const [selectedGrnRef, setSelectedGrnRef] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "downloaded" | "complete">("idle");
  const [progress, setProgress] = useState(0);

  // Fetch GRN references when component mounts
  useEffect(() => {
    fetchGrnRefs();
  }, [fetchGrnRefs]);

  const fetchGrnRefs = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_grn')
        .select('grn_ref')
        .order('creat_time', { ascending: false });

      if (error) {
        console.error('Error fetching GRN references:', error);
        toast({
          title: "Error",
          description: `Failed to fetch GRN references: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Get unique GRN references and convert to string if needed
      const uniqueRefs = [...new Set((data || []).map(item => {
        const ref = item.grn_ref;
        return ref != null ? ref.toString() : null;
      }))].filter(Boolean) as string[];
      
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
  }, [toast, selectedGrnRef]);

  const handleDownload = async () => {
    if (!selectedGrnRef) {
      toast({
        title: "No GRN Selected",
        description: "Please select a GRN reference",
        variant: "destructive",
      });
      return;
    }

    if (downloadStatus !== "idle") return;
    
    setDownloadStatus("downloading");
    setProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
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
      let successCount = 0;
      for (const materialCode of materialCodes) {
        const reportData = await getGrnReportData(selectedGrnRef, materialCode, user.email);
        if (reportData) {
          await exportGrnReport(reportData);
          successCount++;
        }
      }

      clearInterval(interval);
      setProgress(100);
      setDownloadStatus("downloaded");
      
      toast({
        title: "Success",
        description: `GRN reports generated for ${successCount} material code(s)`,
      });
      
      // Reset after 2 seconds
      setTimeout(() => {
        setDownloadStatus("complete");
        setTimeout(() => {
          setDownloadStatus("idle");
          setProgress(0);
        }, 500);
      }, 2000);
    } catch (error) {
      console.error('Download failed:', error);
      clearInterval(interval);
      setDownloadStatus("idle");
      setProgress(0);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full w-full bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{description || 'GRN Report'}</p>
      </div>
      <div className="flex-1 p-3 min-h-0 overflow-visible">
        <div className="flex items-center space-x-2 h-full">
          <div className="flex-1">
            <Select
              value={selectedGrnRef}
              onValueChange={setSelectedGrnRef}
              disabled={grnRefs.length === 0}
            >
              <SelectTrigger 
                className={cn(
                  "w-full h-9",
                  "bg-gray-800/50 hover:bg-gray-700/50",
                  "border border-gray-700 hover:border-gray-600",
                  "text-white"
                )}
              >
                <SelectValue placeholder={grnRefs.length === 0 ? "Loading..." : "Select GRN reference"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {grnRefs.map((ref) => (
                  <SelectItem 
                    key={ref} 
                    value={ref}
                    className="text-white hover:bg-slate-800"
                  >
                    {ref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {grnRefs.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No GRN references found</p>
            )}
          </div>
          
          <Button
            onClick={handleDownload}
            disabled={downloadStatus !== "idle" || !selectedGrnRef}
            className={cn(
              "h-9 px-3 relative overflow-hidden select-none",
              "bg-blue-600 hover:bg-blue-700 text-white",
              downloadStatus === "downloading" && "bg-blue-600/50",
              downloadStatus !== "idle" && "pointer-events-none"
            )}
            size="sm"
          >
            {downloadStatus === "idle" && (
              <Download className="h-4 w-4" />
            )}
            {downloadStatus === "downloading" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {downloadStatus === "downloaded" && (
              <CheckCircle className="h-4 w-4" />
            )}
            {downloadStatus === "complete" && (
              <Download className="h-4 w-4" />
            )}
            {downloadStatus === "downloading" && (
              <div
                className="absolute bottom-0 z-[3] h-full left-0 bg-blue-500 inset-0 transition-all duration-200 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
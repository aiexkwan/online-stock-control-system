'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminDialog as Dialog,
  AdminDialogContent as DialogContent,
  AdminDialogDescription as DialogDescription,
  AdminDialogFooter as DialogFooter,
  AdminDialogHeader as DialogHeader,
  AdminDialogTitle as DialogTitle,
} from '@/app/admin/components/ui/admin-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface ReportGeneratorWithDialogWidgetProps {
  title: string;
  reportType: string;
  description?: string;
  dialogTitle: string;
  dialogDescription: string;
  selectLabel: string;
  dataTable: string;
  referenceField: string;
  apiEndpoint?: string;
}

export const ReportGeneratorWithDialogWidget = function ReportGeneratorWithDialogWidget({ 
  title, 
  reportType,
  description,
  dialogTitle,
  dialogDescription,
  selectLabel,
  dataTable,
  referenceField,
  apiEndpoint
}: ReportGeneratorWithDialogWidgetProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string>('');
  const [references, setReferences] = useState<string[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "downloaded" | "complete">("idle");
  const [progress, setProgress] = useState(0);

  const loadReferences = useCallback(async () => {
    setIsLoadingRefs(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(dataTable)
        .select(referenceField)
        .not(referenceField, 'is', null)
        .order(referenceField);

      if (error) throw error;

      // Get unique references and convert to strings
      const uniqueRefs = Array.from(new Set(data?.map(item => (item as any)[referenceField]) || []))
        .filter(ref => ref !== null && ref !== undefined)
        .map(ref => String(ref));
      setReferences(uniqueRefs);
    } catch (error) {
      console.error('Error loading references:', error);
    } finally {
      setIsLoadingRefs(false);
    }
  }, [dataTable, referenceField]);

  // Load references when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadReferences();
    }
  }, [isDialogOpen, loadReferences]);

  const handleDownload = async () => {
    if (!selectedRef || downloadStatus !== "idle") return;
    
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
      // Call the API endpoint to generate report with selected reference
      const response = await fetch(apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reportType,
          reference: selectedRef 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      // Download the report
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${selectedRef}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      clearInterval(interval);
      setProgress(100);
      setDownloadStatus("downloaded");
      
      // Close dialog and reset
      setTimeout(() => {
        setIsDialogOpen(false);
        setSelectedRef('');
        setDownloadStatus("idle");
        setProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Download failed:', error);
      clearInterval(interval);
      setDownloadStatus("idle");
      setProgress(0);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex items-center justify-between px-6"
      >
        <div className="flex-1">
          <p className="text-2xl text-muted-foreground">
            {description || `Generate ${title.toLowerCase()}`}
          </p>
        </div>
        
        <Button
          onClick={() => setIsDialogOpen(true)}
          size="lg"
          className="ml-4 relative overflow-hidden select-none text-lg px-8 py-6"
        >
          <Download className="h-6 w-6 mr-3" />
          Download
        </Button>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reference" className="text-sm font-medium text-slate-200">
                {selectLabel}
              </label>
              <Select value={selectedRef} onValueChange={setSelectedRef}>
                <SelectTrigger 
                  id="reference" 
                  className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  <SelectValue placeholder={isLoadingRefs ? "Loading..." : "Select a reference"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {references.map((ref) => (
                    <SelectItem 
                      key={ref} 
                      value={ref}
                      className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white"
                    >
                      {ref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!selectedRef || downloadStatus !== "idle"}
              className={cn(
                "relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/25",
                downloadStatus === "downloading" && "from-blue-600/50 to-cyan-600/50",
                downloadStatus !== "idle" && "pointer-events-none",
                !selectedRef && "from-slate-600 to-slate-600 hover:from-slate-600 hover:to-slate-600"
              )}
            >
              {downloadStatus === "idle" && (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
              {downloadStatus === "downloading" && (
                <div className="z-[5] flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {Math.round(progress)}%
                </div>
              )}
              {downloadStatus === "downloaded" && (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Downloaded</span>
                </>
              )}
              {downloadStatus === "downloading" && (
                <div
                  className="absolute bottom-0 z-[3] h-full left-0 bg-white/20 inset-0 transition-all duration-200 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
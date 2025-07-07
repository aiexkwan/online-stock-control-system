'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReportGeneratorWidgetProps {
  title: string;
  reportType: string;
  description?: string;
  apiEndpoint?: string;
  onGenerate?: () => Promise<void>;
}

export const ReportGeneratorWidget = function ReportGeneratorWidget({ 
  title, 
  reportType,
  description,
  apiEndpoint,
  onGenerate 
}: ReportGeneratorWidgetProps) {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "downloaded" | "complete">("idle");
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
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
      if (onGenerate) {
        await onGenerate();
      } else if (apiEndpoint) {
        // Call the API endpoint to generate report
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reportType }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate report');
        }
        
        // Download the report
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      clearInterval(interval);
      setProgress(100);
      setDownloadStatus("downloaded");
      
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
    }
  };

  return (
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
        onClick={handleDownload}
        size="lg"
        className={cn(
          "ml-4 relative overflow-hidden select-none text-lg px-8 py-6",
          downloadStatus === "downloading" && "bg-primary/50 hover:bg-primary/50",
          downloadStatus !== "idle" && "pointer-events-none"
        )}
      >
        {downloadStatus === "idle" && (
          <>
            <Download className="h-6 w-6 mr-3" />
            Download
          </>
        )}
        {downloadStatus === "downloading" && (
          <div className="z-[5] flex items-center justify-center">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            {Math.round(progress)}%
          </div>
        )}
        {downloadStatus === "downloaded" && (
          <>
            <CheckCircle className="h-6 w-6 mr-3" />
            <span>Downloaded</span>
          </>
        )}
        {downloadStatus === "complete" && <span>Download</span>}
        {downloadStatus === "downloading" && (
          <div
            className="absolute bottom-0 z-[3] h-full left-0 bg-primary inset-0 transition-all duration-200 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        )}
      </Button>
    </motion.div>
  );
}

export default ReportGeneratorWidget;
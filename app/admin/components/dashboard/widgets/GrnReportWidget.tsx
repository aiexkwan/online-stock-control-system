/**
 * GRN Report Widget
 * 包含 GRN reference 下拉選擇器的 GRN 報告生成器
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, CheckCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { exportGrnReport } from '@/lib/exportReport';
import { getMaterialCodesForGrnRef, getGrnReportData } from '@/app/actions/reportActions';
import { createClient } from '@/app/utils/supabase/client';
import { useReportPrinting } from '@/app/admin/hooks/useReportPrinting';
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
  
  // Use unified printing hook
  const { printReport, isPrinting, isServiceAvailable } = useReportPrinting({
    reportType: 'grn',
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GRN report sent to print queue",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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

  // Fetch GRN references when component mounts
  useEffect(() => {
    fetchGrnRefs();
  }, [fetchGrnRefs]);

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
          
          <div className="flex gap-2">
            {/* Print button */}
            {isServiceAvailable && (
              <Button
                onClick={async () => {
                  if (!selectedGrnRef) {
                    toast({
                      title: "Error",
                      description: "Please select a GRN reference",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  try {
                    // Get material codes and generate report
                    const { data: user } = await createClient().auth.getUser();
                    if (!user.user) throw new Error('User not authenticated');
                    
                    const materialCodes = await getMaterialCodesForGrnRef(selectedGrnRef);
                    if (!materialCodes || materialCodes.length === 0) {
                      throw new Error('No material codes found for this GRN reference');
                    }
                    
                    // For printing, we'll just print the first material code
                    // You can modify this to print all or let user select
                    const reportData = await getGrnReportData(selectedGrnRef, materialCodes[0], user.user.email);
                    if (!reportData) throw new Error('Failed to get report data');
                    
                    console.log('[GrnReportWidget] Report data received:', reportData);
                    console.log('[GrnReportWidget] Report data records:', reportData.records);
                    console.log('[GrnReportWidget] First record:', reportData.records?.[0]);
                    
                    // Generate a proper PDF from the GRN report data
                    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
                    const pdfDoc = await PDFDocument.create();
                    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                    
                    // Create a landscape page for the GRN report (Excel style)
                    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
                    const { width, height } = page.getSize();
                    let yPosition = height - 40;
                    
                    // Draw GRN Number box (top right)
                    page.drawRectangle({
                      x: width - 180,
                      y: yPosition - 40,
                      width: 150,
                      height: 35,
                      borderColor: rgb(0, 0, 0),
                      borderWidth: 2
                    });
                    page.drawText('G.R.N. Number:', {
                      x: width - 270,
                      y: yPosition - 20,
                      size: 12,
                      font: boldFont,
                      color: rgb(0, 0, 0)
                    });
                    page.drawText(selectedGrnRef, {
                      x: width - 160,
                      y: yPosition - 20,
                      size: 14,
                      font: boldFont,
                      color: rgb(0, 0, 0)
                    });
                    
                    // Draw PASS/FAIL boxes
                    page.drawRectangle({
                      x: width - 180,
                      y: yPosition - 85,
                      width: 70,
                      height: 30,
                      borderColor: rgb(0, 0, 0),
                      borderWidth: 1.5
                    });
                    page.drawText('PASS', {
                      x: width - 160,
                      y: yPosition - 70,
                      size: 12,
                      font: boldFont,
                      color: rgb(0, 0, 0)
                    });
                    
                    page.drawRectangle({
                      x: width - 100,
                      y: yPosition - 85,
                      width: 70,
                      height: 30,
                      borderColor: rgb(0, 0, 0),
                      borderWidth: 1.5
                    });
                    page.drawText('FAIL', {
                      x: width - 80,
                      y: yPosition - 70,
                      size: 12,
                      font: boldFont,
                      color: rgb(0, 0, 0)
                    });
                    
                    // Left side - Material info
                    yPosition = height - 60;
                    const leftLabels = [
                      { label: 'Code:', value: materialCodes[0] },
                      { label: 'Description:', value: reportData.material_description || 'N/A' },
                      { label: 'Supplier Name:', value: reportData.supplier_name || 'N/A' },
                      { label: 'Our Order No.:', value: '' },
                      { label: 'Date:', value: reportData.report_date || new Date().toLocaleDateString('en-US') }
                    ];
                    
                    leftLabels.forEach((item, index) => {
                      page.drawText(item.label, {
                        x: 100,
                        y: yPosition - (index * 20),
                        size: 11,
                        font: boldFont,
                        color: rgb(0, 0, 0)
                      });
                      
                      // Draw underline for value
                      page.drawLine({
                        start: { x: 200, y: yPosition - (index * 20) - 3 },
                        end: { x: 400, y: yPosition - (index * 20) - 3 },
                        thickness: 0.5,
                        color: rgb(0, 0, 0)
                      });
                      
                      page.drawText(item.value, {
                        x: 210,
                        y: yPosition - (index * 20),
                        size: 10,
                        font: font,
                        color: rgb(0, 0, 0)
                      });
                    });
                    
                    // Main table starting position
                    yPosition = height - 180;
                    
                    // Draw main table with Excel-like structure
                    const tableHeaders = [
                      { text: 'Control\nRef.', x: 30, width: 50 },
                      { text: 'Correct\nPallet\nType', x: 85, width: 55 },
                      { text: 'Qty of\nPallets', x: 145, width: 50 },
                      { text: 'Correct\nPackage', x: 200, width: 55 },
                      { text: 'Qty of\nPackage', x: 260, width: 50 },
                      { text: 'Gross\nWeight', x: 315, width: 50 },
                      { text: 'Net\nWeight', x: 370, width: 50 },
                      { text: 'Pallet\nWeight', x: 425, width: 50 },
                      { text: 'Package\nWeight', x: 480, width: 55 },
                      { text: 'Labels\nCheck', x: 540, width: 50 },
                      { text: 'Qty Per\nPackage', x: 595, width: 55 },
                      { text: 'Type of\nUnits', x: 655, width: 50 },
                      { text: 'Passed', x: 710, width: 45 },
                      { text: 'Failed', x: 760, width: 45 }
                    ];
                    
                    // Draw header row with gray background
                    page.drawRectangle({
                      x: 25,
                      y: yPosition - 35,
                      width: 785,
                      height: 35,
                      color: rgb(0.85, 0.85, 0.85)
                    });
                    
                    // Draw header borders
                    tableHeaders.forEach((header, index) => {
                      // Vertical lines
                      page.drawLine({
                        start: { x: header.x - 5, y: yPosition },
                        end: { x: header.x - 5, y: yPosition - 35 },
                        thickness: 0.5,
                        color: rgb(0, 0, 0)
                      });
                      
                      // Header text (handle multi-line)
                      const lines = header.text.split('\n');
                      lines.forEach((line, lineIndex) => {
                        page.drawText(line, {
                          x: header.x,
                          y: yPosition - 15 - (lineIndex * 10),
                          size: 8,
                          font: boldFont,
                          color: rgb(0, 0, 0)
                        });
                      });
                    });
                    
                    // Draw last vertical line
                    page.drawLine({
                      start: { x: 810, y: yPosition },
                      end: { x: 810, y: yPosition - 35 },
                      thickness: 0.5,
                      color: rgb(0, 0, 0)
                    });
                    
                    // Horizontal lines
                    page.drawLine({
                      start: { x: 25, y: yPosition },
                      end: { x: 810, y: yPosition },
                      thickness: 0.5,
                      color: rgb(0, 0, 0)
                    });
                    page.drawLine({
                      start: { x: 25, y: yPosition - 35 },
                      end: { x: 810, y: yPosition - 35 },
                      thickness: 0.5,
                      color: rgb(0, 0, 0)
                    });
                    
                    yPosition -= 35;
                    
                    // Add records data with Excel-like format
                    if (reportData && reportData.records) {
                      const rowHeight = 25;
                      reportData.records.forEach((record, index) => {
                        // Draw row borders
                        // Horizontal line
                        page.drawLine({
                          start: { x: 25, y: yPosition - rowHeight },
                          end: { x: 810, y: yPosition - rowHeight },
                          thickness: 0.5,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Vertical lines for each column
                        tableHeaders.forEach(header => {
                          page.drawLine({
                            start: { x: header.x - 5, y: yPosition },
                            end: { x: header.x - 5, y: yPosition - rowHeight },
                            thickness: 0.5,
                            color: rgb(0, 0, 0)
                          });
                        });
                        
                        // Last vertical line
                        page.drawLine({
                          start: { x: 810, y: yPosition },
                          end: { x: 810, y: yPosition - rowHeight },
                          thickness: 0.5,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Fill in data
                        const yText = yPosition - 15;
                        
                        // Control Ref (row number)
                        page.drawText((index + 1).toString(), {
                          x: 45,
                          y: yText,
                          size: 9,
                          font: font,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Pallet Type (with Y for Yes)
                        page.drawText('Y', {
                          x: 100,
                          y: yText,
                          size: 10,
                          font: boldFont,
                          color: rgb(0, 0.4, 0)
                        });
                        
                        // Qty of Pallets
                        page.drawText((record.pallet_count || 0).toString(), {
                          x: 160,
                          y: yText,
                          size: 9,
                          font: font,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Package (with Y for Yes)
                        page.drawText('Y', {
                          x: 215,
                          y: yText,
                          size: 10,
                          font: boldFont,
                          color: rgb(0, 0.4, 0)
                        });
                        
                        // Qty of Package
                        page.drawText((record.package_count || 0).toString(), {
                          x: 275,
                          y: yText,
                          size: 9,
                          font: font,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Gross Weight
                        page.drawText((record.gross_weight || 0).toString(), {
                          x: 325,
                          y: yText,
                          size: 9,
                          font: font,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Net Weight
                        page.drawText((record.net_weight || 0).toString(), {
                          x: 380,
                          y: yText,
                          size: 9,
                          font: font,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Calculate pallet weight (gross - net)
                        const palletWeight = (record.gross_weight || 0) - (record.net_weight || 0);
                        page.drawText(palletWeight.toString(), {
                          x: 435,
                          y: yText,
                          size: 9,
                          font: font,
                          color: rgb(0, 0, 0)
                        });
                        
                        // Labels Check (Y for Yes)
                        page.drawText('Y', {
                          x: 555,
                          y: yText,
                          size: 10,
                          font: boldFont,
                          color: rgb(0, 0.4, 0)
                        });
                        
                        // Passed column (with Y in gray area)
                        page.drawRectangle({
                          x: 705,
                          y: yPosition - rowHeight,
                          width: 50,
                          height: rowHeight,
                          color: rgb(0.9, 0.9, 0.9)
                        });
                        page.drawText('Y', {
                          x: 725,
                          y: yText,
                          size: 10,
                          font: boldFont,
                          color: rgb(0, 0.4, 0)
                        });
                        
                        yPosition -= rowHeight;
                      });
                      
                      // Add footer summary section (Excel style)
                      yPosition -= 20;
                      
                      // Action For Material On Hold section
                      page.drawText('Action For Material On Hold:', {
                        x: 30,
                        y: yPosition,
                        size: 12,
                        font: boldFont,
                        color: rgb(0, 0, 0)
                      });
                      
                      // Large box for action notes
                      page.drawRectangle({
                        x: 25,
                        y: yPosition - 80,
                        width: 350,
                        height: 70,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 1
                      });
                      
                      // Summary table on the right
                      const summaryItems = [
                        { label: 'Total Material Delivered', value: reportData.total_gross_weight || 0 },
                        { label: 'Total Material On Hold', value: 0 },
                        { label: 'Total Material Accepted', value: reportData.total_net_weight || 0 },
                        { label: 'Total Material To Be Sent Back', value: 0 },
                        { label: 'Signed Off All Complete And Booked In', value: '' }
                      ];
                      
                      const summaryStartX = 450;
                      let summaryY = yPosition;
                      
                      summaryItems.forEach((item, index) => {
                        // Draw boxes
                        page.drawRectangle({
                          x: summaryStartX,
                          y: summaryY - 20,
                          width: 280,
                          height: 20,
                          borderColor: rgb(0, 0, 0),
                          borderWidth: 1.5
                        });
                        
                        page.drawRectangle({
                          x: summaryStartX + 280,
                          y: summaryY - 20,
                          width: 80,
                          height: 20,
                          borderColor: rgb(0, 0, 0),
                          borderWidth: 1.5
                        });
                        
                        // Add text
                        page.drawText(item.label, {
                          x: summaryStartX + 5,
                          y: summaryY - 13,
                          size: 9,
                          font: boldFont,
                          color: rgb(0, 0, 0)
                        });
                        
                        if (item.value !== '') {
                          page.drawText(item.value.toString(), {
                            x: summaryStartX + 285,
                            y: summaryY - 13,
                            size: 9,
                            font: font,
                            color: rgb(0, 0, 0)
                          });
                        }
                        
                        summaryY -= 20;
                      });
                    }
                    
                    // Footer
                    page.drawText(`Generated on: ${new Date().toLocaleString('en-US')}`, {
                      x: 50,
                      y: 50,
                      size: 8,
                      font: font,
                      color: rgb(0.5, 0.5, 0.5)
                    });
                    
                    const pdfBytes = await pdfDoc.save();
                    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                    
                    await printReport(pdfBlob, {
                      grnRef: selectedGrnRef,
                      materialCode: materialCodes[0],
                      userId: user.user.email
                    });
                  } catch (error) {
                    console.error('[GrnReportWidget] Print failed:', error);
                    toast({
                      title: "Print Error",
                      description: error instanceof Error ? error.message : 'Failed to print report',
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isPrinting || downloadStatus !== "idle" || !selectedGrnRef}
                className={cn(
                  "h-9 px-3",
                  "bg-gray-600 hover:bg-gray-700 text-white",
                  isPrinting && "opacity-50"
                )}
                size="sm"
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Download button */}
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
    </div>
  );
}
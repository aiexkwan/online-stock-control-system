'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { exportAcoReport, exportGrnReport, buildTransactionReport } from '../../lib/exportReport';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getUniqueAcoOrderRefs, getAcoReportData, getUniqueGrnRefs, getMaterialCodesForGrnRef, getGrnReportData, getTransactionReportData } from '../actions/reportActions';
import { toast } from "sonner";
import { saveAs } from 'file-saver';
import { useAuth } from '@/app/hooks/useAuth';

export default function ExportReportPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  const [showAcoRefDialog, setShowAcoRefDialog] = useState(false);
  const [acoOrderRefs, setAcoOrderRefs] = useState<string[]>([]);
  const [selectedAcoOrderRef, setSelectedAcoOrderRef] = useState<string | undefined>(
    undefined
  );
  const [isLoadingAcoOrderRefs, setIsLoadingAcoOrderRefs] = useState(false);
  const [isExportingAco, setIsExportingAco] = useState(false);

  // States for GRN Report Dialog
  const [showGrnRefDialog, setShowGrnRefDialog] = useState(false);
  const [grnRefs, setGrnRefs] = useState<string[]>([]);
  const [selectedGrnRef, setSelectedGrnRef] = useState<string | undefined>(undefined);
  const [isLoadingGrnRefs, setIsLoadingGrnRefs] = useState(false);
  const [isExportingGrn, setIsExportingGrn] = useState(false);
  
  // States for Transaction Report Dialog
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isTransactionReportLoading, setIsTransactionReportLoading] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Enhanced validation function for user session
  const validateUserSession = (): boolean => {
    if (!isAuthenticated) {
      toast.error('User session expired. Please log in again.');
      return false;
    }
    return true;
  };

  // Handle URL parameters to auto-open specific report dialogs
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const reportType = searchParams.get('type');
    if (reportType) {
      switch (reportType.toLowerCase()) {
        case 'aco':
          handleAcoExportClick();
          break;
        case 'grn':
          handleGrnReportExportClick();
          break;
        case 'transaction':
          handleTransactionReportClick();
          break;
        case 'slate':
          toast.info('Slate Report is currently under development.');
          break;
        default:
          toast.warning(`Unknown report type: ${reportType}`);
      }
    }
  }, [isAuthenticated, loading, searchParams]);

  useEffect(() => {
    if (showAcoRefDialog && acoOrderRefs.length === 0 && !isLoadingAcoOrderRefs) {
      if (!validateUserSession()) {
        setShowAcoRefDialog(false);
        return;
      }

      setIsLoadingAcoOrderRefs(true);
      getUniqueAcoOrderRefs()
        .then((refs) => {
          if (refs.length === 0) {
            toast.info('No ACO order references available.');
          }
          setAcoOrderRefs(refs);
          setSelectedAcoOrderRef(undefined);
        })
        .catch((err) => {
          console.error('Failed to fetch ACO order refs:', err);
          toast.error('Failed to load ACO order references. Please try again.');
          setAcoOrderRefs([]);
          setSelectedAcoOrderRef(undefined);
        })
        .finally(() => {
          setIsLoadingAcoOrderRefs(false);
        });
    }
  }, [showAcoRefDialog, acoOrderRefs.length, isLoadingAcoOrderRefs, isAuthenticated]);

  // useEffect for fetching GRN Refs with enhanced error handling
  useEffect(() => {
    if (showGrnRefDialog && grnRefs.length === 0 && !isLoadingGrnRefs) {
      if (!validateUserSession()) {
        setShowGrnRefDialog(false);
        return;
      }

      setIsLoadingGrnRefs(true);
      getUniqueGrnRefs()
        .then((refs) => {
          if (refs.length === 0) {
            toast.info('No GRN references available.');
          }
          setGrnRefs(refs);
          setSelectedGrnRef(undefined);
        })
        .catch((err) => {
          console.error('Failed to fetch GRN refs:', err);
          toast.error('Failed to load GRN references. Please try again.');
          setGrnRefs([]);
          setSelectedGrnRef(undefined);
        })
        .finally(() => {
          setIsLoadingGrnRefs(false);
        });
    }
  }, [showGrnRefDialog, grnRefs.length, isLoadingGrnRefs, isAuthenticated]);

  const handleAcoExportClick = () => {
    if (!validateUserSession()) {
      return;
    }
    setSelectedAcoOrderRef(undefined);
    setShowAcoRefDialog(true);
  };

  const handleConfirmAcoExport = async () => {
    if (!selectedAcoOrderRef) {
      toast.warning('Please select an ACO order reference.');
      return;
    }

    // Additional validation
    if (!selectedAcoOrderRef.trim()) {
      toast.error('Selected ACO order reference is invalid.');
      return;
    }

    if (!validateUserSession()) {
      setShowAcoRefDialog(false);
      return;
    }

    setIsExportingAco(true);
    toast.info(`Generating ACO report for ${selectedAcoOrderRef}...`);

    try {
      const reportData = await getAcoReportData(selectedAcoOrderRef);
      if (reportData && reportData.length > 0) {
        await exportAcoReport(reportData, selectedAcoOrderRef);
        toast.success(`ACO report for ${selectedAcoOrderRef} exported successfully!`);
      } else {
        toast.warning(`No data found for ACO order ${selectedAcoOrderRef}. Cannot generate report.`);
      }
    } catch (error) {
      console.error('Error during ACO report export process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error exporting ACO report: ${errorMessage}`);
    } finally {
      setIsExportingAco(false);
      setShowAcoRefDialog(false);
    }
  };

  const handleCancelAcoExport = () => {
    if (isExportingAco) return;
    setShowAcoRefDialog(false);
  };

  const handleNativeAcoSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAcoOrderRef(event.target.value || undefined);
  };

  // GRN Report Handlers with enhanced validation
  const handleGrnReportExportClick = () => {
    if (!validateUserSession()) {
      return;
    }
    setSelectedGrnRef(undefined);
    setShowGrnRefDialog(true);
  };

  const handleConfirmGrnExport = async () => {
    if (!selectedGrnRef) {
      toast.warning('Please select a GRN reference number.');
      return;
    }

    // Additional validation
    if (!selectedGrnRef.trim()) {
      toast.error('Selected GRN reference is invalid.');
      return;
    }

    if (!user?.email) {
      toast.error('User email not available. Please log in again.');
      setShowGrnRefDialog(false);
      return;
    }

    setIsExportingGrn(true);
    setShowGrnRefDialog(false);
    toast.info(`Processing GRN report for ${selectedGrnRef}...`);

    try {
      const materialCodes = await getMaterialCodesForGrnRef(selectedGrnRef);
      if (!materialCodes || materialCodes.length === 0) {
        toast.warning(`No material codes found for GRN reference ${selectedGrnRef}.`);
        setIsExportingGrn(false);
        return;
      }

      toast.info(`Found ${materialCodes.length} material codes. Generating reports...`);
      let exportCount = 0;
      let failedCount = 0;

      for (const materialCode of materialCodes) {
        try {
          const userEmail = user?.email;
          if (!userEmail) {
            console.error('User email not available');
            failedCount++;
            continue;
          }

          const reportPageData = await getGrnReportData(selectedGrnRef, materialCode, userEmail);

          if (reportPageData) {
            await exportGrnReport(reportPageData);
            toast.success(`GRN report for ${selectedGrnRef} (Material: ${materialCode}) exported successfully!`);
            exportCount++;
          } else {
            console.warn(`No data for GRN ${selectedGrnRef}, material ${materialCode}`);
            failedCount++;
          }
        } catch (materialError) {
          console.error(`Error processing material ${materialCode}:`, materialError);
          failedCount++;
        }
      }

      // Summary message
      if (exportCount > 0) {
        toast.success(`Successfully exported ${exportCount} GRN reports.${failedCount > 0 ? ` ${failedCount} reports failed to generate.` : ''}`);
      } else {
        toast.error(`All GRN reports failed to generate. Please check data or try again later.`);
      }

    } catch (error) {
      console.error("Error during GRN report export process:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error exporting GRN reports: ${errorMessage}`);
    } finally {
      setIsExportingGrn(false);
    }
  };

  const handleCancelGrnExport = () => {
    if (isExportingGrn) return;
    setShowGrnRefDialog(false);
  };

  const handleNativeGrnSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrnRef(event.target.value || undefined);
  };

  // Handler for Transaction Report with enhanced validation
  const handleTransactionReportExport = async () => {
    if (!validateUserSession()) {
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }

    setIsTransactionReportLoading(true);
    
    try {
      toast.info(`Generating transaction report for ${startDate} to ${endDate}...`);
      const reportData = await getTransactionReportData(startDate, endDate);
      
      if (!reportData) {
        toast.error('Failed to fetch transaction data. Please try again.');
        return;
      }

      if (reportData.transfers.length === 0) {
        toast.warning(`No transfer records found for the selected date range (${startDate} to ${endDate}).`);
        // 仍然生成報表，但顯示空數據
      }

      const buffer = await buildTransactionReport(reportData);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `Transaction_Report_${startDate}_to_${endDate}.xlsx`;
      saveAs(blob, fileName);
      
      if (reportData.transfers.length > 0) {
        toast.success(`Transaction report exported successfully! Found ${reportData.total_transfers} transfers.`);
      } else {
        toast.success('Transaction report exported (no data found for selected period).');
      }
    } catch (error) {
      console.error("Error during Transaction report export process:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error exporting transaction report: ${errorMessage}`);
    } finally {
      setIsTransactionReportLoading(false);
      setShowTransactionDialog(false);
    }
  };

  // New handler for Transaction Report button click
  const handleTransactionReportClick = () => {
    if (!validateUserSession()) {
      return;
    }
    
    // 設置默認日期為昨天
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
    setShowTransactionDialog(true);
  };

  const handleCancelTransactionExport = () => {
    if (isTransactionReportLoading) return;
    setShowTransactionDialog(false);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
          <p className="text-lg mb-6">Please log in to access the Export Reports page.</p>
          <Button 
            onClick={() => window.location.href = '/main-login'}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">
        Export Reports
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={handleAcoExportClick}
          disabled={isExportingAco || isExportingGrn}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExportingAco && showAcoRefDialog ? 'Exporting...' : 'ACO Order Report'}
        </button>
        <button 
          className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => console.log("Slate Report button clicked")}
          disabled
        >
          Slate Report
        </button>
        <button 
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGrnReportExportClick}
          disabled={isExportingGrn || isExportingAco}
        >
          {isExportingGrn && showGrnRefDialog ? 'Exporting...' : 'GRN Report'}
        </button>
        <button
          onClick={handleTransactionReportClick}
          disabled={isTransactionReportLoading || isExportingAco || isExportingGrn}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTransactionReportLoading ? 'Exporting...' : 'Transaction Report'}
        </button>
      </div>

      <Dialog open={showAcoRefDialog} onOpenChange={(open) => !isExportingAco && setShowAcoRefDialog(open)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Select ACO Order Ref</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please select an ACO Order Reference from the list below to generate the report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoadingAcoOrderRefs ? (
              <p className="text-center">Loading references...</p>
            ) : acoOrderRefs.length > 0 ? (
              <select
                value={selectedAcoOrderRef || ''}
                onChange={handleNativeAcoSelectChange}
                disabled={isExportingAco}
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select an ACO Order Ref
                </option>
                {acoOrderRefs.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-center">No ACO Order References found or failed to load.</p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={handleCancelAcoExport}
              variant="outline"
              disabled={isExportingAco}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAcoExport}
              disabled={!selectedAcoOrderRef || isLoadingAcoOrderRefs || isExportingAco}
              className="bg-blue-500 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingAco ? 'Exporting...' : 'Confirm Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGrnRefDialog} onOpenChange={(open) => !isExportingGrn && setShowGrnRefDialog(open)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Select GRN Ref Number</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please select a GRN Reference Number from the list below to generate the report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoadingGrnRefs ? (
              <p className="text-center">Loading GRN references...</p>
            ) : grnRefs.length > 0 ? (
              <select
                value={selectedGrnRef || ''}
                onChange={handleNativeGrnSelectChange}
                disabled={isExportingGrn}
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select a GRN Ref Number
                </option>
                {grnRefs.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-center">No GRN References found or failed to load.</p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={handleCancelGrnExport}
              variant="outline"
              disabled={isExportingGrn}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmGrnExport}
              disabled={!selectedGrnRef || isLoadingGrnRefs || isExportingGrn}
              className="bg-green-500 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingGrn ? 'Exporting...' : 'Confirm Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransactionDialog} onOpenChange={(open) => !isTransactionReportLoading && setShowTransactionDialog(open)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Report</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please select the date range for the transaction report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={handleCancelTransactionExport}
              variant="outline"
              disabled={isTransactionReportLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransactionReportExport}
              disabled={!startDate || !endDate || isTransactionReportLoading}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTransactionReportLoading ? 'Exporting...' : 'Confirm Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 